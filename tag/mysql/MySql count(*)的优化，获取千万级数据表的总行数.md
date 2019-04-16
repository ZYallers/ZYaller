# MySql count(*) 优化，获取千万级数据表的总行数
> https://blog.csdn.net/LJFPHP/article/details/84400400

## 一、前言

关于查询一个1200w的数据表的总行数，用count(*)的速度一直提不上去。找了很多优化方案，最后另辟蹊径，选择了用explain来获取总行数。

## 二、关于count优化

网上关于count()优化的有很多。这边的思路就是没索引的就建立索引关系，然后使用count(1)或count(*)来提升速度。

这两个函数默认使用的是数据表中最短的那个索引字段。假如表中只有一个索引字段，所以使用count(1)和count(*)没什么区别。

参考资料：mysql count(*) 会选哪个索引？这篇文章可以看下。

## 三、使用explain获取行数

#### 1、关于explain

使用mysql的都知道，这个函数是专门用于查看sql语句的执行效率的，网上可供参考的文章很多。

explain 命令速度很快，因为 explain 用并不真正执行查询，而是查询优化器【估算】的行数。

 我们使用explain之后，会看到返回很多参数，其中：rows：显示MySQL认为它执行查询时必须检查的行数。就是这个东西了，既然我们要获取的是数据表的行数。
```mysql
EXPLAIN SELECT * FROM `et_sms` WHERE `mobile`='13676565425';
```

#### 2、关于返回值

explain函数是会返回一个数组。这样我们就能通过这个数组获取到我们需求的rows。
```json
{
	"id": "1",
	"select_type": "SIMPLE",
	"table": "et_sms",
	"type": "ref",
	"possible_keys": "idx",
	"key": "idx",
	"key_len": "50",
	"ref": "const",
	"rows": "7",
	"Extra": "Using index condition"
}
```
这里直接获取这个值即可。速度极快。原来查询速度是2.33s,换成只用explain之后，速度仅为0.008s，提升十分巨大。

#### 3、关于rows的准确性
explain的rows结果算是一个大概的统计结果。而count统计的是比较准确的，如果要追求准确的条数，那就使用count查询最好，如果是要大概的结果，那可以使用explain的rows当做结果，正常来说，rows的数值会比count大一些，特别是加的有where条件的话，row的结果是大于Count的结果的。

假如有一个语句：
```mysql
select * from t where column_a = 1 and column_b = 2;
```
全表假设有100条记录，column_a字段有索引（非联合索引），column_b没有索引。column_a = 1 的记录有20条， column_a = 1 and column_b = 2 的记录有5条。
那么最终查询结果应该显示5条记录。 explain结果中的rows应该是20. 因为这20条记录mysql引擎必须逐行检查是否满足where条件。

关于explain不准确的问题，可以参考国外的一篇文章：https://www.percona.com/blog/2006/07/24/mysql-explain-limits-and-errors

> 需要注意不能完全相信explain的结果，特别是在使用limit的时候，结果也许会错的很离谱。其次，explain的结果也有可能会走错，一般发生在子查询的时候比较多。

#### 4、关于实际使用
```php
/**
 * 短信发送记录列表
 * @param int $page default 1
 */
public function lists($page = 1)
{
    $table = 'et_sms';
    $perPage = 20;
    $mobile = trim($this->input->get_post('mobile', true));
    $this->db->from($table);
    if (!empty($mobile)) {
        $this->db->where('mobile', $mobile);
    }
    FormHelper::createPageListByCount(FormHelper::getExplainRows($this->db), $this->baseUrl, $perPage);
    $rows = $this->db->order_by('id desc')->limit($perPage, ($page - 1) * $perPage)->get()->result_array();
    $data['lists'] = $rows;
    $this->load->view('base/sms/lists', $data);
}

// FormHelper 里的 getExplainRows 函数

/**
 * 获取 Select 查询的 Explain 结果的 rows 行数
 * @param $db
 * @author zhongyongbiao
 * @return int
 */
static public function getExplainRows($db)
{
    $countSql = $db->get_compiled_select('', false);
    $row = $db->query("EXPLAIN {$countSql}")->row_array();
    echo json_encode($row);exit;
    return isset($row['rows']) ? intval($row['rows']) : 0;
}
```