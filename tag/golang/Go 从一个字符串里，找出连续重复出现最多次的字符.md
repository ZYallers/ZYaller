# 从一个字符串里，找出连续重复出现最多次的字符

话不多，直接看下面代码吧。

```go
func maxContinueStr(str string) (res string) {
	max := 1 // 连续最大次数
	tmp := 1
	res = string(str[0])
	for i := 1; i < len(str); i++ {
		if str[i] == str[i-1] { // 第N个和第N+1个对比
			tmp++
			if tmp > max {
				max = tmp
				res = string(str[i])
			}
		} else {
			tmp = 1
		}
	}
	return
}
```

测试下：
```go
func TestMaxContinueStr(t *testing.T) {
	t.Log(maxContinueStr("aaabbbbaa"))
}
```
结果：
```bash
=== RUN   TestMaxContinueStr
    for_test.go:477: b
--- PASS: TestMaxContinueStr (0.00s)
PASS
```
如果觉得有用可以Star一下！
