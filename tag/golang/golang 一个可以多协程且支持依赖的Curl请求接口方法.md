[//]:# (2018/8/25 20:20|GOLANG|)
# golang 一个可以多协程且支持依赖的Curl请求接口方法

懂PHP语言的开发者们应该知道在PHP里有curl_multi_init类似的一些函数，可以支持到多进程并发去请求多个接口，之前也专门有写一篇关于这些
函数的调用方法。
[RollingCurl: PHP并发最佳实践](https://github.com/ZYallers/ZYaller/blob/68ef485f9186503e93613aef8a0f78c97cccc1fb/tag/php/RollingCurl:%20PHP%E5%B9%B6%E5%8F%91%E6%9C%80%E4%BD%B3%E5%AE%9E%E8%B7%B5.md)
有兴趣的话可以去阅读下这篇文章。

PHP这种方法虽然支持多并发，但不支持接口依赖，而且存在CPU过高假死的风险，进程的数量也有限（跟硬件相关）。
因为这个痛点，才写了下面这种通过golang的多协程（goroutine）并发和通道（channel）通信来实现一个支持依赖的模拟curl的方法。
有关golang的goroutine协程与进程的比较这里不再细说，有兴趣的可以简单查询百度或者相关技术资料，这里主要展示下这种方法的实现。
代码如下：
```go
package library

import (
	"fmt"
	"encoding/json"
	"errors"
	"reflect"
	"time"
	"strings"
	"strconv"
	"log"
)

func GoroutineCurl(data map[string]interface{}) (map[string]interface{}, error) {
	now := time.Now()

	var timeout uint8 = 10
	if to, ok := data["timeout"]; ok {
		if ut, err := strconv.ParseUint(to.(string), 10, 64); err == nil {
			timeout = uint8(ut)
		}
	}
	log.Printf("timeout: %v, type: %T.\n", timeout, timeout)

	requestsSlice := []map[string]interface{}{}
	if requests, ok := data["requests"]; ok {
		requestsSlice = requests.([]map[string]interface{})
	} else {
		return nil, errors.New("Lack of necessary parameters \"requests\"")
	}
	log.Printf("requestsSlice: %v, type: %T.\n", requestsSlice, requestsSlice)

	dependTimesMap := make(map[string]uint64)
	for _, request := range requestsSlice {
		params := request["params"].(map[string]interface{})
		for _, param := range params {
			if reflect.TypeOf(param).String() == "map[string]interface {}" {
				depend := param.(map[string]interface{})
				dependId := depend["depend_id"].(string)
				dependTimesMap[dependId]++
			}
		}
	}
	log.Printf("dependTimesMap: %v.\n", dependTimesMap)

	resChan := make(chan map[string]interface{})
	dependChanMap := make(map[string]chan interface{})
	for _, request := range requestsSlice {
		id := request["id"].(string)
		if dependTimes, ok := dependTimesMap[id]; ok && dependTimes > 0 {
			dependChanMap[id] = make(chan interface{})
		}
		go goroutineCurlHandler(request, dependChanMap, dependTimesMap, resChan)
	}

	counter := 0
	breakFlag := false
	reqResMap := make(map[string]interface{})
	for {
		select {
		case rec, ok := <-resChan:
			if ok {
				log.Printf("resChan get: %v.\n", rec)
				if id, ok := rec["id"]; ok {
					if data, ok := rec["data"]; ok {
						reqResMap[id.(string)] = data
						counter++
					}
				}
				if counter == len(requestsSlice) {
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

	close(resChan)
	res := make(map[string]interface{})
	res["runtime"] = time.Since(now).String()
	res["data"] = reqResMap
	return res, nil
}

func goroutineCurlHandler(opts map[string]interface{}, chanMap map[string]chan interface{}, timesMap map[string]uint64, resChan chan map[string]interface{}) {
	id := opts["id"].(string)
	url := opts["url"].(string)
	reqType := "GET"
	if rt, ok := opts["type"]; ok {
		reqType = strings.ToUpper(rt.(string))
	}

	var timeout uint8 = 10
	if to, ok := opts["timeout"]; ok {
		timeout = uint8(to.(int))
	}

	headers := map[string]string{
		"Content-Type": "application/x-www-form-urlencoded",
	}
	queries := make(map[string]string)
	postData := make(map[string]interface{})

	apiParams := opts["params"].(map[string]interface{})
	for key, value := range apiParams {
		var tranfer interface{}
		if reflect.TypeOf(value).String() == "map[string]interface {}" {
			depend := value.(map[string]interface{})
			dependId := depend["depend_id"].(string)
			dependParam := depend["depend_param"].(string)
			if dependChan, ok := chanMap[dependId]; ok {
				for {
					if resp, ok := <-dependChan; ok {
						log.Printf("dependChan: %s, resp: %v.\n", dependId, resp)
						if resp != "" {
							data := make(map[string]interface{})
							json.Unmarshal([]byte(resp.(string)), &data)
							dependParamSlice := strings.Split(dependParam, ".")
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
	}

	log.Printf("begin id: %s, url: %s, type: %s, queries: %v, post: %v.\n", id, url, reqType, queries, postData)
	curl := NewRequest().SetTimeOut(timeout).SetHeaders(headers)
	if len(queries) > 0 {
		curl.SetQueries(queries)
	}
	if len(postData) > 0 {
		curl.SetPostData(postData)
	}

	resData := ""
	if resp, err := curl.Send(url, reqType); err == nil {
		resData = resp.Body
		log.Printf("end id: %s, respBody: %v.\n", id, resData)
	} else {
		log.Printf("end id: %s, Err: %s.\n", id, err)
	}

	if dependChan, ok := chanMap[id]; ok {
		if dependTimes, ok := timesMap[id]; ok && dependTimes > 0 {
			var i uint64
			for i = 0; i < dependTimes; i++ {
				dependChan <- resData
			}
			close(dependChan)
		}
	}

	resChan <- map[string]interface{}{"id": id, "data": resData}
	log.Printf("id: %s, resChan sent.\n", id)
}
```
主要的实现方法是`GoroutineCurl`，为了演示和调试方便加了很多log打印，正式使用可以去掉的，这个不影响多少性能。
细心的小伙伴应该发现发起NewRequst缺乏一个包`project08/library`，其实是curl的工具，之前文章介绍过，这里贴上链接
[golang curl 工具介绍](https://github.com/ZYallers/ZYaller/blob/master/tag/golang/golang%20curl%20%E5%B7%A5%E5%85%B7%E4%BB%8B%E7%BB%8D.md)

下载对应代码放到对应`project08/library`目录，写个go main文件测试下。
```go
package main

import (
	"log"
	"encoding/json"
	"project08/library"
	"fmt"
)

func getJsonData() map[string]interface{} {
	jsonMap := map[string]interface{}{
		"timeout": "10",
		"requests": []interface{}{
			map[string]interface{}{
				"id":      "1",
				"type":    "post",
				"timeout": 10,
				"url":     "http://act-test.hxsapp.com/api/test/test01",
				"params": map[string]interface{}{
					"name": "Peter",
					"age":  23,
				},
			},
			map[string]interface{}{
				"id":      "2",
				"type":    "get",
				"timeout": 10,
				"url":     "http://act-test.hxsapp.com/api/test/test02",
				"params": map[string]interface{}{
					"date": "2018-01-12",
				},
			},
			map[string]interface{}{
				"id":      "3",
				"type":    "post",
				"timeout": 10,
				"url":     "http://act-test.hxsapp.com/api/test/test03",
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
				"id":      "4",
				"type":    "get",
				"timeout": 10,
				"url":     "http://act-test.hxsapp.com/api/test/test04",
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
	return jsonMap
}

func main() {
    res, err := library.GoroutineCurl(getJsonData())
	if err == nil {
		for k, v := range res["data"].(map[string]interface{}) {
			log.Printf("result: k=%s, v=%v.\n", k, v)
		}
	} else {
		log.Printf("Err: %v.\n", err)
	}
}
```

运行结果：
```shell
...
2018/08/23 15:27:35 dataJsonMap: map[requests:[map[timeout:10 type:post url:http://act-test.hxsapp.com/api/test/test01 id:1 params:map[age:23 name:Peter]] map[params:map[date:2018-01-12] timeout:10 type:get url:http://act-test.hxsapp.com/api/test/test02 id:2] map[url:http://act-test.hxsapp.com/api/test/test03 id:3 params:map[product_id:map[depend_id:2 depend_param:data.product_id] user_id:map[depend_id:1 depend_param:data.user_id]] timeout:10 type:post] map[id:4 params:map[date:2018-01-12 product_id:map[depend_id:2 depend_param:data.product_id]] timeout:10 type:get url:http://act-test.hxsapp.com/api/test/test04]] timeout:10].
2018/08/23 15:27:35 timeout: 10, type: uint8.
2018/08/23 15:27:35 dependTimesMap: map[2:2 1:1].
2018/08/23 15:27:35 begin id: 2, url: http://act-test.hxsapp.com/api/test/test02, type: GET, queries: map[date:2018-01-12], post: map[].
2018/08/23 15:27:35 begin id: 1, url: http://act-test.hxsapp.com/api/test/test01, type: POST, queries: map[], post: map[age:23 name:Peter].
2018/08/23 15:27:42 end id: 2, respBody: {"code":200,"data":{"product_id":10,"post":[],"get":{"date":"2018-01-12"},"input":""}}.
2018/08/23 15:27:42 id: 2, resChan sent.
2018/08/23 15:27:42 resChan get: map[id:2 data:{"code":200,"data":{"product_id":10,"post":[],"get":{"date":"2018-01-12"},"input":""}}].
2018/08/23 15:27:42 dependChan: 2, resp: {"code":200,"data":{"product_id":10,"post":[],"get":{"date":"2018-01-12"},"input":""}}.
2018/08/23 15:27:42 dependChan: 2, resp: {"code":200,"data":{"product_id":10,"post":[],"get":{"date":"2018-01-12"},"input":""}}.
2018/08/23 15:27:42 begin id: 4, url: http://act-test.hxsapp.com/api/test/test04, type: GET, queries: map[date:2018-01-12 product_id:10], post: map[].
2018/08/23 15:27:42 end id: 1, respBody: {"code":200,"data":{"user_id":12,"post":{"{\"age\":23,\"name\":\"Peter\"}":"","0":""},"get":[],"input":"{\"age\":23,\"name\":\"Peter\"}"}}.
2018/08/23 15:27:42 id: 1, resChan sent.
2018/08/23 15:27:42 resChan get: map[id:1 data:{"code":200,"data":{"user_id":12,"post":{"{\"age\":23,\"name\":\"Peter\"}":"","0":""},"get":[],"input":"{\"age\":23,\"name\":\"Peter\"}"}}].
2018/08/23 15:27:42 dependChan: 1, resp: {"code":200,"data":{"user_id":12,"post":{"{\"age\":23,\"name\":\"Peter\"}":"","0":""},"get":[],"input":"{\"age\":23,\"name\":\"Peter\"}"}}.
2018/08/23 15:27:42 begin id: 3, url: http://act-test.hxsapp.com/api/test/test03, type: POST, queries: map[], post: map[product_id:10 user_id:12].
2018/08/23 15:27:48 end id: 4, respBody: {"code":200,"data":{"post":[],"get":{"date":"2018-01-12","product_id":"10"},"input":""}}.
2018/08/23 15:27:48 id: 4, resChan sent.
2018/08/23 15:27:48 resChan get: map[id:4 data:{"code":200,"data":{"post":[],"get":{"date":"2018-01-12","product_id":"10"},"input":""}}].
2018/08/23 15:27:48 end id: 3, respBody: {"code":200,"data":{"post":{"{\"product_id\":10,\"user_id\":12}":"","0":""},"get":[],"input":"{\"product_id\":10,\"user_id\":12}"}}.
2018/08/23 15:27:48 id: 3, resChan sent.
2018/08/23 15:27:48 resChan get: map[id:3 data:{"code":200,"data":{"post":{"{\"product_id\":10,\"user_id\":12}":"","0":""},"get":[],"input":"{\"product_id\":10,\"user_id\":12}"}}].
2018/08/23 15:27:48 result: k=3, v={"code":200,"data":{"post":{"{\"product_id\":10,\"user_id\":12}":"","0":""},"get":[],"input":"{\"product_id\":10,\"user_id\":12}"}}.
2018/08/23 15:27:48 result: k=2, v={"code":200,"data":{"product_id":10,"post":[],"get":{"date":"2018-01-12"},"input":""}}.
2018/08/23 15:27:48 result: k=1, v={"code":200,"data":{"user_id":12,"post":{"{\"age\":23,\"name\":\"Peter\"}":"","0":""},"get":[],"input":"{\"age\":23,\"name\":\"Peter\"}"}}.
2018/08/23 15:27:48 result: k=4, v={"code":200,"data":{"post":[],"get":{"date":"2018-01-12","product_id":"10"},"input":""}}.

Process finished with exit code 0
```

调用的这几个接口是用PHP写的。
```php
public function test01()
{
    //sleep(1);
    echo json_encode(['code' => 200, 'data' => ['user_id' => 12, 'post' => $_POST, 'get' => $_GET, 'input' => file_get_contents('php://input')]]);
    exit;
}

public function test02()
{
    //sleep(2);
    echo json_encode(['code' => 200, 'data' => ['product_id' => 10, 'post' => $_POST, 'get' => $_GET, 'input' => file_get_contents('php://input')]]);
    exit;
}

public function test03()
{
    //sleep(3);
    echo json_encode(['code' => 200, 'data' => ['post' => $_POST, 'get' => $_GET, 'input' => file_get_contents('php://input')]]);
    exit;
}

public function test04()
{
    //sleep(4);
    echo json_encode(['code' => 200, 'data' => ['post' => $_POST, 'get' => $_GET, 'input' => file_get_contents('php://input')]]);
    exit;
}
```

最后，虽然这种方式不如直接在golang里写业务实现，因为接口依赖的时候，golang可以先并发跑完不需要依赖的代码，只需要在需要依赖的时候去等待
对应的数据，这样效率肯定是最好的。但在现有业务存在且量大的请求下，不可能完全重现成golang。
所以总体来说上面这种方式又比单纯的用PHP实现或优化好很多。