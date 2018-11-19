# PHP 实时生成并下载超大数据量的Excel文件
> https://segmentfault.com/a/1190000011663425

最近接到一个需求，通过选择的时间段导出对应的用户访问日志到excel中， 由于用户量较大，经常会有导出50万加数据的情况。而常用的PHPexcel包需要把所有数据拿到后才能生成excel， 在面对生成超大数据量的excel文件时这显然是会造成内存溢出的，所以考虑使用让PHP边写入输出流边让浏览器下载的形式来完成需求。

我们通过如下的方式写入PHP输出流

```php
$fp = fopen('php://output', 'a');
fputs($fp, 'strings');
....
....
fclose($fp)
```

`php://output`是一个可写的输出流，允许程序像操作文件一样将输出写入到输出流中，PHP会把输出流中的内容发送给web服务器并返回给发起请求的浏览器

另外由于excel数据是从数据库里逐步读出然后写入输出流的所以需要将PHP的执行时间设长一点（默认30秒）`set_time_limit(0)`不对PHP执行时间做限制。

> 注：以下代码只是阐明生成大数据量EXCEL的思路和步骤，并且在去掉项目业务代码后程序有语法错误不能拿来直接运行，请根据自己的需求填充对应的业务代码！

```php
    /**
     * 导出参与统计
     */
    public function uvExport()
    {
        $actId = intval($this->input->get_post('act_id', true));
        $actId > 0 || error_redirct('', '请先选择活动');

        $filename = date('YmdHis');
        header("Content-type:application/vnd.ms-excel");
        header("Content-Disposition: attachment; filename={$filename}.csv");
        $fp = fopen('php://output', 'a');
        $title = explode(',', 'ID,活动ID,用户ID,用户昵称,用户手机,性别,注册时间,参与时间');
        foreach ($title as $key => $row) {
            $title[$key] = iconv('UTF-8', 'GBK//IGNORE', $row);
        }
        fputcsv($fp, $title);

        $this->actDB->select('id,act_id,user_id,create_time')->from('et_user_act_log')->where('act_id', $actId);
        $uvTime = trim($this->input->get_post('uv_time', true));
        empty($uvTime) || $this->actDB->where('create_time >=', $uvTime);
        $this->actDB->order_by('id DESC');

        $flag = true;
        $limit = 500;
        while ($flag) {
            $pdo = clone $this->actDB;
            isset($lastId) && $pdo->where('id <', $lastId);
            $rows = $pdo->limit($limit)->get()->result_array();
            if (empty($rows)) {
                $flag = false;
                continue;
            }
            $userIdArr = [];
            foreach ($rows as $row) {
                array_push($userIdArr, $row['user_id']);
            }
            $lastId = intval($row['id']);
            $user = $this->findUserInfo(array_unique($userIdArr));
            foreach ($rows as $key => $row) {
                $mid = [$row['id'], $row['act_id']];
                $userId = $row['user_id'];
                $mid[] = $userId;
                $mid[] = isset($user[$userId]) ? iconv('UTF-8', 'GBK//IGNORE', $user[$userId]['nickname']) . "\t" : '';
                $mid[] = isset($user[$userId]) ? $user[$userId]['mobile'] . "\t" : '';
                $mid[] = isset($user[$userId]) ? (1 == $user[$userId]['sex'] ? 'male' : 'female') . "\t" : '';
                $mid[] = isset($user[$userId]) ? iconv('UTF-8', 'GBK//IGNORE', $user[$userId]['create_time']) . "\t" : '';
                $mid[] = iconv('UTF-8', 'GBK//IGNORE', $row['create_time']) . "\t";
                fputcsv($fp, $mid);
            }
            ob_flush();
            flush();
            usleep(1000000 / 2); // sleep 0.5s
        }
        exit();
    }
```

其实很简单，就是用逐步写入输出流并发送到浏览器让浏览器去逐步下载整个文件，由于是逐步写入的无法获取文件的总体size所以就没办法通过设置`header("Content-Length: $size");`
在下载前告诉浏览器这个文件有多大了。不过不影响整体的效果这里的核心问题是解决大文件的实时生成和下载。

说一下我数据库查询这里的思路，因为逐步写入EXCEL的数据实际上来自Mysql的分页查询，大家知道其语法是`LIMIT offset, num`。
不过随着offset越来越大Mysql在每次分页查询时需要跳过的行数就越多，这会严重影响Mysql查询的效率(包括MongoDB这样的NoSQL也是不建议skip掉多条来取结果集)。
所以我采用LastId的方式来做分页查询。 类似下面的语句：

```sql
SELECT columns FROM `table_name` 
WHERE `created_at` >= 'time range start' 
AND `created_at` <= 'time range end' 
AND  `id` < LastId 
ORDER BY `id` DESC 
LIMIT num 
```

