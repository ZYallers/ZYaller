[//]:# (2021/10/26 11:33|GOLANG|https://img2.baidu.com/it/u=3309978093,3613917351&fm=253&fmt=auto&app=120&f=JPEG?w=1010&h=500)
# go 数组对象的两种排序方法.md
> [简书](https://www.jianshu.com/p/780ecb13ab5d)

业务上可能会经常遇到这样的逻辑，例如根据员工的年龄进行如大到小的排序分页列表显示。这里介绍两种方法，希望对你有帮助！

```go
type Person struct {
	Name string `json:"name"`
	Sex  string `json:"sex"`
	Age  int    `json:"age"`
}

type PersonSort []Person

//PersonSort 实现sort SDK 中的Interface接口

func (s PersonSort) Len() int {
	//返回传入数据的总数
	return len(s)
}
func (s PersonSort) Swap(i, j int) {
	//两个对象满足Less()则位置对换
	//表示执行交换数组中下标为i的数据和下标为j的数据
	s[i], s[j] = s[j], s[i]
}
func (s PersonSort) Less(i, j int) bool {
	//按字段比较大小,此处是降序排序
	//返回数组中下标为i的数据是否小于下标为j的数据
	return s[i].Age > s[j].Age
}

func Test_StringArrayImplementsTnterface(t *testing.T) {
	var mD []Person

	mD = append(mD, Person{Name: "xj16", Sex: "男16", Age: 16})
	mD = append(mD, Person{Name: "xj55", Sex: "男55", Age: 55})
	mD = append(mD, Person{Name: "xj18", Sex: "男18", Age: 18})
	mD = append(mD, Person{Name: "xj15", Sex: "男15", Age: 15})
	mD = append(mD, Person{Name: "xj25", Sex: "男25", Age: 25})

	fmt.Printf("排序前:%+v\n", mD)
	sort.Sort(PersonSort(mD))
	fmt.Printf("排序后:%+v\n", mD)
}

func Test_StringArraySliceStable(t *testing.T) {
	var mD []Person

	mD = append(mD, Person{Name: "xj16", Sex: "男16", Age: 16})
	mD = append(mD, Person{Name: "xj55", Sex: "男55", Age: 55})
	mD = append(mD, Person{Name: "xj18", Sex: "男18", Age: 18})
	mD = append(mD, Person{Name: "xj15", Sex: "男15", Age: 15})
	mD = append(mD, Person{Name: "xj25", Sex: "男25", Age: 25})

	fmt.Printf("排序前:%+v\n", mD)
	sort.SliceStable(mD, func(i, j int) bool {
		return mD[i].Age > mD[j].Age
	})
	fmt.Printf("排序后:%+v\n", mD)
}
```

运行结果：
```
=== RUN   Test_StringArrayImplementsTnterface
排序前:[{Name:xj16 Sex:男16 Age:16} {Name:xj55 Sex:男55 Age:55} {Name:xj18 Sex:男18 Age:18} {Name:xj15 Sex:男15 Age:15} {Name:xj25 Sex:男25 Age:25}]
排序后:[{Name:xj55 Sex:男55 Age:55} {Name:xj25 Sex:男25 Age:25} {Name:xj18 Sex:男18 Age:18} {Name:xj16 Sex:男16 Age:16} {Name:xj15 Sex:男15 Age:15}]
--- PASS: Test_StringArrayImplementsTnterface (0.00s)

=== RUN   Test_StringArraySliceStable
排序前:[{Name:xj16 Sex:男16 Age:16} {Name:xj55 Sex:男55 Age:55} {Name:xj18 Sex:男18 Age:18} {Name:xj15 Sex:男15 Age:15} {Name:xj25 Sex:男25 Age:25}]
排序后:[{Name:xj55 Sex:男55 Age:55} {Name:xj25 Sex:男25 Age:25} {Name:xj18 Sex:男18 Age:18} {Name:xj16 Sex:男16 Age:16} {Name:xj15 Sex:男15 Age:15}]
--- PASS: Test_StringArraySliceStable (0.00s)
PASS
```
喜欢的Star一下！
