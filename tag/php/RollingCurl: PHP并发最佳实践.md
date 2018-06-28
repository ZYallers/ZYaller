# RollingCurl: PHP并发最佳实践
> https://www.oschina.net/question/54100_58279

在实际项目或者自己编写小工具(比如新闻聚合,商品价格监控,比价)的过程中, 通常需要从第3方网站或者API接口获取数据, 在需要处理1个URL队列时, 为了提高性能, 可以采用cURL提供的curl_multi_*族函数实现简单的并发。

本文将探讨两种具体的实现方法

### 1. 经典classicCurl并发机制及其存在的问题

经典的curl实现机制在网上很容易找到, 比如参考PHP在线手册的如下实现方式: 
```php
function classicCurl(array $curls, $timeout = 3)
{
    $now = microtime(true);
    $mud = memory_get_usage();
    $queue = curl_multi_init();
    $map = [];
    $ret = [];
    foreach ($curls as $curl) {
        if (!isset($curl['key']) || empty($curl['key']) || !isset($curl['url']) || empty($curl['url'])) {
            continue;
        }
        // 创建句柄
        $ch = curl_init();
        // 提交方式
        if (isset($curl['type']) && strtolower($curl['type']) === 'post') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($curl['params'], null, '&'));
            }
        } else {
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                $curl['url'] .= '?' . http_build_query($curl['params'], null, '&');
            }
        }
        // 设置url
        curl_setopt($ch, CURLOPT_URL, $curl['url']);
        // 设置header
        curl_setopt($ch, CURLOPT_HEADER, false);
        // 获取的信息以字符串返回，而不是直接输出
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // 设置超时
        curl_setopt($ch, CURLOPT_TIMEOUT, isset($curl['timeout']) ? $curl['timeout'] : $timeout);
        // true时忽略所有的cURL传递给PHP进行的信号。在SAPI多线程传输时此项被默认启用，所以超时选项仍能使用
        curl_setopt($ch, CURLOPT_NOSIGNAL, true);
        // 增加句柄
        curl_multi_add_handle($queue, $ch);
        // 添加映射，方便后期处理数据
        $map[$curl['key']] = $ch;
    }

    // 这样写是为以防CPU过高，请求假死的现象
    do {
        while (($mrc = curl_multi_exec($queue, $active)) == CURLM_CALL_MULTI_PERFORM) ;
        if ($active && curl_multi_select($queue) == -1) {
            usleep(1);
        }
    } while ($active && $mrc == CURLM_OK);

    foreach ($map as $key => $ch) {
        // 从句柄中获取回应内容
        $ret[$key] = ['error' => curl_error($ch), 'result' => curl_multi_getcontent($ch)];
        // 关闭已完成的句柄
        curl_multi_remove_handle($queue, $ch);
        curl_close($ch);
    }

    // 关闭全部句柄
    curl_multi_close($queue);

    return ['memory' => round((memory_get_usage() - $mud) / 1024, 6) . 'kb',
        'spend' => sprintf('%.6fs', microtime(true) - $now), 'result' => $ret];
}
```

首先将所有的URL压入并发队列, 然后执行并发过程, 等待所有请求接收完之后进行数据的解析等后续处理。
在实际的处理过程中, 受网络传输的影响, 部分URL的内容会优先于其他URL返回, 但是经典curl并发必须等待最慢的那个URL返回之后才开始处理。
等待也就意味着CPU的空闲和浪费. 如果URL队列很短, 这种空闲和浪费还处在可接受的范围, 但如果队列很长, 这种等待和浪费将变得不可接受。

### 2. 改进的RollingCurlL并发方式

仔细分析不难发现经典curl并发还存在优化的空间, 优化的方式时当某个URL请求完毕之后尽可能快的去处理它, 边处理边等待其他的URL返回, 而不是等待那个最慢的接口返回之后才开始处理等工作, 从而避免CPU的空闲和浪费。
闲话不多说, 下面贴上具体的实现:

