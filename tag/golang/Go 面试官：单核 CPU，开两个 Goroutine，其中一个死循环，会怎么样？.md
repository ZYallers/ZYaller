[//]:# (2021/3/15 15:50|GOLANG|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/94c5e2d985519b10957a1f74344845db64859761.jpg)
# Go 面试官：单核 CPU，开两个 Goroutine，其中一个死循环，会怎么样？
> [煎鱼](https://eddycjy.com/posts/go/go-tips-goroutineloop)

今天的男主角，是与 Go 工程师有调度相关的知识，那就是 “**单核 CPU，开两个 Goroutine，其中一个死循环，会怎么样？**”

**请在此处默念自己心目中的答案**，再一起研讨一波 Go 的技术哲学。

## 问题定义

针对这个问题，我们需要把问题剖开来看看，其具有以下几个元素：
- 运行 Go 程序的计算机只有一个单核 CPU。
- 两个 Goroutine 在运行。
- 一个 Goroutine 死循环。

根据这道题的题意，可大致理解其想要问的是 Go 调度相关的一些知识理解。

### 单核 CPU

第一个要点，就是要明确 “计算机只有一个单核 CPU” 这一个变量定义，对 Go 程序会产生什么影响，否则很难继续展开。

既然明确涉及 Goroutine，这里就会考察到你对 Go 的调度模型 GMP 的基本理解了。

从单核 CPU 来看，最大的影响就是 GMP 模型中的 P，因为 P 的数量默认是与 CPU 核数（GOMAXPROCS）保持一致的。

- G：Goroutine，实际上我们每次调用 `go func` 就是生成了一个 G。
- P：Processor，处理器，一般 P 的数量就是处理器的核数，可以通过 `GOMAXPROCS` 进行修改。
- M：Machine，系统线程。

这三者交互实际来源于 Go 的 M: N 调度模型。也就是 M 必须与 P 进行绑定，然后不断地在 M 上循环寻找可运行的 G 来执行相应的任务。

### Goroutine 受限

第二个要点，就是 Goroutine 的数量和运行模式都是受限的。有两个 Goroutine，一个 Goroutine 在死循环，另外一个在正常运行。

这可以理解为 Main Goroutine + 起了一个新 Goroutine 跑着死循环，因为本身 main 函数就是一个主协程在运行着，没毛病。

需要注意的是，Goroutine 里跑着死循环，也就是时时刻刻在运行着 “业务逻辑”。这块需要与单核 CPU 关联起来，**考虑是否会一直阻塞住，把整个 Go 进程运行给 hang 住了**？

注： 但若是在现场面试，可以先枚举出这种场景，诠释清楚后。再补充提问面试官，是否这类场景？

### Go 版本的问题

第三个要点，是一个隐性的拓展点。如果你是一个老 Go 粉，经常关注 Go 版本的更新情况（至少大版本），则应该会知道 Go 的调度是会变动的（会在后面的小节讲解）。

因此**本文这个问题，在不同的 Go 语言版本中，结果可能会是不一样**的。但是面试官并没有指出，这里就需要考虑到：
1. 面试官故意不指出，等着你指出。
2. 面试官没留意到这块，没想那么多。
3. 面试官自己都不知道这块的 “新” 知识，他的知识可能还是老的。

如果你注意到了，是一个小亮点，说明你在这块有一定的知识积累。

## 实战演练

在刚刚过去的 3s 中，你已经把上面的考量都在大脑中过了一遍。接下来我们正式进入实战演练，构造一个例子：

```golang
// Main Goroutine 
func main() {
    // 模拟单核 CPU
    runtime.GOMAXPROCS(1)
    
    // 模拟 Goroutine 死循环
    go func() {
        for {
        }
    }()
    time.Sleep(time.Millisecond)
    fmt.Println("脑子进煎鱼了")
}
```

在上面的例子中，我们通过以下方式达到了面试题所需的目的：
- 设置 `runtime.GOMAXPROCS` 方法模拟了单核 CPU 下只有一个 P 的场景。
- 运行一个 Goroutine，内部跑一个 for 死循环，达到阻塞运行的目的。
- 运行一个 Goroutine，主函数（main）本身就是一个 Main Goroutine。

思考一下：**这段程序是否会输出 ”脑子进煎鱼了“ 呢，为什么**？

答案是：
- 在 Go1.14 前，不会输出任何结果。
- 在 Go1.14 及之后，能够正常输出结果。

## 为什么

这是怎么回事呢，这两种情况分别对应了什么原因和标准，Go 版本的变更有带来了什么影响？

### 不会输出任何结果

显然，这段程序是有一个 Goroutine 是正在执行死循环，也就是说他肯定无法被抢占。

这段程序中更没有涉及主动放弃执行权的调用（runtime.Gosched），又或是其他调用（可能会导致执行权转移）的行为。
因此这个 Goroutine 是没机会溜号的，只能一直打工...

那为什么主协程（Main Goroutine）会无法运行呢，其实原因是会优先调用休眠，但由于单核 CPU，其只有唯一的 P。唯一的 P 又一直在打工不愿意下班（执行 for 死循环，被迫无限加班）。

因此主协程永远没有机会呗调度，所以这个 Go 程序自然也就一直阻塞在了执行死循环的 Goroutine 中，永远无法下班（执行完毕，退出程序）。

### 正常输出结果

那为什么 Go1.14 及以后的版本，又能正常输出了呢？

主要还是**在 Go1.14 实现了基于信号的抢占式调度**，以此来解决上述一些仍然无法被抢占解决的场景。

主要原理是Go 程序在启动时，会在 `runtime.sighandler` 方法注册并且绑定 `SIGURG` 信号：

```golang
func mstartm0() {
	...
	initsig(false)
}
func initsig(preinit bool) {
	for i := uint32(0); i < _NSIG; i++ {
		...
		setsig(i, funcPC(sighandler))
	}
}
```

绑定相应的 `runtime.doSigPreempt` 抢占方法：

```golang
func sighandler(sig uint32, info *siginfo, ctxt unsafe.Pointer, gp *g) {
    ...
    if sig == sigPreempt && debug.asyncpreemptoff == 0 {
        // 执行抢占
        doSigPreempt(gp, c)
    }
}
```

同时在调度的 `runtime.sysmon` 方法会调用 `retake` 方法处理一下两种场景：
- 抢占阻塞在系统调用上的 P。
- 抢占运行时间过长的 G。

该方法会检测符合场景的 P，当满足上述两个场景之一。就会发送信号给 M， M 收到信号后将会休眠正在阻塞的 Goroutine，调用绑定的信号方法，并进行重新调度。以此来解决这个问题。

注：在 Go 语言中，sysmon 会用于检测抢占。sysmon 是 Go 的 Runtime 的系统检测器，sysmon 可进行 forcegc、netpoll、retake 等一系列骚操作（via @xiaorui）。

## 总结

在这篇文章中，我们针对 ”单核 CPU，开两个 Goroutine，其中一个死循环，会怎么样？“ 这个问题进行了展开剖析。

针对不同 Go 语言版本，不同程序逻辑的表现形式都不同，但背后的基本原理都是与 Go 调度模型和抢占有关。

你是否有在这一块遇到问题呢，欢迎大家在留言区评论和交流。