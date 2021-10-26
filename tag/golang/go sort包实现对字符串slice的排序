[//]:# (2021/10/26 11:02|GOLANG|https://img2.baidu.com/it/u=3836895907,2844607205&fm=26&fmt=auto)
# go sort包实现对字符串slice的排序
> [煎鱼](https://www.jianshu.com/p/3b16aa872517)

重点是初始化a和赋值部分，如果 `var a sort.StringSlice{}` 要用append，append方法第一个参数是被append的slice，第二个参数是要append的string。
```go
package main

import (
    "fmt"
    "sort"
)

func main() {
    a := sort.StringSlice{"name-04", "name-02", "name-03"}
    sort.Sort(a)
    fmt.Println(a)
}
```
很简单的一个实例。


