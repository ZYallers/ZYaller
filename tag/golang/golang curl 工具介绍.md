# golang curl 工具介绍
PHPer开发者和Linux系统下对curl命令绝对很熟悉，那golang呢？
其实，golang的资源包`net/http`包已经基本实现了，这里封装了个curl类，方便使用。
```golang
package tool

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Request构造类
type Request struct {
	client   *http.Client
	request  *http.Request
	Method   string
	Url      string
	Timeout  time.Duration
	Headers  map[string]string
	Cookies  map[string]string
	Queries  map[string]string
	PostData map[string]interface{}
}

// 创建一个Request实例
func NewRequest(url string) *Request {
	return &Request{Url: url, client: http.DefaultClient, Timeout: 30 * time.Second}
}

// 设置请求方法
func (r *Request) SetMethod(method string) *Request {
	r.Method = method
	return r
}

// 设置请求地址
func (r *Request) SetUrl(url string) *Request {
	r.Url = url
	return r
}

// 设置请求头
func (r *Request) SetHeaders(headers map[string]string) *Request {
	r.Headers = headers
	return r
}

// 将用户自定义请求头添加到http.Request实例上
func (r *Request) setHeaders() *Request {
	var foundConnection, foundUserAgent bool
	for k, v := range r.Headers {
		r.request.Header.Set(k, v)
		switch k {
		case "Connection":
			foundConnection = true
		case "User-Agent":
			foundUserAgent = true
		}
	}
	if !foundConnection {
		r.request.Header.Set("Connection", "close")
	}
	if !foundUserAgent {
		r.request.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.119 Safari/537.36")
	}
	return r
}

// 设置请求cookies
func (r *Request) SetCookies(cookies map[string]string) *Request {
	r.Cookies = cookies
	return r
}

// 将用户自定义cookies添加到http.Request实例上
func (r *Request) setCookies() *Request {
	for k, v := range r.Cookies {
		r.request.AddCookie(&http.Cookie{Name: k, Value: v})
	}
	return r
}

// 设置url查询参数
func (r *Request) SetQueries(queries map[string]string) *Request {
	r.Queries = queries
	return r
}

// 将用户自定义url查询参数添加到http.Request上
func (r *Request) setQueries() *Request {
	q := r.request.URL.Query()
	for k, v := range r.Queries {
		q.Add(k, v)
	}
	r.request.URL.RawQuery = q.Encode()
	return r
}

// 设置post请求的提交数据
func (r *Request) SetPostData(postData map[string]interface{}) *Request {
	r.PostData = postData
	return r
}

// 发起get请求
func (r *Request) Get() (*Response, error) {
	return r.SetMethod(http.MethodGet).Send()
}

// 发起post请求
func (r *Request) Post() (*Response, error) {
	return r.SetMethod(http.MethodPost).Send()
}

// SetDialTimeOut
func (r *Request) SetTimeOut(timeout time.Duration) *Request {
	if timeout > 0 && timeout < 30*time.Second {
		r.Timeout = timeout
	}
	return r
}

// 发起请求
func (r *Request) Send() (*Response, error) {
	var body io.Reader
	if len(r.PostData) > 0 {
		if contentType, exist := r.Headers["Content-Type"]; exist {
			switch strings.ToLower(contentType) {
			case "application/json", "application/json;charset=utf-8":
				if bts, err := json.Marshal(r.PostData); err != nil {
					return nil, err
				} else {
					body = bytes.NewReader(bts)
				}
			case "application/x-www-form-urlencoded":
				postData := url.Values{}
				for k, v := range r.PostData {
					postData.Add(k, fmt.Sprintf("%v", v))
				}
				body = strings.NewReader(postData.Encode())
			}
		}
	}

	if req, err := http.NewRequest(r.Method, r.Url, body); err != nil {
		return nil, err
	} else {
		ctx, cancel := context.WithTimeout(context.Background(), r.Timeout)
		defer cancel()
		r.request = req.WithContext(ctx)
	}

	r.setHeaders().setCookies().setQueries()

	if resp, err := r.client.Do(r.request); err != nil {
		return nil, err
	} else {
		res := NewResponse()
		res.Raw = resp
		defer res.Raw.Body.Close()
		if err := res.parseBody(); err != nil {
			return nil, err
		} else {
			return res, nil
		}
	}
}

// Response 构造类
type Response struct {
	Raw     *http.Response
	Headers map[string]string
	Body    string
}

func NewResponse() *Response {
	return &Response{}
}

func (r *Response) StatusCode() int {
	if r.Raw == nil {
		return 0
	}
	return r.Raw.StatusCode
}

func (r *Response) IsOk() bool {
	return r.StatusCode() == http.StatusOK
}

func (r *Response) parseHeaders() {
	headers := map[string]string{}
	for k, v := range r.Raw.Header {
		headers[k] = v[0]
	}
	r.Headers = headers
}

func (r *Response) parseBody() error {
	if bts, err := ioutil.ReadAll(r.Raw.Body); err != nil {
		return err
	} else {
		r.Body = string(bts)
		return nil
	}
}
```
写个demo简单介绍下如何使用。
```golang
package main

import (
	"log"
	"project04/tool"
	"github.com/json-iterator/go"
)

func main() {
	url := "http://www.kuaidi100.com/query"
	queries := map[string]string{
		"postid": "800125432030318719",
		"type":   "yuantong",
	}
	resp, err := tool.NewRequest(url).SetQueries(queries).SetTimeOut(3).Get()
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