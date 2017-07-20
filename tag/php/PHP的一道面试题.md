# PHP的一道面试题

> 转载自：[segmentfault](https://segmentfault.com/q/1010000004427203?utm_source=weekly&utm_medium=email&utm_campaign=email_weekly)

```php
function myfunc($a){ 
  echo $a + 10;
}
$val = 10;
echo "myfunc($val)=".myfunc($val);
```

有些人会说简单，不是应该输出myfunc(10)=20吗？其实不然，应是20myfunc(10)=。

这道面试题主要是考察执行顺序，具体解答过程如下：

1.echo "myfunc($val)=";

单独这样的时候，输出结果为：myfunc(10)= ，说明双引号中只不解析函数，只解析变量
  
2.echo "myfunc($val)=".myfunc($val);

拼接上后面的函数后，结果为：20myfunc(10)=，说明后面的函数先执行输出了20。然后执行了echo语句。

总结：第一步执行后面的函数输出了20，然后在执行echo语句。故结果为：20myfunc(10)=