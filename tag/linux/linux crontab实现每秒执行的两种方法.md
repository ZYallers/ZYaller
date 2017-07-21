# linux crontab实现每秒执行的两种方法

![image](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/201705/25/1495676230340653.png)

Linux crontab 命令，最小的执行时间是一分钟。如需要在小于一分钟内重复执行，可以有两个方法实现。

### 一、使用延时来实现每N秒执行

在CI框架下创建一个方法做执行动作。该方法从redis队列里弹出元素，然后批量写入数据库。

```php
/**
 * 访问数据入库，只允许cli命令行运行，默认每次插入30条数据，从redis list中弹出获取数据,crontab由运维设置
 * @param int $rows 每次插入数据条数
 */
public function logAccess($rows = 30)
{
    !is_cli() && exit(header("HTTP/1.1 403 Forbidden"));
    try {
        $curTime = date('Y-m-d H:i:s');
        $redis = $this->getRedis();
        $rdsKey = $this->getCI()->config->item(self::RDS_WEIGHT_DRAW_ACCESS_LIST);
        $len = $redis->lLen($rdsKey);
        !$len > 0 && exit("{$curTime}->List empty.\n");
        $data = array();
        $continue = true;
        $count = 0;
        while ($continue) {
            $count++;
            $json = $redis->rPop($rdsKey);
            if (!empty($json)) {
                array_push($data, json_decode($json, true));
            }
            if (!$json || $count > $rows - 1) {
                $continue = false;
            }
        }
        empty($data) && exit("{$curTime}->Data empty.\n");
        $res = DialAccessLog_model::getInstance()->insertBatchAccessLog($data);
        if (!$res) {
            /* 写入数据库失败则重新入队列 */
            foreach ($data as $key => $value) {
                $redis->lPush(json_encode($value));
            }
            exit("{$curTime}->Into table failed, rolled back. llen:" . $redis->lLen($rdsKey) . ".\n");
        }
        exit("{$curTime}->Into table ".count($data)." data, llen:" . $redis->lLen($rdsKey) . ".\n");
    } catch (Exception $e) {
        exit("{$curTime}->" . $e->getMessage() . "\n");
    }
}
```

crontab -e 输入以下语句，然后 :wq 保存退出。

```bash
* * * * * source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1
* * * * * sleep 10; source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1 
* * * * * sleep 20; source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1
* * * * * sleep 30; source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1
* * * * * sleep 40; source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1
* * * * * sleep 50; source /apps/sh/.server_env.sh;/apps/svr/php/bin/php -c /apps/conf/php/php.ini -f  /apps/data/work/php/act.hxsapp.cc/index.php weightDraw/Stat logAccess/30 > /tmp/act_wdraw_accesslog_rds_list.log 2>&1
```

使用 tail -f 查看执行情况，可以见到log每10秒被写入一条记录。

```bash
fdipzone@ubuntu:~$ tail -f /tmp/act_wdraw_accesslog_rds_list.log
2017-05-24 15:10:01->Into table 1 data, llen:0.
2017-05-24 15:10:11->List empty.
2017-05-24 15:11:21->List empty.
2017-05-24 15:11:31->Into table 1 data, llen:0.
2017-05-24 15:12:41->List empty.
2017-05-24 15:12:51->Into table 5 data, llen:0.
2017-05-24 15:13:01->List empty.
2017-05-24 15:13:21->Into table 2 data, llen:0.
2017-05-24 15:13:31->List empty.
2017-05-24 15:13:41->List empty.
2017-05-24 15:13:51->Into table 2 data, llen:0.
```

原理：通过延时方法sleep N来实现每N秒执行。

`注意：`

60必须能整除间隔的秒数（没有余数），例如间隔的秒数是2，4，6，10，12等。
如果间隔的秒数太少，例如2秒执行一次，这样就需要在crontab 加入60/2=30条语句。不建议使用此方法，可以使用下面介绍的第二种方法。



### 二、编写shell脚本实现

act_wdraw_accesslog_rds_list.sh

```bash
#!/bin/bash
phpexec=/apps/svr/php/bin/php
phpini=/apps/conf/php/php.ini
index_file=/apps/data/work/php/act.hxsapp.cc/index.php
env_sh=/apps/sh/.server_env.sh
step=2
source $env_sh;
for (( i=0; i<60; i=(i+step) )); do
  $($phpexec -c $phpini -f $index_file weightDraw/Stat logAccess/30 >> /tmp/act_wdraw_accesslog_rds_list.log 2>&1)
  sleep $step
done
exit 0
```

crontab -e 输入以下语句，然后:wq 保存退出。
```bash
* * * * * /apps/sh/act_wdraw_accesslog_rds_list.sh
```
使用 tail -f 查看执行情况，可以见到log每2秒执行一次。
```bash
2017-05-24 15:10:01->Into table 1 data, llen:0.
2017-05-24 15:10:03->List empty.
2017-05-24 15:11:05->List empty.
2017-05-24 15:11:07->Into table 1 data, llen:0.
2017-05-24 15:11:09->List empty.
2017-05-24 15:11:11->Into table 5 data, llen:0.
2017-05-24 15:11:13->List empty.
2017-05-24 15:11:15->Into table 2 data, llen:0.
2017-05-24 15:11:17->List empty.
2017-05-24 15:11:19->List empty.
2017-05-24 15:11:21->Into table 2 data, llen:0.
```
原理：在sh使用for语句实现循环指定秒数执行

`注意：`

如果60不能整除间隔的秒数，则需要调整执行的时间。例如需要每7秒执行一次，就需要找到7与60的最小公倍数，7与60的最小公倍数是420（即7分钟）。
则act_wdraw_accesslog_rds_list.sh step的值为7，循环结束条件i<420， crontab -e可以输入以下语句来实现
```bash
*/7 * * * * /apps/sh/act_wdraw_accesslog_rds_list.sh
```