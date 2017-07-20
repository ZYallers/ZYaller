# MySQL单表百万数据记录分页性能优化
 
> 转载自：一颗卤蛋-博客园|http://www.cnblogs.com/lyroge/p/3837886.html

### 背景

自己的一个网站，由于单表的数据记录高达了一百万条，造成数据访问很慢，Google分析的后台经常报告超时，尤其是页码大的页面更是慢的不行。

### 测试环境

先让我们熟悉下基本的sql语句，来查看下我们将要测试表的基本信息

```mysql
use infomation_schema
SELECT * FROM TABLES WHERE TABLE_SCHEMA = ‘dbname’ AND TABLE_NAME = ‘product’
```

查询结果从上图中我们可以看到表的基本信息：

- 表行数：866633
- 平均每行的数据长度：5133字节
- 单表大小：4448700632字节

关于行和表大小的单位都是字节，我们经过计算可以知道

- 平均行长度：大约5k
- 单表总大小：4.1g
表中字段各种类型都有varchar、datetime、text等，id字段为主键

### 测试实验

直接用limit start, count分页语句， 也是我程序中用的方法：

```mysql
select * from product limit start, count
```
当起始页较小时，查询没有性能问题，我们分别看下从10， 100， 1000， 10000开始分页的执行时间（每页取20条）， 如下：

```mysql
select * from product limit 10, 20   0.016秒
select * from product limit 100, 20   0.016秒
select * from product limit 1000, 20   0.047秒
select * from product limit 10000, 20   0.094秒
```

我们已经看出随着起始记录的增加，时间也随着增大， 这说明分页语句limit跟起始页码是有很大关系的，那么我们把起始记录改为40w看下（也就是记录的一般左右）

```mysql
select * from product limit 400000, 20   3.229秒
```

再看我们取最后一页记录的时间

```mysql
select * from product limit 866613, 20   37.44秒
```

难怪搜索引擎抓取我们页面的时候经常会报超时，像这种分页最大的页码页显然这种时间是无法忍受的。

从中我们也能总结出两件事情：

1. limit语句的查询时间与起始记录的位置成正比
2. mysql的limit语句是很方便，但是对记录很多的表并不适合直接使用

### 对limit分页问题的性能优化方法

#### 利用表的覆盖索引来加速分页查询

我们都知道，利用了索引查询的语句中如果只包含了那个索引列（覆盖索引），那么这种情况会查询很快。因为利用索引查找有优化算法，且数据就在查询索引上面，不用再去找相关的数据地址了，这样节省了很多时间。另外Mysql中也有相关的索引缓存，在并发高的时候利用缓存就效果更好了。

在我们的例子中，我们知道id字段是主键，自然就包含了默认的主键索引。现在让我们看看利用覆盖索引的查询效果如何。

这次我们之间查询最后一页的数据（利用覆盖索引，只包含id列），如下：

```mysql
select id from product limit 866613, 20 0.2秒
```

相对于查询了所有列的37.44秒，提升了大概100多倍的速度。那么如果我们也要查询所有列，有两种方法，一种是id>=的形式，另一种就是利用join，看下实际情况：

```mysql
SELECT * FROM product WHERE ID > =(select id from product limit 866613, 1) limit 20
```

查询时间为0.2秒，简直是一个质的飞跃啊。另一种写法：

```mysql
SELECT * FROM product a JOIN (select id from product limit 866613, 20) b ON a.ID = b.id
```

查询时间也很短，赞！其实两者用的都是一个原理嘛，所以效果也差不多。