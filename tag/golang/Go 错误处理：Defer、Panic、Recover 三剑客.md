[//]:# "2024/11/8 13:53|GOLANG|"
# Go 错误处理：Defer、Panic、Recover 三剑客
> 转载自：[江湖十年](https://jianghushinian.cn/2024/10/13/go-error-guidelines-defer-panic-recover)

Go 语言中的错误处理不仅仅只有 if err != nil，defer、panic 和 recover 这三个相对来说不不如 if err != nil 有名气的控制流语句，也与错误处理息息相关。
本文就来讲解下这三者在 Go 语言中的应用。

## 一、Defer

defer 是一个 Go 中的关键字，通常用于简化执行各种清理操作的函数。
defer 后跟一个函数（或方法）调用，该函数（或方法）的执行会被推迟到外层函数返回的那一刻，即函数（或方法）要么遇到了 return，要么遇到了 panic。

### 1. 语法

defer 功能使用语法如下：
```
defer Expression
```
其中 Expression 必须是函数或方法的调用。
使用示例如下：
```go
func f() {
	defer fmt.Println("deferred in f")
	fmt.Println("calling f")
}

func main() {
	f()
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
calling f
deferred in f
```
根据输出可以发现，被 defer 修饰的 fmt.Println("deferred in f") 调用并没有立即执行，而是先执行了 fmt.Println("calling f")，然后才会执行 defer 修饰的函数调用语句。

### 2. 执行顺序

一个函数中可以写多个 defer 语句：
```go
func f() {
	defer fmt.Println("deferred in f 1")
	defer fmt.Println("deferred in f 2")
	defer fmt.Println("deferred in f 3")
	fmt.Println("calling f")
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
calling f
deferred in f 3
deferred in f 2
deferred in f 1
```
被 defer 修饰的函数调用，在外层函数返回后按后进先出顺序执行，即 Last In First Out(LIFO)。

不仅如此，defer 可以写在任意位置，并且还可以嵌套，即在被 defer 修饰的函数中再次使用 defer。示例如下：
```go
func f() {
	fmt.Println("1")
	defer func() {
		fmt.Println("2")
		defer fmt.Println("3")
		fmt.Println("4")
	}()
	fmt.Println("5")
	defer fmt.Println("6")
	fmt.Println("7")
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
1
5
7
6
2
4
3
```
这个输出结果符合你的预期吗？

### 3. 读写函数返回值

有时候，我们可以使用 defer 语句来读取或修改函数的返回值。

有如下示例，试图在 defer 中修改函数的返回值：
```go
func f() int {
	r := 2
	defer func() {
		fmt.Println("r:", r)
		r *= 3
	}()
	return r
}

func main() {
	fmt.Println(f())
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 2
2
```
从输出结果可以发现，r 的值被修改了，但是函数 f 的返回值还是 2。 看来没有成功。

函数使用具名返回值再来看看：
```go
func f() (r int) {
	r = 2
	defer func() {
		fmt.Println("r:", r)
		r *= 3
	}()
	return r
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 2
6
```
这次成功了。

如果改成这样呢：
```go
func f() (r int) {
	defer func() {
		fmt.Println("r:", r)
		r *= 3
	}()
	return 2
}
```
现在，返回值直接写成了 2，而非变量 r。

执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 2
6
```
这次返回值依然修改成功了。

前面几个示例，其实都算使用了闭包。因为被 defer 修饰的函数内部都引用了外部变量 r。

我们再看一个不使用闭包的示例：
```go
func f() (r int) {
	defer func(r int) {
		fmt.Println("r:", r)
		r *= 3
	}(r)
	return 2
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 0
2
```
这次返回值没有修改成功，并且被 defer 修饰的函数内部读到的 r 值为 0，并不是前面示例中的 2。

也就是说，实际上虽然被 defer 修饰的函数调用会延迟执行，但是我们传递给函数的参数，会被立即求值。

我们接着看下面这个示例：
```go
func f() (r int) {
	x := 2
	defer func() {
		fmt.Println("r:", r)
		fmt.Println("x:", x)
		x *= 3
	}()
	return x
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 2
x: 2
2
```
当代码执行到 return x 时，r 值也会被赋值为 2，这没什么好解释的。

然后在 defer 所修饰的函数内部，我们只修改了 x 变量，这对返回结果 r 没有影响。

把函数返回值类型改成指针试试呢：
```go
func f() (r *int) {
	x := 2
	defer func() {
		fmt.Println("r:", *r)
		fmt.Println("x:", x)
		x *= 3
	}()
	return &x
}

func main() {
	fmt.Println(*f())
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
r: 2
x: 2
6
```
这次返回值又成功被修改了。

看到这里，你是不是对 defer 语句的效果有点懵，没关系，我们再来梳理下 defer 执行时机。

defer 语句的行为其实是可预测的，我们可以记住这三条规则：
1. 在计算 defer 语句时，将立即计算被 defer 修饰的函数参数。
2. 被 defer 修饰的函数，在外层函数返回后按后进先出的顺序（LIFO）执行。
3. 延迟函数可以读取或赋值给外层函数的具名返回值。

现在，你再翻回去重新看看上面的几个示例程序，是不是都能理解了呢？

### 4. 释放资源

defer 还常被用来释放资源，比如关闭文件对象。

这里有个示例程序，可以将一个文件内容复制到另外一个文件中：
```go
func CopyFile(dstName, srcName string) (written int64, err error) {
	src, err := os.Open(srcName)
	if err != nil {
		return
	}

	dst, err := os.Create(dstName)
	if err != nil {
		return
	}

	written, err = io.Copy(dst, src)
	dst.Close()
	src.Close()
	return
}
```
不过这个程序存在 bug，如果 os.Create 执行失败，函数返回后 src 并没有被关闭。

而这种场景刚好适用 defer，示例如下：
```go
func CopyFile(dstName, srcName string) (written int64, err error) {
	src, err := os.Open(srcName)
	if err != nil {
		return
	}
	defer src.Close()

	dst, err := os.Create(dstName)
	if err != nil {
		return
	}
	defer dst.Close()

	return io.Copy(dst, src)
}
```
此时如果 os.Create 执行失败，函数返回后 defer src.Close() 将会被执行，文件资源得以释放。

切记，不要在 if err != nil 之前调用 defer 释放资源，这很可能会触发 panic。
因为，如果调用 os.Open 报错，src 值将为 nil，而 nil.Close() 会触发 panic，导致程序意外终止而退出。

### 5. 结构体方法是否使用指针接收者

当结构体方法使用指针作为接收者时，也要小心。

示例如下：
```go
type User struct {
	name string
}

func (u User) Name() {
	fmt.Println("Name:", u.name)
}

func (u *User) PointName() {
	fmt.Println("PointName:", u.name)
}

func printUser() {
	u := User{name: "user1"}

	defer u.Name()
	defer u.PointName()

	u.name = "user2"
}

func main() {
	printUser()
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
PointName: user2
Name: user1
```
User.Name 方法接收者为结构体，在 defer 中被调用，最终输出结果为初始 name 值 user1。

User.PointName 方法接收者为指针，在 defer 中被调用，最终输出结果为修改后的 name 值 user2。

可见，defer 处不仅会计算函数参数，其实它会对其后面的表达式求值，并计算出最终将要执行的函数或方法。

也就是说，代码执行到 defer u.Name() 时，变量 u 的值就已经计算出来了，相当于“复制”了一个新的变量，后面再通过 u.name = "user2" 修改其属性，二者已经不是同一个变量了。

而代码执行到 defer u.PointName() 时，其实这里的 u 是指针类型，即使“复制”了一个新的变量，其内部保存的指针依然相等，所以可以被修改。

如果将代码修改成如下这样，执行结果又会怎样呢？
```go
func printUser() {
	u := User{name: "user1"}

	defer func() {
		u.Name()
		u.PointName()
	}()

	u.name = "user2"
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
PointName: user2
Name: user2
```
### 6. 当 defer 遇到 os.Exit

当 defer 遇到 os.Exit 时会怎样呢？
```go
func f() {
	defer fmt.Println("deferred in f")
	fmt.Println("calling f")
	os.Exit(0)
}

func main() {
	f()
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
calling f
```
可见，当遇到 os.Exit 时，程序直接退出，defer 并不会被执行，这一点平时开发过程中要格外注意。

### 7. 一个过时的面试题

前几年，有一个考察 defer 的面试题经常在网上出现：
```go
func f() {
	for i := 0; i < 3; i++ {
		defer func() {
			fmt.Println(i)
		}()
	}
}
```
问执行 f 以后，输出什么？

既然会成为面试题，执行结果就肯定有猫腻。

如果你使用 Go 1.22 以前的版本执行示例代码，将得到如下结果：
```shell
$ go run main.go
3
3
3
```
而如果你使用 Go 1.22 及以后的版本执行示例代码，将得到如下结果：
```shell
$ go run main.go
2
1
0
```
这是由于，在 Go 1.22 以前，由 for 循环声明的变量只会被创建一次，并在每次迭代时更新。在 Go 1.22 中，循环的每次迭代都会创建新的变量，以避免意外的共享错误。
因此，在 Go 1.22 及以后版本中，输出结果为 2、1、0，而不是 3、3、3。

在旧版本的 Go 中要修复这个问题，只需要这样写即可：
```go
func f() {
	for i := 0; i < 3; i++ {
		defer fmt.Println(i)
	}
}
```
直接把 defer 放在外面，不要构成闭包。

又或者为 defer 函数增加参数：
```go
func f() {
	for i := 0; i < 3; i++ {
		defer func(i int) {
			fmt.Println(i)
		}(i)
	}
}
```
总之，解决方案就是不要出现闭包。

### 8. 不要出现 defer nil 的情况

前文说过，defer 后面支持函数或方法的调用。

但是，如果计算 defer 后的表达式出现 nil 的情况，则会触发 panic。
```go
func deferNil() {
	var f func()
	defer f()
	fmt.Println("calling deferNil")
}

func main() {
	deferNil()
}
```
执行示例代码，得到输出如下：
```shell
calling deferNil
panic: runtime error: invalid memory address or nil pointer dereference
[signal SIGSEGV: segmentation violation code=0x2 addr=0x0 pc=0x10264f88c]

goroutine 1 [running]:
main.deferNil()
        /go/blog-go-example/error/defer-panic-recover/defer/main.go:363 +0x6c
main.main()
        /go/blog-go-example/error/defer-panic-recover/defer/main.go:384 +0x1c
exit status 2
```
因为 nil 不可被调用。

至于到底什么是 panic，咱们往下看。

## 二、Panic

在 Go 中，error 表示一个错误，错误通常会返给调用方，交由调用方来决定如何处理。而 panic 则表示一个无法挽回的异常，panic 会直接终止当前执行的控制流。

panic 是一个内置函数，它会停止程序的正常控制流并输出 panic 相关信息。

有两种方式可以触发 panic：

- 一种是非法操作导致运行时错误，比如访问数组索引越界，此时会触发运行时 panic。
- 另一种是主动调用 panic 函数。

当在函数 F 中调用了 panic 后，程序执行流程如下：

1. 函数 F 调用 panic 时，F 的执行会被停止，
2. 接下来会执行 F 中调用 panic 之前的所有 defer 函数，然后 F 返回给调用者。
3. 接着，对于 F 的调用方 G 的行为也类似于对 panic 的调用。
4. 该过程继续向上返回，直到当前 goroutine 中的所有函数都返回，此时程序崩溃。

最后，你将在执行 Go 程序的控制台看到程序执行异常的堆栈信息。

### 1. 使用

panic 使用示例如下：
```go
func f() {
	defer fmt.Println("defer 1")
	fmt.Println(1)
	panic("woah")
	defer fmt.Println("defer 2")
	fmt.Println(2)
}

func main() {
	f()
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
1
defer 1
panic: woah

goroutine 1 [running]:
main.f()
        /go/blog-go-example/error/defer-panic-recover/panic/main.go:10 +0xa0
main.main()
        /go/blog-go-example/error/defer-panic-recover/panic/main.go:29 +0x1c
exit status 2
```
可以发现，panic 会输出异常堆栈信息。

并且 1 和 defer 1 都被输出了，而 2 和 defer 2 没有输出，说明 panic 调用之后的代码不会执行，但它不影响 panic 之前 defer 函数的执行。

此外，如果你足够细心，还可以发现 panic 后程序的退出码为 2。

### 2. 子 Goroutine 中 panic

如果在子 goroutine 中发生 panic，也会导致主 goroutine 立即退出：
```go
func g() {
	fmt.Println("calling g")
	// 子 goroutine 中发生 panic，主 goroutine 也会退出
	go f(0)
	fmt.Println("called g")
}

func f(i int) {
	fmt.Println("panicking!")
	panic(fmt.Sprintf("i=%v", i))
	fmt.Println("printing in f", i) // 不会被执行
}

func main() {
	g()
	time.Sleep(10 * time.Second)
}
```
执行示例代码，程序并不会等待 10s 后才退出，而是立即 panic 并退出，得到输出如下：
```shell
$ go run main.go
calling g
called g
panicking!
panic: i=0

goroutine 3 [running]:
main.f(0x0)
        /go/blog-go-example/error/defer-panic-recover/panic/main.go:25 +0xa0
created by main.g in goroutine 1
        /go/blog-go-example/error/defer-panic-recover/panic/main.go:19 +0x5c
exit status 2
```

### 3. panic 和 os.Exit

虽然 panic 和 os.Exit 都能使程序终止并退出，但它们有着显著的区别，尤其在触发时的行为和对程序流程的影响上。

panic 用于在程序中出现异常情况时引发一个运行时错误，通常会导致程序崩溃（除非被 recover 恢复）。当触发 panic 时，defer 语句仍然会执行。panic 还会打印详细的堆栈信息，显示引发错误的调用链。panic 退出状态码固定为 2。

os.Exit 会立即终止程序，并返回指定的状态码给操作系统。当执行 os.Exit 时，defer 语句不会执行。os.Exit 直接通知操作系统退出程序，它不会返回给调用者，也不会引发运行时堆栈追踪，所以也就不会打印堆栈信息。os.Exit 可以设置程序退出状态码。

因为 panic 比较暴力，所以一般只建议在 main 函数中使用，比如应用的数据库初始化失败后直接 panic，因为程序无法连接数据库，程序继续执行意义不大。而普通函数中推荐尽量返回 error 而不是直接 panic。

不过 panic 也不是没有挽救的余地，recover 就是来恢复 panic 的。

## 三、Recover

recover 也是一个函数，用来从 panic 所导致的程序崩溃中恢复执行。

### 1. 使用

使用示例如下：
```go
func f() {
	defer func() {
		recover()
	}()

	defer fmt.Println("defer 1")
	fmt.Println(1)
	panic("woah")
	defer fmt.Println("defer 2")
	fmt.Println(2)
}

func main() {
	f()
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
1
defer 1
```
recover() 的调用捕获了 panic 触发的异常，并且程序正常退出。

recover 函数只在 defer 语句的上下文中才有效，直接调用的话，只会返回 nil。

### 2. 不要在 defer 中出现 panic

为了避免不必要的麻烦，defer 函数中最好不要有能够引起 panic 的代码。

正常来说，defer 用来释放资源，不会出现大量代码。如果 defer 函数中逻辑过多，则需要斟酌下有没有更优解。

如下示例将输出什么？
```go
func f() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recover:", r)
		}
	}()

	defer func() {
		panic("woah 1")
	}()
	panic("woah 2")
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
recover: woah 1
```
从输出可以发现，recover 只会捕获 defer 函数中第一个 panic，后面的 panic 都会被忽略。

看来，defer 中的 panic("woah 1") 覆盖了程序正常控制流中的 panic("woah 2")。

如果我们将代码顺序稍作修改：
```go
func f() {
	defer func() {
		panic("woah 1")
	}()

	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recover:", r)
		}
	}()

	panic("woah 2")
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
recover: woah 2
panic: woah 1

goroutine 1 [running]:
main.f.func1()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:68 +0x2c
main.f()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:77 +0x68
main.main()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:142 +0x1c
exit status 2
```
看来，调用 recover 的 defer 应该放在函数的入口处，成为第一个 defer。

### 3. recover 只能捕获当前 Goroutine 中的 panic

需要额外注意的一点是，recover 只会捕获当前 goroutine 所触发的 panic。

示例如下：
```go
func f() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("recover:", r)
		}
	}()

	go func() {
		panic("woah")
	}()
	time.Sleep(1 * time.Second)
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
panic: woah

goroutine 18 [running]:
main.f.func2()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:91 +0x2c
created by main.f in goroutine 1
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:90 +0x40
exit status 2
```
子 goroutine 中触发的 panic 并没有被 recover 捕获。

所以，如果你认为代码中需要捕获 panic 时，就需要在每个 goroutine 中都执行 recover。

### 4. 将 panic 转换成 error 返回

在实际开发中，我们更希望将异常转化为 error 返回，而不是直接 panic。
我们可能需要将 panic 转换成 error 并返回，防止当前函数调用他人提供的不可控代码时出现意外的 panic。

示例如下：
```go
func g(i int) (number int, err error) {
	defer func() {
		if r := recover(); r != nil {
			var ok bool
			err, ok = r.(error)
			if !ok {
				err = fmt.Errorf("f returns err: %v", r)
			}
		}
	}()

	number, err = f(i)
	return number, err
}

func f(i int) (int, error) {
	if i == 0 {
		panic("i=0")
	}
	return i * i, nil
}

func main() {
	fmt.Println(g(1))
	fmt.Println(g(0))
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
1 <nil>
0 f returns err: i=0
```
从输出可以发现，当 i=0 时，f 函数返回的 panic 被 recover 捕获，并转化为 error 返回。

### 5. panic(nil)

panic 函数签名如下：
```
func panic(v any)
```
既然 panic 参数是 any 类型，那么 nil 当然也可以作为参数。

可以写出 panic(nil) 程序示例代码如下：
```go
func f() {
	defer func() {
		if err := recover(); err != nil {
			fmt.Println(err)
		}
	}()
	panic(nil)
}
```
执行示例代码，得到输出如下：
```shell
$ go run main.go
panic called with nil argument
```
这没什么问题。

但是在 Go 1.21 版本以前，执行上述代码，将得到如下结果：
```shell
$ go run main.go
```
你没看错，我也没写错误，这里什么都没输出。

在旧版本的 Go 中，panic(nil) 并不能被 recover 捕获，recover() 调用结果将返回 nil。
幸运的是，在 Go 1.21 发布时，这个问题得以解决。

不过，这就破坏了 Go 官方承诺的 Go1 兼容性保障。因此，Go 团队又提供了 GODEBUG=panicnil=1 标识来恢复旧版本中的 panic 行为。

使用方式如下：
```shell
$ GODEBUG=panicnil=1 go run main.go
```
其实，根据 panic 声明中的注释我们也能够观察到 Go 1.21 后 panic(nil) 行为有所改变：
```shell
// Starting in Go 1.21, calling panic with a nil interface value or an
// untyped nil causes a run-time error (a different panic).
// The GODEBUG setting panicnil=1 disables the run-time error.
func panic(v any)
```
panic 相关源码实现如下：
```go
// The implementation of the predeclared function panic.
func gopanic(e any) {
	if e == nil {
		if debug.panicnil.Load() != 1 {
			e = new(PanicNilError)
		} else {
			panicnil.IncNonDefault()
		}
	}
...
}
```
在没有指定 GODEBUG=panicnil=1 情况下，panic(nil) 调用等价于 panic(new(runtime.PanicNilError))。

### 6. 数据库事务

使用 defer + recover 来处理数据库事务，也是比较常用的做法。

这里有一个来自 GORM 官方文档中的 示例程序：
```go
type Animal struct {
	Name string
}

func CreateAnimals(db *gorm.DB) error {
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if err := tx.Error; err != nil {
		return err
	}

	if err := tx.Create(&Animal{Name: "Giraffe"}).Error; err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Create(&Animal{Name: "Lion"}).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}
```
在函数最开始开启了一个事务，接着使用 defer + recover 来确保程序执行中间过程遇到 panic 时能够回滚事务。

程序执行过程中使用 tx.Create 创建了两条 Animal 数据，并且如果输出，都将回滚事务。

如果没有错误，最终调用 tx.Commit() 提交事务，并将其错误结果返回。

这个函数实现逻辑非常严谨，没什么问题。

但是这个示例代码写的过于啰嗦，还有优化的空间，可以写成这样：
```go
func CreateAnimals(db *gorm.DB) error {
	tx := db.Begin()
	defer tx.Rollback()

	if err := tx.Error; err != nil {
		return err
	}

	if err := tx.Create(&Animal{Name: "Giraffe"}).Error; err != nil {
		return err
	}

	if err := tx.Create(&Animal{Name: "Lion"}).Error; err != nil {
		return err
	}

	return tx.Commit().Error
}
```
这里在 defer 中直接去掉了 recover 的判断，所以无论如何程序最终都会执行 tx.Rollback()。

之所以可以这样写，是因为调用 tx.Commit() 时事务已经被提交成功，之后执行 tx.Rollback() 并不会影响已经提交事务。

这段代码看上去要简洁不少，不必在每次出现 error 时都想着调用 tx.Rollback() 回滚事务。

你可能认为这样写有损代码性能，但其实绝大多数场景下我们不需要担心。我更愿意用一点点可以忽略不计的性能损失，换来一段清晰的代码，毕竟可读性很重要。

### 7. panic 并不是都可以被 recover 捕获

最后，咱们再来看一个并发写 map 的场景，如果触发 panic 结果将会怎样？

示例如下：
```go
func f() {
	m := map[int]struct{}{}

	go func() {
		defer func() {
			if err := recover(); err != nil {
				fmt.Println("goroutine 1", err)
			}
		}()
		for {
			m[1] = struct{}{}
		}
	}()

	go func() {
		defer func() {
			if err := recover(); err != nil {
				fmt.Println("goroutine 2", err)
			}
		}()
		for {
			m[1] = struct{}{}
		}
	}()

	select {}
}
```
这里启动两个 goroutine 来并发的对 map 进行写操作，并且每个 goroutine 中都使用 defer + recover 来保证能够正常处理 panic 发生。

最后使用 select {} 阻塞主 goroutine 防止程序退出。
执行示例代码，得到输出如下：
```shell
$ go run main.go
fatal error: concurrent map writes

goroutine 3 [running]:
main.f.func1()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:156 +0x4c
created by main.f in goroutine 1
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:149 +0x50

goroutine 1 [select (no cases)]:
main.f()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:171 +0x84
main.main()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:204 +0x1c

goroutine 4 [runnable]:
main.f.func2()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:167 +0x4c
created by main.f in goroutine 1
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:160 +0x80
exit status 2
```
然而程序还是输出 panic 信息 fatal error: concurrent map writes 并退出了。

但是根据输出信息，我们无法知道具体原因。

在 [Go 1.19 Release Notes](https://go.dev/doc/go1.19#runtime) 中有提到，
从 Go 1.19 版本开始程序遇到不可恢复的致命错误（例如并发写入 map，或解锁未锁定的互斥锁）只会打印一个简化的堆栈信息，不包含运行时元数据。
不过这可以通过将环境变量 GOTRACEBACK 被设置为 system 或 crash 来解决。

所以我们可以使用如下两种方式来输出更详细的堆栈信息：
```shell
$ GOTRACEBACK=system go run main.go
$ GOTRACEBACK=crash go run main.go
```
再次执行示例代码，得到输出如下：
```shell
$  GOTRACEBACK=system go run main.go
fatal error: concurrent map writes

goroutine 4 gp=0x14000003180 m=3 mp=0x14000057008 [running]:
runtime.fatal({0x104904795?, 0x0?})
        /go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.1.darwin-arm64/src/runtime/panic.go:1088 +0x38 fp=0x14000051750 sp=0x14000051720 pc=0x104898a28
runtime.mapassign_fast64(0x104938ee0, 0x1400007a0c0, 0x1)
        /go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.1.darwin-arm64/src/runtime/map_fast64.go:122 +0x40 fp=0x14000051790 sp=0x14000051750 pc=0x1048cb5d0
main.f.func1()
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:156 +0x4c fp=0x140000517d0 sp=0x14000051790 pc=0x1049017bc
runtime.goexit({})
        /go/pkg/mod/golang.org/toolchain@v0.0.1-go1.23.1.darwin-arm64/src/runtime/asm_arm64.s:1223 +0x4 fp=0x140000517d0 sp=0x140000517d0 pc=0x1048d4694
created by main.f in goroutine 1
        /go/blog-go-example/error/defer-panic-recover/recover/main.go:149 +0x50
...
exit status 2
```
可以看到，这次输出的堆栈信息比之前更详细，并且还包含了运行时的元数据。
这里省略了大部分堆栈输出，只保留了重要部分。根据堆栈信息可以发现在 runtime/map_fast64.go:122 处发生了 panic。

相关源码内容如下：
```go
func mapassign_fast64(t *maptype, h *hmap, key uint64) unsafe.Pointer {
	if h == nil {
		panic(plainError("assignment to entry in nil map"))
	}
	if raceenabled {
		callerpc := getcallerpc()
		racewritepc(unsafe.Pointer(h), callerpc, abi.FuncPCABIInternal(mapassign_fast64))
	}
	if h.flags&hashWriting != 0 {
		fatal("concurrent map writes") // 第 122 行
	}
	...
	return elem
}
```
显然是第 122 行代码 fatal("concurrent map writes") 触发了 panic，并且其参数内容 concurrent map writes 也正是输出结果。

fatal 函数源码如下：
```go
// fatal triggers a fatal error that dumps a stack trace and exits.
//
// fatal is equivalent to throw, but is used when user code is expected to be
// at fault for the failure, such as racing map writes.
//
// fatal does not include runtime frames, system goroutines, or frame metadata
// (fp, sp, pc) in the stack trace unless GOTRACEBACK=system or higher.
//
//go:nosplit
func fatal(s string) {
	// Everything fatal does should be recursively nosplit so it
	// can be called even when it's unsafe to grow the stack.
	systemstack(func() {
		print("fatal error: ")
		printindented(s) // logically printpanicval(s), but avoids convTstring write barrier
		print("\n")
	})

	fatalthrow(throwTypeUser)
}
```
fatal 内部调用了 fatalthrow 来触发 panic。看来由 fatalthrow 所触发的 panic 无法被 recover 捕获。

我们开发时要切记：并发读写 map 触发 panic，无法被 recover 捕获。

并发操作 map 一定要小心，这是一个比较危险的行为，在 Web 开发中，如果在某个接口 handler 方法中触发了 panic，整个 http Server 会直接挂掉。

涉及并发操作 map，我们应该使用 sync.Map 来代替：
```go
func f() {
	m := sync.Map{}

	go func() {
		defer func() {
			if err := recover(); err != nil {
				fmt.Println("goroutine 1", err)
			}
		}()
		for {
			m.Store(1, struct{}{})
		}
	}()

	go func() {
		defer func() {
			if err := recover(); err != nil {
				fmt.Println("goroutine 2", err)
			}
		}()
		for {
			m.Store(1, struct{}{})
		}
	}()

	select {}
}
```
这个示例就不会 panic 了。

## 四、总结

本文对错误处理三剑客 defer、panic 和 recover 进行了讲解梳理，虽然这三者并不是 error，但它们与错误处理息息相关。

defer 可以推迟一个函数或方法的调用，通常用于简化执行各种清理操作的函数。

panic 是一个内置函数，它会停止程序的正常控制流并输出 panic 相关信息。相比于 error，panic 更加暴力，谨慎使用。

recover 用来从 panic 所导致的程序崩溃中恢复执行，并且要与 defer 一起使用。

希望此文能对你有所启发。













