[//]: # "2022/2/24 16:02|GOLANG"

#  Go 源码里的这些 //go: 指令，你知道吗？

> 文章转载自：[polarisxu](https://mp.weixin.qq.com/s/7PY4MCat5gYdqWVS1E0j8w)

大家好，我是煎鱼。

如果你平时有翻看源码的习惯，你肯定会发现。咦，怎么有的方法上面总是写着 `//go:`  这类指令呢。他们到底是干嘛用的？

今天和大家一同揭开他们的面纱，我将给你介绍一下他们的作用都是什么。

## go:linkname

```go
//go:linkname localname importpath.name
```

该指令指示编译器使用 `importpath.name` 作为源代码中声明为 `localname` 的变量或函数的目标文件符号名称。但是由于这个伪指令，可以破坏类型系统和包模块化，只有引用了 unsafe 包才可以使用。

简单来讲，就是 `importpath.name` 是 `localname` 的符号别名，编译器实际上会调用 `localname`。

使用的前提是使用了 `unsafe` 包才能使用。

### 案例

```go
import _ "unsafe" // for go:linkname

//go:linkname time_now time.now
func time_now() (sec int64, nsec int32, mono int64) {
 		sec, nsec = walltime()
 		return sec, nsec, nanotime() - startNano
}
```

在这个案例中可以看到 `time.now`，它并没有具体的实现。如果你初看可能会懵逼。这时候建议你全局搜索一下源码，你就会发现其实现在 `runtime.time_now` 中。

配合先前的用法解释，可得知在 runtime 包中，我们声明了 `time_now` 方法是 `time.now` 的符号别名。并且在文件头引入了 `unsafe` 达成前提条件。



## go:noescape

```go
//go:noescape
```

该指令指定下一个有声明但没有主体（意味着实现有可能不是 Go）的函数，不允许编译器对其做逃逸分析。

一般情况下，该指令用于内存分配优化。编译器默认会进行逃逸分析，会通过规则判定一个变量是分配到堆上还是栈上。

但凡事有意外，一些函数虽然逃逸分析将其存放到堆上。但是对于我们来说，它是特别的。我们就可以使用 `go:noescape` 指令强制要求编译器将其分配到函数栈上。

### 案例

```go
// memmove copies n bytes from "from" to "to".
// in memmove_*.s
//go:noescape
func memmove(to, from unsafe.Pointer, n uintptr)
```

我们观察一下这个案例，它满足了该指令的常见特性。如下：

- memmove_*.s：只有声明，没有主体。其主体是由底层汇编实现的
- memmove：函数功能，在栈上处理性能会更好



## go:nosplit

```go
//go:nosplit
```

该指令指定文件中声明的下一个函数不得包含堆栈溢出检查。

简单来讲，就是这个函数跳过堆栈溢出的检查。

### 案例

```go
//go:nosplit
func key32(p *uintptr) *uint32 {
   return (*uint32)(unsafe.Pointer(p))
}
```



## go:nowritebarrierrec

```go
//go:nowritebarrierrec
```

该指令表示编译器遇到写屏障时就会产生一个错误，并且允许递归。也就是这个函数调用的其他函数如果有写屏障也会报错。

简单来讲，就是针对写屏障的处理，防止其死循环。

### 案例

```go
//go:nowritebarrierrec
func gcFlushBgCredit(scanWork int64) {
    ...
}
```



## go:yeswritebarrierrec

```go
//go:yeswritebarrierrec
```

该指令与 `go:nowritebarrierrec` 相对，在标注 `go:nowritebarrierrec` 指令的函数上，遇到写屏障会产生错误。

而当编译器遇到 `go:yeswritebarrierrec` 指令时将会停止。

### 案例

```go
//go:yeswritebarrierrec
func gchelper() {
  ...
}
```



## go:noinline

```go
//go:noinline
```

该指令表示该函数禁止进行内联。

### 案例

```go
//go:noinline
func unexportedPanicForTesting(b []byte, i int) byte {
   return b[i]
}
```

我们观察一下这个案例，是直接通过索引取值，逻辑比较简单。如果不加上 `go:noinline`的话，就会出现编译器对其进行内联优化。

显然，内联有好有坏。该指令就是提供这一特殊处理。



## go:norace

```go
//go:norace
```

该指令表示禁止进行竞态检测。

常见的形式就是在启动时执行 `go run -race`，能够检测应用程序中是否存在双向的数据竞争，非常有用。

### 案例

```go
//go:norace
func forkAndExecInChild(argv0 *byte, argv, envv []*byte, chroot, dir *byte, attr *ProcAttr, sys *SysProcAttr, pipe int) (pid int, err Errno) {
    ...
}
```



## go:notinheap

```go
//go:notinheap
```

该指令常用于类型声明，它表示这个类型不允许从 GC 堆上进行申请内存。

在运行时中常用其来做较低层次的内部结构，避免调度器和内存分配中的写屏障，能够提高性能。

### 案例

```go
// notInHeap is off-heap memory allocated by a lower-level allocator
// like sysAlloc or persistentAlloc.
//
// In general, it's better to use real types marked as go:notinheap,
// but this serves as a generic type for situations where that isn't
// possible (like in the allocators).
//
//go:notinheap
type notInHeap struct{}
```

