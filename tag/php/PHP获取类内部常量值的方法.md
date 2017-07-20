# PHP获取类内部常量值的方法

今天在写搭建一个api接口，需求返回程序处理后对于的结果状态码，如status=-1001就代表不合法请求。不想再代码里面直接写-1001这样的数字，阅读理解太不友好了。就想着创建一个状态码类，里面定义好需要的常量，既可以直接作为静态常量访问，也可以返回想要的数据组合。

但问题来了，在想要返回需要的数据组合时候，通过传入的参数获取对应常量的时候，一直找不到方法，网上寻觅了会找到了几种方法。

```php
class TestClass {  
  const NAME  = 'A’s name';  
}  
  
$testClass = new TestClass();  
$const  = 'NAME'; 
 
// 方法一 eval  
$name   = eval( 'return $testClass::' . $const . ';' );  
// 方法二 反射  
$name   = ( new \ReflectionClass( $testClass ) )->getconstant( $const );  
// 方法三 杂项函数  
$name   = constant( get_class( $testClass ) .'::'. $const );  
  
var_dump($name);
```

我只使用了第三种方法，应该其他几种也同样行，就不知道哪个效率好些。