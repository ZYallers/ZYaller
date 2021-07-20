[//]:# (2018/8/13 17:26|GOLANG|)
# golang 简单通用的协程池实现

写这个目的是简化协程管理和代码，实现限制协程数量，阻塞等待指定数量任务执行。

核心包代码如下：
```golang
package library

import "sync"

/**
 * golang通用协程池
 * - 简化协程管理
 * - 实现功能
 *   > 限制协程数量
 *   > 阻塞等待指定数量任务执行
 * - example
 *   pool := library.NewGorPool(2, 1) // 实例化一个大小2，等待长度1的协程池
 *   pool := AddTask(func() { // 执行任务
 *       time.Sleep(time.Second)
 *   })
 *   pool.Block() // 等待所有协程执行完成
 */
type GorPool struct {
	ch     chan struct{}
	wg     *sync.WaitGroup
	wgSize int
}

/**
 * 实例化
 * poolSize 协程池大小
 * wgSize WaitGroup大小，为0时不等待
 */
func NewGorPool(poolSize, wgSize int) *GorPool {
	p := &GorPool{
		ch: make(chan struct{}, poolSize),
		wg: &sync.WaitGroup{},
	}
	if wgSize > 0 {
		p.wg.Add(wgSize)
	}
	p.wgSize = wgSize
	return p
}

/**
 * 执行任务
 */
func (p *GorPool) AddTask(task func()) {
	p.ch <- struct{}{}
	go func() {
		defer func() {
			if p.wgSize > 0 {
				p.wg.Done()
				p.wgSize--
				<-p.ch
			}
		}()
		task()
	}()
}

/**
 * 阻塞等待所有任务完成
 */
func (p *GorPool) Block() {
	p.wg.Wait()
}
```
在Web编程上写个demo测试下：
```golang
package main

import (
	"net/http"
	"github.com/julienschmidt/httprouter"
	"fmt"
	"github.com/json-iterator/go"
	"project06/library"
	"time"
	"strconv"
)

func GorPoolTest(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	pool := library.NewGorPool(3, 2)
	start := time.Now().UnixNano() / 1e6
	pool.AddTask(func() {
		time.Sleep(3 * time.Second)
		fmt.Fprintf(w, "%s: task1\n", time.Now())
	})
	pool.AddTask(func() {
		time.Sleep(2 * time.Second)
		fmt.Fprintf(w, "%s: task2\n", time.Now())
	})
	pool.AddTask(func() {
		time.Sleep(1 * time.Second)
		fmt.Fprintf(w, "%s: task3\n", time.Now())
	})
	pool.Block()
	fmt.Fprintf(w, "spendTime: %s", spendTime(start))
}

func spendTime(start int64) string {
	end := time.Now().UnixNano() / 1e6
	return strconv.Itoa(int(end-start)) + "ms"
}

func main() {
	router := httprouter.New()
	router.GET("/gor-pool", GorPoolTest)
	log.Fatal(http.ListenAndServe("127.0.0.1:9090", router))
}
```
打开个浏览器访问http://127.0.0.1:9090，窗口输出如下内容：
```html
2018-08-10 14:54:04.562771838 +0800 CST m=+4.245330555: task3
2018-08-10 14:54:05.156732806 +0800 CST m=+4.839273705: task2
spendTime: 2000ms
```

#### 参考资料
- https://github.com/xialeistudio/goroutine-pool
- https://segmentfault.com/a/1190000015928618
