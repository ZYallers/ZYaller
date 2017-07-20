# PHP静态变量

静态变量：用修饰符static修饰的变量。

**特点：**

1.静态变量初始化后，不会再初始化该静态变量，也不能再向其赋初始化的值，否则编译报错。
2.静态变量不会随作用域结束后而销毁，并且保存最后的结果，供下次使用。常用于函数体内，处理递归问题。如：

```php
function staticTest(){
  static $stdigital = 0;
  $stdigital++;
  echo $stdigital;
}
staticTest(); //输出1；当一次执行完毕，函数的作用域消失，但static变量并没有消失
staticTest(); //输出2，static变量在上一次的基础上加1
```

3.静态变量只能接受值的形式赋值，不接受表达式赋值，否则编译报错。
如： $stdigital = 1+2; //错误

4.类中的静态成员变量，不专属某个实例，故不能用"$this->"和"对象->访问",只能用"类::"和"self::"访问。

```php
class StatciTest{
  public static $stdigital = 0;
  function __construct(){
    self::$stdigital += 1; 
  }
  
  public function printStdigital(){
    echo self::$stdigital;
  }
}
$testObj = new StaticTest();
$testObj->printStdigital(); //输出2
print StatciTest::$stdigital; //输出2
```

