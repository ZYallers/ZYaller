[//]:# (2019/5/21 10:03|GOLANG|)
# golang 四舍五入保留小数后五位数
> https://www.jianshu.com/p/ca52f4f58353

其实浮点数内部你不需要考虑到底是几位，输出的时候一般才在乎有多少位。

可以通过格式化输出的方式来做，当然这个默认也不是按照四舍五入的，当前面一个数是奇数时候是四舍五入，
当前面数是一个偶数时候是五舍六入。这个规则应该是小学就教过的。

```go
package main

import "fmt"

func main() {
	var fs []float64 = []float64{1.1234456, 1.1234567, 1.1234678, 1.1}
	for _, f := range fs {
		s := fmt.Sprintf("%.5f", f)
		fmt.Println(f, "->", s)
	}
}
```
输出：
```bash
1.1234456 -> 1.12345
1.1234567 -> 1.12346
1.1234678 -> 1.12347
1.1 -> 1.10000
```