# PHP-FPM 超时时间设置request_terminate_timeout资源问题分析 
> https://freexyz.cn/dev/57376.html

php日志中有一条超时的日志，但是我request_terminate_timeout中设置的是0，理论上应该没有超时时间才对。

```bash
PHP Fatal error: Maximum execution time of 30 seconds exceeded in ...
```

先列出现在的配置：

```bash
php-fpm:
request_terminate_timeout = 0
```

```bash
php.ini:
max_execution_time = 30
```

先查阅了一下php-fpm文件中关于request_terminate_timeout的注释

```bash
; The timeout for serving a single request after which the worker process will
; be killed. This option should be used when the 'max_execution_time' ini option
; does not stop script execution for some reason. A value of '0' means 'off'.
; Available units: s(econds)(default), m(inutes), h(ours), or d(ays)
; Default Value: 0
```

这个注释说明了，request_terminate_timeout 适用于，当max_execution_time由于某种原因无法终止脚本的时候，会把这个php-fpm请求干掉。

再看看max_execution_time的注释：这设置了脚本被解析器中止之前允许的最大执行时间，默认是30s。看样子，我这个请求应该是被max_execution_time这个设置干掉了。

不死心，做了一个实验：

设置 | &nbsp; | &nbsp;
---|---|---
php-fpm request_terminate_timeout  | 0 | 15
php.ini max_execution_time  | 30 | 30
执行结果 | php有Fatal error超时日志，http状态码为500 | php无Fatal error超时日志，http状态码为502，php-fpm日志中有杀掉子进程日志

结论是web请求php执行时间受到2方面控制。

一个是php.ini的max_execution_time（要注意的是sleep，http请求等待响应的时间是不算的，这里算的是真正的执行时间）；

另一个是php-fpm request_terminate_timeout 设置，这个算的是请求开始n秒。

## request_terminate_timeout引起的资源问题

request_terminate_timeout的值如果设置为0或者过长的时间，可能会引起file_get_contents的资源问题。
如果file_get_contents请求的远程资源如果反应过慢，file_get_contents就会一直卡在那里不会超时。
<u> 我们知道php.ini 里面max_execution_time 可以设置 PHP 脚本的最大执行时间，但是，在 php-cgi(php-fpm) 中，该参数不会起效。</u>

真正能够控制 PHP 脚本最大执行时间的是 php-fpm.conf 配置文件中的request_terminate_timeout参数。
request_terminate_timeout默认值为 0 秒，也就是说，PHP 脚本会一直执行下去。
这样，当所有的 php-cgi 进程都卡在 file_get_contents() 函数时，这台 Nginx+PHP 的 WebServer 已经无法再处理新的 PHP 请求了，Nginx 将给用户返回“502 Bad Gateway”。

修改该参数，设置一个 PHP 脚本最大执行时间是必要的，
但是，治标不治本。例如改成 30s，如果发生 file_get_contents() 获取网页内容较慢的情况，这就意味着 150 个 php-cgi 进程，每秒钟只能处理 5 个请求，WebServer 同样很难避免”502 Bad Gateway”。

解决办法是： <u>request_terminate_timeout设置为10s或者一个合理的值，或者给file_get_contents加一个超时参数。</u>

```php
$ctx = stream_context_create(array(
  'http' => array(
    'timeout' => 10  // 设置一个超时时间，单位为秒
  )
));
 
file_get_contents("str", 0, $ctx);
```





