# golang 多协程且支持依赖的Curl请求工具

上一次我们一篇文章《golang 一个可以多协程且支持依赖的Curl请求接口方法》介绍过这个工具，后期使用通过实践对其不断完善，有了这篇文章。
不多说，上代码：
```go
// Copyright (c) 2020 HXS R&D Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// @Title go_curl
// @Description 
// 
// @Author zhongyongbiao
// @Version 1.0.0
// @Time 2020/5/8 下午12:53
// @Software GoLand
package tool

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/tidwall/gjson"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	defaultTimeout = 10 * time.Second
)

type goCurl struct {
	nowTime        time.Time
	timeout        time.Duration
	requests       []interface{}
	reqCounter     int
	debug          bool
	Data           map[string]interface{}
	reqDepend      map[string]chan interface{}
	reqDependTimes map[string]uint64
	Result         map[string]interface{}
	resultChan     chan interface{}
	Runtime        string
}

func NewGoCurl() *goCurl {
	return &goCurl{
		nowTime:        time.Now(),
		timeout:        defaultTimeout,
		reqDependTimes: make(map[string]uint64),
		resultChan:     make(chan interface{}),
		reqDepend:      make(map[string]chan interface{}),
		Result:         make(map[string]interface{}),
	}
}

func (gc *goCurl) Debug() *goCurl {
	gc.debug = true
	return gc
}

func (gc *goCurl) print(format string, v ...interface{}) *goCurl {
	if gc.debug {
		log.Printf(format, v...)
	}
	return gc
}

func (gc *goCurl) SetData(input string) *goCurl {
	// 不用json.Unmarshal方法，是因为解析后存在科学计数法问题
	d := json.NewDecoder(strings.NewReader(input))
	d.UseNumber()
	_ = d.Decode(&gc.Data)
	gc.print("Data: \n %#v \n", gc.Data)
	return gc
}

func (gc *goCurl) Done() (*goCurl, error) {
	if val, ok := gc.Data["timeout"].(string); ok {
		if num, err := strconv.ParseInt(val, 10, 64); err == nil {
			gc.timeout = time.Duration(num) * time.Second
		}
	}

	if val, ok := gc.Data["requests"].([]interface{}); ok {
		gc.requests = val
	} else {
		return gc, errors.New(`lack of necessary parameters "requests"`)
	}
	gc.print("request length: %d, timeout: %v\n", len(gc.requests), gc.timeout)

	for _, req := range gc.requests {
		if params, ok := req.(map[string]interface{})["params"].(map[string]interface{}); ok {
			for _, param := range params {
				if param, ok := param.(map[string]interface{}); ok {
					dependId := param["depend_id"].(string)
					gc.reqDependTimes[dependId]++
				}
			}
		}
	}
	gc.print("reqDependTimes: %v\n", gc.reqDependTimes)

	for _, val := range gc.requests {
		if req, ok := val.(map[string]interface{}); ok {
			id := req["id"].(string)
			if dependTimes, ok := gc.reqDependTimes[id]; ok && dependTimes > 0 {
				gc.reqDepend[id] = make(chan interface{})
			}
			go gc.handler(req)
		}
	}

LOOP:
	for {
		select {
		case resp, ok := <-gc.resultChan:
			if ok {
				gc.reqCounter++
				gc.print("resultChan: %v, counter: %d\n", resp, gc.reqCounter)
				if val, ok := resp.(map[string]string); ok {
					if id, ok := val["id"]; ok {
						if data, ok := val["data"]; ok {
							gc.Result[id] = map[string]string{"data": data, "runtime": val["runtime"]}
						}
					}
				}
				if gc.reqCounter >= len(gc.requests) {
					break LOOP
				}
			}
		case <-time.After(gc.timeout):
			gc.print("timeout %s\n", gc.timeout)
			break LOOP
		}
	}
	gc.safeCloseChan(gc.resultChan)
	gc.Runtime = time.Since(gc.nowTime).String()
	return gc, nil
}

func (gc *goCurl) handler(req map[string]interface{}) {
	var id string
	if val, ok := req["id"].(string); ok {
		id = val
	} else {
		gc.print(`missing necessary parameters "id"`)
		gc.safeSendChan(gc.resultChan, nil)
		return
	}

	var url string
	if val, ok := req["url"].(string); ok {
		url = val
	} else {
		gc.print(`missing necessary parameters "url"`)
		gc.safeSendChan(gc.resultChan, nil)
		return
	}

	var httpMethod = http.MethodGet
	if val, ok := req["type"].(string); ok {
		httpMethod = strings.ToUpper(val)
	}

	var timeout = defaultTimeout
	if val, ok := req["timeout"].(string); ok {
		if num, err := strconv.ParseInt(val, 10, 64); err == nil {
			timeout = time.Duration(num) * time.Second
		}
	}

	headers := make(map[string]string)
	switch httpMethod {
	case http.MethodPost:
		headers["Content-Type"] = "application/x-www-form-urlencoded"
	default:
		headers["Content-Type"] = "application/json;charset=utf-8"
	}
	if val, ok := req["headers"].(map[string]interface{}); ok {
		for k, v := range val {
			headers[k] = v.(string)
		}
	}

	queries := make(map[string]string)
	postData := make(map[string]interface{})
	if params, ok := req["params"].(map[string]interface{}); ok {
		for key, value := range params {
			var transfer interface{}
			if depend, ok := value.(map[string]interface{}); ok {
				dependId := depend["depend_id"].(string)
				if dependChan, ok := gc.reqDepend[dependId]; ok {
				LOOP:
					for {
						select {
						case resp, ok := <-dependChan:
							if ok && resp != "" {
								gc.print("dependChan: %s, resp: %s\n", dependId, resp)
								transfer = gjson.Get(resp.(string), depend["depend_param"].(string)).Value()
								break LOOP
							}
						case <-time.After(timeout):
							gc.print("dependChan %s, timeout %s\n", dependId, gc.timeout)
							break LOOP
						}
					}
				}
			} else {
				transfer = value
			}
			if transfer != nil {
				if httpMethod == http.MethodGet {
					queries[key] = fmt.Sprintf("%v", transfer)
				} else {
					postData[key] = transfer
				}
			}
		}
	}

	curl := NewRequest(url).SetMethod(httpMethod).SetTimeOut(timeout).SetHeaders(headers).SetQueries(queries).SetPostData(postData)
	gc.print("------>begin id: %s, url: %s, type: %s, headers: %#v, queries: %#v, postData: %#v\n", id, url, httpMethod, headers, queries, postData)

	var (
		respData, spendTime string
		nowTime             = time.Now()
	)

	if resp, err := curl.Send(); err == nil {
		spendTime = time.Since(nowTime).String()
		respData = resp.Body
		gc.print("<------end id: %s, runtime: %s, respBody: %v.\n", id, spendTime, respData)
		gc.safeSendChan(gc.resultChan, map[string]string{"id": id, "data": respData, "runtime": spendTime})
		gc.print("id: %s, resultChan sent.\n", id)
	} else {
		spendTime = time.Since(nowTime).String()
		gc.safeSendChan(gc.resultChan, nil)
		gc.print("<------end id: %s, runtime: %s, error: %v.\n", id, spendTime, err)
	}

	if dependChan, ok := gc.reqDepend[id]; ok {
		if dependTimes, ok := gc.reqDependTimes[id]; ok && dependTimes > 0 {
			var i uint64
			for i = 0; i < dependTimes; i++ {
				gc.safeSendChan(dependChan, respData)
			}
			gc.safeCloseChan(dependChan)
		}
	}
}

func (gc *goCurl) safeSendChan(ch chan<- interface{}, value interface{}) (closed bool) {
	defer func() {
		if recover() != nil {
			closed = true
		}
	}()
	ch <- value
	return false
}

func (gc *goCurl) safeCloseChan(ch chan interface{}) (closed bool) {
	defer func() {
		if recover() != nil {
			closed = false
		}
	}()
	close(ch)
	return true
}
```
老规矩，写个测试执行一下：
```go
// Copyright (c) 2020 HXS R&D Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// @Title go_curl_test.go
// @Description 
// 
// @Author zhongyongbiao
// @Version 1.0.0
// @Time 2020/5/11 下午7:32
// @Software GoLand
package tool

import (
	"encoding/json"
	"testing"
)

func TestNewGoCurl(t *testing.T) {
	jsonMap := map[string]interface{}{
		"timeout": "10",
		"requests": []interface{}{
			map[string]interface{}{
				"id":   "test01",
				"type": "get",
				"url":  "http://act-test.hxsapp.com/api/test/test01",
				"headers": map[string]string{
					"Content-Type": "application/json;charset=utf-8",
				},
			},
			map[string]interface{}{
				"id":   "test02",
				"type": "get",
				"url":  "http://act-test.hxsapp.com/api/test/test02",
				"headers": map[string]string{
					"Content-Type": "application/json;charset=utf-8",
				},
			},
			map[string]interface{}{
				"id":   "test03",
				"type": "post",
				"url":  "http://act-test.hxsapp.com/api/test/test03",
				"headers": map[string]string{
					"Content-Type": "application/x-www-form-urlencoded",
				},
				"params": map[string]interface{}{
					"user_id": map[string]string{
						"depend_id":    "test01",
						"depend_param": "data.user_id",
					},
					"product_id": map[string]string{
						"depend_id":    "test02",
						"depend_param": "data.product_id",
					},
				},
			},
			map[string]interface{}{
				"id":   "test04",
				"type": "get",
				"url":  "http://act-test.hxsapp.com/api/test/test04",
				"headers": map[string]string{
					"Content-Type": "application/json;charset=utf-8",
				},
				"params": map[string]interface{}{
					"date": "2018-01-12",
					"product_id": map[string]string{
						"depend_id":    "test02",
						"depend_param": "data.product_id",
					},
				},
			},
		},
	}
	bts, _ := json.Marshal(jsonMap)
	if gc, err := NewGoCurl().SetData(string(bts)).Done(); err == nil {
		t.Log("runtime:", gc.Runtime)
		for k, v := range gc.Result {
			t.Logf("key: %s, value: %#v\n", k, v)
		}
	} else {
		t.Logf("Err: %v\n", err)
	}
}
```
测试输出内容：
```shell script
=== RUN   TestNewGoCurl
2020/05/25 17:14:01 Data: 
 map[string]interface {}{"requests":[]interface {}{map[string]interface {}{"headers":map[string]interface {}{"Content-Type":"application/json;charset=utf-8"}, "id":"test01", "type":"get", "url":"http://act-test.hxsapp.com/api/test/test01"}, map[string]interface {}{"headers":map[string]interface {}{"Content-Type":"application/json;charset=utf-8"}, "id":"test02", "type":"get", "url":"http://act-test.hxsapp.com/api/test/test02"}, map[string]interface {}{"headers":map[string]interface {}{"Content-Type":"application/x-www-form-urlencoded"}, "id":"test03", "params":map[string]interface {}{"product_id":map[string]interface {}{"depend_id":"test02", "depend_param":"data.product_id"}, "user_id":map[string]interface {}{"depend_id":"test01", "depend_param":"data.user_id"}}, "type":"post", "url":"http://act-test.hxsapp.com/api/test/test03"}, map[string]interface {}{"headers":map[string]interface {}{"Content-Type":"application/json;charset=utf-8"}, "id":"test04", "params":map[string]interface {}{"date":"2018-01-12", "product_id":map[string]interface {}{"depend_id":"test02", "depend_param":"data.product_id"}}, "type":"get", "url":"http://act-test.hxsapp.com/api/test/test04"}}, "timeout":"10"} 
2020/05/25 17:14:01 request length: 4, timeout: 10s
2020/05/25 17:14:01 reqDependTimes: map[test01:1 test02:2]
2020/05/25 17:14:01 ------>begin id: test02, url: http://act-test.hxsapp.com/api/test/test02, type: GET, headers: map[string]string{"Content-Type":"application/json;charset=utf-8"}, queries: map[string]string{}, postData: map[string]interface {}{}
2020/05/25 17:14:01 ------>begin id: test01, url: http://act-test.hxsapp.com/api/test/test01, type: GET, headers: map[string]string{"Content-Type":"application/json;charset=utf-8"}, queries: map[string]string{}, postData: map[string]interface {}{}
2020/05/25 17:14:01 <------end id: test01, runtime: 85.081681ms, respBody: {"data":{"user_id":12},"code":200,"msg":"ok","request":[]}.
2020/05/25 17:14:01 id: test01, resultChan sent.
2020/05/25 17:14:01 resultChan: map[data:{"data":{"user_id":12},"code":200,"msg":"ok","request":[]} id:test01 runtime:85.081681ms], counter: 1
2020/05/25 17:14:01 <------end id: test02, runtime: 90.144819ms, respBody: {"data":{"product_id":123,"request":[]},"code":200,"msg":"ok"}.
2020/05/25 17:14:01 id: test02, resultChan sent.
2020/05/25 17:14:01 dependChan: test02, resp: {"data":{"product_id":123,"request":[]},"code":200,"msg":"ok"}
2020/05/25 17:14:01 dependChan: test02, resp: {"data":{"product_id":123,"request":[]},"code":200,"msg":"ok"}
2020/05/25 17:14:01 dependChan: test01, resp: {"data":{"user_id":12},"code":200,"msg":"ok","request":[]}
2020/05/25 17:14:01 ------>begin id: test04, url: http://act-test.hxsapp.com/api/test/test04, type: GET, headers: map[string]string{"Content-Type":"application/json;charset=utf-8"}, queries: map[string]string{"date":"2018-01-12", "product_id":"123"}, postData: map[string]interface {}{}
2020/05/25 17:14:01 ------>begin id: test03, url: http://act-test.hxsapp.com/api/test/test03, type: POST, headers: map[string]string{"Content-Type":"application/x-www-form-urlencoded"}, queries: map[string]string{}, postData: map[string]interface {}{"product_id":123, "user_id":12}
2020/05/25 17:14:01 resultChan: map[data:{"data":{"product_id":123,"request":[]},"code":200,"msg":"ok"} id:test02 runtime:90.144819ms], counter: 2
2020/05/25 17:14:01 <------end id: test03, runtime: 66.054091ms, respBody: {"data":{"request":{"product_id":"123","user_id":"12"}},"code":200,"msg":"ok"}.
2020/05/25 17:14:01 id: test03, resultChan sent.
2020/05/25 17:14:01 resultChan: map[data:{"data":{"request":{"product_id":"123","user_id":"12"}},"code":200,"msg":"ok"} id:test03 runtime:66.054091ms], counter: 3
2020/05/25 17:14:01 <------end id: test04, runtime: 81.836097ms, respBody: {"data":{"request":{"date":"2018-01-12","product_id":"123"}},"code":200,"msg":"ok"}.
2020/05/25 17:14:01 id: test04, resultChan sent.
2020/05/25 17:14:01 resultChan: map[data:{"data":{"request":{"date":"2018-01-12","product_id":"123"}},"code":200,"msg":"ok"} id:test04 runtime:81.836097ms], counter: 4
--- PASS: TestNewGoCurl (0.17s)
    go_curl_test.go:92: runtime: 172.726425ms
    go_curl_test.go:94: key: test01, value: map[string]string{"data":"{\"data\":{\"user_id\":12},\"code\":200,\"msg\":\"ok\",\"request\":[]}", "runtime":"85.081681ms"}
    go_curl_test.go:94: key: test02, value: map[string]string{"data":"{\"data\":{\"product_id\":123,\"request\":[]},\"code\":200,\"msg\":\"ok\"}", "runtime":"90.144819ms"}
    go_curl_test.go:94: key: test03, value: map[string]string{"data":"{\"data\":{\"request\":{\"product_id\":\"123\",\"user_id\":\"12\"}},\"code\":200,\"msg\":\"ok\"}", "runtime":"66.054091ms"}
    go_curl_test.go:94: key: test04, value: map[string]string{"data":"{\"data\":{\"request\":{\"date\":\"2018-01-12\",\"product_id\":\"123\"}},\"code\":200,\"msg\":\"ok\"}", "runtime":"81.836097ms"}
PASS
```

调用的这几个接口是用PHP写的。
```php
public function test01()
{
    $this->returnJson(['code' => 200, 'msg' => 'ok', 'data' => ['user_id' => 12], 'request' => $_REQUEST]);
}

public function test02()
{
    $this->returnJson(['code' => 200, 'msg' => 'ok', 'data' => ['product_id' => 123, 'request' => $_REQUEST]]);
}

public function test03()
{
    $this->returnJson(['code' => 200, 'msg' => 'ok', 'data' => ['request' => $_REQUEST]]);
}

public function test04()
{
    $this->returnJson(['code' => 200, 'msg' => 'ok', 'data' => ['request' => $_REQUEST]]);
}
```
如你觉得有用，可以先Mark一下；如有问题欢迎联系我。