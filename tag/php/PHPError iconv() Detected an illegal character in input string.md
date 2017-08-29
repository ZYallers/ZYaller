# PHPError iconv() : Detected an illegal character in input string

> http://www.jb51.net/article/25528.htm

## 背景
PHP传给JS字符串用ecsape转换加到url里，又用PHP接收，再用网上找的unscape函数转换一下，这样得到的字符串是UTF-8的，但我需要的是GB2312，于是用iconv转换。

开始是这样用的
```php
$str = iconv('UTF-8', 'GB2312', unescape(isset($_GET['str'])? $_GET['str']:''));
```
上线后报一堆这样的错：
> iconv() : Detected an illegal character in input string

考虑到GB2312字符集比较小，换个大的吧，于是改成GBK：
```php
$str = iconv('UTF-8', 'GBK', unescape(isset($_GET['str'])? $_GET['str']:''));
```
上线后还是报同样的错！

再认真读手册，发现有这么一段：
> If you append the string //TRANSLIT to out_charset transliteration is activated. This means that when a character can't be represented in the target charset, it can be approximated through one or several similarly looking characters. If you append the string //IGNORE, characters that cannot be represented in the target charset are silently discarded. Otherwise, str is cut from the first illegal character.

于是改成：
```php
$str = iconv('UTF-8', 'GBK//IGNORE', unescape(isset($_GET['str'])? $_GET['str']:''));
```
本地测试`//IGNORE`能忽略掉它不认识的字接着往下转，并且不报错，而`//TRANSLIT`是截掉它不认识的字及其后面的内容，并且报错。

在网上找到下面这篇文章，发现mb_convert_encoding也可以，但效率比iconv差。


## 转换字符串编码iconv与mb_convert_encoding的区别

- iconv — Convert string to requested character encoding(PHP 4 >= 4.0.5, PHP 5)
- mb_convert_encoding — Convert character encoding(PHP 4 >= 4.0.6, PHP 5)

### 用法：
> string mb_convert_encoding ( string str, string to_encoding [, mixed from_encoding] )
需要先启用`mbstring`扩展库，在php.ini里将; extension=php_mbstring.dll前面的`;`去掉。

> string iconv ( string in_charset, string out_charset, string str )

### 注意：
第二个参数，除了可以指定要转化到的编码以外，还可以增加两个后缀：//TRANSLIT 和 //IGNORE，
其中：
- //TRANSLIT 会自动将不能直接转化的字符变成一个或多个近似的字符，
- //IGNORE 会忽略掉不能转化的字符，而默认效果是从第一个非法字符截断。
Returns the converted string or FALSE on failure.

### 使用：
1. 发现iconv在转换字符"-"到gb2312时会出错，如果没有ignore参数，所有该字符后面的字符串都无法被保存。不管怎么样，这个"-"都无法转换成功，无法输出。另外mb_convert_encoding没有这个bug.
2. mb_convert_encoding 可以指定多种输入编码，它会根据内容自动识别,但是执行效率比iconv差太多；如：$str = mb_convert_encoding($str,"euc-jp","ASCII,JIS,EUC-JP,SJIS,UTF- 8");“ASCII,JIS,EUC-JP,SJIS,UTF-8”的顺序不同效果也有差异
3. 一般情况下用 iconv，只有当遇到无法确定原编码是何种编码，或者iconv转化后无法正常显示时才用mb_convert_encoding 函数

> from_encoding is specified by character code name before conversion. it can be array or string - comma separated enumerated list. If it is not specified, the internal encoding will be used.

```php
$str = mb_convert_encoding($str, "UCS-2LE", "JIS, eucjp-win, sjis-win");
$str = mb_convert_encoding($str, "EUC-JP', "auto");
```

### 例子：
```php
$content = iconv("GBK", "UTF-8", $content);
$content = mb_convert_encoding($content, "UTF-8", "GBK"); 
```
