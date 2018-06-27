# Rolling cURL: PHP并发最佳实践
> https://www.oschina.net/question/54100_58279

在实际项目或者自己编写小工具(比如新闻聚合,商品价格监控,比价)的过程中, 通常需要从第3方网站或者API接口获取数据, 在需要处理1个URL队列时, 为了提高性能, 可以采用cURL提供的curl_multi_*族函数实现简单的并发。

本文将探讨两种具体的实现方法

### 1. 经典cURL并发机制及其存在的问题

经典的cURL实现机制在网上很容易找到, 比如参考PHP在线手册的如下实现方式: 
```php
function classic_curl($urls) {
    $queue = curl_multi_init();
    $map = array();
 
    foreach ($urls as $url) {
        // create cURL resources
        $ch = curl_init();
 
        // set URL and other appropriate options
        curl_setopt($ch, CURLOPT_URL, $url);
 
        curl_setopt($ch, CURLOPT_TIMEOUT, 1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_NOSIGNAL, true);
 
        // add handle
        curl_multi_add_handle($queue, $ch);
        $map[$url] = $ch;
    }
 
    $active = null;
 
    // execute the handles
    do {
        $mrc = curl_multi_exec($queue, $active);
    } while ($mrc == CURLM_CALL_MULTI_PERFORM);
 
    while ($active > 0 && $mrc == CURLM_OK) {
        if (curl_multi_select($queue, 0.5) != -1) {
            do {
                $mrc = curl_multi_exec($queue, $active);
            } while ($mrc == CURLM_CALL_MULTI_PERFORM);
        }
    }
 
    $responses = array();
    foreach ($map as $url=>$ch) {
        $responses[$url] = curl_multi_getcontent($ch);
        curl_multi_remove_handle($queue, $ch);
        curl_close($ch);
    }
 
    curl_multi_close($queue);
    return $responses;
}
```

首先将所有的URL压入并发队列, 然后执行并发过程, 等待所有请求接收完之后进行数据的解析等后续处理。
在实际的处理过程中, 受网络传输的影响, 部分URL的内容会优先于其他URL返回, 但是经典cURL并发必须等待最慢的那个URL返回之后才开始处理。
等待也就意味着CPU的空闲和浪费. 如果URL队列很短, 这种空闲和浪费还处在可接受的范围, 但如果队列很长, 这种等待和浪费将变得不可接受。

### 2. 改进的Rolling cURL并发方式

仔细分析不难发现经典cURL并发还存在优化的空间, 优化的方式时当某个URL请求完毕之后尽可能快的去处理它, 边处理边等待其他的URL返回, 而不是等待那个最慢的接口返回之后才开始处理等工作, 从而避免CPU的空闲和浪费。
闲话不多说, 下面贴上具体的实现:

```php
function rollingCurl(array $urls, $timeout = 3)
{
    $map = [];
    // 创建批处理cURL句柄
    $queue = curl_multi_init();
    foreach ($urls as $data) {
        if (!isset($data['key']) || empty($data['key']) || !isset($data['url']) || empty($data['url'])) {
            continue;
        }
        $ch = curl_init();
        $map[(string)$ch] = $data['key'];
        $url = $data['url'];

        // 提交方式
        if (isset($data['type']) && strtolower($data['type']) === 'post') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (isset($data['params']) && is_array($data['params']) && !empty($data['params'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data['params'], null, '&'));
            }
        } else {
            if (isset($data['params']) && is_array($data['params']) && !empty($data['params'])) {
                $url .= '?' . http_build_query($data['params'], null, '&');
            }
        }
        // 设置url
        curl_setopt($ch, CURLOPT_URL, $url);
        // 设置header
        curl_setopt($ch, CURLOPT_HEADER, false);
        // 获取的信息以字符串返回，而不是直接输出
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // 设置超时
        curl_setopt($ch, CURLOPT_TIMEOUT, isset($data['timeout']) ? $data['timeout'] : $timeout);
        // true时忽略所有的cURL传递给PHP进行的信号。在SAPI多线程传输时此项被默认启用，所以超时选项仍能使用
        curl_setopt($ch, CURLOPT_NOSIGNAL, true);
        // 增加句柄
        curl_multi_add_handle($queue, $ch);
    }

    $ret = [];
    do {
        while (($code = curl_multi_exec($queue, $active)) == CURLM_CALL_MULTI_PERFORM) ;
        if ($code != CURLM_OK) {
            break;
        }
        // a request was just completed -- find out which one
        while ($done = curl_multi_info_read($queue)) {
            // get the info and content returned on the request
            //$info = curl_getinfo($done['handle']);
            $error = curl_error($done['handle']);
            $result = curl_multi_getcontent($done['handle']);
            //$ret[$map[(string)$done['handle']]] =  compact('info', 'error', 'result');
            $ret[$map[(string)$done['handle']]] = compact('error', 'result');
            // remove the curl handle that just completed
            curl_multi_remove_handle($queue, $done['handle']);
            curl_close($done['handle']);
        }
        // Block for data in / output; error handling is done by curl_multi_exec
        if ($active > 0) {
            curl_multi_select($queue, 0.5);
        }

    } while ($active);

    // 关闭全部句柄
    curl_multi_close($queue);

    return $ret;
}
```

通过简单的性能对比这两种方式, 在处理URL队列并发的应用场景中Rolling cURL应该是更加的选择, 并发量非常大(1000+)时, 可以控制并发队列的最大长度。
比如20, 每当1个URL返回并处理完毕之后立即加入1个尚未请求的URL到队列中, 这样写出来的代码会更加健壮, 不至于并发数太大而卡死或崩溃. 

### 参考资料
- http://code.google.com/p/rolling-curl/
- https://www.oschina.net/question/54100_58279
- http://www.searchtb.com/2012/06/rolling-curl-best-practices.html
