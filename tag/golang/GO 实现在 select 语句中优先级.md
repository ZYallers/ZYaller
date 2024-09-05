[//]:# "2024/9/5 13:55|GOLANG|"

# GO 实现在 select 语句中优先级

Go 语言中的 `select` 语句可以同时对多个通道的读写的 `case` 进行监听，当其中一个通道满足读写条件时，`select` 语句就会执行对应的分支。从语法形式上看起来和 `switch` 语句很是类似：

```go
select {
case <-ch1:
    fmt.Println("hello")
case ch2 <- 1:
    fmt.Println("world")
}
```

也正应如此，很多新手 Gopher 会下意识地认为 `select` 语句和 `switch` 语句一样，会按照代码的书写顺序依次执行 `case` 分支。

但根据 **Go Specification**中对 `select` 语句的描述，`select` 语句会（伪）随机地选择一个满足条件的 `case` 分支执行，而不是按照代码的书写顺序执行：

> If one or more of the communications can proceed, a single one that can proceed is chosen via a uniform pseudo-random selection.

比如下面这段代码：

```go
package main

import "fmt"

func main() {
    numCh := make(chan int, 5)
    strCh := make(chan string, 1)
    go func() {
        for i := range 5 {
            numCh <- i
        }
        strCh <- "hello"
    }()
    for {
        select {
        case n := <-numCh:
            fmt.Println(n)
        case s := <-strCh:
            fmt.Println(s)
            return
        }
    }
}
```

在主函数中，我们创建了两个**有缓冲**的通道 `numCh` 和 `strCh`，并在一个 goroutine 中向 `numCh` 中先写入 5 个整数，然后再向 `strCh` 中写入一个字符串。使用 `select` 语句监听这两个通道，打印出从 `numCh` 中读取的整数和从 `strCh` 中读取的字符串，如果从 `strCh` 中读取到了字符串，就结束程序。

多次运行以上这段代码，你会发现输出的结果可能是：

```
0
1
2
hello
```

或者：

```
0
hello
```

这样变化的结果，且几乎不可能会出现：

```
0
1
2
3
4
hello
```

出现这样的结果是因为 `numCh` 是一个有缓冲的通道，写入数据时不会阻塞，主函数中对 `numCh` 的读操作会慢于写入，写完 5 个整数后，又立即向 `strCh` 中写入了 hello。这样就会存在主函数 `select` 的两个 `case` 分支都满足可读写的情况，但 `select` 语句只会随机选择一个就绪的 `case` 分支执行，所以可能会出现 hello 先输出，程序直接结束的情况。



## select 实现优先级

如果我们就是期望先输出 5 个整数，然后再输出 hello，也就是期望 `numCh` 优先级高于 `strCh`，我们该怎么办呢？

如果有两个 `case` 分支都有数据就绪可读的情况，且需要保证其中一个分支的优先级时，我们需要做的是：

1. 如果 `select` 选中高优先级通道的 `case` 分支，那么就直接执行这个分支；

2. 如果 `select` 选中低优先级通道的 `case` 分支：

3. - 需要将高优先级通道内的数据读完；
   - 然后再执行低优先级通道的 `case` 分支逻辑。

拿上面的例子来说，我们可以这样修改代码：

```go
package main

import "fmt"

func main() {
    numCh := make(chan int, 5)
    strCh := make(chan string, 1)
    go func() {
        for i := range 5 {
            numCh <- i
        }
        strCh <- "hello"
    }()
    for {
        select {
        case n := <-numCh:
            fmt.Println(n)
        case s := <-strCh:
            for {
                select {
                case n := <-numCh:
                    fmt.Println(n)
                default:
                    fmt.Println(s)
                    return
                }
            }
        }
    }
}
```

修改后的代码，无论执行多少次，输出的结果都是：

```
0
1
2
3
4
hello
```

上述代码在 `strCh` 的 `case` 分支中，增加了一个内层的 `for-select`，并且有一个读取 `numCh` 的分支和 `default` 分支。当 `select` 选中 `strCh` 的 `case` 分支时，会先读取 `numCh` 中的所有就绪数据，当没有数据可读时，会走 `default` 分支，输出 hello 并结束程序。



## select 优先级应用

关于在 `select` 中实现优先级在实际生产中是有实际应用场景的， 在最大牌的 Go 开源项目 Kubernetes 中，就有一个关于 `select` 优先级技巧的实际例子，在 **K8s Controller**关于 Taint/Toleration 的控制器中：

![IMG](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/2024/image-20240905142246462.png)

在这段代码中，`worker` 希望优先处理关于 Node 的更新事件，即 `tc.nodeUpdateChannels[worker]` 通道的优先级要高于 `tc.podUpdateChannels[worker]`。当 Pod 更新事件到来时，会优先将 Node 更新事件队列中的事件处理完，然后再处理 Pod 更新事件。

K8s Controller 中的这段代码比我们上面的例子又要多一个细节。在我们的例子中，`strCh` 读到数据后就会退出程序，而 K8s Controller 的 `worker` 需要不断监听 Node 和 Pod 的更新事件，所以在低优先级的分支中，使用内层 `for-select` 读完高优先级的 Node 通道的数据后，跳出了这个内层 `for-select`，继续外层的 `for-select` 监听。这里注意 `break` 想跳出内层 `for` 循环需要对这个内层 `for` 打个标签（这里是 `priority`），不然 `break` 只会跳出内层的 `select`，内层的 `for` 还会继续执行。



## Reference

1. **Go Specification:** *https://go.dev/ref/spec#Select_statements*
2. **K8s Controller:** https://github.com/kubernetes/kubernetes/blob/7df5940bf920349a3c158bcd425e4e4cf97096da/pkg/controller/tainteviction/taint_eviction.go#L355

