# PHP红包算法

> <https://segmentfault.com/a/1190000010210451>

产品经理 ： 老司机，你那边开发个领取红包的版块。我给一定的金额总数，红包个数，最高发放金额，以及最低发放金额，你要随机生成固定个数的红包，红包总额不能超过金额总数。
老司机 ： 你（笔者），去实现这个算法，把生成的红包全部丢到数据库里面。

好吧，就这样，这个需求就让我实现了。其实业务看起来说的很复杂，其实就是例如我有1000元，我想发放100个红包，最高不能超过20块，最低不能低于1块。
当时我也不太清楚这个算法要怎么写，上网搜索了下，找到一种比较合理的算法，是用微积分去实现（我会把代码贴出来）的。算法原理如下

![IMG](https://segmentfault.com/img/bVQ0kF?w=794&h=467)

（原文地址：<http://blog.csdn.net/clevercode/article/details/53239681>）

我刚开始觉得这个算法确实很不错，但仔细看了下里面的源码后觉得会比较耗性能，而且回头一看公司的需求，其实也就个红包生成(在项目经理没要求需要正态分布的情况下)，没必要把复杂简单的东西弄复杂了。所以我思来想去想了一个晚上，终于写出了个比较合理的算法。

```php
/**
 * 获取随机红包
 * min<k<max
 * min(n-1) <= money - k <= (n-1)max
 * k <= money-(n-1)min
 * k >= money-(n-1)max
 * @param $money 总金额
 * @param $num 红包数量
 * @param $min 最小红包金额
 * @param $max 最大红包金额
 * @return array
 */
function getRedPackage($money, $num, $min, $max)
{
    $data = array();
    if ($min * $num > $money) {
        return array();
    }
    if ($max * $num < $money) {
        return array();
    }
    while ($num >= 1) {
        $num--;
        $kmix = max($min, $money - $num * $max);
        $kmax = min($max, $money - $num * $min);
        $kAvg = $money / ($num + 1);
        //获取最大值和最小值的距离之间的最小值
        $kDis = min($kAvg - $kmix, $kmax - $kAvg);
        //获取0到1之间的随机数与距离最小值相乘得出浮动区间，这使得浮动区间不会超出范围
        $r = ((float)(rand(1, 10000) / 10000) - 0.5) * $kDis * 2;
        $k = round($kAvg + $r, 2);
        $money -= $k;
        $data[] = $k;
    }
    return $data;
}
```
测试：
```php
$a = getRedPackage(10, 20, 0.01, 3);
var_dump($a);
var_dump(array_sum($a));
exit;

// 输出
array (size=20)
  0 => float 0.04
  1 => float 0.89
  2 => float 0.7
  3 => float 0.91
  4 => float 0.16
  5 => float 0.88
  6 => float 0.75
  7 => float 0.83
  8 => float 0.24
  9 => float 0.06
  10 => float 0.11
  11 => float 0.79
  12 => float 0.55
  13 => float 0.12
  14 => float 0.52
  15 => float 0.07
  16 => float 1
  17 => float 0.43
  18 => float 0.5
  19 => float 0.45
float 10
```

这个算法的原理其实就是根据剩余不断变化的平均值去加减随机数做到不超过总额，但红包的分布就没那么平均。
