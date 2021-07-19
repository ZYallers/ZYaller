[//]:# (2019/6/3 12:55|GOLANG|)
# go 使用 fresh 类库实现 gin 热重启
> https://huangweitong.com/296.html

每次修改代码之后都需要重新build，Go目前没有内置代码热更新的工具，找了一下找到了第三方类库fresh，在开发的时候使用起来炒鸡方便的。

### 安装
```bash
$ go get github.com/pilu/fresh
```
> 不要用govendor，要不然不会在bin目录下生成可执行命令工具fresh

### 使用
- 进入项目根目录
```bash
$ cd $GOPATH/src/$your_project
```
- 启动fresh
```bash
$ fresh
```
> 如果需要自定义配置，可以参考如下 runner.conf 修改参数：
```bash
root:              .
tmp_path:          ./fresh
build_name:        runner_build
build_log:         runner_build_errors.log
valid_ext:         .go, .tpl, .tmpl, .html, .md, .log
no_rebuild_ext:    .tpl, .tmpl, .html
ignored:           assets, tmp, log
build_delay:       3000
colors:            1
log_color_main:    cyan
log_color_build:   yellow
log_color_runner:  green
log_color_watcher: magenta
log_color_app:     red
```
然后指定该配置运行
```bash
$ fresh -c runner.conf
```

这时控制台就开始编译打包执行了，注意控制台返回的信息，能知道项目的编译错误和日志，最后会有访问 url，

### 来实践一下
main.go
```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    r.GET("/hello", func(c *gin.Context) {
        c.String(http.StatusOK,"Hello Fresh!")
})
    r.Run()
}
```

![IMG](https://huangweitong.com/usr/uploads/2018/12/386559645.png)

fresh启动之后，新开一个窗口用curl测试一下

```bash
$ curl -XGET http://localhost:8080/hello
Hello Fresh!
```

修改一下main.go：

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
)

func main() {
    r := gin.Default()
    r.GET("/hello", func(c *gin.Context) {
        c.String(http.StatusOK,"Hello Fresh!\nReload")
})
    r.Run()
}
```

项目go 文件有新增或修改，fresh 都会智能 reload

![IMG](https://huangweitong.com/usr/uploads/2018/12/2368945946.png)

```bash
$ curl -XGET http://localhost:8080/hello
Hello Fresh!
Reload
```

是不是很不错？更多细节可以去 github 官网查看该包更多资料！