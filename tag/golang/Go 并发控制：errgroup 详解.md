[//]:# "2024/11/7 15:54|GOLANG|"

# Go 并发控制：errgroup 详解
> [Go编程世界](https://mp.weixin.qq.com/s/6ikavBDiDe81uGNRJX9FfA)

errgroup 是 Go 官方库 x 中提供的一个非常实用的工具，用于并发执行多个 goroutine，并且方便的处理错误。
我们知道，Go 标准库中有个 sync.WaitGroup 可以用来并发执行多个 goroutine，errgroup 就是在其基础上实现了 errgroup.Group。
不过，errgroup.Group 和 sync.WaitGroup 在功能上是有区别的，尽管它们都用于管理 goroutine 的同步。

## errgroup 优势

与 sync.WaitGroup 相比，以下是设计 errgroup.Group 的原因和优势：
### 1. 错误处理
- sync.WaitGroup 只负责等待 goroutine 完成，不处理 goroutine 的返回值或错误
- errgroup.Group 虽然目前也不能直接处理 goroutine 的返回值，但在 goroutine 返回错误时，可以立即取消其他正在运行的 goroutine，并在 Wait 方法中返回第一个非 nil 的错误。
### 2. 上下文取消
- errgroup 可以与 context.Context 配合使用，支持在某个 goroutine 出现错误时自动取消其他 goroutine，这样可以更好地控制资源，避免不必要的工作。
### 3. 简化并发编程

- 使用 errgroup 可以减少错误处理的样板代码，开发者不需要手动管理错误状态和同步逻辑，使得并发编程更简单、更易于维护。
### 4. 限制并发数量

- errgroup 提供了便捷的接口来限制并发 goroutine 的数量，避免过载，而 sync.WaitGroup 没有这样的功能。

以上，errgroup 为处理并发任务提供了更强大的错误管理和控制机制，因此在许多并发场景下是更优的选择。

随着本文接下来的深入讲解，你就能深刻体会到上面所说的优势了。

## sync.WaitGroup 使用示例
在介绍 errgroup.Group 前，我们还是先来一起回顾下 sync.WaitGroup 的用法。示例如下：
```go
package main

import (
    "fmt"
    "net/http"
    "sync"
)

func main() {
    var urls = []string{
        "http://www.golang.org/",
        "http://www.google.com/",
        "http://www.somestupidname.com/", // 这是一个错误的 URL，会导致任务失败
    }
    var err error

    var wg sync.WaitGroup // 零值可用，不必显式初始化

    for _, url := range urls {
        wg.Add(1) // 增加 WaitGroup 计数器

        // 启动一个 goroutine 来获取 URL
        go func() {
            defer wg.Done() // 当 goroutine 完成时递减 WaitGroup 计数器

            resp, e := http.Get(url)
            if e != nil { // 发生错误返回，并记录该错误
                err = e
                return
            }
            defer resp.Body.Close()
            fmt.Printf("fetch url %s status %s\n", url, resp.Status)
        }()
    }

    // 等待所有 goroutine 执行完成
    wg.Wait()
    if err != nil { // err 会记录最后一个错误
        fmt.Printf("Error: %s\n", err)
    }
}
```

示例中，我们使用 sync.WaitGroup 来启动 3 个 goroutine 并发访问 3 个不同的 URL，并在成功时打印响应状态码，或失败时记录错误信息。

执行示例代码，得到如下输出：
```shell
$ go run waitgroup/main.go
fetch url http://www.google.com/ status 200 OK
fetch url http://www.golang.org/ status 200 OK
Error: Get "http://www.somestupidname.com/": dial tcp: lookup www.somestupidname.com: no such host
```
我们获取了两个成功的响应，并打印了一条错误信息。

## errgroup.Group 使用示例
其实 errgroup.Group 的使用套路与 sync.WaitGroup 非常类似。

### 基本使用
errgroup 基本使用套路如下：

1. 导入 errgroup 包。
2. 创建一个 errgroup.Group 实例。
3. 使用 Group.Go 方法启动多个并发任务。
4. 使用 Group.Wait 方法等待所有 goroutine 完成或有一个返回错误。

将前文中的 sync.WaitGroup 程序示例使用 errgroup.Group 重写为如下示例：
```go
package main

import (
    "fmt"
    "net/http"

    "golang.org/x/sync/errgroup"
)

func main() {
    var urls = []string{
        "http://www.golang.org/",
        "http://www.google.com/",
        "http://www.somestupidname.com/", // 这是一个错误的 URL，会导致任务失败
    }

    // 使用 errgroup 创建一个新的 goroutine 组
    var g errgroup.Group // 零值可用，不必显式初始化

    for _, url := range urls {
        // 使用 errgroup 启动一个 goroutine 来获取 URL
        g.Go(func() error {
            resp, err := http.Get(url)
            if err != nil {
                return err // 发生错误，返回该错误
            }
            defer resp.Body.Close()
            fmt.Printf("fetch url %s status %s\n", url, resp.Status)
            return nil // 返回 nil 表示成功
        })
    }

    // 等待所有 goroutine 完成并返回第一个错误（如果有）
    if err := g.Wait(); err != nil {
        fmt.Printf("Error: %s\n", err)
    }
}
```
可以发现，这段程序与 sync.WaitGroup 示例很像，根据代码中的注释，很容易看懂。

执行示例代码，得到如下输出：
```shell
$ go run examples/main.go
fetch url http://www.google.com/ status 200 OK
fetch url http://www.golang.org/ status 200 OK
Error: Get "http://www.somestupidname.com/": dial tcp: lookup www.somestupidname.com: no such host
```
输出结果也没什么变化。

### 上下文取消
errgroup 提供了 errgroup.WithContext 可以附加取消功能，在任意一个 goroutine 返回错误时，可以立即取消其他正在运行的 goroutine，并在 Wait 方法中返回第一个非 nil 的错误。

示例如下：
```go
package main

import (
    "context"
    "fmt"
    "net/http"
    "sync"

    "golang.org/x/sync/errgroup"
)

func main() {
    var urls = []string{
        "http://www.golang.org/",
        "http://www.google.com/",
        "http://www.somestupidname.com/", // 这是一个错误的 URL，会导致任务失败
    }

    // 创建一个带有 context 的 errgroup
    // 任何一个 goroutine 返回非 nil 的错误，或 Wait() 等待所有 goroutine 完成后，context 都会被取消
    g, ctx := errgroup.WithContext(context.Background())

    // 创建一个 map 来保存结果
    var result sync.Map

    for _, url := range urls {
        // 使用 errgroup 启动一个 goroutine 来获取 URL
        g.Go(func() error {
            req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
            if err != nil {
                return err // 发生错误，返回该错误
            }

            // 发起请求
            resp, err := http.DefaultClient.Do(req)
            if err != nil {
                return err // 发生错误，返回该错误
            }
            defer resp.Body.Close()

            // 保存每个 URL 的响应状态码
            result.Store(url, resp.Status)
            return nil // 返回 nil 表示成功
        })
    }

    // 等待所有 goroutine 完成并返回第一个错误（如果有）
    if err := g.Wait(); err != nil {
        fmt.Println("Error: ", err)
    }

    // 所有 goroutine 都执行完成，遍历并打印成功的结果
    result.Range(func(key, value any) bool {
        fmt.Printf("fetch url %s status %s\n", key, value)
        return true
    })
}
```
执行示例代码，得到如下输出：
```shell
$ go run examples/withcontext/main.go
Error:  Get "http://www.somestupidname.com/": dial tcp: lookup www.somestupidname.com: no such host
fetch url http://www.google.com/ status 200 OK
```
由测试结果来看，对于 [http://www.google.com/](http://www.google.com/) 的请求可以接收到成功响应，
由于对 [http://www.somestupidname.com/](http://www.somestupidname.com/) 请求报错，程序来不及等待 [http://www.golang.org/](http://www.golang.org/) 响应，就被取消了。

其实我们大致可以猜测到，取消功能应该是通过 context.cancelCtx 来实现的，我们暂且不必深究，稍后探索源码就能验证我们的猜想了。

### 限制并发数量
errgroup 提供了 errgroup.SetLimit 可以限制并发执行的 goroutine 数量。

示例如下：
```go
package main

import (
    "fmt"
    "time"

    "golang.org/x/sync/errgroup"
)

func main() {
    // 创建一个 errgroup.Group
    var g errgroup.Group
    // 设置最大并发限制为 3
    g.SetLimit(3)

    // 启动 10 个 goroutine
    for i := 1; i <= 10; i++ {
        g.Go(func() error {
            // 打印正在运行的 goroutine
            fmt.Printf("Goroutine %d is starting\n", i)
            time.Sleep(2 * time.Second) // 模拟任务耗时
            fmt.Printf("Goroutine %d is done\n", i)
            return nil
        })
    }

    // 等待所有 goroutine 完成
    if err := g.Wait(); err != nil {
        fmt.Printf("Encountered an error: %v\n", err)
    }

    fmt.Println("All goroutines complete.")
}
```
使用 g.SetLimit(3) 可以限制最大并发为 3 个 goroutine。

执行示例代码，得到如下输出：
```shell
$  go run examples/setlimit/main.go
Goroutine 3 is starting
Goroutine 1 is starting
Goroutine 2 is starting
Goroutine 2 is done
Goroutine 1 is done
Goroutine 5 is starting
Goroutine 3 is done
Goroutine 6 is starting
Goroutine 4 is starting
Goroutine 6 is done
Goroutine 5 is done
Goroutine 8 is starting
Goroutine 4 is done
Goroutine 7 is starting
Goroutine 9 is starting
Goroutine 9 is done
Goroutine 8 is done
Goroutine 10 is starting
Goroutine 7 is done
Goroutine 10 is done
All goroutines complete.
```
根据输出可以发现，虽然我们通过 for 循环启动了 10 个 goroutine，但程序执行时最多只允许同时启动 3 个 goroutine，当这 3 个 goroutine 中有某个执行完成并退出，才会有新的 goroutine 被启动。

### 尝试启动
errgroup 还提供了 errgroup.TryGo 可以尝试启动一个任务，它返回一个 bool 值，标识任务是否启动成功，true 表示成功，false 表示失败。

errgroup.TryGo 需要搭配 errgroup.SetLimit 一同使用，因为如果不限制并发数量，那么 errgroup.TryGo 始终返回 true，当达到最大并发数量限制时，errgroup.TryGo 返回 false。

示例如下：
```go
package main

import (
    "fmt"
    "time"

    "golang.org/x/sync/errgroup"
)

func main() {
    // 创建一个 errgroup.Group
    var g errgroup.Group
    // 设置最大并发限制为 3
    g.SetLimit(3)

    // 启动 10 个 goroutine
    for i := 1; i <= 10; i++ {
        if g.TryGo(func() error {
            // 打印正在运行的 goroutine
            fmt.Printf("Goroutine %d is starting\n", i)
            time.Sleep(2 * time.Second) // 模拟工作
            fmt.Printf("Goroutine %d is done\n", i)
            return nil
        }) {
            // 如果成功启动，打印提示
            fmt.Printf("Goroutine %d started successfully\n", i)
        } else {
            // 如果达到并发限制，打印提示
            fmt.Printf("Goroutine %d could not start (limit reached)\n", i)
        }
    }

    // 等待所有 goroutine 完成
    if err := g.Wait(); err != nil {
        fmt.Printf("Encountered an error: %v\n", err)
    }

    fmt.Println("All goroutines complete.")
}
```
使用 g.SetLimit(3) 限制最大并发为 3 个 goroutine，调用 g.TryGo 如果启动任务成功，打印 Goroutine {i} started successfully 提示信息；启动任务失败，则打印 Goroutine {i} could not start (limit reached) 提示信息。

执行示例代码，得到如下输出：
```shell
$ go run examples/trygo/main.go
Goroutine 1 started successfully
Goroutine 1 is starting
Goroutine 2 is starting
Goroutine 2 started successfully
Goroutine 3 started successfully
Goroutine 4 could not start (limit reached)
Goroutine 5 could not start (limit reached)
Goroutine 6 could not start (limit reached)
Goroutine 7 could not start (limit reached)
Goroutine 8 could not start (limit reached)
Goroutine 9 could not start (limit reached)
Goroutine 10 could not start (limit reached)
Goroutine 3 is starting
Goroutine 2 is done
Goroutine 3 is done
Goroutine 1 is done
All goroutines complete.
```
从输出中可以看到，虽然我们启动了 10 个 goroutine，但程序执行时最多只允许同时启动 3 个 goroutine，当达到最大并发数量限制时，后续的 goroutine 启动失败。

因为限制最大并发数量为 3，所以前面 3 个 goroutine 启动成功，并且正常执行完成，其他几个 goroutine 全部执行失败。

以上就是 errgroup 的全部用法了，更多使用场景你可以在实践中去尝试和感悟。

## 源码解读
源码地址：https://github.com/golang/sync/tree/master/errgroup

从上面链接中可以看 errgroup 全部源码加起来也不到 100 行，可谓短小精悍。

根据包注释我们可以知道，errgroup 包提供了同步、错误传播和上下文取消功能，用于一组 goroutines 处理共同任务的子任务。errgroup.Group 与 sync.WaitGroup 相关，增加了处理任务返回错误的能力。

为了提供以上功能，首先 errgroup 定义了 token 和 Group 两个结构体：
```go
// 定义一个空结构体类型 token，会作为信号进行传递，用于控制并发数
type token struct{}

// Group 是一组协程的集合，这些协程处理同一整体任务的子任务
//
// 零值 Group 是有效的，对活动协程的数量没有限制，并且不会在出错时取消
type Group struct {
    cancel func(error) // 取消函数，就是 context.CancelCauseFunc 类型

    wg sync.WaitGroup // 内部使用了 sync.WaitGroup

    sem chan token // 信号 channel，可以控制协程并发数量

    errOnce sync.Once // 确保错误仅处理一次
    err     error     // 记录子协程集中返回的第一个错误
}
```
token 被定义为空结构体，用来传递信号，这也是 Go 中空结构体的惯用法。

Group 是 errgroup 包提供的唯一公开结构体，其关联的方法承载了所有功能。

cancel 属性为一个函数，上下文取消时会被调用，其实就是 context.CancelCauseFunc 类型，调用 errgroup.WithContext 时被赋值。

wg 属性即为 sync.WaitGroup，承担并发控制的主逻辑,errgroup.Go 和 errgroup.TryGo 内部并发控制逻辑都会代理给 sync.WaitGroup。

sem属性是 token 类型的 channel，用于限制并发数量，调用 errgroup.SetLimit 是被赋值。

err 会记录所有 goroutine 中出现的第一个错误，由errOnce 确保错误错误仅处理一次，所以后面再出现更多的错误都会被忽略。

接下来我们先看 errgroup.SetLimit 方法定义：
```go
// SetLimit 限制该 Group 中活动的协程数量最多为 n，负值表示没有限制
//
// 任何后续对 Go 方法的调用都将阻塞，直到可以在不超过限额的情况下添加活动协程
//
// 在 Group 中存在任何活动的协程时，限制不得修改
func (g *Group) SetLimit(n int) { // 传进来的 n 就是 channel 长度，以此来限制协程的并发数量
    if n < 0 { // 这里检查如果小于 0 则不限制协程并发数量。此外，也不要将其设置为 0，会产生死锁
        g.sem = nil
        return
    }
    if len(g.sem) != 0 { // 如果存在活动的协程，调用此方法将产生 panic
        panic(fmt.Errorf("errgroup: modify limit while %v goroutines in the group are still active", len(g.sem)))
    }
    g.sem = make(chan token, n)
}
```
errgroup.SetLimit 方法可以限制并发属性，其内部逻辑很简单，不过要注意在调用 errgroup.Go 或 errgroup.TryGo 方法前调用 errgroup.SetLimit，以防程序出现 panic。

然后看下主逻辑 errgroup.Go 方法实现：
```go
// Go 会在新的协程中调用给定的函数
// 它会阻塞，直到可以在不超过配置的活跃协程数量限制的情况下添加新的协程
//
// 首次返回非 nil 错误的调用会取消该 Group 的上下文（context），如果该 context 是通过调用 WithContext 创建的，该错误将由 Wait 返回
func (g *Group) Go(f func() error) {
    if g.sem != nil { // 这个是限制并发数的信号通道
        g.sem <- token{} // 如果超过了配置的活跃协程数量限制，向 channel 发送 token 会阻塞
    }

    g.wg.Add(1) // 转发给 sync.WaitGroup.Add(1)，将活动协程数加一
    go func() {
        defer g.done() // 当一个协程完成时，调用此方法，内部会将调用转发给 sync.WaitGroup.Done()

        if err := f(); err != nil { // f() 就是我们要执行的任务
            g.errOnce.Do(func() { // 仅执行一次，即只处理一次错误，所以会记录第一个非 nil 的错误，与协程启动顺序无关
                g.err = err          // 记录错误
                if g.cancel != nil { // 如果 cancel 不为 nil，则调用取消函数，并设置 cause
                    g.cancel(g.err)
                }
            })
        }
    }()
}
```
首先会检测是否使用 errgroup.SetLimit 方法设置了并发限制，如果有限制，则使用 channel 来控制并发数量。

否则执行主逻辑，其实就是 sync.WaitGroup 的套路代码。

在 defer 中调用了 g.done()，done 方法定义如下：
```go
// 当一个协程完成时，调用此方法
func (g *Group) done() {
    // 如果设置了最大并发数，则 sem 不为 nil，从 channel 中消费一个 token，表示一个协程已完成
    if g.sem != nil {
        <-g.sem
    }
    g.wg.Done() // 转发给 sync.WaitGroup.Done()，将活动协程数减一
}
```
另外，如果某个任务返回了错误，则通过 errOnce 确保错误只被处理一次，处理方式就是先记录错误，然后调用 cancel 方法。

cancel 实际上是在 errgroup.WithContext 方法中赋值的：
```go
// WithContext 返回一个新的 Group 和一个从 ctx 派生的关联 Context
//
// 派生的 Context 会在传递给 Go 的函数首次返回非 nil 错误或 Wait 首次返回时被取消，以先发生者为准。
func WithContext(ctx context.Context) (*Group, context.Context) {
    ctx, cancel := withCancelCause(ctx)
    return &Group{cancel: cancel}, ctx
}
```
这里的 withCancelCause 有两种实现。

如果 Go 版本大于等于 1.20，提供的 withCancelCause 函数实现如下：
```go
/ 构建约束标识了这个文件是 Go 1.20 版本被加入的
//go:build go1.20

package errgroup

import "context"

// 代理到 context.WithCancelCause
func withCancelCause(parent context.Context) (context.Context, func(error)) {
    return context.WithCancelCause(parent)
}
```
如果 Go 版本小于 1.20，提供的 withCancelCause 函数实现如下：
```go
//go:build !go1.20

package errgroup

import "context"

func withCancelCause(parent context.Context) (context.Context, func(error)) {
    ctx, cancel := context.WithCancel(parent)
    return ctx, func(error) { cancel() }
}
```
调用 errgroup.Go 方法启动任务后，我们会调用 errgroup.Wait 等待所有任务完成，其实现如下：
```go
// Wait 会阻塞，直到来自 Go 方法的所有函数调用返回，然后返回它们中的第一个非 nil 错误（如果有的话）
func (g *Group) Wait() error {
    g.wg.Wait()          // 转发给 sync.WaitGroup.Wait()，等待所有协程执行完成
    if g.cancel != nil { // 如果 cancel 不为 nil，则调用取消函数，并设置 cause
        g.cancel(g.err)
    }
    return g.err // 返回错误
}
```
所以，最终 errgroup.Wait 返回的错误其实就是 errgroup.Go 方法中记录的第一个错误。

现在，我们还剩下最后一个方法 errgroup.TryGo 的源码没有分析，我把源码贴在下面，并写上了详细的注释：
```go
// TryGo 仅在 Group 中活动的协程数量低于限额时，才在新的协程中调用给定的函数
//
// 返回值标识协程是否启动
func (g *Group) TryGo(f func() error) bool {
    if g.sem != nil { // 如果设置了最大并发数
        select {
        case g.sem <- token{}: // 可以向 channel 写入 token，说明没有达到限额，可以启动协程
            // Note: this allows barging iff channels in general allow barging.
        default: // 如果超过了配置的活跃协程数量限制，会走到这个 case
            return false
        }
    }

    // 接下来的代码与 Go 中的逻辑相同
    g.wg.Add(1)
    go func() {
        defer g.done()

        if err := f(); err != nil {
            g.errOnce.Do(func() {
                g.err = err
                if g.cancel != nil {
                    g.cancel(g.err)
                }
            })
        }
    }()
    return true
}
```
主逻辑与 errgroup.Go 方法一样，不同的是 errgroup.Go 方法如果达到并发限额会阻塞，而 errgroup.TryGo 方法在达到并发限额时直接返回 false。

至此，errgroup 源码就都解读完成了。

## 总结
errgroup 是官方为我们提供的扩展库，在 sync.WaitGroup 基础上，增加了处理任务返回错误的能力。提供了同步、错误传播和上下文取消功能，用于一组 goroutines 处理共同任务的子任务。

errgroup.WithContext 方法可以附加取消功能，在任意一个 goroutine 返回错误时，立即取消其他正在运行的 goroutine，并在 Wait 方法中返回第一个非 nil 的错误。

errgroup.SetLimit 方法可以限制并发执行的 goroutine 数量。

errgroup.TryGo 可以尝试启动一个任务，返回值标识启动成功或失败。

errgroup 源码设计精妙，值得借鉴。