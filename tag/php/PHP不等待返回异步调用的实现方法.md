# PHP不等待返回异步调用的实现方法

> 转载自：http://pcwanli.blog.163.com/blog/static/45315611201291774214657/

PHP异步执行个人觉得还是用队列最好，这里可以查看下PHP定时执行计划任务 。
但如果硬件不容许的话就没办法了，这里介绍常用方式常见的有以下几种，可以根据各自优缺点进行选择：

#### 1.客户端页面采用AJAX技术请求服务器

优点：最简单，也最快，就是在返回给客户端的HTML代码中，嵌入AJAX调用，或者，嵌入一个img标签，src指向要执行的耗时脚本。

缺点：一般来说Ajax都应该在onLoad以后触发，也就是说，用户点开页面后，就关闭，那就不会触发我们的后台脚本了。

而使用img标签的话，这种方式不能称为严格意义上的异步执行。用户浏览器会长时间等待php脚本的执行完成，也就是用户浏览器的状态栏一直显示还在load。

当然，还可以使用其他的类似原理的方法，比如script标签等等。

#### 2.popen()函数

该函数打开一个指向进程的管道，该进程由派生给定的 command 命令执行而产生。打开一个指向进程的管道，该进程由派生给定的 command 命令执行而产生。

所以可以通过调用它，但忽略它的输出。使用代码如下：

```php
pclose(popen("/home/xinchen/backend.php &", 'r'));
```

优点：避免了第一个方法的缺点，并且也很快。

缺点：这种方法不能通过HTTP协议请求另外的一个WebService，只能执行本地的脚本文件。并且只能单向打开，无法穿大量参数给被调用脚本。并且如果，访问量很高的时候，会产生大量的进程。如果使用到了外部资源，还要自己考虑竞争。

#### 3.CURL扩展

CURL是一个强大的HTTP命令行工具，可以模拟POST/GET等HTTP请求，然后得到和提取数据，显示在"标准输出"（stdout）上面。代码如下：

```php
$ch = curl_init();
$curl_opt = array(CURLOPT_URL, ' CURLOPT_RETURNTRANSFER, 1, CURLOPT_TIMEOUT, 1,);
curl_setopt_array($ch, $curl_opt);
curl_exec($ch);
curl_close($ch);
```

缺点：如你问题中描述的一样，由于使用CURL需要设置CUROPT_TIMEOUT为1（最小为1，郁闷）。也就是说，客户端至少必须等待1秒钟。

#### 4.fscokopen()函数

fsockopen支持socket编程，可以使用fsockopen实现邮件发送等socket程序等等,使用fcockopen需要自己手动拼接出header部分

可以参考: http://cn.php.net/fsockopen/

使用示例如下：

```php
$fp = fsockopen("www.34ways.com", 80, $errno, $errstr, 30);
if (!$fp) {
  echo "$errstr ($errno)<br />\n";
} else {
  $out = "GET /index.php  / HTTP/1.1\r\n";
  $out .= "Host: www.34ways.com\r\n";
  $out .= "Connection: Close\r\n\r\n";
  fwrite($fp, $out);
  /*忽略执行结果
  while (!feof($fp)) {
    echo fgets($fp, 128);
  }*/
  fclose($fp);
}
```

所以总结来说，fscokopen()函数应该可以满足您的要求。可以尝试一下。

PHP 本身没有多线程的东西，但可以曲线的办法来造就出同样的效果，比如多进程的方式来达到异步调用，只限于命令模式。还有一种更简单的方式，可用于 Web 程序中，那就是用 fsockopen()、fputs() 来请求一个 URL 而无需等待返回，如果你在那个被请求的页面中做些事情就相当于异步了。

关键代码如下：
```php
$fp=fsockopen('localhost',80,&$errno,&$errstr,5);
if(!$fp){
    echo "$errstr ($errno)<br />\n";
}
fputs($fp,"GET another_page.php?flag=1\r\n");
fclose($fp);
```
上面的代码向页面 another_page.php 发送完请求就不管了，用不着等待请求页面的响应数据，利用这一点就可以在被请求的页面 another_page.php 中异步的做些事情了。

比如，一个很切实的应用，某个 Blog 在每 Post 了一篇新日志后需要给所有它的订阅者发个邮件通知。如果按照通常的方式就是：

> 日志写完 -> 点提交按钮 -> 日志插入到数据库 -> 发送邮件通知 ->告知撰写者发布成功

那么作者在点提交按钮到看到成功提示之间可能会等待很常时间，基本是在等邮件发送的过程，比如连接邮件服务异常、或器缓慢或是订阅者太多。而实际上 是不管邮件发送成功与否，保证日志保存成功基本可接受的，所以等待邮件发送的过程是很不经济的，这个过程可异步来执行，并且邮件发送的结果不太关心或以日 志形式记录备查。

改进后的流程就是：

> 日志写完 -> 点提交按钮 -> 日志插入到数据库 --->告知撰写者发布成功
> 
> └发送邮件通知 -> [记下日志]

用个实际的程序来测试一下，有两个 php，分别是 write.php 和 sendmail.php，在 sendmail.php 用 sleep(seconds) 来模拟程序执行使用时间。

write.php，执行耗时 1 秒

```php
<?php 
    function asyn_sendmail() {
        $fp=fsockopen('localhost',80,&$errno,&$errstr,5);
        if(!$fp){
            echo "$errstr ($errno)<br />\n";
        }
        sleep(1);
        fputs($fp,"GET /sendmail.php?param=1\r\n"); #请求的资源 URL 一定要写对
        fclose($fp);
    } 
    echo time().'<br>';
    echo 'call asyn_sendmail<br>';
    asyn_sendmail();
    echo time().'<br>';
?>
```

sendmail.php，执行耗时 10 秒

```php
<?php
    //sendmail();
    //sleep 10 seconds
    sleep(10);
    fopen('C:\'.time(),'w');
?>
```

通过页面访问 write.php，页面输出：

```php
1272472697 call asyn_sendmail
1272472698
```

并且在 C:\ 生成文件：

```php
1272472708
```

从上面的结果可知 sendmail.php 花费至少 10 秒，但不会阻塞到 write.php 的继续往下执行，表明这一过程是异步的。