[//]:# "2023/12/7 14:10|mysql"

# MySQL 中多种排名实现

> 转载自：[CSDN](https://blog.csdn.net/qq_36433289/article/details/128676858)

## 一、数据库表结构以及数据

1. 创建表(学生成绩表)

```sql
CREATE TABLE `forlan_score` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `student_name` varchar(255) DEFAULT NULL COMMENT '学生名称',
  `score` int(20) DEFAULT '-1' COMMENT '分数',
	`course_name` varchar(255) DEFAULT NULL COMMENT '课程',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='学生成绩表';
```

2. 模拟数据

```sql
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (1, '小明', 70, '数学');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (2, '小红', 65, '英语');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (3, '小林', 100, '数学');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (4, '小黄', 100, '语文');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (5, '小东', 80, '语文');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (6, '小美', 90, '英语');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (7, '小伟', 88, '英语');
INSERT INTO `test`.`forlan_score` (`id`, `student_name`, `score`, `course_name`) VALUES (8, '小小', 100, '数学');
```



## 二、实现排名（不分组）

#### 1. 排名不重复且连续

效果：

```
+--------------+-------+---------+
| student_name | score | ranking |
+--------------+-------+---------+
| 小林         |   100 |       1 |
| 小黄         |   100 |       2 |
| 小小         |   100 |       3 |
| 小美         |    90 |       4 |
| 小伟         |    88 |       5 |
| 小东         |    80 |       6 |
| 小明         |    70 |       7 |
| 小红         |    65 |       8 |
+--------------+-------+---------+
```

#### 1.1 mysql5.7实现

##### 1.1.1 使用自定义变量(外部sql)

```sql
SET @cur_rank := 0;
SELECT
	student_name,
	score,
	@cur_rank := @cur_rank + 1 AS ranking 
FROM
	forlan_score 
ORDER BY
	score DESC;
```

##### 1.1.2 使用自定义变量(内部sql)(推荐)

```sql
SELECT
	fs.student_name,
	fs.score,
	( @cur_rank := @cur_rank + 1 ) AS ranking 
FROM
	forlan_score fs,
	( SELECT @cur_rank := 0 ) r 
ORDER BY
	score DESC;
```

#### 2.1 mysql8实现

##### 2.1.1 使用 ROW_NUMBER()

```sql
SELECT
	student_name,
	score,
	ROW_NUMBER() OVER ( ORDER BY score DESC ) AS ranking 
FROM
	forlan_score;
```



### 2. 排名并列且连续

效果：

```
+--------------+-------+---------+
| student_name | score | ranking |
+--------------+-------+---------+
| 小林         |   100 |       1 |
| 小黄         |   100 |       1 |
| 小小         |   100 |       1 |
| 小美         |    90 |       2 |
| 小伟         |    88 |       3 |
| 小东         |    80 |       4 |
| 小明         |    70 |       5 |
| 小红         |    65 |       6 |
+--------------+-------+---------+
```

#### 2.1 mysql5.7实现

##### 2.1.1 使用自定义变量 + IF

```sq
SELECT
	fs.student_name,
	fs.score,
	IF( @pre_score = fs.score, @cur_rank, @cur_rank := @cur_rank + 1 ) AS ranking,
	@pre_score := fs.score 
FROM
	forlan_score fs,( SELECT @cur_rank := 0, @pre_score := NULL ) r 
ORDER BY
	fs.score DESC;
```

##### 2.1.2 使用自定义变量 + CASE WHEN

```sql
SELECT
	fs.student_name,
	fs.score,
	(
		CASE
			WHEN @pre_score = fs.score THEN @cur_rank 
			WHEN @pre_score := fs.score THEN @cur_rank := @cur_rank + 1 
		END 
	) AS ranking 
	FROM
		forlan_score fs,(SELECT @cur_rank := 0,@pre_score := NULL) r 
ORDER BY
	fs.score DESC;
```

#### 2.2 mysql8实现

##### 2.2.1 使用 DENSE_RANK()

```sql
SELECT
	student_name,
	score,
	DENSE_RANK() OVER ( ORDER BY score DESC ) AS ranking 
FROM
	forlan_score;
```



### 3. 排名并列但不连续

效果：

```
+--------------+-------+---------+
| student_name | score | ranking |
+--------------+-------+---------+
| 小林         |   100 |       1 |
| 小黄         |   100 |       1 |
| 小小         |   100 |       1 |
| 小美         |    90 |       4 |
| 小伟         |    88 |       5 |
| 小东         |    80 |       6 |
| 小明         |    70 |       7 |
| 小红         |    65 |       8 |
+--------------+-------+---------+
```

#### 3.1 mysql5.7实现

##### 3.1.1 使用自定义变量 + IF

```sql
SELECT
	fs.student_name,
	fs.score,
	@row_num := @row_num + 1,
	IF( @pre_score = fs.score, @cur_rank, @cur_rank := @row_num ) AS ranking,
	@pre_score := fs.score 
FROM
	forlan_score fs,
	(SELECT @cur_rank := 0,@pre_score := NULL,@row_num := 0 ) r 
ORDER BY
	fs.score DESC;
```

##### 3.1.1 使用自定义变量 + CASE WHEN

```sql
SELECT
	fs.student_name,
	fs.score,
	@row_num := @row_num + 1,
	( CASE WHEN @pre_score = fs.score THEN @cur_rank WHEN @pre_score := fs.score THEN @cur_rank := @row_num END ) AS ranking 
FROM
	forlan_score fs,
	( SELECT @cur_rank := 0, @pre_score := NULL, @row_num := 0 ) r 
ORDER BY
	fs.score DESC;
```

#### 3.2 mysql8实现

##### 3.2.1 使用 RANK()

```sql
SELECT
	student_name,
	score,
	RANK() OVER ( ORDER BY score DESC ) AS ranking 
FROM
	forlan_score;
```



## 三、按照课程分组实现排名

### 1. 排名不重复但连续

效果：

```
+--------------+-------------+-------+---------+
| student_name | course_name | score | ranking |
+--------------+-------------+-------+---------+
| 小林         | 数学        |   100 |       1 |
| 小小         | 数学        |   100 |       2 |
| 小明         | 数学        |    70 |       3 |
| 小美         | 英语        |    90 |       1 |
| 小伟         | 英语        |    88 |       2 |
| 小红         | 英语        |    65 |       3 |
| 小黄         | 语文        |   100 |       1 |
| 小东         | 语文        |    80 |       2 |
+--------------+-------------+-------+---------+
```

#### 1.1 mysql5.7实现

##### 1.1.1 使用自定义变量 + IF

```sql
SELECT
	fs.student_name,
	fs.course_name,
	fs.score,
	IF(@cur_couse = course_name, @cur_rank := @cur_rank+1, @cur_rank :=1) AS ranking,
	@cur_couse := fs.course_name
FROM
	forlan_score fs,
	( SELECT @cur_rank := 0,  @cur_couse := NULL ) r 
ORDER BY
	fs.course_name,fs.score DESC;
```

#### 1.2 mysql8实现

##### 1.2.1 使用 ROW_NUMBER()

```sql
SELECT
	student_name,
	course_name,
	score,
	ROW_NUMBER() OVER (PARTITION BY course_name ORDER BY course_name,score DESC) AS ranking
FROM
	forlan_score;
```



### 2. 排名并列且连续

效果：

```
+--------------+-------------+-------+---------+
| student_name | course_name | score | ranking |
+--------------+-------------+-------+---------+
| 小林         | 数学        |   100 |       1 |
| 小小         | 数学        |   100 |       1 |
| 小明         | 数学        |    70 |       2 |
| 小美         | 英语        |    90 |       1 |
| 小伟         | 英语        |    88 |       2 |
| 小红         | 英语        |    65 |       3 |
| 小黄         | 语文        |   100 |       1 |
| 小东         | 语文        |    80 |       2 |
+--------------+-------------+-------+---------+
```

#### 2.1 mysql5.7实现

##### 2.1.1 使用自定义变量 + IF

```sql
SELECT
	fs.student_name,
	fs.course_name,
	fs.score,
	IF(@cur_couse = course_name, IF( @pre_score = fs.score, @cur_rank, @cur_rank := @cur_rank+1 ), @cur_rank :=1) AS ranking,
	@pre_score := fs.score,
	@cur_couse := fs.course_name
FROM
	forlan_score fs,
	( SELECT @cur_rank := 0, @pre_score := NULL, @cur_couse := NULL ) r 
ORDER BY
	fs.course_name,fs.score DESC;
```

#### 2.2 mysql8实现

##### 2.2.1 使用 DENSE_RANK()

```sql
SELECT
	student_name,
	course_name,
	score,
	DENSE_RANK() OVER (PARTITION BY course_name ORDER BY course_name,score DESC) AS ranking
FROM
	forlan_score;
```



### 3. 排名并列但不连续

效果：

```
+--------------+-------------+-------+---------+
| student_name | course_name | score | ranking |
+--------------+-------------+-------+---------+
| 小林         | 数学        |   100 |       1 |
| 小小         | 数学        |   100 |       1 |
| 小明         | 数学        |    70 |       3 |
| 小美         | 英语        |    90 |       1 |
| 小伟         | 英语        |    88 |       2 |
| 小红         | 英语        |    65 |       3 |
| 小黄         | 语文        |   100 |       1 |
| 小东         | 语文        |    80 |       2 |
+--------------+-------------+-------+---------+
```

#### 3.1 mysql5.7实现

##### 3.1.1 使用自定义变量 + IF

```sql
SELECT
	fs.student_name,
	fs.course_name,
	fs.score,
	IF(@cur_couse = course_name, @row_num := @row_num + 1, @row_num :=1),
	IF(@cur_couse = course_name, IF( @pre_score = fs.score, @cur_rank, @cur_rank := @row_num ),@cur_rank :=1) AS ranking,
	@pre_score := fs.score,
	@cur_couse := fs.course_name
FROM
	forlan_score fs,
	( SELECT @cur_rank := 0, @pre_score := NULL, @row_num := 0,@cur_couse := NULL ) r 
ORDER BY
	fs.course_name,fs.score DESC;
```

#### 3.2 mysql8实现

##### 3.2.1 使用 RANK()

```sql
SELECT
	student_name,
	course_name,
	score,
	RANK() OVER (PARTITION BY course_name ORDER BY course_name,score DESC) AS ranking
FROM
	forlan_score;
```



## 四、参考文章

- [MySQL8 根据某属性查询字段排名由自定义变量到rank()的变动](https://www.cnblogs.com/xxsdbk/p/15413287.html)

