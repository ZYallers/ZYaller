# PHP 中的浮点数

对浮点数进行比较运算是一个坑爹的事，由于栽在这个问题上的次数比较多，总是记吃不记打的，痛定思痛后打算整理一下，避免下次再犯。

## 浮点数计算错误实例

```php
<?php

$float = 0.58;

var_dump($float * 100);
var_dump(intval($float * 100));

// 结果:
/*
double(58)
int(57)
*/
```
## 浮点数比较错误实例

```php
<?php

$a = 0.1;
$b = 0.2;

var_dump($a);
var_dump($b);
var_dump($a + $b);
var_dump($a + $b === 0.3);


// 结果:
/*
double(0.1)
double(0.2)
double(0.3)
bool(false)
*/
```

## 浮点数的精度

浮点数的精度有限。尽管取决于系统，PHP 通常使用 IEEE 754 双精度格式，则由于取整而导致的最大相对误差为 1.11e-16。非基本数学运算可能会给出更大误差，并且要考虑到进行复合运算时的误差传递。

此外，以十进制能够精确表示的有理数如 0.1 或 0.7，无论有多少尾数都不能被内部所使用的二进制精确表示，因此不能在不丢失一点点精度的情况下转换为二进制的格式。这就会造成混乱的结果，例如：floor((0.1+0.7)*10 通常会返回 7 而不是预期中的 8，因为该结果内部的表示其实是类似 7.9999999999999991118...。

所以，永远不要相信浮点数结果精确到了最后一位，也永远不要比较两个浮点数是否相等。如果确实需要更高的精度，应该使用 任意精度数学函数 或者 gmp 函数。

## 精度数学函数

名称 | 说明
---|---
bcadd() | 任意精度数字的加法计算
bccomp() | 比较两个任意精度的数字
bcdiv() | 两个任意精度的数字除法计算
bcmod() | 对一个任意精度数字取模
bcmul() | 两个任意精度数字乘法计算
bcpow() | 任意精度数字的乘方
bcpowmod() | 任意精度数字乘方求模
bcscale() | 设置所有 bc 数学函数的默认小数点保留位数
bcsqrt() | 任意精度数字的二次方根
bcsub() | 两个任意精度数字的减法

使用 bcscale() 设置的位数，超出部分是丢弃掉，而不是四舍五入。

```php
<?php

declare(strict_types=1);

$a = '0.19';
$b = '0.81';

$array = [
    'bcadd'    => bcadd($a, $b, 2),
    'bccomp'   => bccomp(bcadd($a, $b), '1', 1), // 两个数相等返回 0
    'bcdiv'    => bcdiv('100', '3', 4),
    'bcmod'    => bcmod(PHP_VERSION, '2'),
    'bcmul'    => bcmul($a, $b, 4),
    'bcpow'    => bcpow('2.2', '3', 3),
    'bcpowmod' => bcpowmod('2', '2', '3'),
    'bcscale'  => bcscale(6), // 设置新的小数点保留位数
    'bcsqrt'   => bcsqrt('4'),
    'bcsub'    => bcsub($b, $a),
];

print_r($array);

// 结果:
/*
Array
(
    [bcadd] => 1.00
    [bccomp] => 0
    [bcdiv] => 33.3333
    [bcmod] => 0
    [bcmul] => 0.1539
    [bcpow] => 10.648
    [bcpowmod] => 1
    [bcscale] => 1
    [bcsqrt] => 2.000000
    [bcsub] => 0.620000
)
*/
```

正确的姿势。

```php
<?php

declare(strict_types=1);

$a = '0.185';
$b = '0.804';

$c = 0.185;
$d = 0.804;

$e = 101.1988654321;
$f = 101.1988456789;

$g = 1.23456789;
$h = 1.23456780;

$epsilon = 0.00001; // 机器极小值（epsilon）或最小单元取整数，是计算中所能接受的最小的差别值

var_dump(bcadd($a, $b, 2) === '0.98');
var_dump(round($c + $d, 2) === 0.99);
var_dump(bccomp((string)$e, (string)$f, 3) === 0);
var_dump(abs($g - $h) < $epsilon); // 误差小于这个值可以接受

// 结果:
/*
bool(true)
bool(true)
bool(true)
bool(true)
*/
```
