[//]:# "2024/11/7 14:28|mysql"

# MySQL实现按某个字段的指定值排序
> 转载自：[CSDN](https://blog.csdn.net/u011974797/article/details/140356198)

## 项目场景
MySQL 按某个字段的指定值排序，我们需要用到 FIELD() 函数，
它是一种对查询结果排序的方法，可以根据指定的字段值顺序进行排序。

order by FIELD() 函数的语法如下：
```sql
ORDER BY FIELD(expr, val1, val2, ..., valN) [ASC | DESC];
```
参数说明：
expr 是需要排序的列，val1 到 valN 是按照指定顺序排列的值。
如果需要按照降序排序，则在函数后面加上 DESC 关键字。

## 解决方案
比如现在有这么一组数据:

ID | name | create_time
---|---|---
1|张三|2024-11-01 14:30:20
2|李四|2024-11-02 14:30:20
3|王五|2024-11-03 14:30:20
4|赵六|2024-11-04 14:30:20

现在我们的需求是，王五排第一，赵六排第二，其他的人按创建时间倒序。
SQL如下：
```sql
SELECT * FROM student
ORDER BY FIELD(name, '赵六', '王五') desc, create_time desc;
```
或者:
```sql
SELECT * FROM student
ORDER BY FIELD(name, '王五', '赵六', name), create_time desc;
```
查询结果：

ID | name | create_time
---|---|---
3|张三|2024-11-03 14:30:20
4|李四|2024-11-04 14:30:20
2|王五|2024-11-02 14:30:20
1|赵六|2024-11-01 14:30:20

## 分析
查询语句：
````sql
SELECT * FROM student ORDER BY FIELD(name, '王五', '赵六');
````
这条语句排序的结果是：

ID | name | create_time
---|---|---
3|张三|2024-11-03 14:30:20
4|李四|2024-11-04 14:30:20
2|王五|2024-11-02 14:30:20
1|赵六|2024-11-01 14:30:20

排序的逻辑是：其他值>>王五>>赵六，这种情况王五、赵六跑到最后面去了，不是想要的结果。

正确的SQL：
```sql
SELECT * FROM student ORDER BY FIELD(name, '赵六', '王五') desc;
```
或：
```sql
SELECT * FROM student ORDER BY FIELD(name, '王五', '赵六', name);
```
这样才是想要的结果，王五>>赵六>>其他值。