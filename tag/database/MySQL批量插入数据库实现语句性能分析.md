# MySQL批量插入数据库实现语句性能分析
> https://www.cnblogs.com/caicaizi/p/5849979.html

假定我们的表结构如下：
```mysql
CREATE TABLE example (
    example_id INT NOT NULL,
    name VARCHAR( 50 ) NOT NULL,
    value VARCHAR( 50 ) NOT NULL,
    other_value VARCHAR( 50 ) NOT NULL
);
```
通常情况下单条插入的sql语句我们会这么写：
```mysql
INSERT INTO example
(example_id, name, value, other_value)
VALUES
(100, 'Name 1', 'Value 1', 'Other 1');
```
mysql允许我们在一条sql语句中批量插入数据，如下sql语句：
```mysql
INSERT INTO example
(example_id, name, value, other_value)
VALUES
(100, 'Name 1', 'Value 1', 'Other 1'),
(101, 'Name 2', 'Value 2', 'Other 2'),
(102, 'Name 3', 'Value 3', 'Other 3'),
(103, 'Name 4', 'Value 4', 'Other 4');
```
如果我们插入列的顺序和表中列的顺序一致的话，还可以省去列名的定义，如下sql：
```mysql
INSERT INTO example
VALUES
(100, 'Name 1', 'Value 1', 'Other 1'),
(101, 'Name 2', 'Value 2', 'Other 2'),
(102, 'Name 3', 'Value 3', 'Other 3'),
(103, 'Name 4', 'Value 4', 'Other 4');
```
上面看上去没什么问题，下面我来使用sql语句优化的小技巧，下面会分别进行测试，目标是插入一个空的数据表200W条数据

第一种方法：使用insert into 插入，代码如下：	 
```php
$params = array('value'=>'50');
set_time_limit(0);
echo date("H:i:s");
for($i=0;$i<2000000;$i++){
    $connect_mysql->insert($params);
};
echo date("H:i:s");
```
最后显示为：23:25:05 01:32:05 也就是花了2个小时多!

第二种方法：使用事务提交，批量插入数据库(每隔10W条提交下)最后显示消耗的时间为：22:56:13 23:04:00 ，一共8分13秒 ，代码如下：
```php
echo date("H:i:s");

$connect_mysql->query('BEGIN');
$params = array('value'=>'50');
for($i=0;$i<2000000;$i++){
    $connect_mysql->insert($params);
    if($i%100000==0){
        $connect_mysql->query('COMMIT');
        $connect_mysql->query('BEGIN');
    }
}
$connect_mysql->query('COMMIT');
echo date("H:i:s");
```
第三种方法：使用优化SQL语句：将SQL语句进行拼接，使用 insert into table () values (),(),(),()然后再一次性插入，如果字符串太长，
则需要配置下MYSQL，在mysql 命令行中运行 ：set global max_allowed_packet = 2*1024*1024*10;
消耗时间为：11:24:06-11:25:06;插入200W条测试数据仅仅用了1分钟! 代码如下：
```php
$sql= "insert into twenty_million (value) values";
for($i=0;$i<2000000;$i++){
    $sql.="('50'),";
};
$sql = substr($sql,0,strlen($sql)-1);
$connect_mysql->query($sql);
```
最后总结下，在插入大批量数据时，第一种方法无疑是最差劲的，而第二种方法在实际应用中就比较广泛，第三种方法在插入测试数据或者其他低要求时比较合适，速度确实快。