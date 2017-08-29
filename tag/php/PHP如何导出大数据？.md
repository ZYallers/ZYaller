# PHP如何导出大数据？

相信做过后台管理系统的PHPer小伙伴们都会遇到需要导出列表数据为Excel/Csv文件的需求，这是很正常的业务需求。
开发也不是很难，结合PHPExcel插件可以方便导出想要的数据文件。但~~问题来了，几百几千条数据还能勉强导出，
上万条数据就容易遇到内存溢出或者允许超时的致命错误！

写这篇文章之前，小编也去网上找了一些相关的解决方案文章：
- [PHP文件批量下载 ](http://blog.csdn.net/u010373419/article/details/9534937)
- [PHP支持断点续传的文件下载类](http://blog.csdn.net/fdipzone/article/details/9208221)
- [PHP使用fputcsv进行大数据的导出](http://www.cnblogs.com/jkko123/p/6389240.html)
- [PHP怎么导出大量数据的Excel](https://segmentfault.com/q/1010000000115282)

看了一番后不得不感叹自己老了，刚好公司用户量越来越大，以前的通过PHPExcel导出数据的方案终于有一天在线上挂了（504）。
结合自己业务需要，重新改写了导出的方法。部分代码如下：
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
        /*header("Expires: 0");
        header("Pragma: public");
        header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
        header("Cache-Control: public");*/

        // 打开php标准输出流，以写入追加的方式打开
        $fp = fopen('php://output', 'a');
        // 设置标题
        $title = explode(',', 'ID,活动ID,用户ID,用户昵称,用户手机,性别,注册时间,参与时间');
        foreach ($title as $key => $item) {
            // 这里必须转码，不然会乱码
            $title[$key] = iconv('UTF-8', 'GBK//IGNORE', $item);
        }
        // 将标题写到标准输出中
        fputcsv($fp, $title);

        $this->actDB->select('id,act_id,user_id,create_time')->from('et_user_act_log')->where('act_id', $actId);
        $uvTime = trim($this->input->get_post('uv_time', true));
        empty($uvTime) || $this->actDB->where('create_time >=', $uvTime);
        $this->actDB->order_by('id DESC');

        // 循环标识
        $flag = true;
        // 进度记录
        $step = 1;
        // 每次导出1000条数据，可根据实际环境调整大小
        $limit = 1000;
        do {
            $pdo = clone $this->actDB;
            $rows = $pdo->limit($limit, ($step - 1) * $limit)->get()->result_array();
            if (!empty($rows)) {
                $step++;
                $userIdArr = [];
                foreach ($rows as $item) {
                    array_push($userIdArr, $item['user_id']);
                }
                $user = $this->findUserInfo(array_unique($userIdArr));
                foreach ($rows as $key => $row) {
                    $mid = [$row['id'], $row['act_id']];
                    $userId = $row['user_id'];
                    $mid[] = $userId;
                    $mid[] = isset($user[$userId]) ? iconv('UTF-8', 'GBK//IGNORE', $user[$userId]['nickname']) . "\t" : '';
                    $mid[] = isset($user[$userId]) ? $user[$userId]['mobile'] . "\t" : '';
                    $mid[] = isset($user[$userId]) ? (1 == $user[$userId]['sex'] ? 'male' : 'female') . "\t" : '';
                    $mid[] = isset($user[$userId]) ? iconv('UTF-8', 'GBK//IGNORE', $user[$userId]['reg_time']) . "\t" : '';
                    $mid[] = iconv('UTF-8', 'GBK//IGNORE', $row['create_time']) . "\t";
                    fputcsv($fp, $mid);
                }
                // 每$limit条数据就刷新缓冲区，防止由于数据过多造成问题
                ob_flush();
                flush();
                // 延迟1秒再继续执行，根据需求添加，小编添加是因为在火狐浏览器下有奇怪问题
                usleep(1 * 1000 * 1000);
            } else {
                $flag = false;
            }
        } while ($flag);
        exit;
    }
```
写得比较仓促，本想着把它提取出一个公共方法，但由于中间参插数据库表查询，暂时没好的方法就维持现在这样了。
欢迎小伙伴们指点，小编在这只是抛砖引玉。谢谢！