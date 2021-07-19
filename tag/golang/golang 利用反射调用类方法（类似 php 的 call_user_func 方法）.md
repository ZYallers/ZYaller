[//]:# (2019/6/25 13:55|GOLANG|)
# golang 利用反射调用类方法（类似 php 的 call_user_func 方法）.md
> [张素杰](http://www.xtgxiso.com/golang%E5%88%A9%E7%94%A8%E5%8F%8D%E5%B0%84%E8%B0%83%E7%94%A8%E7%B1%BB%E6%96%B9%E6%B3%95)

以前不知反射的用法，那是一直在写弱语言，现在用了go之后才知道反射的用途之一就是动态调用。

php动态调用代码一般是这样的：

```php
class MyMath{

    public function Add($num1,$num2){
        return $num1+$num2;
    }
}
$class_name = "MyMath";
$method_name = "Add";

$class = new $class_name();
$num = call_user_func(array($class,$method_name),1,2);
var_dump($num);
```

而在go中是不行的，应该是利用反射，代码举例如下：

```go
package main

import (
	"fmt"
	"reflect"
)

//自己的数据类
type MyMath struct{
	a int
}

//加法
func (mm *MyMath) Add(num1 float64,num2 float64 ) float64 {
    reply := num1+num2 
	return reply
}


func main() {
	m := new(MyMath)
	add := reflect.ValueOf(m).MethodByName("Add")
	args := make([]reflect.Value, 2)
	args[0] = reflect.ValueOf(1.0)
	args[1] = reflect.ValueOf(2.0)
	ret := add.Call(args)
	fmt.Println(ret[0])
}
```

现在大概知道在 `go` 中大致反射是怎么用了。