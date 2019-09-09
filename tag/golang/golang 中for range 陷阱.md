# golang 中 for range 陷阱
> 转载自：https://studygolang.com/articles/22495

我们先来看一段代码：

```golang
src := []int{1, 2, 3, 4, 5}
var dst2 []*int
for _, i := range src {
    dst2 = append(dst2, &i)
}

for _, p := range dst2 {
    fmt.Print(*p)
}
```

这段代码的运行结果是什么？ 大多数开发者都会认为是：12345

而当你实际执行一下这段代码后，你会惊讶的发现实际结果是：55555

这是为什么呢？实际上for range迭代的是这样的：

```golang
var i int
for j := 0; j < len(src); j++ {
    i = src[j]
    dst2 = append(dst2, &i)
}
```

而不是我们认为的这样：

```golang
for j := 0; j < len(src); j++ {
    dst2 = append(dst2, &src[j])
}
```

遍历过程中并没有返回集合中的实际元素，而是将实际元素的值复制给了一个在此过程中固定的变量。

这个复制操作就是你看到的很多文章提及的for range存在性能问题的原因。