# PHP字符串指定长度截取的内置函数
> http://php.net/manual/zh/function.mb-strimwidth.php

## mb_strimwidth
> (PHP 4 >= 4.0.6, PHP 5, PHP 7)

`mb_strimwidth` — 获取按指定宽度截断的字符串

### 说明
```php
string mb_strimwidth ( string $str , int $start , int $width [, string $trimmarker = "" [, string $encoding = mb_internal_encoding() ]] )
```
按 width 将字符串 str 截短。

### 参数
#### str
```
要截短的 string。
```
#### start
```
开始位置的偏移。从这些字符数开始的截取字符串。（默认是 0 个字符） 如果 start 是负数，就是字符串结尾处的字符数。
```
#### width
```
所需修剪的宽度。负数的宽度是从字符串结尾处统计的。
```
#### trimmarker
```
当字符串被截短的时候，将此字符串添加到截短后的末尾。
```
#### encoding
```
encoding 参数为字符编码。如果省略，则使用内部字符编码。
```
#### 返回值
```
截短后的 string。 如果设置了 trimmarker，还将结尾处的字符替换为 trimmarker ，并符合 width 的宽度。
```
### 更新日志
版本 | 说明
---|---
7.1.0 | 支持负数的 start 和 width。

### 范例
#### Example 1 mb_strimwidth() 例子
```php
<?php
echo mb_strimwidth("Hello World", 0, 10, "...");
// 输出 Hello W...
?>
```

