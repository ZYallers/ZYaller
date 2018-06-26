# go并发执行函数快速获取数据的方法之一（协程+通道）

对于Golang，基础理论的东西几乎人人都能看懂，但真正到核心代码底层知识未必都看得懂，解释其中理论更是难上加难。
所以我还是直接贴代码，等能看着代码说清原理再来补注释～

完整代码：
```go
package main

import (
	"time"
	"fmt"
	"math/rand"
)

func api01(res chan interface{}, n *int) {
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(5) + 1
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of %s times: %d.\n", "api01", ws)

	res <- "A"
	fmt.Printf("Sent of 'api01' data: 'A'.\n")

	*n++
}

func api02(res chan interface{}, n *int) {
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(5) + 1
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of %s times: %d.\n", "api02", ws)

	res <- "B"
	fmt.Printf("Sent of 'api02' data: 'B'.\n")
	*n++
}

func api03(res chan interface{}, n *int) {
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(5) + 1
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of %s times: %d.\n", "api03", ws)

	res <- "C"
	fmt.Printf("Sent of 'api03' data: 'C'.\n")
	*n++
}

func myapi() []interface{} {
	resChan := make(chan interface{})
	var counter int

	go api01(resChan, &counter)
	go api02(resChan, &counter)
	go api03(resChan, &counter)

	go func() {
		for {
			// fmt.Printf("counter: %d.\n", counter)
			if counter == 3 {
				close(resChan)
				fmt.Println("Channel closed.")
				break
			}
		}
		return
	}()

	var ret []interface{}

	for {
		res, ok := <-resChan
		if ok {
			ret = append(ret, res)
			fmt.Printf("Receive data: %s.\n", res)
		} else {
			fmt.Printf("Receive failed: %s.\n", ok)
			break
		}
	}

	return ret
}

func main() {
	a := time.Now()
	ret := myapi()
	fmt.Printf("Runtime：%s.\n", time.Since(a))
	fmt.Printf("ret: [%s]\n", ret)
}

```

找到对应路径并执行命令`go run`，输出结果：
```shell
Sleep of api03 times: 2.
Sent of 'api03' data: 'C'.
Receive data: C.
Sleep of api01 times: 4.
Sent of 'api01' data: 'A'.
Receive data: A.
Sleep of api02 times: 4.
Sent of 'api02' data: 'B'.
Receive data: B.
Channel closed.
Receive failed: %!s(bool=false).
Runtime：4.001223631s.
ret: [[C A B]]
```
> 提示：因为子方法里的等待时间（模拟方法真实执行时间）是随机的，不一定跟上面我执行的结果一样！

如果觉得有用，可以Star，不定期更新相关知识！