[//]:# (2019/7/15 11:53|GOLANG|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/fdb009fe89fa592ef5f6a5fe4d72c5031d5c561a.png)
# golang 我们应该用指针替代结构体的副本吗？
> https://studygolang.com/articles/21763

对于许多 golang 开发者来说，考虑到性能，最佳实践是系统地使用指针而非结构体副本。我们将回顾两个用例，来理解使用指针而非结构体副本的影响。

## 1. 数据分配密集型

让我们举一个简单的例子，说明何时要为使用值而共享结构体：

```go
type S struct {
   a, b, c int64
   d, e, f string
   g, h, i float64
}
```

这是一个可以由副本或指针共享的基本结构体：

```go
func byCopy() S {
   return S{
      a: 1, b: 1, c: 1,
      e: "foo", f: "foo",
      g: 1.0, h: 1.0, i: 1.0,
   }
}

func byPointer() *S {
   return &S{
      a: 1, b: 1, c: 1,
      e: "foo", f: "foo",
      g: 1.0, h: 1.0, i: 1.0,
   }
}
```

基于这两种方法，我们现在可以编写两个基准测试，其中一个是通过副本传递结构体的：

```go
func BenchmarkMemoryStack(b *testing.B) {
   var s S

   f, err := os.Create("stack.out")
   if err != nil {
      panic(err)
   }
   defer f.Close()

   err = trace.Start(f)
   if err != nil {
      panic(err)
   }

   for i := 0; i < b.N; i++ {
      s = byCopy()
   }

   trace.Stop()

   b.StopTimer()

   _ = fmt.Sprintf("%v", s.a)
}
```
另一个非常相似，它通过指针传递：

```go
func BenchmarkMemoryHeap(b *testing.B) {
   var s *S

   f, err := os.Create("heap.out")
   if err != nil {
      panic(err)
   }
   defer f.Close()

   err = trace.Start(f)
   if err != nil {
      panic(err)
   }

   for i := 0; i < b.N; i++ {
      s = byPointer()
   }

   trace.Stop()

   b.StopTimer()

   _ = fmt.Sprintf("%v", s.a)
}
```

让我们运行基准测试：

```bash
go test ./... -bench=BenchmarkMemoryHeap -benchmem -run=^$ -count=10 > head.txt && benchstat head.txt
go test ./... -bench=BenchmarkMemoryStack -benchmem -run=^$ -count=10 > stack.txt && benchstat stack.txt
```

以下是统计数据：

```bash
name          time/op
MemoryHeap-4  75.0ns ± 5%
name          alloc/op
MemoryHeap-4   96.0B ± 0%
name          allocs/op
MemoryHeap-4    1.00 ± 0%
------------------
name           time/op
MemoryStack-4  8.93ns ± 4%
name           alloc/op
MemoryStack-4   0.00B
name           allocs/op
MemoryStack-4    0.00
```

在这里，使用结构体副本比指针快 8 倍。如果我们使用 `GOMAXPROCS = 1` 将处理器限制为 1，情况会更糟：

```bash
name        time/op
MemoryHeap  114ns ± 4%
name        alloc/op
MemoryHeap  96.0B ± 0%
name        allocs/op
MemoryHeap   1.00 ± 0%
------------------
name         time/op
MemoryStack  8.77ns ± 5%
name         alloc/op
MemoryStack   0.00B
name         allocs/op
MemoryStack    0.00
```

## 2.方法调用密集型

对于第二个用例，我们将在结构体中添加两个空方法，稍微调整一下我们的基准测试：

```go
func (s S) stack(s1 S) {}

func (s *S) heap(s1 *S) {}
```

在栈上分配的基准测试将创建一个结构体并通过复制副本传递它：

```go
func BenchmarkMemoryStack(b *testing.B) {
   var s S
   var s1 S

   s = byCopy()
   s1 = byCopy()
   for i := 0; i < b.N; i++ {
      for i := 0; i < 1000000; i++  {
         s.stack(s1)
      }
   }
}
```

堆的基准测试将通过指针传递结构体：

```go
func BenchmarkMemoryHeap(b *testing.B) {
   var s *S
   var s1 *S

   s = byPointer()
   s1 = byPointer()
   for i := 0; i < b.N; i++ {
      for i := 0; i < 1000000; i++ {
         s.heap(s1)
      }
   }
}
```

正如预期的那样，结果现在大不相同：

```bash
name          time/op
MemoryHeap-4  301µs ± 4%
name          alloc/op
MemoryHeap-4  0.00B
name          allocs/op
MemoryHeap-4   0.00
------------------
name           time/op
MemoryStack-4  595µs ± 2%
name           alloc/op
MemoryStack-4  0.00B
name           allocs/op
MemoryStack-4   0.00
```

## 结论

在 go 中使用指针而不是结构体的副本并不总是好事。此外，内存使用情况分析肯定会帮助你弄清楚你的内存分配和堆上发生了什么。

## 参考资料
- go test命令（Go语言测试命令）完全攻略 http://c.biancheng.net/view/124.html