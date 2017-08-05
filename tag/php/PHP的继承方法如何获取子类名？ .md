# PHP的继承方法如何获取子类名？ 

> <http://blog.csdn.net/zls986992484/article/details/53154097>

例如：

```php
class A  
{  
    function __construct()  
    {  
        echo __CLASS__;  
    }  
  
    static function name()  
    {  
        echo __CLASS__;  
    }  
}  
  
class B extends A  
{  
}  
  
$objB = new B(); // 输出 A  
B::name();       // 输出 A 
```

此时，无论将B实例化还是直接调用静态方法，echo出来的都会是A。

而实际上我想要得到的是子类B的名称！那如何实现呢？

php自带两个函数 get_class() 和 get_called_class() 可以解决这个问题。

get_class() 用于实例调用，加入参数($this)可解决子类继承调用的问题，而 get_called_class() 则是用于静态方法调用。

```php
class A  
{  
    function __construct()  
    {  
        echo get_class($this);  
    }  
  
    static function name()  
    {  
        echo get_called_class();  
    }  
}  
  
class B extends A  
{  
}  
  
$objB = new B(); // 输出 B  
B::name();       // 输出 B 
```
