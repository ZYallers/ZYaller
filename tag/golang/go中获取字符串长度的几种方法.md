[//]:# (2021/10/26 15:42|GOLANG|https://img2.baidu.com/it/u=1081034363,2190071361&fm=26&fmt=auto)
# go中获取字符串长度的几种方法
> [博客园](https://www.cnblogs.com/405845829qq/p/9472955.html)

获取字符串长度的几种方法

 
- 使用 bytes.Count() 统计
- 使用 strings.Count() 统计
- 将字符串转换为 []rune 后调用 len 函数进行统计
- 使用 utf8.RuneCountInString() 统计

案例：
```go
str:="HelloWord"

l1:=len([]rune(str))
l2:=bytes.Count([]byte(str),nil)-1)
l3:=strings.Count(str,"")-1
l4:=utf8.RuneCountInString(str)
 
fmt.Println(l1)
fmt.Println(l2)
fmt.Println(l3)
fmt.Println(l4)
 
// 打印结果：都是 9
```
注：在 Golang 中，如果字符串中出现中文字符不能直接调用 len 函数来统计字符串字符长度。
这是因为在 Go 中，字符串是以 UTF-8 为格式进行存储的，在字符串上调用 len 函数，取得的是字符串包含的 byte 的个数。
