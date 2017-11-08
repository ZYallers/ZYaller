# PHP定时刷新缓存输出内容

先上核心的部分代码（请无视业务代码逻辑），Mark一下。

```php
/**
     * 无刷新缓存输出
     * @param $msg
     * @param int $second
     */
    private function dumpFlush($msg, $second = 1)
    {
        echo '$[' . date('Y-m-d H:i:s') . ']->' . $msg . "\r\n";
        ob_flush();
        flush();
        usleep($second * 1000 * 1000);
    }

    /**
     * 临时脚本：清空user_data_hash缓存数据
     * @param int $size
     */
    public function clearUserHashRdCacheHandler($size = 500)
    {
        set_time_limit(0);

        header("Content-type:text/html;charset=utf-8"); 
        header('X-Accel-Buffering:no'); // 解决Nginx开启Gzip后无效的问题
        echo str_pad(' ', 4096); // 解决部分浏览器缓存无法实时输出问题
        echo '<pre style="line-height: 1.3rem;color: #fff;background: #000;height: 100%;padding: 10px;">';

        $recordKey = 'act@clear:uhh:record:str';
        if (!$this->Redis->exists($recordKey)) {
            $this->Redis->setex($recordKey, 86400 * 30, 0); // 缓存30天
        }

        // 最后一次查询活动用户的ID
        $lastUserId = intval($this->Redis->get($recordKey));
        $this->dumpFlush("最后处理记录的user_id:" . $lastUserId);

        // 获取一批活动用户ID
        $conn = $this->load->database($this->getActMysqlDsn(), true);
        $sql = "SELECT DISTINCT user_id FROM et_user_act_log WHERE user_id>'{$lastUserId}' ORDER BY user_id LIMIT {$size}";
        $rows = $conn->query($sql)->result_array();
        if (empty($rows)) {
            $this->console('获取参与活动用户ID为空');
        }
        $this->dumpFlush('准备处理' . count($rows) . '条数据...');

        // 循环判断用户缓存是否存在，存在则保存到数据库后再删除缓存，最后更新recordKey
        $now = date('Y-m-d H:i:s');
        $userKeyPrefix = 'act@ddraw_uhash-';
        foreach ($rows as $key => $row) {
            $this->dumpFlush('第' . ($key + 1) . '条数据开始处理...');
            $userId = intval($row['user_id']);
            if (!$userId > 0) {
                $this->dumpFlush('user_id为空');
                continue;
            }

            $this->Redis->set($recordKey, $userId);

            $userKey = $userKeyPrefix . $userId;
            if (!$this->Redis->exists($userKey)) {
                $this->dumpFlush('user_key: ' . $userKey . ' 缓存不存在');
                continue;
            }
            $this->dumpFlush('user_key: ' . $userKey);

            $value = ['type' => 'hash', 'key' => $userKey, 'value' => $this->Redis->hGetAll($userKey)];
            $data = ['key' => $userKey, 'value' => json_encode($value), 'type' => 'hash', 'alias' => 'user_data_hash', 'expire_time' => $now, 'del_time' => $now, 'state' => 2];
            $insertId = ActRedisLog_model::getInstance()->insertOne($data);
            if (!$insertId > 0) {
                $this->dumpFlush('插入数据失败');
                continue;
            }
            $ret = $this->Redis->del($userKey);
            if (!$ret > 0) {
                $this->dumpFlush('删除缓存数据失败');
                continue;
            }
            $this->dumpFlush('成功记录: ' . $userKey . '=' . json_encode($value));
        }
        $this->dumpFlush('处理完成！！！');
        echo '</pre>';
    }
```

加入html的pre标签是为了模拟命令行窗口，可按照个人喜好删减。

*参考资料*

- https://zhuanlan.zhihu.com/p/25203101
- https://segmentfault.com/q/1010000002500106
