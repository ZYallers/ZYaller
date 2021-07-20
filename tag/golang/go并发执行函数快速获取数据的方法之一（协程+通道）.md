[//]:# (2018/6/28 19:20|GOLANG|)
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

func myapi01(res chan interface{}, counter *int) {
	// 生成随机整数
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(3) + 1
	// 等待几秒，模拟执行时间
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of '%s' times: '%d'.\n", "myapi01", ws)
	// 发送数据
	data := make(map[string]interface{})
	data["key"] = "myapi01"
	data["data"] = ws
	res <- data
	fmt.Printf("Sent of 'api01' data: '%v'.\n", data)
	// 记录器+1
	*counter++
}

func myapi02(res chan interface{}, counter *int) {
	// 生成随机整数
	rand.Seed(time.Now().UnixNano())
	ws := rand.Intn(3) + 1
	// 等待几秒，模拟执行时间
	time.Sleep(time.Duration(ws) * time.Second)
	fmt.Printf("Sleep of '%s' times: '%d'.\n", "api02", ws)
	// 发送数据
	data := make(map[string]interface{})
	data["key"] = "myapi02"
	data["data"] = ws
	res <- data
	fmt.Printf("Sent of 'api02' data: '%v'.\n", data)
	// 记录器+1
	*counter++
}

func myapi() map[string]interface{} {
	resChan := make(chan interface{})
	counter := 0

	go myapi01(resChan, &counter)
	go myapi02(resChan, &counter)

	go func() {
		for {
			if counter == 2 {
				close(resChan)
				fmt.Println("Channel closed.")
				break
			}
		}
		return
	}()

	ret := make(map[string]interface{})

	for {
		res, ok := <-resChan
		if ok {
			fmt.Printf("Receive data: %v.\n", res)
			res := res.(map[string]interface{})
			ret[res["key"].(string)] = res["data"]
		} else {
			fmt.Printf("Receive failed: %s.\n", ok)
			break
		}
	}

	return ret
}

func main() {
	st := time.Now()
	ret := myapi()
	fmt.Printf("Runtime：%s.\n", time.Since(st))
	fmt.Printf("ret: %v\n", ret)
}
```

找到对应路径并执行命令`go run`，输出结果：
```shell
Sleep of 'api02' times: '2'.
Sleep of 'myapi01' times: '2'.
Sent of 'api02' data: 'map[key:myapi02 data:2]'.
Receive data: map[key:myapi02 data:2].
Receive data: map[key:myapi01 data:2].
Sent of 'api01' data: 'map[key:myapi01 data:2]'.
Channel closed.
Receive failed: %!s(bool=false).
Runtime：2.001304175s.
ret: map[myapi02:2 myapi01:2]
```
> 提示：因为子方法里的等待时间（模拟方法真实执行时间）是随机的，不一定跟上面我执行的结果一样！

如果觉得有用，可以Star，不定期更新相关知识！
