# MySQL随机获取数据的效率问题
> http://www.cnblogs.com/hfww/archive/2011/07/08/2223359.html

 最近由于需要大概研究了一下MYSQL的随机抽取实现方法。举个例子，要从tablename表中随机提取一条记录，大家一般的写法就是：SELECT * FROM tablename ORDER BY RAND() LIMIT 1。
 
 但是，后来我查了一下MYSQL的官方手册，里面针对RAND()的提示大概意思就是，在ORDER BY从句里面不能使用RAND()函数，因为这样会导致数据列被多次扫描。但是在MYSQL 3.23版本中，仍然可以通过ORDER BY RAND()来实现随机。
 
 但是真正测试一下才发现这样效率非常低。一个15万余条的库，查询5条数据，居然要8秒以上。查看官方手册，也说rand()放在ORDER BY 子句中会被执行多次，自然效率及很低。
 
 搜索Google，网上基本上都是查询max(id) * rand()来随机获取数据。
 ```mysql
SELECT * 
FROM `table` AS t1 JOIN (SELECT ROUND(RAND() * (SELECT MAX(id) FROM `table`)) AS id) AS t2 
WHERE t1.id >= t2.id 
ORDER BY t1.id ASC LIMIT 5;
```
但是这样会产生连续的5条记录。解决办法只能是每次查询一条，查询5次。即便如此也值得，因为15万条的表，查询只需要0.01秒不到。

下面的语句采用的是JOIN，mysql的论坛上有人使用
```mysql
SELECT * 
FROM `table` 
WHERE id >= (SELECT FLOOR( MAX(id) * RAND()) FROM `table` ) 
ORDER BY id LIMIT 1;
```

我测试了一下，需要0.5秒，速度也不错，但是跟上面的语句还是有很大差距。总觉有什么地方不正常。

于是我把语句改写了一下。
```mysql
SELECT * FROM `table` 
WHERE id >= (SELECT floor(RAND() * (SELECT MAX(id) FROM `table`)))  
ORDER BY id LIMIT 1;
```
这下，效率又提高了，查询时间只有0.01秒

最后，再把语句完善一下，加上MIN(id)的判断。我在最开始测试的时候，就是因为没有加上MIN(id)的判断，结果有一半的时间总是查询到表中的前面几行。
完整查询语句是：
```mysql
SELECT * FROM `table` 
WHERE id >= (SELECT floor( RAND() * ((SELECT MAX(id) FROM `table`)-(SELECT MIN(id) FROM `table`)) + (SELECT MIN(id) FROM `table`)))  
ORDER BY id LIMIT 1;

SELECT * 
FROM `table` AS t1 JOIN (SELECT ROUND(RAND() * ((SELECT MAX(id) FROM `table`)-(SELECT MIN(id) FROM `table`))+(SELECT MIN(id) FROM `table`)) AS id) AS t2 
WHERE t1.id >= t2.id 
ORDER BY t1.id LIMIT 1;
```

最后在php中对这两个语句进行分别查询10次，

- 前者花费时间 0.147433 秒
- 后者花费时间 0.015130 秒

看来采用JOIN的语法比直接在WHERE中使用函数效率还要高很多。

#### 参考文献
- MySQL Order By索引优化：http://www.phpq.net/mysql/mysql-order-by.html
- MySQL Order By语法：http://www.phpq.net/mysql/mysql-order-by-syntax.html
- MySQL Order By Rand()效率：http://www.phpq.net/mysql/mysql-order-by-rand.html
- MySQL Order By用法：http://www.phpq.net/mysql/mysql-order-by-use.html