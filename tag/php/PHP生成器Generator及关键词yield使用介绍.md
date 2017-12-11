# PHP生成器Generator及关键词yield使用介绍

## 优点

如果是做Python或者其他语言的小伙伴，对于生成器应该不陌生。但很多PHP开发者或许都不知道生成器这个功能，可能是因为生成器是PHP 5.5.0才引入的功能，也可以是生成器作用不是很明显。但是，生成器功能的确非常有用。

直接讲概念估计你听完还是一头雾水，所以我们先来说说优点，也许能勾起你的兴趣。那么生成器有哪些优点，如下：

- 生成器会对PHP应用的性能有非常大的影响
- PHP代码运行时节省大量的内存
- 比较适合计算大量的数据

## 概念引入

首先，放下生成器概念的包袱，来看一个简单的PHP函数：

```php
function createRange($number){
    $data = [];
    for($i=0;$i<$number;$i++){
        $data[] = time();
    }
    return $data;
}
```

这是一个非常常见的PHP函数，我们在处理一些数组的时候经常会使用。这里的代码也非常简单：

1. 我们创建一个函数。
2. 函数内包含一个for循环，我们循环的把当前时间放到$data里面
3. for循环执行完毕，把$data返回出去。

下面没完，我们继续。我们再写一个函数，把这个函数的返回值循环打印出来：

```php
$result = createRange(10); // 这里调用上面我们创建的函数
foreach($result as $value){
    sleep(1);//这里停顿1秒，我们后续有用
    echo $value.'<br />';
}
```

我们在浏览器里面看一下运行结果：

