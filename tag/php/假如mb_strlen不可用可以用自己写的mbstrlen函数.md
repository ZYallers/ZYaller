# 假如mb_strlen不可用可以用自己写的mbstrlen函数

> 转载自：<http://www.ekan001.com/articles/29>

有时候我们需要计算一个字符串中包含的字数，对于纯英文字符串，字数等于字符串长度，用**strlen**函数即可获得，但如果字符串中包含中文怎办？**mb_strlen** 可以实现。

php有一个扩展一般是必装的，我们可以使用**mb_strlen**来获取字符串中的字数，用法一般如下：

```php
$len = mb_strlen("你是我的小苹果","utf-8");
```

如愿获得字符串长度：7.

如果没装mb扩展呢？自己实现一下吧。

我们要先明白一个事实：字符串是由字符组成的，而字符是由字节表示的，每个英文字符是一个字节，对应一个ascii码，英文字符的ascii码是小于128的，也就是十六进制的 0x80 .当一个字节的ascii码超过了127，那就说明当前字节不是一个完整的字符。

`比如`

$str = "你是我的小苹果";中的$str{0}可以取到第一个字节，我们来看一下它是啥：

```php
$str = "你是我的小苹果";
echo $str{0};
//�
```

是个乱码，它只是"你"字的字节之一，也就是说，"你"这个字符是由超过一个字节组成的，我们这样试试：

```php
echo $str{0}.$str{1}.$str{2};
//你
```

可以看到，将三个字节连在一起输出，就成了一个完整的你。

至于这里为什么是三个字节，而不是两个或4个？这个取决于字符串的编码，我这里控制台默认是utf8编码的，在PHP中，一个utf8字符是用三个字节表达的，如果是gbk编码，则会是两个字节。至于编码和字节的关系，这个话题比较大，一篇说不完，请参考这篇文章：字符编码笔记：ascii,unicode和utf8 。

知道了这些，我们就可以自己编写一个字数检查的函数了，大致流程如下：

1. for循环遍历字节
2. 判断字节编码是否 >= 0x80,是的话跳过N个字节

我写了个简单的函数，可以判断gbk或utf8字符串的长度，仅供参考：

```php
function mbstrlen( $str, $encoding = "utf-8" ) {
  if ( function_exists( 'mb_strlen' ) ) {
    return mb_strlen( $str, $encoding );
  }
  $len = strlen( $str );
  if ( 0 == $len ) {
    return 0;
  }
  $encoding = strtolower( $encoding );
  if ( 'utf-8' == $encoding ) {
    $step = 3;
  } elseif ( 'gbk' == $encoding || 'gb2312' == $encoding ) {
    $step = 2;
  } else {
    return 0;
  }
  $count = 0;
  for( $i = 0; $i < $len; $i++ ) {
    $count++;
    //如果字节码大于127，则根据编码跳几个字节
    if ( ord( $str{$i} ) >= 0x80 ) {
      $i = $i + $step - 1; //之所以减去1，因为for循环本身还要$i++
    }
  }
  return $count;
}
```
