# go build 完全攻略
> http://c.biancheng.net/view/120.html

Go 语言的编译速度非常快。Go 1.9 版本后默认利用 Go 语言的并发特性进行函数粒度的并发编译。

Go 语言的程序编写基本以源码方式，无论是自己的代码还是第三方代码，并且以 GOPATH 作为工作目录和一套完整的工程目录规则。因此 Go 语言中日常编译时无须像 C++ 一样配置各种包含路径、链接库地址等。

Go 语言中使用 go build 命令将源码编译为可执行文件。go build 有很多种编译方法，如无参数编译、文件列表编译、指定包编译等，使用这些方法都可以输出可执行文件。

### 无参数编译
假设用到的代码具体位置是`./src/chapter11/gobuild`
代码相对于 GOPATH 的目录关系如下：
```
.
└── src
    └── chapter11
        └── gobuild
            ├── lib.go
            └── main.go
```

main.go 代码如下：
```go
package main
import (
    "fmt"
)
func main() {
    // 同包的函数
    pkgFunc()
    fmt.Println("hello world")
}
```

lib.go 代码如下：
```go
package main
import "fmt"
func pkgFunc() {
    fmt.Println("call pkgFunc")
}
```
如果源码中没有依赖 GOPATH 的包引用，那么这些源码可以使用无参数 go build。格式如下：
```bash
go build
```

在代码所在目录`（./src/chapter11/gobuild）`下使用go build 命令，如下所示：
```bash
$ cd src/chapter11/gobuild/
$ go build
$ ls
gobuild  lib.go  main.go
$ ./gobuild
call pkgFunc
hello world
```

命令行指令和输出说明如下：
- 第 1 行，转到本例源码目录下。
- 第 2 行，go build 在编译开始时，会搜索当前目录的 go 源码。这个例子中，go build 会找到 lib.go 和 main.go 两个文件。编译这两个文件后，生成当前目录名的可执行文件并放置于当前目录下，这里的可执行文件是 gobuild。
- 第 3 行和第 4 行，列出当前目录的文件，编译成功，输出 gobuild 可执行文件。
- 第 5 行，运行当前目录的可执行文件 gobuild。
- 第 6 行和第 7 行，执行 gobuild 后的输出内容。

### 文件列表
编译同目录的多个源码文件时，可以在 go build 的后面提供多个文件名，go build 会编译这些源码，输出可执行文件，“go build+文件列表”的格式如下：

```bash
go build file1.go file2.go……
```

在代码代码所在目录（./src/chapter11/gobuild）中使用 go build，在 go build 后添加要编译的源码文件名，代码如下：

```bash
$ go build main.go lib.go
$ ls
lib.go  main  main.go
$ ./main
call pkgFunc
hello world
$ go build lib.go main.go
$ ls
lib  lib.go  main  main.go
```

命令行指令和输出说明如下：
- 第 1 行在 go build 后添加文件列表，选中需要编译的 Go 源码。
- 第 2  行和第 3 行列出完成编译后的当前目录的文件。这次的可执行文件名变成了 main。
- 第 4～6 行，执行 main 文件，得到期望输出。
- 第 7 行，尝试调整文件列表的顺序，将 lib.go 放在列表的首位。
- 第 8 行和第 9 行，编译结果中出现了 lib 可执行文件。

> 使用“go build+文件列表”方式编译时，可执行文件默认选择文件列表中第一个源码文件作为可执行文件名输出。

如果需要指定输出可执行文件名，可以使用-o参数，参见下面的例子：

```bash
$ go build -o myexec main.go lib.go
$ ls
lib.go  main.go  myexec
$ ./myexec
call pkgFunc
hello world
```

上面代码中，在 go build 和文件列表之间插入了-o myexec参数，表示指定输出文件名为 myexec。

> 使用“go build+文件列表”编译方式编译时，文件列表中的每个文件必须是同一个包的 Go 源码。也就是说，不能像 C++ 语言一样，将所有工程的 Go 源码使用文件列表方式进行编译。编译复杂工程时需要用“指定包编译”的方式。

“go build+文件列表”方式更适合使用 Go 语言编写的只有少量文件的工具。

### 包

“go build+包”在设置 GOPATH 后，可以直接根据包名进行编译，即便包内文件被增（加）删（除）也不影响编译指令。

#### 1. 代码位置及源码

假设用到的代码具体位置是 `./src/chapter11/goinstall`

相对于GOPATH的目录关系如下：
```
.
└── src
    └── chapter11
        └──goinstall
            ├── main.go
            └── mypkg
                └── mypkg.go
```

main.go代码如下：
```go
package main
import (
    "chapter11/goinstall/mypkg"
    "fmt"
)
func main() {
    mypkg.CustomPkgFunc()
    fmt.Println("hello world")
}
```

mypkg.go代码如下：

```go
package mypkg
import "fmt"
func CustomPkgFunc() {
    fmt.Println("call CustomPkgFunc")
}
```
#### 2. 按包编译命令
执行以下命令将按包方式编译 goinstall 代码：
```bash
$ export GOPATH=/home/davy/golangbook/code
$ go build -o main chapter11/goinstall
$ ./goinstall
call CustomPkgFunc
hello world
```
代码说明如下：
- 第 1 行，设置环境变量 GOPATH，这里的路径是笔者的目录，可以根据实际目录来设置 GOPATH。
- 第 2 行，-o执行指定输出文件为 main，后面接要编译的包名。包名是相对于 GOPATH 下的 src 目录开始的。
- 第 3～5 行，编译成功，执行 main 后获得期望的输出。

> 参考这个例子编译代码时，需要将 GOPATH 更换为自己的目录。注意 GOPATH 下的目录结构，源码必须放在 GOPATH 下的 src 目录下。所有目录中不要包含中文。

### 附加参数

go build 还有一些附加参数，可以显示更多的编译信息和更多的操作，详见下表所示。

附加参数 | 参数描述
---|---
-v|编译时显示包名
-p n|开启并发编译，默认情况下该值为 CPU 逻辑核数
-a|强制重新构建
-n|打印编译时会用到的所有命令，但不真正执行
-x|打印编译时会用到的所有命令
-race|开启竞态检测

> 表中的附加参数按使用频率排列，读者可以根据需要选择使用。

