# PHP导出csv格式数据将数字转换成文本解决方法

> http://www.cnblogs.com/min-cj/archive/2014/06/04/php_csv.html

### 导出csv格式数据实现：
先定义一个字符串 存储内容，例如：
```php
$exportdata = '规则111,规则222,审222,规222,服2222,规则1,规则2,规则3,匹配字符,设置时间,有效期'."\n";
```

然后对需要保存csv的数组进行foreach循环，例如
```php
if (!empty($lists)) {
    foreach ($lists as $key => $value) {
        $time = date("Y-m-d_H:i:s", $value['add_time']);
        $exportdata .= "\"\t" . $value['Rule_id'] . "\",\"\t" . $value['Rule_name'] . "\",\"\t" . $value['Matching_level'] . "\",\"\t" . "{$value['Rule_action']}" . "\",\"\t" . $value['Service_type'] . "\",\"\t" . $value['Keyword1'] . "\",\"\t" . $value['Keyword2'] . "\",\"\t" . $value['Keyword3'] . "\",\"\t" . $value['Matching_word'] . "\",\"\t" . $value['Set_time'] . "\",\"\t" . $value['Validation_time'] . "\"\n";
    }
}
```

csv格式的内容用','隔开，在现实的时候就能分格了。每一行后面就一个'\n'就能分行了。

然后在后面执行输出就行了。例如：
```php
$filename = "plcnetinfo_{$date}.csv";

header("Content-type:application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=$filename");

header("Expires: 0");
header("Pragma: public");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");

echo(mb_convert_encoding($exportdata, "gb2312", "UTF-8"));
```
但是在导出数字的时候csv就会把前面的0去掉，例如我想显示00001，如果输出的话就会显示1。
这种解决办法就是在输出的时候就一个`'\"\t'`,这个是`制表符`，会显示成空格。就能把数值转化成文本了。
不过在导入的时候会出现`'"    '`这种东西，用一下PHP自带的`trim`函数就好了。完整代码如下：
```php
$lists = $this->dbo->query($sql);
$exportdata = '规则111,规则222,审222,规222,服2222,规则1,规则2,规则3,匹配字符,设置时间,有效期' . "\n";
$date = date("YmdHis");
if (!empty($lists)) {
    foreach ($lists as $key => $value) {
        $time = date("Y-m-d_H:i:s", $value['add_time']);
        $exportdata .= "\"\t" . $value['Rule_id'] . "\",\"\t" . $value['Rule_name'] . "\",\"\t" . $value['Matching_level'] . "\",\"\t" . "{$value['Rule_action']}" . "\",\"\t" . $value['Service_type'] . "\",\"\t" . $value['Keyword1'] . "\",\"\t" . $value['Keyword2'] . "\",\"\t" . $value['Keyword3'] . "\",\"\t" . $value['Matching_word'] . "\",\"\t" . $value['Set_time'] . "\",\"\t" . $value['Validation_time'] . "\"\n";
    }
}
$filename = "plcnetinfo_{$date}.csv";

header("Content-type:application/vnd.ms-excel");
header("Content-Disposition: attachment; filename=$filename");

header("Expires: 0");
header("Pragma: public");
header("Cache-Control: must-revalidate, post-check=0, pre-check=0");
header("Cache-Control: public");

echo(mb_convert_encoding($exportdata, "gb2312", "UTF-8"));
```
