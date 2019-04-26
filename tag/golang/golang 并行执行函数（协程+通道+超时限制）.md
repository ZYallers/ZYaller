# golang 并行执行函数（协程+通道+超时限制）

前面写过一篇类似文章，也是协程+通道，但这次完善了下，加上了超时限制。

直接贴代码，等能看着代码说清原理再来补注释。

完整代码：
```go
package main

import (
	"time"
	"fmt"
	"math/rand"
)

func nowdate() string {
	return time.Now().Format("2006.01.02 15:04:05")
}

func randInt(max int) int {
	rand.Seed(time.Now().UnixNano())
	return rand.Intn(max) + 1
}

func api01(res chan interface{}) {
	ws := randInt(5)
	fmt.Printf("%s: Start of 'api01', will sleep %d second.\n", nowdate(), ws)
	time.Sleep(time.Duration(ws) * time.Second)
	res <- "1"
	fmt.Printf("%s: Sent of 'api01'.\n", nowdate())
}

func api02(res chan interface{}) {
	ws := randInt(5)
	fmt.Printf("%s: Start of 'api02', will sleep %d second.\n", nowdate(), ws)
	time.Sleep(time.Duration(ws) * time.Second)
	res <- "2"
	fmt.Printf("%s: Sent of 'api02'.\n", nowdate())
}

func api03(res chan interface{}) {
	ws := randInt(5)
	fmt.Printf("%s: Start of 'api03', will sleep %d second.\n", nowdate(), ws)
	time.Sleep(time.Duration(ws) * time.Second)
	res <- "3"
	fmt.Printf("%s: Sent of 'api03'.\n", nowdate())
}

func myapi(timeout int) interface{} {
	fmt.Printf("%s: Start..., will %d second timeout.\n", nowdate(), timeout)
	var data []interface{}
	resChanLen := 3
	resChan := make(chan interface{}, resChanLen)
	go api01(resChan)
	go api02(resChan)
	go api03(resChan)

	go func() {
	FOREND:
		for {
			select {
			case <-time.After(time.Duration(timeout) * time.Second):
				close(resChan)
				fmt.Printf("%s: Timeout.\n", nowdate())
				break FOREND
			}
		}
	}()

	for {
		if resp, ok := <-resChan; ok {
			resChanLen--
			data = append(data, resp)
			fmt.Printf("%s: Receive data: %s.\n", nowdate(), resp)
			if resChanLen == 0 {
				fmt.Printf("%s: Receive all data.\n", nowdate())
				break
			}
		} else {
			fmt.Printf("%s: reschan closed.\n", nowdate())
			break
		}
	}

	return data
}

func main() {
	a := time.Now()
	ret := myapi(3)
	fmt.Printf("%s: Runtime：%s.\n", nowdate(), time.Since(a))
	fmt.Printf("%s: ret: [%s]\n", nowdate(), ret)
}
```

找到对应路径并执行命令`go run`，输出结果：
```shell
2019.04.27 03:01:48: Start..., will 3 second timeout.
2019.04.27 03:01:48: Start of 'api01', will sleep 2 second.
2019.04.27 03:01:48: Start of 'api02', will sleep 1 second.
2019.04.27 03:01:48: Start of 'api03', will sleep 5 second.
2019.04.27 03:01:49: Receive data: 2.
2019.04.27 03:01:49: Sent of 'api02'.
2019.04.27 03:01:50: Sent of 'api01'.
2019.04.27 03:01:50: Receive data: 1.
2019.04.27 03:01:51: Timeout.
2019.04.27 03:01:51: reschan closed.
2019.04.27 03:01:51: Runtime：3.004351197s.
2019.04.27 03:01:51: ret: [[2 1]]
```
> 子方法里的等待时间（模拟方法真实执行时间）是随机的，不一定跟上面我执行的结果一样！

如果觉得有用，可以Star，不定期更新相关知识。