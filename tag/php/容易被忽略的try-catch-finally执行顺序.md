# 容易被忽略的try-catch-finally执行顺序
> https://segmentfault.com/a/1190000015196493

try-catch是捕捉异常的神器，不管是调试还是防止软件崩溃，都离不开它。介绍一下加上finally后的执行顺序

### 加入finally的执行顺序
```php
function test() {
  try {
    echo 1,' ';
  } finally {
    echo 2,' ';
  }
}

test(); //输出：1 2
```

嗯！按顺序执行了。

### try中加入return语句
```php
function test() {
  try {
    echo 1,' ';
    return 'from_try ';
  } catch (e) {
    // TODO
  } finally {
    echo 2,' ';
  }
}

echo test(); //输出： 1 2 from_try
```

等等，难道不应该是 1 > from_try > 2的顺序吗？

抱歉啊，是这样的，在`try`和`catch`的代码块中，如果碰到`return`语句，那么在`return`之前，会先执行`finally`中的内容，所以`2`会比`from_try`优先输出。

### finally中也加入return语句
```php
function test() {
  try {
    echo 1,' ';
    return 'from_try ';
  } catch (e) {
    // TODO
  } finally {
    echo 2,' ';
    return 'from_finally ';
  }
}

echo test(); // 1 2 from_finally
```
噢？我的from_try怎么不见了？

抱歉，按照上一条的规则，`finally`是会优先执行的，所以如果`finally`里有`return`语句，那么就真的`return`了。

### try语句块中故意报错
```php
function test() {
  try {
    echo 1,' ';
    throw new Error('throw ');
  } catch (Exception $e) {
    echo $e->message
    return 'from_catch ';
  } finally {
    echo 2,' ';
  }
}

echo test(); // 1 throw 2 from_catch
```

看来，`try`和`catch`的`return`都需要先经过`finally`。