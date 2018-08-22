# golang curl 工具介绍
PHPer开发者和Linux系统下对curl命令绝对很熟悉，那golang呢？
其实，golang的资源包`net/http`包已经基本实现了，这里封装了个curl类，方便使用。
```golang
package library

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"
	"io/ioutil"
	"context"
	"strconv"
)

// Request构造类
type Request struct {
	cli      *http.Client
	req      *http.Request
	Method   string
	Url      string
	Timeout  time.Duration
	Headers  map[string]string
	Cookies  map[string]string
	Queries  map[string]string
	PostData map[string]interface{}
}

// 创建一个Request实例
func NewRequest() *Request {
	return &Request{}
}

// 设置请求方法
func (this *Request) SetMethod(method string) *Request {
	this.Method = method
	return this
}

// 设置请求地址
func (this *Request) SetUrl(url string) *Request {
	this.Url = url
	return this
}

// 设置请求头
func (this *Request) SetHeaders(headers map[string]string) *Request {
	this.Headers = headers
	return this
}

// 将用户自定义请求头添加到http.Request实例上
func (this *Request) setHeaders() {
	for k, v := range this.Headers {
		this.req.Header.Set(k, v)
	}
}

// 设置请求cookies
func (this *Request) SetCookies(cookies map[string]string) *Request {
	this.Cookies = cookies
	return this
}

// 将用户自定义cookies添加到http.Request实例上
func (this *Request) setCookies() {
	for k, v := range this.Cookies {
		this.req.AddCookie(&http.Cookie{
			Name:  k,
			Value: v,
		})
	}
}

// 设置url查询参数
func (this *Request) SetQueries(queries map[string]string) *Request {
	this.Queries = queries
	return this
}

// 将用户自定义url查询参数添加到http.Request上
func (this *Request) setQueries() {
	q := this.req.URL.Query()
	for k, v := range this.Queries {
		q.Add(k, v)
	}
	this.req.URL.RawQuery = q.Encode()
}

// 设置post请求的提交数据
func (this *Request) SetPostData(postData map[string]interface{}) *Request {
	this.PostData = postData
	return this
}

// 发起get请求
func (this *Request) Get() (*Response, error) {
	return this.Send(this.Url, http.MethodGet)
}

// 发起post请求
func (this *Request) Post() (*Response, error) {
	return this.Send(this.Url, http.MethodPost)
}

//SetDialTimeOut 
func (this *Request) SetTimeOut(timeout uint8) *Request {
	this.Timeout = time.Duration(timeout)
	return this
}

func (this *Request) elapsedTime(n int64, resp *Response) {
	end := time.Now().UnixNano() / 1e6
	resp.spendTime = end - n
}

// 发起请求
func (this *Request) Send(url string, method string) (*Response, error) {
	// Start time
	start := time.Now().UnixNano() / 1e6

	// 检测请求url是否填了
	if url == "" {
		return nil, errors.New("request url")
	}
	// 检测请求方式是否填了
	if method == "" {
		return nil, errors.New("request method")
	}
	// 初始化Response对象
	response := NewResponse()

	// Count elapsed time
	defer this.elapsedTime(start, response)

	// 初始化http.Client对象
	this.cli = &http.Client{}

	// 加载用户自定义的post数据到http.Request
	var payload io.Reader
	if method == "POST" && this.PostData != nil {
		if jData, err := json.Marshal(this.PostData); err != nil {
			return nil, err
		} else {
			payload = bytes.NewReader(jData)
		}
	} else {
		payload = nil
	}

	// 超时时间处理，超时时间必须大于0小于等于30，默认最大30秒
	if this.Timeout <= 0 || this.Timeout > 30 {
		this.Timeout = time.Duration(30)
	}
	ctx, cancel := context.WithCancel(context.TODO())
	time.AfterFunc(this.Timeout*time.Second, func() {
		cancel()
	})

	if req, err := http.NewRequest(method, url, payload); err != nil {
		return nil, err
	} else {
		req = req.WithContext(ctx)
		this.req = req
	}

	this.setHeaders()
	this.setCookies()
	this.setQueries()

	if resp, err := this.cli.Do(this.req); err != nil {
		return nil, err
	} else {
		response.Raw = resp
	}

	defer response.Raw.Body.Close()

	response.parseHeaders()
	if err := response.parseBody(); err != nil {
		return nil, err
	}

	return response, nil
}

// Response 构造类
type Response struct {
	Raw       *http.Response
	Headers   map[string]string
	Body      string
	spendTime int64
}

func NewResponse() *Response {
	return &Response{}
}

func (this *Response) StatusCode() int {
	if this.Raw == nil {
		return 0
	}
	return this.Raw.StatusCode
}

func (this *Response) IsOk() bool {
	return this.StatusCode() == 200
}

func (this *Response) SpendTime() string {
	return strconv.Itoa(int(this.spendTime)) + "ms"
}

func (this *Response) parseHeaders() {
	headers := map[string]string{}
	for k, v := range this.Raw.Header {
		headers[k] = v[0]
	}
	this.Headers = headers
}

func (this *Response) parseBody() error {
	if body, err := ioutil.ReadAll(this.Raw.Body); err != nil {
		return err
	} else {
		this.Body = string(body)
	}
	return nil
}
```
写个demo简单介绍下如何使用。
```golang
package main

import (
	"log"
	"project04/library"
	"github.com/json-iterator/go"
)

func main() {
	url := "http://www.kuaidi100.com/query"
	queries := map[string]string{
		"postid": "800125432030318719",
		"type":   "yuantong",
	}
	resp, err := library.NewRequest().SetUrl(url).SetQueries(queries).SetTimeOut(3).Get()
	if err != nil {
		log.Println(err)
	} else {
		log.Println(resp.StatusCode())
		log.Println(resp.Body)
		var jd map[string]interface{}
		err := jsoniter.Unmarshal([]byte(resp.Body), &jd)
		if err != nil {
			log.Println(err)
		} else {
			log.Println(jd)
			log.Println(jd["data"])
		}
	}
}
```
具体使用可以直接看代码，就几行不多，希望对你有帮助，喜欢的可以 star 一下！

#### 参考资料
- https://github.com/mikemintang/go-curl
- https://github.com/json-iterator/go
- http://blog.jobbole.com/107012/