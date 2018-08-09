# golang 创建Redis连接池和Redis基础操作

首先，在src下新建一个目录`redis-cli-pool`，接着新建一个`pool.go`文件，代码如下：
```golang
package redisCliPool

import (
	"time"
	"github.com/garyburd/redigo/redis"
	"github.com/robfig/config"
)

var (
	CliPool     *redis.Pool
	server      string
	password    string
	db          int
	maxIdle     int
	maxActive   int
	idleTimeout int
)

func newCliPool() *redis.Pool {
	return &redis.Pool{
		MaxIdle:     maxIdle,
		MaxActive:   maxActive,
		IdleTimeout: time.Duration(idleTimeout) * time.Second,
		Dial: func() (redis.Conn, error) {
			conn, err := redis.Dial("tcp", server)
			if err != nil {
				return nil, err
			}
			if _, err := conn.Do("AUTH", password); err != nil {
				conn.Close()
				return nil, err
			}
			if _, err := conn.Do("SELECT", db); err != nil {
				conn.Close()
				return nil, err
			}
			return conn, err
		},
		TestOnBorrow: func(c redis.Conn, t time.Time) error {
			if time.Since(t) < time.Minute {
				return nil
			}
			_, err := c.Do("PING")
			return err
		},
	}
}

func InitCliPool(conf *config.Config) {
	section := "redis_pool"
	server, _ = conf.String(section, "server")
	password, _ = conf.String(section, "password")
	db, _ = conf.Int(section, "db")
	maxIdle, _ = conf.Int(section, "maxIdle")
	maxActive, _ = conf.Int(section, "maxActive")
	idleTimeout, _ = conf.Int(section, "idleTimeout")
	CliPool = newCliPool()
}
```
是的，这个 pool 依赖两个第三方开源包，这里就不细说了，简单的go get操作导入即可。
接着，新建一个保存redis连接配置的文件`config.ini`，保存位置随意，我这里直接放在src下。
```
[redis_pool]
server: 127.0.0.1:6379
password: 12345678
db: 0
maxIdle: 3
maxActive: 5
idleTimeout: 240
```
详细的配置解释信息可以查阅 redigo 包的docs文档，这里不做具体介绍。
最后，写个 example.go 测试下redis常用的一些命令操作是否ok。
```golang
package main

import (
	"log"
	"project05/redis-cli-pool"
	"github.com/robfig/config"
)

func main() {
	conf, err := config.ReadDefault("./config.ini")
	if err != nil {
		log.Fatal(err)
		return
	}

	redisCliPool.InitCliPool(conf)
	defer redisCliPool.CliPool.Close()

	conn := redisCliPool.CliPool.Get()
	defer conn.Close()

	/*
	// SET
	reply, err := conn.Do("SET", "test0001", "test value!")
	if err != nil {
		log.Printf("reply err: %v\n", err)
		return
	}
	log.Printf("reply value: %v\n", reply) // print OK

	reply, err := conn.Do("SET", "test0002", "test value2!")
	if err != nil {
		log.Printf("reply err: %v\n", err)
		return
	}
	log.Printf("reply2 value: %v\n", reply) // print OK
	*/

	/*
	// GET
	value, err := conn.Do("GET", "test0001")
	if err != nil {
		log.Printf("value err: %v\n", err)
		return
	}
	log.Printf("value: %T\n", value) // print []uint8
	log.Printf("value: %v\n", string(value.([]byte)))*/// print test value!

	/*
	// PIPELINE
	conn.Send("GET", "test0001")
	conn.Send("GET", "test0002")
	conn.Flush()
	reply, _ := conn.Receive()
	reply2, _ := conn.Receive()
	fmt.Printf("reply value: %v\n", string(reply.([]byte))) // print reply value: test value!
	fmt.Printf("reply2 value: %v\n", string(reply2.([]byte))) // print reply2 value: test value2!
	*/

	// MULTI
	conn.Send("MULTI")
	conn.Send("EXPIRE", "test0001", 60)
	conn.Send("EXPIRE", "test0002", 60)
	reply, err := conn.Do("EXEC")
	log.Println(reply) // print [1 1]
}
```
在命令行下进入到当前src目录下，运行`go run example.go`即可看到对应结果了。
嗯，大概的就这些了，希望对你有用，喜欢的话可以 star 下了！

#### 参考资料
- https://github.com/garyburd/redigo
- https://github.com/robfig/config
- https://godoc.org/github.com/garyburd/redigo/redis
- http://redisdoc.com
- https://studygolang.com/articles/4542