# golang 一个可以多协程且支持依赖的Curl请求接口方法

懂PHP语言的开发者们应该知道在PHP里有curl_multi_init类似的一些函数，可以支持到多进程并发去请求多个接口，之前也专门有写一篇关于这些
函数的调用方法。
[RollingCurl: PHP并发最佳实践](https://github.com/ZYallers/ZYaller/blob/68ef485f9186503e93613aef8a0f78c97cccc1fb/tag/php/RollingCurl:%20PHP%E5%B9%B6%E5%8F%91%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5.md)
有兴趣的话可以去阅读下这篇文章。

PHP这种方法虽然支持多并发，但不支持接口依赖，而且存在CPU过高假死的风险，进程的数量也有限（跟硬件相关）。
因为这个痛点，才写了下面这种通过golang的多协程（goroutine）并发和通道（channel）通信来实现一个支持依赖的模拟curl的方法。
有关golang的goroutine协程与进程的比较这里不再细说，有兴趣的可以简单查询百度或者相关技术资料，这里主要展示下这种方法的实现。
代码如下：
```golang
package main

import (
	"time"
	"log"
	"encoding/json"
	"reflect"
	"strings"
	"project08/library"
	"errors"
	"fmt"
)

func GoroutineCurl(jsonStr string) (map[string]interface{}, error) {
	var (
		err     error
		timeout = 10
	)
	reqJson := make(map[string]interface{})
	err = json.Unmarshal([]byte(jsonStr), &reqJson)
	if err != nil {
		return nil, err
	}
	log.Printf("reqJson: %v.\n", reqJson)

	if to, ok := reqJson["timeout"].(int); ok {
		timeout = to
	}
	log.Printf("timeout: %v, type: %T.\n", timeout, timeout)

	urlsSlice := []interface{}{}
	if urls, ok := reqJson["urls"]; ok {
		urlsSlice = urls.([]interface{})
	} else {
		return nil, errors.New("Param 'urls' must request.")
	}

	dependTimesMap := make(map[string]uint64)
	for _, v := range urlsSlice {
		urlOpt := v.(map[string]interface{})
		params := urlOpt["params"].(map[string]interface{})
		for _, vv := range params {
			if reflect.TypeOf(vv).String() == "map[string]interface {}" {
				depend := vv.(map[string]interface{})
				dependId := depend["depend_id"].(string)
				dependTimesMap[dependId]++
			}
		}
	}
	log.Printf("dependTimesMap: %v.\n", dependTimesMap)

	resChan := make(chan map[string]interface{})
	defer func(ch chan map[string]interface{}) {
		close(resChan)
		log.Printf("resChan active closed.\n")
	}(resChan)

	dependChanMap := make(map[string]chan interface{})
	for _, v := range urlsSlice {
		urlOpt := v.(map[string]interface{})
		id := urlOpt["id"].(string)
		dependTimes := dependTimesMap[id]
		if dependTimes > 0 {
			dependChanMap[id] = make(chan interface{})
			defer func(ch chan interface{}, id string) {
				close(ch)
				log.Printf("dependChan %s active closed.\n", id)
			}(dependChanMap[id], id)
		}
		go goroutineCurlHandler(urlOpt, dependChanMap, dependTimesMap, resChan, timeout)
	}

	counter := 0
	breakFlag := false
	result := make(map[string]interface{})
	for {
		select {
		case resp, ok := <-resChan:
			if ok {
				log.Printf("get resChan resp: %v.\n", resp)
				result[resp["id"].(string)] = resp["result"]
				counter++
				if counter == len(urlsSlice) {
					breakFlag = true
				}
			}
		case <-time.After(time.Duration(timeout) * time.Second):
			breakFlag = true
		}
		if breakFlag {
			break
		}
	}

	return result, err
}

func goroutineCurlHandler(apiOpt map[string]interface{}, dependChanMap map[string]chan interface{},
	dependTimesMap map[string]uint64, resChan chan map[string]interface{}, timeout int) {
	id := apiOpt["id"].(string)
	url := apiOpt["url"].(string)
	reqType := strings.ToUpper(apiOpt["type"].(string))
	queries := make(map[string]string)
	postData := make(map[string]interface{})

	apiParams := apiOpt["params"].(map[string]interface{})
	for key, value := range apiParams {
		var tranfer interface{}
		if reflect.TypeOf(value).String() == "map[string]interface {}" {
			depend := value.(map[string]interface{})
			dependId := depend["depend_id"].(string)
			dependParam := depend["depend_param"].(string)
			if dependChan, ok := dependChanMap[dependId]; ok {
				for {
					resp, ok := <-dependChan
					if ok {
						log.Printf("dependChan: %s, resp: %v.\n", dependId, resp)
						if resp != "" {
							data := make(map[string]interface{})
							json.Unmarshal([]byte(resp.(string)), &data)
							dependParamSlice := strings.Split(dependParam, ".")
							log.Printf("dependChan: %s, dependParamSlice: %v.\n", dependId, dependParamSlice)
							for _, v := range dependParamSlice {
								if tranfer == nil {
									tranfer = data[v]
								} else {
									tranfer = tranfer.(map[string]interface{})[v]
								}
							}
						}
						break
					}
				}
			}
		} else {
			tranfer = value
		}

		if reqType == "GET" {
			queries[key] = fmt.Sprintf("%v", tranfer)
		} else {
			postData[key] = tranfer
		}
		log.Printf("id %s, tranfer: %v, queries: %v, postData: %v.\n", id, tranfer, queries, postData)
	}

	log.Printf("begin id: %s send, url: %s, reqType: %s.\n", id, url, reqType)
	curl := library.NewRequest().SetTimeOut(timeout)
	if len(queries) > 0 {
		curl.SetQueries(queries)
	}
	if len(postData) > 0 {
		curl.SetPostData(postData)
	}

	var (
		respStr string
		err     error
	)
	resp, err := curl.Send(url, reqType)
	if err == nil {
		respStr = resp.Body
	}
	log.Printf("end id: %s, respBody: %v, err: %v.\n", id, respStr, err)

	if dependChan, ok := dependChanMap[id]; ok {
		dependTimes, ok := dependTimesMap[id]
		if ok && dependTimes > 0 {
			var i uint64
			for i = 0; i < dependTimes; i++ {
				dependChan <- respStr
			}
		}
	}

	resChan <- map[string]interface{}{"id": id, "result": respStr}
	log.Printf("id: %s and resChan sent.\n", id)
}

func main() {
	jsonMap := map[string]interface{}{
		"timeout": 10,
		"urls": []map[string]interface{}{
			map[string]interface{}{
				"id":   "1",
				"type": "post",
				"url":  "http://mall-test.hxsapp.com/api/testBrm/test01",
				"params": map[string]interface{}{
					"name": "Peter",
					"age":  23,
				},
			},
			map[string]interface{}{
				"id":   "2",
				"type": "get",
				"url":  "http://mall-test.hxsapp.com/api/testBrm/test02",
				"params": map[string]interface{}{
					"date": "2018-01-12",
				},
			},
			map[string]interface{}{
				"id":   "3",
				"type": "post",
				"url":  "http://mall-test.hxsapp.com/api/testBrm/test03",
				"params": map[string]interface{}{
					"user_id": map[string]string{
						"depend_id":    "1",
						"depend_param": "data.user_id",
					},
					"product_id": map[string]string{
						"depend_id":    "2",
						"depend_param": "data.product_id",
					},
				},
			},
			map[string]interface{}{
				"id":   "4",
				"type": "get",
				"url":  "http://mall-test.hxsapp.com/api/testBrm/test04",
				"params": map[string]interface{}{
					"date": "2018-01-12",
					"product_id": map[string]string{
						"depend_id":    "2",
						"depend_param": "data.product_id",
					},
				},
			},
		},
	}

	buffer, _ := json.Marshal(jsonMap)
	st := time.Now()
	res, err := GoroutineCurl(string(buffer))
	log.Printf("Runtime：%s.\n", time.Since(st))
	log.Printf("result: %v, err: %v.\n", res, err)
}
```
主要的实现方法是`GoroutineCurl`，为了演示和调试方便加了很多log打印，正式使用可以去掉的，这个不影响多少性能。

运行结果：
```shell
2018/08/21 20:01:12 reqJson: map[timeout:10 urls:[map[id:1 params:map[age:23 name:Peter] type:post url:http://mall-test.hxsapp.com/api/testBrm/test01] map[type:get url:http://mall-test.hxsapp.com/api/testBrm/test02 id:2 params:map[date:2018-01-12]] map[params:map[product_id:map[depend_id:2 depend_param:data.product_id] user_id:map[depend_id:1 depend_param:data.user_id]] type:post url:http://mall-test.hxsapp.com/api/testBrm/test03 id:3] map[type:get url:http://mall-test.hxsapp.com/api/testBrm/test04 id:4 params:map[date:2018-01-12 product_id:map[depend_id:2 depend_param:data.product_id]]]]].
2018/08/21 20:01:12 timeout: 10, type: int.
2018/08/21 20:01:12 dependTimesMap: map[2:2 1:1].
2018/08/21 20:01:12 id 4, tranfer: 2018-01-12, queries: map[date:2018-01-12], postData: map[].
2018/08/21 20:01:12 id 1, tranfer: 23, queries: map[], postData: map[age:23].
2018/08/21 20:01:12 id 1, tranfer: Peter, queries: map[], postData: map[age:23 name:Peter].
2018/08/21 20:01:12 id 2, tranfer: 2018-01-12, queries: map[date:2018-01-12], postData: map[].
2018/08/21 20:01:12 begin id: 1 send, url: http://mall-test.hxsapp.com/api/testBrm/test01, reqType: POST.
2018/08/21 20:01:12 begin id: 2 send, url: http://mall-test.hxsapp.com/api/testBrm/test02, reqType: GET.
2018/08/21 20:01:13 end id: 1, respBody: {"code":200,"data":{"user_id":12}}, err: <nil>.
2018/08/21 20:01:14 end id: 2, respBody: {"code":200,"data":{"product_id":10}}, err: <nil>.
2018/08/21 20:01:14 id: 2 and resChan sent.
2018/08/21 20:01:14 dependChan: 2, resp: {"code":200,"data":{"product_id":10}}.
2018/08/21 20:01:14 dependChan: 2, resp: {"code":200,"data":{"product_id":10}}.
2018/08/21 20:01:14 get resChan resp: map[id:2 result:{"code":200,"data":{"product_id":10}}].
2018/08/21 20:01:14 dependChan: 2, dependParamSlice: [data product_id].
2018/08/21 20:01:14 id 4, tranfer: 10, queries: map[date:2018-01-12 product_id:10], postData: map[].
2018/08/21 20:01:14 begin id: 4 send, url: http://mall-test.hxsapp.com/api/testBrm/test04, reqType: GET.
2018/08/21 20:01:14 dependChan: 2, dependParamSlice: [data product_id].
2018/08/21 20:01:14 id 3, tranfer: 10, queries: map[], postData: map[product_id:10].
2018/08/21 20:01:14 dependChan: 1, resp: {"code":200,"data":{"user_id":12}}.
2018/08/21 20:01:14 dependChan: 1, dependParamSlice: [data user_id].
2018/08/21 20:01:14 id 3, tranfer: 12, queries: map[], postData: map[product_id:10 user_id:12].
2018/08/21 20:01:14 begin id: 3 send, url: http://mall-test.hxsapp.com/api/testBrm/test03, reqType: POST.
2018/08/21 20:01:14 id: 1 and resChan sent.
2018/08/21 20:01:14 get resChan resp: map[id:1 result:{"code":200,"data":{"user_id":12}}].
2018/08/21 20:01:17 end id: 3, respBody: {"code":200,"data":{"user_id":12,"product_id":10}}, err: <nil>.
2018/08/21 20:01:17 id: 3 and resChan sent.
2018/08/21 20:01:17 get resChan resp: map[id:3 result:{"code":200,"data":{"user_id":12,"product_id":10}}].
2018/08/21 20:01:18 end id: 4, respBody: {"code":200,"data":{"date":"2018-01-12","input":""}}, err: <nil>.
2018/08/21 20:01:18 id: 4 and resChan sent.
2018/08/21 20:01:18 get resChan resp: map[id:4 result:{"code":200,"data":{"date":"2018-01-12","input":""}}].
2018/08/21 20:01:18 dependChan 2 active closed.
2018/08/21 20:01:18 dependChan 1 active closed.
2018/08/21 20:01:18 resChan active closed.
2018/08/21 20:01:18 Runtime：6.205477107s.
2018/08/21 20:01:18 result: map[1:{"code":200,"data":{"user_id":12}} 3:{"code":200,"data":{"user_id":12,"product_id":10}} 4:{"code":200,"data":{"date":"2018-01-12","input":""}} 2:{"code":200,"data":{"product_id":10}}], err: <nil>.

Process finished with exit code 0
```

调用的这几个接口是用PHP写的。
```php
public function test01()
{
    sleep(1);
    echo json_encode(['code' => 200, 'data' => ['user_id' => 12]]);
    exit;
}

public function test02()
{
    sleep(2);
    echo json_encode(['code' => 200, 'data' => ['product_id' => 10]]);
    exit;
}

public function test03()
{
    sleep(3);
    $input = file_get_contents('php://input');
    $data = empty($input) ? [] : json_decode($input, true);
    $userId = isset($data['user_id']) ? $data['user_id'] : 0;
    $proId = isset($data['product_id']) ? $data['product_id'] : 0;
    echo json_encode(['code' => 200, 'data' => ['user_id' => $userId, 'product_id' => $proId]]);
    exit;
}

public function test04()
{
    sleep(4);
    $input = file_get_contents('php://input');
    $date = $this->input->get('date');
    echo json_encode(['code' => 200, 'data' => ['date' => $date, 'input' => $input]]);
    exit;
}
```
为了模拟方便，这些PHP接口里加了sleep阻塞。

最后，虽然这种方式不如直接在golang里写业务实现，因为接口依赖的时候，golang可以先并发跑完不需要依赖的代码，只需要在需要依赖的时候去等待
对应的数据，这样效率肯定是最好的。但在现有业务存在且量大的请求下，不可能完全重现成golang。
所以总体来说上面这种方式又比单纯的用PHP实现或优化好很多。