```php
function rollingCurl(array $curls, $timeout = 3)
{
    $now = microtime(true);
    $mud = memory_get_usage();
    $map = [];
    $ret = [];

    // 创建批处理cURL句柄
    $queue = curl_multi_init();
    foreach ($curls as $curl) {
        if (!isset($curl['key']) || empty($curl['key']) || !isset($curl['url']) || empty($curl['url'])) {
            continue;
        }
        // 创建句柄
        $ch = curl_init();
        // 提交方式
        if (isset($curl['type']) && strtolower($curl['type']) === 'post') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($curl['params'], null, '&'));
            }
        } else {
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                $curl['url'] .= '?' . http_build_query($curl['params'], null, '&');
            }
        }
        // 设置url
        curl_setopt($ch, CURLOPT_URL, $curl['url']);
        // 设置header
        curl_setopt($ch, CURLOPT_HEADER, false);
        // 获取的信息以字符串返回，而不是直接输出
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // 设置超时
        curl_setopt($ch, CURLOPT_TIMEOUT, isset($curl['timeout']) ? $curl['timeout'] : $timeout);
        // true时忽略所有的cURL传递给PHP进行的信号。在SAPI多线程传输时此项被默认启用，所以超时选项仍能使用
        curl_setopt($ch, CURLOPT_NOSIGNAL, true);
        // 增加句柄
        curl_multi_add_handle($queue, $ch);
        // 映射句柄
        $map[(string)$ch] = ['key' => $curl['key'], 'callback' => isset($curl['callback']) ? $curl['callback'] : null];

    }

    do {
        while (($mrc = curl_multi_exec($queue, $active)) == CURLM_CALL_MULTI_PERFORM) ;

        // a request was just completed -- find out which one
        while ($done = curl_multi_info_read($queue)) {
            $curl = $map[(string)$done['handle']];
            if (!isset($curl)) {
                continue;
            }
            // get the info and content returned on the request
            $error = curl_error($done['handle']);
            $result = curl_multi_getcontent($done['handle']);
            if (isset($curl['callback'])) {
                $result = $curl['callback']($result);
            }
            $ret[$curl['key']] = compact('error', 'result');

            // remove the curl handle that just completed
            curl_multi_remove_handle($queue, $done['handle']);
            curl_close($done['handle']);
        }

        // Block for data in / output; error handling is done by curl_multi_exec
        if ($active && curl_multi_select($queue) == -1) {
            usleep(1);
        }
    } while ($active && $mrc == CURLM_OK);

    // 关闭全部句柄
    curl_multi_close($queue);

    return ['memory' => round((memory_get_usage() - $mud) / 1024, 6) . 'kb',
        'spend' => sprintf('%.6fs', microtime(true) - $now), 'result' => $ret];
}
```