![](https://segmentfault.com/img/bVZThG?w=349&h=329)

这里非常完美，没有任何问题。（当然sleep(1)效果你们看不出来）

## 思考问题

我们注意到，在调用函数createRange的时候给$number的传值是10，一个很小的数字。假设，现在传递一个值10000000（1000万）。

那么，在函数createRange里面，for循环就需要执行1000万次。且有1000万个值被放到$data里面，而$data数组在是被放在内存内。所以，在调用函数时候会占用大量内存。
这里，生成器就可以大显身手了。

## 创建生成器

我们直接修改代码，你们注意观察：

```php
function createRange($number){
    for($i=0;$i<$number;$i++){
        yield time();
    }
}
```

看下这段和刚刚很像的代码，我们删除了数组$data，而且也没有返回任何内容，而是在`time()`之前使用了一个关键字`yield`

## 使用生成器

我们再运行一下第二段代码：
```php
$result = createRange(10); // 这里调用上面我们创建的函数
foreach($result as $value){
    sleep(1);
    echo $value.'<br />';
}
```

输出：

![](https://segmentfault.com/img/bVZTi2?w=330&h=329)

我们奇迹般的发现了，输出的值和第一次没有使用生成器的不一样。这里的值（时间戳）中间间隔了1秒。

这里的间隔一秒其实就是sleep(1)造成的后果。但是为什么第一次没有间隔？那是因为：

- 未使用生成器时：`createRange`函数内的for循环结果被很快放到$data中，并且立即返回。所以，foreach循环的是一个固定的数组。
- 使用生成器时：`createRange`的值不是一次性快速生成，而是依赖于foreach循环。foreach循环一次，for执行一次。
到这里，你应该对生成器有点儿头绪。

## 深入理解

### 代码剖析

下面我们来对于刚刚的代码进行剖析。
````php
function createRange($number){
    for($i=0;$i<$number;$i++){
        yield time();
    }
}

$result = createRange(10); // 这里调用上面我们创建的函数
foreach($result as $value){
    sleep(1);
    echo $value.'<br />';
}
````

我们来还原一下代码执行过程。

1. 首先调用createRange函数，传入参数10，但是for值执行了一次然后停止了，并且告诉foreach第一次循环可以用的值。
2. foreach开始对$result循环，进来首先sleep(1)，然后开始使用for给的一个值执行输出。
3. foreach准备第二次循环，开始第二次循环之前，它向for循环又请求了一次。
4. for循环于是又执行了一次，将生成的时间戳告诉foreach.
5. foreach拿到第二个值，并且输出。由于foreach中sleep(1)，所以，for循环延迟了1秒生成当前时间

所以，整个代码执行中，始终只有一个记录值参与循环，内存中也只有一条信息。

无论开始传入的$number有多大，由于并不会立即生成所有结果集，所以内存始终是一条循环的值。

## 概念理解

到这里，你应该已经大概理解什么是生成器了。下面我们来说下生成器原理。

首先明确一个概念：生成器yield关键字不是返回值，他的专业术语叫产出值，只是生成一个值

那么代码中foreach循环的是什么？其实是PHP在使用生成器的时候，会返回一个Generator类的对象。foreach可以对该对象进行迭代，每一次迭代，PHP会通过Generator实例计算出下一次需要迭代的值。这样foreach就知道下一次需要迭代的值了。

而且，在运行中for循环执行后，会立即停止。等待foreach下次循环时候再次和for索要下次的值的时候，for循环才会再执行一次，然后立即再次停止。直到不满足条件不执行结束。

## 生成器概述

PHP从5.5.0版本开始支持生成器（Generator），根据PHP官方文档的说法：生成器提供了一种更容易的方法来实现简单的对象迭代，相比较定义类实现 Iterator 接口的方式，性能开销和复杂性大大降低。

所以生成器首先是一个迭代器（Iterator），也就是说它可以使用`foreach`进行遍历。生成器就类似一个返回数组的函数，它可以接收参数，并被调用。

我们以range()函数为例，把它实现为生成器：

```php
function xrange($start, $end, $step = 1) {
    for ($i = $start; $i <= $end; $i += $step) {
        yield $i;
    }
}

echo 'results from range():';
foreach (range(1, 10, 3) as $v) {
    echo "$v ";
}

echo PHP_EOL . 'results from xrange():';
foreach (xrange(1, 10, 3) as $v) {
    echo "$v ";
}
```

结果看起来是一样的：

```
results from range():1 4 7 10 
results from xrange():1 4 7 10
```

可以看到，xrange()使用yield关键字，而不是return。使用yield关键字后，调用函数时就会返回一个生成器（Generator）的对象（Generator是一个内部类，不能直接实例化），这个对象实现了Iterator接口，所以正如前面说过，生成器是迭代器，我们可以通过以下代码验证下：

```php
var_dump(xrange() instanceof Iterator); // bool(true)
```

跟普通函数只返回一次值不同的是, 生成器可以根据需要yield多次，以便生成需要迭代的值。 普通函数return后，函数会被从栈中移除，中止执行，但是yield会保存生成器的状态，当被再次调用时，迭代器会从上次yield的地方恢复调用状态继续执行。

```php
function xrange($start, $end, $step = 1) {
    echo "The generator has started" . PHP_EOL; 
    for ($i = $start; $i <= $end; $i += $step) {
        yield $i;
        echo "Yielded $i" . PHP_EOL;
    }
    echo "The generator has ended" . PHP_EOL; 
}

foreach (xrange(1, 10, 3) as $v) {
    echo "return $v" . PHP_EOL;
}
```

看下下面代码的执行结果：

```
The generator has started
return 1
Yielded 1
return 4
Yielded 4
return 7
Yielded 7
return 10
Yielded 10
The generator has ended
```

可以看到，每次迭代，在yield后，代码不会继续执行，而是先执行调用者的代码，然后在下一次迭代，迭代器的代码继续执行，一直到没有yield可以执行为止。

## 生成器语法

### return值

前面说过，函数里使用yield关键字后，在被调用时会返回一个生成器对象，所以生成器函数的核心是yield关键字。它的调用形式看起来像一个return申明，不同之处在于普通return会返回值并终止函数的执行，而yield会返回一个值给循环调用此生成器的代码并且只是暂停执行生成器函数。

一个生成器函数不可以通过return返回值（很显而易见，因为生成器函数被调用后返回的是一个生成器对象）， 在PHP 5.6版本及之前，如果使用return返回一个值的话，会产生一个编译错误：

> PHP Fatal error: Generators cannot return values using "return" in /path/to/php_code.php on line x

在PHP 7中，可以使用`getReturn()`得到return的返回值：

```php
function gen_return() {
    for ($i = 0; $i < 3; $i++) {
        yield $i;
    }
    
    return 1; 
}

$gen = gen_return();
foreach($gen as $v);
echo $gen->getReturn(); // 1
```

不过有个前提，就是生成器已经完成了迭代，否则会报以下错误：

> PHP Fatal error: Uncaught Exception: Cannot get return value of a generator that hasn't returned in /path/to/php_code.php:x

另外，return空无论是在PHP 7还是之前支持生成器的PHP版本都是一个有效的语法，它会终止生成器继续执行。

### 生成null值

如果yield后面没有跟任何的参数，则会返回NULL值：

```php
function gen_nulls() {
    for ($i = 0; $i < 3; $i++) {
        yield;
    }
}
var_dump(iterator_to_array(gen_nulls()));
```

输出：
```
array(3) {
  [0]=>
  NULL
  [1]=>
  NULL
  [2]=>
  NULL
}
```

### 生成键值对

PHP的数组支持关联键值对数组，生成器其实也支持生成键值对：

```php
function gen_key_values() {
    for ($i = 0; $i < 3; $i++) {
        yield 'key' . $i => $i;
    }
}
var_dump(iterator_to_array(gen_key_values()));
```

输出：

```
array(3) {
  ["key0"]=>
  int(0)
  ["key1"]=>
  int(1)
  ["key2"]=>
  int(2)
}
```

### 注入值

除了生成值，生成器还能从外面接收值。通过生成器对象的send()方法，我们可以从外面传递值到生成器里。这个值会作为yield表达式的结果，我们可以利用这个值来做一些计算或者其他事情，例如根据值来中止生成器的执行：

```php
function nums() {
    for ($i = 0; $i < 5; ++$i) {
        // 从caller获取值
        $cmd = (yield $i);
        if ($cmd === 'stop') {
            return; // 退出生成器
        }
    }
}

$gen = nums();

foreach ($gen as $v) {
    if ($v === 3) {
        $gen->send('stop');
    }
    echo $v . PHP_EOL;
}
```

输出结果：

```
0
1
2
3
```

> `send()`方法的返回值是下一个yield的值，如果没有，则返回NULL。

需要注意的是， 如果在一个表达式上下文(例如上面的情况，在一个赋值表达式的右侧)中使用yield，必须使用圆括号把yield申明包围起来。 例如：

```php
$data = (yield $value);
```

下面的代码在PHP5中会产生一个编译错误：

```php
$data = yield $value
```

### yield from表达式

在PHP 7里，使用yield from表达式允许你在生成器里通过其他生成器、Traversable对象或者数组产生值。这种方式叫做生成器委托。下面的例子来自官方文档：

```php
function count_to_ten() {
    yield 1;
    yield 2;
    yield from [3, 4];
    yield from new ArrayIterator([5, 6]);
    yield from seven_eight();
    yield 9;
    yield 10;
}

function seven_eight() {
    yield 7;
    yield from eight();
}

function eight() {
    yield 8;
}

foreach (count_to_ten() as $num) {
    echo "$num ";
}
```

输出：

```
1 2 3 4 5 6 7 8 9 10
```

## 为什么不使用Iterator

生成器也是迭代器，那为什么不直接使用迭代器呢？其实文章刚开始就说到了：生成器提供了一种更容易的方法来实现简单的对象迭代，相比较定义类实现 Iterator 接口的方式，性能开销和复杂性大大降低。

### 更低的复杂度

要使用迭代器，必须要实现Iterator接口里的所有方法，这无疑大大增加了使用成本，具体可以看看官方文档里的例子：[Comparing generators with Iterator objects](http://php.net/manual/zh/language.generators.comparison.php)。

### 更低的内存占用

除了复杂度，另外一个使用生成器的原因就是使用生成器可以大大减少内存的使用。以文章最开始的例子为例，标准的`range()`函数需要在内存中生成一个数组包含每一个在它范围内的值，然后返回该数组，这样就会产生多个很大的数组。 比如，调用 range(0, 1000000) 将导致内存占用超过 100 MB。而我们实现的`xrange()`生成器， 只需要足够的内存来创建 生成器对象并在内部跟踪生成器的当前状态，这样只需要不到1K字节的内存。

```php
function xrange($start, $end, $step = 1) {
    for ($i = $start; $i <= $end; $i += $step) {
        yield $i;
    }
}

echo 'Test for range():' . PHP_EOL;
$startTime = microtime(true);
$m = memory_get_peak_usage();
foreach (range(1, 1000000) as $v);
$endTime = microtime(true);
echo 'time:' . bcsub($endTime, $startTime, 4) . PHP_EOL;
echo 'memory (byte):' . (memory_get_peak_usage() - $m);
echo PHP_EOL;

echo 'Test for xrange():' . PHP_EOL;
$startTime = microtime(true);
$m = memory_get_peak_usage(true);
foreach (xrange(1, 1000000) as $v);
$endTime = microtime(true);
echo 'time:' . bcsub($endTime, $startTime, 4) . PHP_EOL;
echo 'memory (byte):' . (memory_get_peak_usage(true) - $m);
```

测试结果：

```
Test for range():
time:0.2319
memory (byte):144376424
Test for xrange():
time:0.1382
memory (byte):0
```

可以看到，在内存占用上，`xrange()`远远低于`range()`，甚至在速度上也占优。在诸如读取文件之类的
场景，使用生成器也可以大大减少内存的占用：

```php
function file_lines($filename) {
    $file = fopen($filename, 'r'); 
    while (($line = fgets($file)) !== false) {
        yield $line; 
    } 
    fclose($file); 
}

foreach (file_lines('somefile') as $line) {
    // do something
}
```

再举个例子：使用生成器处理CSV文件：

```php
date_default_timezone_set('PRC'); //设置中国时区
error_reporting(-1);
ini_set('display_errors', 1);

function getCsvRows($file)
{
    $handle = fopen($file, 'rb');
    if ($handle === false) {
        throw new Exception('fopen file failed');
    }
    while (feof($handle) === false) {
        yield fgetcsv($handle);
    }
    fclose($handle);
}

$file = realpath(dirname(__FILE__) . '/file/test_yield.csv');
foreach (getCsvRows($file) as $row) {
    print_r($row);
}
exit;
```

这个例子中，生成器只会为CSV文件分配一行内存，而不是读入整个文件到内存。

## 实际开发应用

很多PHP开发者不了解生成器，其实主要是不了解应用领域。那么，生成器在实际开发中有哪些应用？

### 读取超大文件

PHP开发很多时候都要读取大文件，比如csv文件、text文件，或者一些日志文件。这些文件如果很大，比如5个G。这时，直接一次性把所有的内容读取到内存中计算不太现实。

这里生成器就可以派上用场啦。简单看个例子：读取text文件

![](https://segmentfault.com/img/bVZT02?w=339&h=256)

我们创建一个text文本文档，并在其中输入几行文字，示范读取。

```php
header("content-type:text/html;charset=utf-8");
function readTxt()
{
    # code...
    $handle = fopen("./test.txt", 'rb');

    while (feof($handle)===false) {
        # code...
        yield fgets($handle);
    }

    fclose($handle);
}

foreach (readTxt() as $key => $value) {
    # code...
    echo $value.'<br />';
}
```

![](https://segmentfault.com/img/bVZT1d?w=343&h=343)

通过上图的输出结果我们可以看出代码完全正常。

但是，背后的代码执行规则却一点儿也不一样。使用生成器读取文件，第一次读取了第一行，第二次读取了第二行，以此类推，**每次被加载到内存中的文字只有一行**，大大的减小了内存的使用。

这样，即使读取上G的文本也不用担心，完全可以像读取很小文件一样编写代码。

## 使用生成器实现协程

PHP的生成器特性使得在PHP中实现协程成为了可能，下面是一篇使用协程实现多任务调度的文章，虽然是12年的文章，但是仍然很有参考意义：[Cooperative-multitasking-using-coroutines-in-PHP](http://nikic.github.io/2012/12/22/Cooperative-multitasking-using-coroutines-in-PHP.html)

## 参考资料
- http://php.net/manual/zh/language.generators.php
- https://www.sitepoint.com/generators-in-php/
- http://nikic.github.io/2012/12/22/Cooperative-multitasking-using-coroutines-in-PHP.html
- https://segmentfault.com/a/1190000012334856