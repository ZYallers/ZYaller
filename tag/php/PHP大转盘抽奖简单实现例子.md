# PHP大转盘抽奖简单实现例子

最近准备搞一个简单的抽奖活动，网上找了也挺多相关的例子，结合了下业务自己写了个。代码贴在下午，欢迎吐槽！

![image](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/201705/09/1494326700789840.jpg)

```php
//奖品
$product = array(
    '1' => array('precent'=>0, 'stock'=>0, 'name'=>'罗浮山门票'),
    '2' => array('precent'=>5, 'stock'=>5, 'name'=>'罗浮山嘉宝田温泉体验券'),
    '3' => array('precent'=>10, 'stock'=>5, 'name'=>'精美旅游书籍《山水酿惠州》'),
    '4' => array('precent'=>15, 'stock'=>10, 'name'=>'碧海湾漂流门票'),
    '5' => array('precent'=>20, 'stock'=>10, 'name'=>'南昆山门票'),
    '6' => array('precent'=>50, 'stock'=>20, 'name'=>'云顶温泉精美礼品'),
);
//方法
function getRand($product) {
    $result = false;
    $precentSum = 0;
    foreach ($product as $key => $pro){
        $precentSum += $pro['precent'];
    }
    foreach ($product as $key => $pro) {
        if ($pro['stock'] > 0) {
            $precent = $pro['precent'];
            $randNum = mt_rand(1, $precentSum);
            if ($randNum <=$precent ) {
                $result = $product[$key];
                break;
            } else {
                $precentSum -= $precent;
            }
        }
    }
    return $result;
}
//测试100次，方便跟进真实概率
for($i=0;$i<100;$i++){
  var_dump(getRand($product));
}
```

参考资料：https://www.oschina.net/code/snippet_1763731_36193