下面这个方法是添加了debug输出，方便研究调试的，但不适合在生产上调用。
```php
function debugRollingCurl(array $urls, $timeout = 3)
{
    $now = microtime(true);
    $mud = memory_get_usage();
    $map = [];
    $ret = [];

    // 创建批处理cURL句柄
    $queue = curl_multi_init();
    foreach ($urls as $data) {
        if (!isset($curl['key']) || empty($curl['key']) || !isset($curl['url']) || empty($curl['url'])) {
            continue;
        }
        // 创建句柄
        $ch = curl_init();
        // 提交方式
        if (isset($curl['type']) && strtolower($curl['type']) === 'post') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($curl['params'], null, '&'));
            }
        } else {
            if (isset($curl['params']) && is_array($curl['params']) && !empty($curl['params'])) {
                $curl['url'] .= '?' . http_build_query($curl['params'], null, '&');
            }
        }
        // 设置url
        curl_setopt($ch, CURLOPT_URL, $curl['url']);
        // 设置header
        curl_setopt($ch, CURLOPT_HEADER, false);
        // 获取的信息以字符串返回，而不是直接输出
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        // 设置超时
        curl_setopt($ch, CURLOPT_TIMEOUT, isset($curl['timeout']) ? $curl['timeout'] : $timeout);
        // true时忽略所有的cURL传递给PHP进行的信号。在SAPI多线程传输时此项被默认启用，所以超时选项仍能使用
        curl_setopt($ch, CURLOPT_NOSIGNAL, true);
        // 增加句柄
        curl_multi_add_handle($queue, $ch);
        // 映射句柄
        $map[(string)$ch] = ['key' => $curl['key'], 'callback' => isset($curl['callback']) ? $curl['callback'] : null];
    }

    $debug = [];
    $active = 0;
    $counter = 0;
    do {
        $debug[] = 'Start: ' . sprintf('%.6fs', microtime(true) - $now);

        do {
            $mrc = curl_multi_exec($queue, $active);
            $debug[] = 'Exec: ' . sprintf('%.6fs', microtime(true) - $now) . ', [mrc=' . $mrc . '; active=' . $active . ']';
        } while ($mrc == CURLM_CALL_MULTI_PERFORM);

        // a request was just completed -- find out which one
        while ($done = curl_multi_info_read($queue)) {
            $url = $map[(string)$done['handle']];
            if (!isset($url)) {
                continue;
            }
            $debug[] = '**************';
            $debug[] = 'Readed: ' . sprintf('%.6fs', microtime(true) - $now) . ', [' . $url['key'] . ']';

            $error = curl_error($done['handle']);
            $debug[] = 'Error: ' . sprintf('%.6fs', microtime(true) - $now) . ', [' . $error . ']';

            $result = curl_multi_getcontent($done['handle']);
            if (isset($url['callback'])) {
                $debug[] = 'callbacking: ' . sprintf('%.6fs', microtime(true) - $now);
                $result = $url['callback']($result);
                $debug[] = 'callbacked: ' . sprintf('%.6fs', microtime(true) - $now);
            }
            $spend = sprintf('%.6fs', microtime(true) - $now);
            $ret[$url['key']] = compact('spend', 'error', 'result');

            // remove the curl handle that just completed
            curl_multi_remove_handle($queue, $done['handle']);
            curl_close($done['handle']);
            $debug[] = '**************';
        }

        // Block for data in / output; error handling is done by curl_multi_exec
        if ($active > 0) {
            $debug[] = 'Select: ' . sprintf('%.6fs', microtime(true) - $now) . ', [active=' . $active . ']';
            if (curl_multi_select($queue) == -1) {
                usleep(1);
            }
        }
        $debug[] = '-------' . $counter . '-------';
        $counter++;
    } while ($active && $mrc == CURLM_OK);

    // 关闭全部句柄
    curl_multi_close($queue);

    return ['memory' => round((memory_get_usage() - $mud) / 1024, 6) . 'kb',
        'spend' => sprintf('%.6fs', microtime(true) - $now), 'debug' => $debug, 'result' => $ret];
}
```

