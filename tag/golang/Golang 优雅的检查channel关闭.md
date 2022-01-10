[//]:# (2022/1/10 13:56|GOLANG|https://img0.baidu.com/it/u=422795330,1264935282&fm=253&fmt=auto&app=138&f=JPG)
# Golang 优雅的检查channel关闭
> [CNBLOGS](https://www.cnblogs.com/-wenli/p/12350181.html)

goroutine作为Golang并发的核心，我们不仅要关注它们的创建和管理，当然还要关注如何合理的退出这些协程，不（合理）退出不然可能会造成阻塞、panic、程序行为异常、数据结果不正确等问题。这篇文章介绍，如何合理的退出goroutine，减少软件bug。
goroutine在退出方面，不像线程和进程，不能通过某种手段强制关闭它们，只能等待goroutine主动退出。但也无需为退出、关闭goroutine而烦恼，下面就介绍3种优雅退出goroutine的方法，只要采用这种最佳实践去设计，基本上就可以确保goroutine退出上不会有问题，尽情享用。

## 一、使用for-range退出

`for-range`是使用频率很高的结构，常用它来遍历数据，range能够感知channel的关闭，当channel被发送数据的协程关闭时，range就会结束，接着退出for循环。
它在并发中的使用场景是：当协程只从1个channel读取数据，然后进行处理，处理后协程退出。下面这个示例程序，当in通道被关闭时，协程可自动退出。

```go
go func(in <-chan int) {
    // Using for-range to exit goroutine
    // range has the ability to detect the close/end of a channel
    for x := range in {
        fmt.Printf("Process %d\n", x)
    }
}(inCh)
```

### 二、使用,ok退出
`for-select`也是使用频率很高的结构，select提供了多路复用的能力，所以for-select可以让函数具有持续多路处理多个channel的能力。
但select没有感知channel的关闭，这引出了2个问题：
- 1）继续在关闭的通道上读，会读到通道传输数据类型的零值，
- 2）继续在关闭的通道上写，将会panic。
问题2可使用的原则是，通道只由发送方关闭，接收方不可关闭，即某个写通道只由使用该select的协程关闭，select中就不存在继续在关闭的通道上写数据的问题。
问题1可以使用,ok来检测通道的关闭，使用情况有2种。

一、如果某个通道关闭后，需要退出协程，直接return即可。示例代码：
```go
go func() {
    // in for-select using ok to exit goroutine
    for {
        select {
        case x, ok := <-in:
            if !ok {
                return
            }
            fmt.Printf("Process %d\n", x)
            processedCnt++
        case <-t.C:
            fmt.Printf("Working, processedCnt = %d\n", processedCnt)
        }
    }
}()
```
示例代码中，该协程需要从in通道读数据，还需要定时打印已经处理的数量，有2件事要做，所有不能使用for-range，需要使用for-select，当in关闭时，ok=false，我们直接返回。

二、如果某个通道关闭了，不再处理该通道，而是继续处理其他case，退出是等待所有的可读通道关闭。
我们需要使用select的一个特征：select不会在nil的通道上进行等待。这种情况，把只读通道设置为nil即可解决。
示例代码：
```go
go func() {
    // in for-select using ok to exit goroutine
    for {
        select {
        case x, ok := <-in1:
            if !ok {
                in1 = nil
            }
            // Process
        case y, ok := <-in2:
            if !ok {
                in2 = nil
            }
            // Process
        case <-t.C:
            fmt.Printf("Working, processedCnt = %d\n", processedCnt)
        }
 
        // If both in channel are closed, goroutine exit
        if in1 == nil && in2 == nil {
            return
        }
    }
}()
```
## 三、使用退出通道退出
使用`,ok`来退出使用`for-select`协程，解决是当读入数据的通道关闭时，没数据读时程序的正常结束。想想下面这2种场景，`,ok`还能适用吗？

- 1. 接收的协程要退出了，如果它直接退出，不告知发送协程，发送协程将阻塞。
- 2. 启动了一个工作协程处理数据，如何通知它退出？

使用一个专门的通道，发送退出的信号，可以解决这类问题。以第2个场景为例，协程入参包含一个停止通道`stopCh`，当`stopCh`被关闭，`case <-stopCh`会执行，直接返回即可。
当我启动了100个worker时，只要main()执行关闭stopCh，每一个worker都会都到信号，进而关闭。如果main()向stopCh发送100个数据，这种就低效了。
```go
func worker(stopCh <-chan struct{}) {
    go func() {
        defer fmt.Println("worker exit")
        // Using stop channel explicit exit
        for {
            select {
            case <-stopCh:
                fmt.Println("Recv stop signal")
                return
            case <-t.C:
                fmt.Println("Working .")
            }
        }
    }()
    return
}
```
## 回顾
- 1. 发送协程主动关闭通道，接收协程不关闭通道。技巧：把接收方的通道入参声明为只读(`<-chan`)，如果接收协程关闭只读协程，编译时就会报错。
- 2. 协程处理1个通道，并且是读时，协程优先使用`for-range`，因为range可以关闭通道的关闭自动退出协程。
- 3. `,ok`可以处理多个读通道关闭，需要关闭当前使用`for-select`的协程。
- 4. 显式关闭通道`stopC`h可以处理主动通知协程退出的场景。
