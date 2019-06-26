# PHP foreach 循环中变量引用的一道面试题
> https://blog.csdn.net/ohmygirl/article/details/8726865

有个朋友去金山面试PHP开发时遇到的一道面试题，是关于引用和foreach循环的。很基础的一道题。废话不多说，直接看代码：

```php
$a = array('a','b','c');
foreach($a as &$v){
}
foreach($a as $v){
}
var_dump($a);
```

现在。不要打开浏览器，猜测一下。输出的结果是什么？

对引用比较了解的童鞋可能已经看出来了。

正确答案是：
```php
array(3) { 
  [0]=> string(1) "a" 
  [1]=> string(1) "b" 
  [2]=> &string(1) "b"
} 
```
如果你猜测的不是上面的话，那么关于引用的使用，你还要查阅一下相关的资料：http://www.php.net/manual/zh/language.references.php

那么为什么是abb呢。让我们一步步来看：

我们知道对数组执行foreach循环时，是通过移动数组内部指针来实现的（关于更多细节，可以阅读php源码）。

因而对于本文中的例子：当foreach循环结束的时候，由于`$v`为引用变量，因而`$v`与`$a[2]`指向了同一个地址空间（共享变量值），所以之后对`$v`的任何修改都会直接反映到数组`$a`中。

我们可以对例子加上调试代码，便会一清二楚，例如我们在第二次循环内部，加上`var_dump($a)`,测试每次循环时`$a`的值的变化：

```php
$a = array('a','b','c');
foreach($a as &$v){}
 
foreach($a as $v){
	var_dump($a);
	echo "<br/>";
}
var_dump($a);
```

运行代码结果为：

```php
array(3) { [0]=> string(1) "a" [1]=> string(1) "b" [2]=> &string(1) "a" }
array(3) { [0]=> string(1) "a" [1]=> string(1) "b" [2]=> &string(1) "b" }
array(3) { [0]=> string(1) "a" [1]=> string(1) "b" [2]=> &string(1) "b" }
array(3) { [0]=> string(1) "a" [1]=> string(1) "b" [2]=> &string(1) "b" } 
```

画个图：可以更加清晰看出来：(图中"$v指向了$a[2]"并不准确。应该是：$v与$a[2]指向了同一个地方)

![IMG](https://img-my.csdn.net/uploads/201303/27/1364375152_5102.JPG)

### 关于引用的几点简单解释

#### 1. 引用类似于指针，但是不同于指针

例如，对于引用：
```php
$a = "str";
$b = &$a; // $a 和 $b 指向了同一个地方
```

一个简单的示意图如下：

![IMG](https://img-my.csdn.net/uploads/201303/27/1364375169_2521.JPG)

那么此时更改$a和$b中任何一个元素的值。另外一个值都为随之改变：

```php
$a = "str";
$b = &$a;
$b = "sssss";
echo $a; // output "sssss"
```

#### 2. `unset`只会删除变量。并不会清空变量值对应的内存空间：（这是与指针不同的地方）

```php
$a = "str";
$b = &$a;
unset($b);
echo $a; // ouput "str"
```

#### 3. 引用作为函数参数传递时，是可以被函数内部更改的：

```php
function change(&$a){
	if(is_array($a)){
		$a = array();
	}
}
$test = range(1,10);
change($test);
print_r($test); // output "array()"
```

基于以上几点，在编码的过程中，要小心使用引用，防止陷入莫名其妙的尴尬问题。

### 理解了么？试试这道题：

```php
$a = range(1, 4);
foreach($a as &$b){
    $b *= $b;
}
foreach( $a as $b){
    echo  $b;
}
```

猜猜输出是什么？