测试代码：
```php
$urls = [
    [
        'key' => 'kuaidi100',
        'url' => 'http://www.kuaidi100.com/query',
        'type' => 'get',
        'params' => ['postid' => '800125432030318719', 'type' => 'yuantong'],
        'timeout' => 3,
        'callback' => function ($res) {
            sleep(1); // 故意等待一秒，测试在回调函数里会不会阻塞
            return json_decode($res, true);
        }
    ],
    [
        'key' => 'ip',
        'url' => 'http://ip.taobao.com/service/getIpInfo.php',
        'type' => 'get',
        'params' => ['ip' => '63.223.108.42'],
        'timeout' => 3
    ]
];

$ret = debugRollingCurl($curls);
echo json_encode($ret);
exit();
```
输出结果如下：
```json
{
    "memory": "21.523438kb",
    "debug": [
        "Start: 0.000073s",
        "Exec: 0.000262s, [mrc=0; active=2]",
        "Select: 0.000267s, [active=2]",
        "-------0-------",
        "Start: 0.008574s",
        "Exec: 0.008662s, [mrc=0; active=2]",
        "Select: 0.008669s, [active=2]",
        "-------1-------",
        "Start: 0.032995s",
        "Exec: 0.033079s, [mrc=0; active=2]",
        "Select: 0.033085s, [active=2]",
        "-------2-------",
        "Start: 0.047638s",
        "Exec: 0.047709s, [mrc=0; active=2]",
        "Select: 0.047716s, [active=2]",
        "-------3-------",
        "Start: 0.050612s",
        "Exec: 0.050677s, [mrc=0; active=1]",
        "**************",
        "Readed: 0.050693s, [kuaidi100]",
        "Error: 0.050697s, []",
        "callbacking: 0.050700s",
        "callbacked: 1.124298s",
        "**************",
        "Select: 1.124344s, [active=1]",
        "-------4-------",
        "Start: 1.124364s",
        "Exec: 1.124417s, [mrc=0; active=0]",
        "**************",
        "Readed: 1.124429s, [ip]",
        "Error: 1.124433s, []",
        "**************",
        "-------5-------"
    ],
    "result": {
        "kuaidi100": {
            "spend": "1.124311s",
            "error": "",
            "result": {
                "message": "ok",
                "nu": "800125432030318719",
                "ischeck": "1",
                "condition": "F00",
                "com": "yuantong",
                "status": "200",
                "state": "3",
                "data": [
                    {
                        "time": "2018-06-14 11:50:36",
                        "ftime": "2018-06-14 11:50:36",
                        "context": "客户 签收人: 已签收，签收人凭取货码签收。 已签收 感谢使用圆通速递，期待再次为您服务",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 09:37:25",
                        "ftime": "2018-06-14 09:37:25",
                        "context": "快件已被明福智富广场二座速递易【自提柜】代收，请及时取件。有问题请联系派件员15295855857",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 09:10:14",
                        "ftime": "2018-06-14 09:10:14",
                        "context": "【广东省佛山市江湾公司】 派件人: 彭明喜 派件中 派件员电话15295855857",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 08:39:00",
                        "ftime": "2018-06-14 08:39:00",
                        "context": "【广东省佛山市江湾公司】 已收入",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 02:17:01",
                        "ftime": "2018-06-14 02:17:01",
                        "context": "【广东省佛山市南海公司】 已发出 下一站 【广东省佛山市江湾公司】",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 00:30:43",
                        "ftime": "2018-06-14 00:30:43",
                        "context": "【佛山转运中心】 已发出 下一站 【广东省佛山市南海公司】",
                        "location": ""
                    },
                    {
                        "time": "2018-06-14 00:25:41",
                        "ftime": "2018-06-14 00:25:41",
                        "context": "【佛山转运中心】 已收入",
                        "location": ""
                    },
                    {
                        "time": "2018-06-12 23:16:44",
                        "ftime": "2018-06-12 23:16:44",
                        "context": "【宁波转运中心】 已发出 下一站 【佛山转运中心】",
                        "location": ""
                    },
                    {
                        "time": "2018-06-12 23:13:46",
                        "ftime": "2018-06-12 23:13:46",
                        "context": "【宁波转运中心】 已收入",
                        "location": ""
                    },
                    {
                        "time": "2018-06-12 20:53:52",
                        "ftime": "2018-06-12 20:53:52",
                        "context": "【浙江省宁波市慈杭新区公司】 已发出 下一站 【宁波转运中心】",
                        "location": ""
                    },
                    {
                        "time": "2018-06-12 20:19:17",
                        "ftime": "2018-06-12 20:19:17",
                        "context": "【浙江省宁波市慈杭新区公司】 已打包",
                        "location": ""
                    },
                    {
                        "time": "2018-06-12 18:47:10",
                        "ftime": "2018-06-12 18:47:10",
                        "context": "【浙江省宁波市慈杭新区公司】 已收件",
                        "location": ""
                    }
                ]
            }
        },
        "ip": {
            "spend": "1.124435s",
            "error": "",
            "result": "{\"code\":0,\"data\":{\"ip\":\"63.223.108.42\",\"country\":\"美国\",\"area\":\"\",\"region\":\"华盛顿\",\"city\":\"西雅图\",\"county\":\"XX\",\"isp\":\"电讯盈科\",\"country_id\":\"US\",\"area_id\":\"\",\"region_id\":\"US_147\",\"city_id\":\"US_1107\",\"county_id\":\"xx\",\"isp_id\":\"3000107\"}}\n"
        }
    },
    "spend": "1.124552s"
}
```
从debug的信息中可以看出，在多个curl中只要有一个curl读取到了返回数据就可以立马调用对应回调函数继续处理。
而不需要等待。但是，在测试代码中的回调函数故意等待了1秒，从输出的结果中的这段信息：
```shell
...
"callbacking: 0.050700s",
"callbacked: 1.124298s",
...
```
可以看出回调函数也是会阻塞进程的。
这样说来回调函数最好只做简单的数据处理而不要有消耗长时间的处理逻辑，要不然会适得其反。

### 参考资料
- http://code.google.com/p/rolling-curl/
- https://www.oschina.net/question/54100_58279
- http://www.searchtb.com/2012/06/rolling-curl-best-practices.html
