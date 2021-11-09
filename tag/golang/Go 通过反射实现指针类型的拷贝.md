[//]:# (2021/10/26 17:05|GOLANG|https://img2.baidu.com/it/u=4085757625,2228131633&fm=26&fmt=auto)
# Go 通过反射实现指针类型的拷贝
> [掘金](https://juejin.cn/post/6844903922205720590)

在Go语言中实现结构体的拷贝非常简单，直接将一个结构体对象赋值给另一个新声明的对象即可实现，如：

```go
type Cartoon struct {
	Name string
}
cart1 := Cartoon{"Name": "nezha"}
var cart2 Cartoon
cart2 = cart1
```

这样cart2即拷贝了cart1，cart1修改其Name值，也不会影响cart2的值。

现在对Cartoon结构体进行扩展，先定义一个Movie接口，并使用*Cartoon实现此接口，再定义结构体Video,却使用Video结构实现Movie接口，，如下：

```go
type Movie interface {
    Play()
}
func (c *Cartoon) Play() {
    fmt.Println(c.Name)
}

type Video struct {
	Name string
}
func (v Video) Play() { // Video前无*
    fmt.Println(v.Name)
}
```

那么问题来了，如何动态生成Movie接口的拷贝呢？

```go
funct CloneMovie(moive Movie) Movie {
    ???
}
```

如上所述，当入参movie是一个结构体类型即reflect.Struct时，可以直接采用赋值的方式拷贝，不再多说！当movie是一个指针变量时，该如何实现呢？


我们可以通过reflect的以下特性找到思路：

### 1.reflect.New(reflect.TypeOf(obj))
可以生成一个指向obj类型的指针变量。
举例来说，如果obj是Cartoon，那么该表达式生成的结果就是*Cartoon类型，如果type是*Cartoon,那么该表达式生成的结果就是 **Cartoon 类型。

### 2.reflect.TypeOf(obj).Elem()
可以得到该obj指针指向的结构体类型（obj一定是指针类型，不然Elem()会报错）。也就说如果obj是*Cartoon的话，那么此表达式返回的对象就是Cartoon。

### 3.reflect.ValueOf(obj).Elem()
可以得到此obj指针指向的结构体的值（obj一定是指针类型，不然Elem()会报错）。

### 4.reflect.Value对象的Set方法
可以实现赋值操作。上一步得到的结构体在赋值时即可形成拷贝。

所以，可以按如下方法实现：
```go
func Clone(movie Movie) Movie {
	movieType := reflect.TypeOf(movie)
	if movieType.Kind() == reflect.Struct {
		var newOne Movie
		newOne = movie
		return newOne
	}
	if movieType.Kind() == reflect.Ptr {
		valueType := movieType.Elem() // 得到结构体对象
		newMoviePtr := reflect.New(valueType) // 产生指向此结构体的指针
		newMoviePtr.Elem().Set(reflect.ValueOf(movie).Elem())
		return newMoviePtr.Interface().(Movie)
	}
	return nil
}
```
是否觉得很神奇？
