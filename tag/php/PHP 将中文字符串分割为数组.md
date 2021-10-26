[//]:# (2021/10/26 15:33|PHP|https://img0.baidu.com/it/u=2838744201,3347715175&fm=26&fmt=auto)
# PHP将中文字符串分割为数组
> [CSDN](https://blog.csdn.net/bai9474500755/article/details/51059520)

作为中国程序员；不可避免的要和中文打交道。这里介绍两个方法。

```php
<?php
function mb_str_split($str){  
    return preg_split('/(?<!^)(?!$)/u', $str );  
}

function utf8_str_split($str, $split_len = 1)
{
    if (!preg_match('/^[0-9]+$/', $split_len) || $split_len < 1)
        return FALSE;
 
    $len = mb_strlen($str, 'UTF-8');
    if ($len <= $split_len)
        return array($str);
 
    preg_match_all('/.{'.$split_len.'}|[^\x00]{1,'.$split_len.'}$/us', $str, $ar);
 
    return $ar[0];
}

$txt = '无新增死亡病例。新增疑似病例1例。';

$arr1 = mb_str_split($txt);
$arr2 = utf8_str_split($txt,10);

var_dump($arr1,$arr2);
```
运行结果：
```
Array
(
    [0] => 无
    [1] => 新
    [2] => 增
    [3] => 死
    [4] => 亡
    [5] => 病
    [6] => 例
    [7] => 。
    [8] => 新
    [9] => 增
    [10] => 疑
    [11] => 似
    [12] => 病
    [13] => 例
    [14] => 1
    [15] => 例
    [16] => 。
)
Array
(
    [0] => 无新增死亡病例。新增
    [1] => 疑似病例1例。
)
```
