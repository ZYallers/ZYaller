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

不久后，有网友问我，那重复出现次数最多的字符，不要求连续的要怎么写？虽然简单，但我还是那么热情。

## 从一个字符串里，找出重复出现最多次的字符

```go
func maxStr(str string) (res string) {
	arr := make(map[int32]int, len(str))
	max := 1
	res = string(str[0])
	for _, v := range str {
		arr[v]++
		if arr[v] > max {
			res = string(v)
			max = arr[v]
		}
	}
	return
}
```

测试：
```go
func TestMaxStr(t *testing.T) {
	t.Log(maxStr("aaabbba"))
}
```

结果：
```bash
=== RUN   TestMaxStr
    for_test.go:454: a
--- PASS: TestMaxStr (0.00s)
PASS
```

如果觉得有用可以Star一下！
