[//]:# "2024/11/12 15:46|GOLANG"

# GO singleflight 你真的会用吗？(源码分析+详细案例)

> 转载自：[彭亚川Allen](https://mp.weixin.qq.com/s/VxFneDTBMUZGOvwGnFbrEw)

### 背景

缓存在项目中使用应该是非常频繁的，提到缓存只要了解过 singleflight ，基本都会用于缓存实现的一部分吧？

### 解释

singleflight 来源于准官方库（也可以说官方扩展库）golang.org/x/sync/singleflight 包中。它的作用是避免同一个 key 对下游发起多次请求，降低下游流量。

### 源码剖析

### 3 个结构体

Group 是 singleflight 的核心，代表一个组，用于执行具有重复抑制的工作单元。

```go
type Group struct {
	mu sync.Mutex       
	m  map[string]*call
}
```

mu 是保护 m 字段的互斥锁，确保对调用信息的访问是线程安全的。m 是一个 map，键是函数的唯一标识符，值是 call 结构体，代表一次函数调用的信息，包括函数的返回值和错误。

call 代表一次函数调用的信息，把函数的调用结果封装到 call 中

```go
type call struct {
	wg sync.WaitGroup

	// 这些字段在 WaitGroup 完成之前只被写入一次，并且在 WaitGroup 完成之后只被读取
	val interface{} // 函数调用的返回值
	err error       // 函数调用可能出现的错误

	dups  int          // 相同 key 调用次数
	chans []chan<- Result // 结果通道列表，仅调用 DoChan() 方法时返回
}
```

Result 结构体用于保存 DoChan() 方法的执行结果，以便将结果传递给通道。

```go
type Result struct {
	Val    interface{}
	Err    error
	Shared bool
}
```

### 4 个方法

Group 主要提供了 3 个公开方法和 1 个非公开方法。

Do() 方法，相同的 key 对应的 fn 函数只会调用一次。返回值 v 调用 fn() 方法返回的结果；err 调用 fn() 返回的 err；shared：表示在多次调用的结果是否共享。

```go
func (g *Group) Do(key string, fn func() (interface{}, error)) (v interface{}, err error, shared bool) {
	g.mu.Lock()
	if g.m == nil {
		g.m = make(map[string]*call)
	}
	if c, ok := g.m[key]; ok {
		c.dups++
		g.mu.Unlock()
		c.wg.Wait()

		if e, ok := c.err.(*panicError); ok {
			panic(e)
		} else if c.err == errGoexit {
			runtime.Goexit()
		}
		return c.val, c.err, true
	}
	c := new(call)
	c.wg.Add(1)
	g.m[key] = c
	g.mu.Unlock()

	g.doCall(c, key, fn)
	return c.val, c.err, c.dups > 0
}
```

源码比较简单，如果 key 对应的 fn 函数已被调用，则等待 fn 函数调用完成直接返回结果。如果 fn 未被调用，new(call) 存入 m 中，执行 doCal() 方法。

doCall() 方法，调用 key 对应的 fn 方法。

```go
func (g *Group) doCall(c *call, key string, fn func() (interface{}, error)) {
	normalReturn := false
	recovered := false
	defer func() {
		if !normalReturn && !recovered {
			c.err = errGoexit
		}

		g.mu.Lock()
		defer g.mu.Unlock()
		c.wg.Done()
		if g.m[key] == c {
			delete(g.m, key)
		}

		if e, ok := c.err.(*panicError); ok {
			if len(c.chans) > 0 {
				go panic(e)
				select {} 
			} else {
				panic(e)
			}
		} else if c.err == errGoexit {
		} else {
			for _, ch := range c.chans {
				ch <- Result{c.val, c.err, c.dups > 0}
			}
		}
	}()

	func() {
		defer func() {
			if !normalReturn {
				if r := recover(); r != nil {
					c.err = newPanicError(r)
				}
			}
		}()

		c.val, c.err = fn()
		normalReturn = true
	}()

	if !normalReturn {
		recovered = true
	}
}
```

doCall() 代码比较简单，double defer 双延迟机制区分 panic 和 runtime.Goexit。第二个 defer 会先执行调用 fn() 函数，如果未正常返回将会补获异常，并将堆栈信息存入 err 中。

第一个 defer 先将 key 从 m 中移除，再就是异常处理，如果是 Goexit 正常退出，如果断言是 panicError 将对外抛出 Panic。若正常退出将结果发送到 chans 通道列表中。

DoChan() 方法类似于 Do() 方法，返回通道（chan），通过通道接收数据。另外通道不会被关闭。

```go
func (g *Group) DoChan(key string, fn func() (interface{}, error)) <-chan Result {
	ch := make(chan Result, 1)
	g.mu.Lock()
	if g.m == nil {
		g.m = make(map[string]*call)
	}
	if c, ok := g.m[key]; ok {
		c.dups++
		c.chans = append(c.chans, ch)
		g.mu.Unlock()
		return ch
	}
	c := &call{chans: []chan<- Result{ch}}
	c.wg.Add(1)
	g.m[key] = c
	g.mu.Unlock()

	go g.doCall(c, key, fn)

	return ch
}
```

Forget() 方法，可以理解为丢弃某一个 key，后面该 key 会被立即调用，而不是等待先前的调用完成。

```go
func (g *Group) Forget(key string) {
	g.mu.Lock()
	delete(g.m, key)
	g.mu.Unlock()
}
```

### 经典案例

缓存场景在大家的业务场景中应该是被广泛使用的，大部分的场景使用应该都是下图吧？

![图片](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/2024/640-20241112155630611)

从单体应用到微服务化，调用下游服务一般如下图吧？

![图片](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/2024/640-20241112155630657)

假设缓存 Miss 所有流量会瞬间打到数据库，或者所有流量都会打到 server2，如果学习过 singleflight 的同学，肯定会把它用在 reids->db 或 server->server2 之间，包括我也是。如下图（只举数据库案例）。

![图片](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/2024/640-20241112155630623)

**在使用 singleflight 之前你先确定下你的业务场景，key 相同的情况多吗？如果 key 相同的情况比较少，singleflight 对你的帮助可能不大。**

上面列举 2 种方案。

1. singleflight 介于 redis 和 db 之间，redis 是内存缓存 qps 高、响应也快。大部分情况不会成为瓶颈，但数据库就不一样了，所以这种方案可以防止缓存被击穿流量打到数据库。

2. singleflight 介于 server 和 redis 之间，网上挺多推荐这种用法的，有必要用此方案吗？大家可以思考下，文章末尾我给出我的想法。

我更倾向方案1。代码如下：

```go
func TestSingleFlight(t *testing.T) {
	var (
		n  = 10
		k  = "12344556"
		wg = sync.WaitGroup{}
		sf singleflight.Group
	)

	for i := 0; i < n; i++ {
    		wg.Add(1)
		go func() {
			defer wg.Done()
			r, err, shared := sf.Do(k, func() (interface{}, error) {
				return get(k)
			})
			if err != nil {
				panic(err)
			}

			fmt.Printf("r=%v,shared=%v\n", r, shared)
		}()
	}

	wg.Wait()
}

func get(key string) (interface{}, error) {
	time.Sleep(time.Microsecond) // 模拟业务处理
	return key, nil
}
```

输出结果如下：

```
=== RUN   TestSingleFlight
r=12344556,shared=true
r=12344556,shared=true
r=12344556,shared=true
r=12344556,shared=true
r=12344556,shared=true
r=12344556,shared=false
r=12344556,shared=true
r=12344556,shared=false
r=12344556,shared=true
r=12344556,shared=true
--- PASS: TestSingleFlight (0.00s)
PASS
```

打印结果中为 true 都代表 调用 get() 函数返回结果被共享。get 函数调用明显降低了。

这种写法在函数正常返回情况下是能拿到正确的结果，如果下游返回异常了呢？（业务上遇过下游返回3-4s的拉低业务处理速度）**因为 Do() 方法是以阻塞的方式来控制对下游的调用的，如果某一个请求被阻塞了，同一个 key 后面的请求都会被阻塞。**

假设有一场景，消费 kafka 消息处理业务逻辑，业务高峰期某一时间段生产消息量为 100 w，单 pod 消费速度 500/s ，请求下游用 singleflight 控制对下游（三方接口）的并发量，假设下游某一次请求耗时 2s。这时会有几个问题：

1. 若某一个 key 被阻塞后续该 key 大量请求被阻塞，若这批请求失败从而导致消息处理失败，如果对消息重试会加剧业务下游压力。

2. 单 pod 消费速度从 500/s，降低到个位数，消费时间拉长，消息堆积（如果消息堆积对实时性要求场景影响视频很大的）。

造成这个问题主要原因如下：

1. singleflight 是<u>**同步阻塞且缺乏超时控制机制**</u>，若某一个 key 阻塞后面次 key 都会被阻塞并且等待第一次结束。

2. singleflight 虽然能降低对下游的请求量，但在某些场景失败的情况也增加了。

### 超时控制

我们有办法给 singleflight 加一个超时时间吗？答案是肯定有的

下面这段代码 singleflight 没有增加超时控制：

```go
var (
	offset int32 = 0
)

func TestSingleFlight(t *testing.T) {
	var (
		n       int32 = 1000
		k             = "12344556"
		wg            = sync.WaitGroup{}
		sf      singleflight.Group
		failCnt int32 = 0
	)

	for i := 0; i < int(n); i++ {
    		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err, _ := sf.Do(k, func() (interface{}, error) {
				return get(k)
			})
			if err != nil {
				atomic.AddInt32(&failCnt, 1)
				return
			}
		}()
	}

	wg.Wait()
	fmt.Printf("总请求数=%d,请求成功率=%d,请求失败率=%d", n, n-failCnt, failCnt)
}

func get(key string) (interface{}, error) {
	var err error
	if atomic.AddInt32(&offset, 1) == 3 { // 假设偏移量 offset == 3 执行耗时长，超时失败了
		time.Sleep(time.Microsecond * 500)
		err = fmt.Errorf("耗时长")
	}
	return key, err
}
```

结果输出如下

```
=== RUN   TestSingleFlight
总请求数=1000,请求成功率=792,请求失败率=208--- PASS: TestSingleFlight (0.00s)
PASS
```

singleflight 增加超时控制代码如下：

```go
func TestSingleFlight(t *testing.T) {
	var (
		n       int32 = 1000
		k             = "12344556"
		wg            = sync.WaitGroup{}
		sf      singleflight.Group
		failCnt int32 = 0
	)

	for i := 0; i < int(n); i++ {
    		wg.Add(1)
		go func() {
			defer wg.Done()
			_, err, _ := sf.Do(k, func() (interface{}, error) {
				ctx, _ := context.WithTimeout(context.TODO(), time.Microsecond*30)
				go func(ctx2 context.Context) {
					<-ctx2.Done()
					sf.Forget(k)
				}(ctx)
				
				return get(k)
			})
			if err != nil {
				atomic.AddInt32(&failCnt, 1)
				return
			}
		}()
	}

	wg.Wait()
	fmt.Printf("总请求数=%d,请求成功率=%d,请求失败率=%d", n, n-failCnt, failCnt)
}
```

利用 context.WithTimeout() 方法控制超时，并且调用 Forget() 方法移除超时 key 结果输出如下

```
=== RUN   TestSingleFlight
总请求数=1000,请求成功率=992,请求失败率=8--- PASS: TestSingleFlight (0.00s)
PASS
```

成功率提高了失败率明显降低了。

下面用 DoChan() 函数实现：

```go
var (
	offset int32 = 0
)

func TestSingleFlight(t *testing.T) {
	var (
		n          int32 = 1000 // n 越大，效果越明显
		k                = "12344556"
		wg               = sync.WaitGroup{}
		sf         singleflight.Group
		successCnt int32 = 0
	)

	for i := 0; i < int(n); i++ {
    		wg.Add(1)
		go func() {
			defer wg.Done()
			ch := sf.DoChan(k, func() (interface{}, error) {
				return get(k)
			})

			ctx, _ := context.WithTimeout(context.TODO(), time.Microsecond*100)
			select {
			case <-ctx.Done():
				sf.Forget(k)
				return
			case ret := <-ch:
				if ret.Err != nil {
					return
				}
				atomic.AddInt32(&successCnt, 1)
			}
		}()
	}

	wg.Wait()
	fmt.Printf("总请求数=%d,请求成功率=%d,请求失败率=%d", n, successCnt, n-successCnt)
}

func get(key string) (interface{}, error) {
	var err error
	if atomic.AddInt32(&offset, 1) == 3 { // 假设偏移量 offset == 3 执行耗时长，超时失败了
		time.Sleep(time.Microsecond * 400)
		err = fmt.Errorf("耗时长")
	}
	return key, err
}
```

DoChan() 函数的运行结果更加稳定，如需要加超时控制优先推出此方法。

### 总结

1、singleflight 使用得当确实能有效降低下游流量，我也推荐大家使用，但一定要注意同步阻塞问题，防止下游长耗时造成业务异常或高延迟，一定要做好正确性与降低业务下游流量权衡。

2、上面我留了一个问题，singleflight 有必要放在 server 应用和 redis 之间吗？我认为没必要，redis 是内存数据库，响应快，高 qps 本身不会是瓶颈，保护 redis 没有意义。另外 singleflight 用途是防止 redis 击穿流量打到数据库，如果你业务 qps 非常高并且对数据实时性要求高，为啥不通过其他手段把数据库数据刷新到 redis 中？比如数据创建同步写入 redis、或通过 binlog 写入。
