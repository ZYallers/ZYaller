# 什么是opcode？如何使用好opcache呢？
> https://www.zybuluo.com/phper/note/1016714

## 啥是Opcode？
我们在日常的PHP开发过程中，应该经常会听见Opcache这个词，那么啥是Opcode呢？

Opcache 的前生是 `Optimizer+` ，它是PHP的官方公司 Zend 开发的一款闭源但可以免费使用的 PHP 优化加速组件。 Optimizer+ 将PHP代码预编译生成的脚本文件 Opcode 缓存在共享内存中供以后反复使用，从而避免了从磁盘读取代码再次编译的时间消耗。同时，它还应用了一些代码优化模式，使得代码执行更快。从而加速PHP的执行。

Optimizer+ 于 2013年3月中旬改名为 Opcache。并且在 PHP License 下开源: 
https://github.com/zendtech/ZendOptimizerPlus

## Opcache的生命周期
了解了啥是Opcache以及Opcache的作用。现在看一下Opcache的运行图。

正常的php代码的执行过程如下：
![IMG](https://ws4.sinaimg.cn/large/006tKfTcgy1fnqjaiczadj30ru03qmxp.jpg)
> request请求（nginx,apache,cli等）-->Zend引擎读取.php文件-->扫描其词典和表达式 -->解析文件-->创建要执行的计算机代码(称为Opcode)-->最后执行Opcode--> response 返回

每一次请求PHP脚本都会执行一遍以上步骤，如果PHP源代码没有变化，那么Opcode也不会变化，显然没有必要每次都重行生成Opcode，结合在Web中无所不在的缓存机制，我们可以把Opcode缓存下来，以后直接访问缓存的Opcode岂不是更快，启用Opcode缓存之后的流程图如下所示：
![IMG](https://ws3.sinaimg.cn/large/006tKfTcgy1fnqm3alma3j30na08ijs3.jpg)
> request请求（nginx,apache,cli等）-->Zend引擎读取.php文件-->读取Opcode-->执行Opcode--> response 返回

## Opcache的安装
实际上，在 `php5.5` 以后，Opcache 是默认安装好了的，已经不需要我们再手动去安装了，但是默认是没有开启的，如果我们需要使用，需要手动去开启:
```bash
zend_extension=opcache.so
[opcache]
opcache.enable=1  #允许在web环境使用，默认是开启的。
opcache.enable_cli=1 #运行在cli环境使用
```
然后重启服务，执行 `php -i|grep opcache` 就可以查看是否开启了。

## 推荐的 php.ini 中 Opcache的配置
以下是官网推荐的php.ini中的配置。可以在生产环境获得更高的性能：
```bash
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=60
opcache.fast_shutdown=1 ;(在PHP 7.2.0中被移除，会自动开启)
opcache.enable_cli=1
```

## opcache的配置说明
上面是官方推荐的一些配置，其实它还有一大长条的配置，我们选择几个重要的，会被使用到的，来说下他们的具体含义：
```bash
opcache.enable=1 (default "1")
;OPcache打开/关闭开关。当设置为Off或者0时，会关闭Opcache, 代码没有被优化和缓存。

opcache.enable_cli=1 (default "0")
;CLI环境下，PHP启用OPcache。这主要是为了测试和调试。从 PHP 7.1.2 开始，默认启用。

opcache.memory_consumption=128 (default "64")
;OPcache共享内存存储大小。用于存储预编译的opcode（以MB为单位）。

opcache.interned_strings_buffer=8 (default "4")
;这是一个很有用的选项，但是似乎完全没有文档说明。PHP使用了一种叫做字符串驻留（string interning）的技术来改善性能。例如，如果你在代码中使用了1000次字符串“foobar”，在PHP内部只会在第一使用这个字符串的时候分配一个不可变的内存区域来存储这个字符串，其他的999次使用都会直接指向这个内存区域。这个选项则会把这个特性提升一个层次——默认情况下这个不可变的内存区域只会存在于单个php-fpm的进程中，如果设置了这个选项，那么它将会在所有的php-fpm进程中共享。在比较大的应用中，这可以非常有效地节约内存，提高应用的性能。
这个选项的值是以兆字节（megabytes）作为单位，如果把它设置为16，则表示16MB，默认是4MB，这是一个比较低的值。

opcache.max_accelerated_files (default "2000")
;这个选项用于控制内存中最多可以缓存多少个PHP文件。这个选项必须得设置得足够大，大于你的项目中的所有PHP文件的总和。
设置值取值范围最小值是 200，最大值在 PHP 5.5.6 之前是 100000，PHP 5.5.6 及之后是 1000000。也就是说在200到1000000之间。
你可以运行“find . -type f -print | grep php | wc -l”这个命令来快速计算你的代码库中的PHP文件数。

opcache.max_wasted_percentage (default "5")
;计划重新启动之前，“浪费”内存的最大百分比。

opcache.use_cwd (default "1")
;如果启用，OPcache将在哈希表的脚本键之后附加改脚本的工作目录， 以避免同名脚本冲突的问题。禁用此选项可以提高性能，但是可能会导致应用崩溃

opcache.validate_timestamps (default "1")
;如果启用（设置为1），OPcache会在opcache.revalidate_freq设置的秒数去检测文件的时间戳（timestamp）检查脚本是否更新。
如果这个选项被禁用（设置为0），opcache.revalidate_freq会被忽略，PHP文件永远不会被检查。这意味着如果你修改了你的代码，然后你把它更新到服务器上，再在浏览器上请求更新的代码对应的功能，你会看不到更新的效果，你必须使用 `opcache_reset()` 或者 `opcache_invalidate()` 函数来手动重置 OPcache。或者重重你的web服务器或者php-fpm 来使文件系统更改生效。
我强烈建议你在生产环境中设置为0，why？因为当你在更新服务器代码的时候，如果代码较多，更新操作是有些延迟的，在这个延迟的过程中必然出现老代码和新代码混合的情况，这个时候对用户请求的处理必然存在不确定性。最后，等所有的代码更新完毕后，再平滑重启PHP和web服务器。

opcache.revalidate_freq (default "2")
;这个选项用于设置缓存的过期时间（单位是秒），当这个时间达到后，opcache会检查你的代码是否改变，如果改变了PHP会重新编译它，生成新的opcode，并且更新缓存。值为“0”表示每次请求都会检查你的PHP代码是否更新（这意味着会增加很多次stat系统调用，译注：stat系统调用是读取文件的状态，这里主要是获取最近修改时间，这个系统调用会发生磁盘I/O，所以必然会消耗一些CPU时间，当然系统调用本身也会消耗一些CPU时间）。可以在开发环境中把它设置为0，生产环境下不用管。
如果 `opcache.validate_timestamps` 配置指令设置为禁用（设置为0），那么此设置项将会被忽略。

opcache.revalidate_path (default "0")
;在include_path优化中启用或禁用文件搜索
如果被禁用，并且找到了使用的缓存文件相同的include_path，该文件不被再次搜索。因此，如果一个文件与include_path中的其他地方相同的名称出现将不会被发现。如果此优化对此有效，请启用此指令你的应用程序，这个指令的默认值是禁用的，这意味着该优化是活跃的。

opcache.fast_shutdown（默认“0”）
;如果启用，则会使用快速停止续发事件。 所谓快速停止续发事件是指依赖 Zend 引擎的内存管理模块 一次释放全部请求变量的内存，而不是依次释放每一个已分配的内存块。
该指令已在PHP 7.2.0中被删除。快速关机序列的一个变种已经被集成到PHP中，并且如果可能的话将被自动使用。
```

## 验证opcache是否生效
当我们开启Opcache后，然后也配置好了相关的配置，那么如何验证是否已经成功了呢？

写了简单的小例子，先把检查时间设置为10秒，也就是说10秒内，不会去检查文件是否有更新，直接用缓存中的opcode：
```bash
zend_extension=opcache.so
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=4000
opcache.revalidate_freq=10
opcache.fast_shutdown=1
opcache.enable_cli=1
```
然后一个简单的例子：
```php
//php71.php
<?php
$a = '12';
echo $a;
```
启动一个php自带的web服务：
```bash
php -S 127.0.0.1:8088
```
然后再浏览器里打开：
```bash
http://127.0.0.1:8088/php71.php
```
结果是：12。

然后，手动改下：
```php
//php71.php
<?php
$a = '34';
echo $a;
```

如果你手速快，迅速的去刷新浏览器，10次内，你会发现，结果还是12。不是 34。说明，Opcache 已经生效了。再来改一下，把opcache.validate_timestamps=0设置为0，则表示，永远不去检查文件是否更新。然后，你刷新页面，数字永远是12。除非你ctrl+c 关闭web服务，再启动web服务，才会生效变成 34。

`所以，在一般的公司代码上线发布后，都会平滑重启php或者web服务器`

## opcache相关的几个函数
虽然opcahce是php内置的行为，只要你开启了，就会生效，不需要像传统的redis或者memcache需要手动写代码才能使用。但是php也提供了若干个opcache相关的函数。
- opcache_compile_file — 无需运行，即可编译并缓存 PHP 脚本
- opcache_get_configuration — 获取php.ini中的配置信息
- opcache_get_status — 获取缓存的状态信息
- opcache_invalidate — 废除脚本缓存
- opcache_is_script_cached — 一个php文件是否被缓存
- opcache_reset — 重置情况所有的缓存内容

我们来一一看下。

### opcache_compile_file
使用此函数，可以无需运行php脚本，即可编译并缓存 PHP 脚本。该函数可用于在 Web 服务器重启之后初始化缓存，俗称缓存预热。

`注意：文件必须填写完整全路径`

我们还是举例子说明：

php71.php

```php
$a = '5678';
echo $a;
//是否被缓存
var_dump(opcache_invalidate('/Users/tencent/php/php71.php'));
//查看缓存状态
var_dump(opcache_get_status());
```

每次重启web服务器，第一次刷新浏览器这个页面，查看打印:

```bash
5678
bool(false) 
 .....
 ["hits"]=> int(0)
 .....
```

可以，看出，第一次进来，是没有被缓存的，第二次刷新，就被缓存住了。

```bash
5678
bool(true) 
 .....
 ["hits"]=> int(1)
 .....
```

### opcache_get_configuration
查看php.ini中的配置项，和php.ini里的设置一样，并列出所有的配置，以数组array的形式呈现，用 json_encode 打印出来：

```json
{
    "directives": {
        "opcache.enable": true,
        "opcache.enable_cli": true,
        "opcache.use_cwd": true,
        "opcache.validate_timestamps": true,
        "opcache.validate_permission": false,
        "opcache.validate_root": false,
        "opcache.inherited_hack": true,
        "opcache.dups_fix": false,
        "opcache.revalidate_path": false,
        "opcache.log_verbosity_level": 1,
        "opcache.memory_consumption": 134217728,
        "opcache.interned_strings_buffer": 8,
        "opcache.max_accelerated_files": 4000,
        "opcache.max_wasted_percentage": 0.05,
        "opcache.consistency_checks": 0,
        "opcache.force_restart_timeout": 180,
        "opcache.revalidate_freq": 10,
        "opcache.preferred_memory_model": "",
        "opcache.blacklist_filename": "",
        "opcache.max_file_size": 0,
        "opcache.error_log": "",
        "opcache.protect_memory": false,
        "opcache.save_comments": true,
        "opcache.enable_file_override": false,
        "opcache.optimization_level": 2147467263,
        "opcache.lockfile_path": "/tmp",
        "opcache.file_cache": "",
        "opcache.file_cache_only": false,
        "opcache.file_cache_consistency_checks": true
    },
    "version": {
        "version": "7.2.0",
        "opcache_product_name": "Zend OPcache"
    },
    "blacklist": []
}
```

### opcache_get_status
获取opcache的缓存状态以及缓存了哪些文件等信息，可以说是用的做多的一个脚本了。

打印出来：

```json
{
    "opcache_enabled": true,
    "cache_full": false,
    "restart_pending": false,
    "restart_in_progress": false,
    "memory_usage": {
        "used_memory": 18278720,
        "free_memory": 115919680,
        "wasted_memory": 19328,
        "current_wasted_percentage": 0.014400482177734375
    },
    "interned_strings_usage": {
        "buffer_size": 8388608,
        "used_memory": 428056,
        "free_memory": 7960552,
        "number_of_strings": 9963
    },
    "opcache_statistics": {
        "num_cached_scripts": 1,
        "num_cached_keys": 1,
        "max_cached_keys": 7963,
        "hits": 2,
        "start_time": 1516850948,
        "last_restart_time": 0,
        "oom_restarts": 0,
        "hash_restarts": 0,
        "manual_restarts": 0,
        "misses": 4,
        "blacklist_misses": 0,
        "blacklist_miss_ratio": 0,
        "opcache_hit_rate": 33.33333333333333
    },
    "scripts": {
        "/Users/tencent/php/php71.php": {
            "full_path": "/Users/tencent/php/php71.php",
            "hits": 0,
            "memory_consumption": 6432,
            "last_used": "Thu Jan 25 11:32:03 2018",
            "last_used_timestamp": 1516851123,
            "timestamp": 1516851119
        }
    }
}
```

### opcache_invalidate
废除（删除）一个文件的缓存。可以针对一个文件的清楚缓存。`注意：文件必须填写完整全路径`

```php
//清楚 php71.php缓存
var_dump(opcache_invalidate('/Users/tencent/php/php71.php')); // bool(true)
```

### opcache_is_script_cached
查看一个文件是否被缓存。注意：文件必须填写完整全路径
```php
var_dump(opcache_is_script_cached('/Users/tencent/ams-swoole-framework/php71.php'));
//bool(true)
var_dump(opcache_is_script_cached('/Users/tencent/ams-swoole-framework/php73.php'));
// bool(false)
```

### opcache_reset
重置所有的opcache缓存。注意：这个函数很危险，他会清空当前项目的所有opcache缓存：
```php
var_dump(opcache_reset());  //bool(true)
```

## opcache图形化管理工具

上面的函数命令用起来可能没那么方便，基于上面的这些函数，有2个GUI的图形化管理工具，还不错。

1. 拥有漂亮的图形化界面的项目
>  https://github.com/PeeHaa/OpCacheGUI

下载后，将config.sample.php 复制一份成为：config.php。并修改账户密码和时区：
```php
return [
    'username'        => 'root',
    'password'        => '$2y$10$XIlZ702pFKgRozYUuvaI4uZcumv19bysFo6PnviZIKlN8IvEeXVXu', //root
    'whitelist'       => [
        'localhost',
        '127.0.0.1',
    ],
    'language'        => 'en',
    'timezone'        => 'Asia/Shanghai',
    'error_reporting' => E_ALL,
    'display_errors'  => 'Off',
    'log_errors'      => 'On',
    'uri_scheme'      => Router::URL_REWRITE
];
```

然后在浏览器访问`http://127.0.0.1:8089/index.php `,输入账户密码：root root:

![IMG](https://ws3.sinaimg.cn/large/006tNc79ly1fnsonj1d1ej30zt0doabl.jpg)


2. 单个PHP文件, 方便部署的项目
> https://github.com/rlerdorf/opcache-status

下载后，然后在浏览器访问：`http://127.0.0.1:8089/opcache.php`

![IMG](https://ws4.sinaimg.cn/large/006tNc79ly1fnsooorfz0j30uz0ic0vg.jpg)

## opcache性能测试
那么，开启opcache性能是否有很大的性能提升呢？

## 参考资料
- 官方手册: http://php.net/manual/zh/opcache.configuration.php#ini.opcache.revalidate-freq
- 使用 Zend Opcache 加速 PHP: https://cnzhx.net/blog/zendopcache-accelerate-php/
- 什么是zend opcache？: http://www.hcoder.net/books/read/info/1141.html
- zend opcache的最佳设置:https://gywbd.github.io/posts/2016/1/best-config-for-zend-opcache.html
- 使用 OpCache 提升 PHP 5.5+ 程序性能: https://laravel-china.org/topics/301/using-opcache-to-enhance-the-performance-of-the-php-55-program
- opcache : http://www.ywnds.com/?p=5396
-图形化工具：http://www.blhere.com/1225.html