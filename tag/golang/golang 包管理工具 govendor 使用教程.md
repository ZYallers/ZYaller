# golang 包管理工具 govendor 使用教程
> https://blog.csdn.net/benben_2015/article/details/80614873

## 使用步骤
1. 首先，从go get -u github.com/kardianos/govendor下载govendor工具到本地。
2. govendor使用时，必须保证你的工程项目放在GOPATH/src目录下。
3. 在Go命令行执行govendor init，自动生成vendor文件夹（存放你项目需要的依赖包）和vendor.json文件（有关依赖包的描述文件）。
4. 这时你查看vendor.json文件时，可能还没有什么内容。此时你需要将GOPATH文件夹中的包添加到vendor目录下，只需执行命令govendor add +external或者govendor add +e。
5. 此时看到的vendor.json文件就比之前多了许多，例如：
```json
{
    "comment": "",
    "ignore": "test",
    "package": [
        {
            "checksumSHA1": "T6YlZ5PORNIwutJP7Vfe29XKQno=",
            "path": "github.com/astaxie/beego",
            "revision": "d96289a81bf67728cff7a19b067aaecc65a62ec6",
            "revisionTime": "2017-07-18T16:56:48Z"
        },
        {
            "checksumSHA1": "vvdzuefaGsQVMbcON/s0oqjrRkU=",
            "path": "github.com/astaxie/beego/cache",
            "revision": "d96289a81bf67728cff7a19b067aaecc65a62ec6",
            "revisionTime": "2017-07-18T16:56:48Z"
        },
        {
            "checksumSHA1": "OFioicOCBXIM8IJ5W9SE0EOWmSA=",
            "path": "github.com/astaxie/beego/session/redis",
            "revision": "d96289a81bf67728cff7a19b067aaecc65a62ec6",
            "revisionTime": "2017-07-18T16:56:48Z"
        },
        {
            "checksumSHA1": "B6+D5EMUhOmo6I5wIVoTwNfcsV8=",
            "path": "github.com/astaxie/beego/toolbox",
            "revision": "d96289a81bf67728cff7a19b067aaecc65a62ec6",
            "revisionTime": "2017-07-18T16:56:48Z"
        },
        {
            "checksumSHA1": "wyz5HgdoDurteHhp63m+CwKx7zg=",
            "path": "github.com/astaxie/beego/utils",
            "revision": "d96289a81bf67728cff7a19b067aaecc65a62ec6",
            "revisionTime": "2017-07-18T16:56:48Z"
        }
    ],
    "rootPath": "benben-project"
}
```

## 其他常用命令
- govendor list可以快速查看你项目中的外部依赖包。例如：
```bash
 v  github.com/astaxie/beego
 v  github.com/astaxie/beego/cache
 v  github.com/astaxie/beego/cache/redis
 v  github.com/astaxie/beego/config
 v  github.com/astaxie/beego/context
 v  github.com/astaxie/beego/context/param
 v  github.com/astaxie/beego/grace
 l  benben-project/router
 l  benben-project/config
 l  benben-project/controllers
 l  benben-project/log
 l  benben-project/models
```
其中最左边的是描述包的状态，右边是你工程的依赖包 
- govendor add添加依赖包到vendor目录下，在使用 govendor add命令时，后面需要跟上下面介绍的一些状态，也可以直接跟上缺失包的地址，如下文常见错误中的做法。 
- govendor update从你的GOPAHT中更新你工程的依赖包 
- govendor remove从你工程下的vendor文件中移除对应的包 
- govendor fetch添加或者更新vendor文件夹中的包

## govendor 使用状态来指定包
```bash
+local     (l) 表示工程中的包
+external  (e) 从GOPATH中引用的包，但不包含在你的当前工程中
+vendor    (v) vendor文件夹中的包
+std       (s) Go标准库中的包
+excluded  (x) 从vendor文件中排除的外部依赖包
+unused    (u) vendor文件中存在但却未使用的包
+missing   (m) 项目引用但却为发现的包
+program   (p) main包中包
```
其中有一些状态存在简写，例如：+std可以用+s表示，+external可以用+ext或者+e表示，+external可以用+exc或者+x表示。

在使用时，你也可以对这些状态进行逻辑组合，例如：
```bash
+local,grogram表示既满足+local又满足+program。
+local +vendor表示只要满足两者之一。
+vendor,program +std表示vendor和program是与的关系，整体和std是或的关系
+vendor,^program表示满足vendor，但却不满足program
```

## 常见错误 
> 服务器提示某个依赖包没有找到 

原因可能是vendor文件中没有该包或者vendor.json文件中没有该包的描述信息。
假设"github.com/astaxie/beego/logs"包的信息在vendor.json文件中没有找到，
则在go命令行中执行govendor add github.com/astaxie/beego/logs。