# go并发执行函数快速获取结果的方法之一（sync.WaitGroup）.md

之前有介绍过类似的一种方法（协程+通道），可能有人会觉得那种方法比较难懂。
因为对于Golang来说，协程和通道是这门语言的核心，有很多不同的特性。
相对比而言，sync.WaitGroup的方法跟大部分语言的写法比较相似。

完整的代码：
```go
package main

import (
	"sync"
	"time"
	"math/rand"
	"fmt"
)

func rpc01(m map[string]interface{}, wg *sync.WaitGroup) {
	defer wg.Done()
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(5) + 1
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of %s times: %d.\n", "method01", ws)
	m["rpc01"] = ws
}

func rpc02(m map[string]interface{}, wg *sync.WaitGroup) {
	defer wg.Done()
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(5) + 1
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of %s times: %d.\n", "method02", ws)
	m["rpc02"] = ws
}

func rpc() map[string]interface{} {
	var wg sync.WaitGroup
	res := make(map[string]interface{})

	wg.Add(2)
	go rpc01(res, &wg)
	go rpc02(res, &wg)

	wg.Wait()

	return res
}

func main() {
	st := time.Now()
	ret := rpc()
	co := time.Since(st)
	fmt.Printf("Runtimes: %s.\n", co)
	fmt.Println(ret)
}

```

找到对应路径并执行命令`go run`，输出结果：
```shell
Sleep of method02 times: 3.
Sleep of method01 times: 4.
Runtimes: 4.001228986s.
map[rpc02:3 rpc01:4]
```
> 提示：因为子方法里的等待时间（模拟方法真实执行时间）是随机的，不一定跟上面我执行的结果一样！

如果觉得有用，可以Star，不定期更新相关知识！