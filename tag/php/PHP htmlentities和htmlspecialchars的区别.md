# PHP htmlentities和htmlspecialchars的区别

我们可以拿一个简单的例子来做比较：

```php
$str='测试页面';
echo htmlentities($str);
// ²âÊÔÒ³Ãæ $str='测试页面';
echo htmlspecialchars($str);
// 测试页面
```
htmlspecialchars 只转化上面这几个html代码，而 htmlentities 却会转化所有的html代码，连同里面的它无法识别的中文字符也给转化了。

结论是有中文的时候，最好用 htmlspecialchars ，否则可能乱码。