# MySQL在100万级别数据中随机获取一条或多条记录之RAND()优化
> http://blog.csdn.net/yeshencat/article/details/73504036

处理业务中，有这样的需求，例如：有100W甚至更多的用户，此时我们要随机一条男性或者女性用户出来做数据操作。基于这个需求，我们做一下实验。

## 基础准备

1、准备一张用户表，结构如下
```mysql
CREATE TABLE `user` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `name` varchar(255) DEFAULT NULL COMMENT '用户姓名',
  `age` tinyint(3) unsigned DEFAULT 0 COMMENT '年龄',
  `gender` tinyint(3) unsigned DEFAULT 2 COMMENT '性别 2 人妖 1 男 0 女',
  `create_time` int(10) unsigned  DEFAULT 0 COMMENT '创建时间',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

2、简单写个MySQL储存
```mysql
DELIMITER ;;
USE `test`;;

DROP PROCEDURE IF EXISTS `autoFull`;;

CREATE DEFINER=`root`@`localhost` PROCEDURE`autoFull`(num INT)
BEGIN
    #Routine body goes here...
    DECLARE count INT DEFAULT 0;
    DECLARE i INT DEFAULT 0;
    set @exesql = concat("insert into user(name,age,gender,create_time) values ");
    set @exedata = "";
    while count<num do 
            set @exedata = concat(@exedata, ",('",MD5(i), "','", floor(rand()*37+18), "','", ROUND(RAND() * 1), "','",current_timestamp(), "')");
            set count=count+1;
            set i=i+1;
            if i%1000=0
            then 
                    set @exedata = SUBSTRING(@exedata, 2);
                    set @exesql = concat("insert into user(name,age,gender,create_time) values ", @exedata);
                    prepare stmt from @exesql;
                    execute stmt;
                    DEALLOCATE prepare stmt;
                    set @exedata = "";
            end if;
    end while;
    
    if length(@exedata)>0 
    then 
            set @exedata = SUBSTRING(@exedata, 2);
            set @exesql = concat("insert into user(name,age,gender,create_time) values ", @exedata);
            prepare stmt from @exesql;
            execute stmt;
            DEALLOCATE prepare stmt;
    end if;
END;;
DELIMITER ;
```

## 具体步骤
```bash
mysql> use test
Database changed
mysql> 

mysql> CREATE TABLE `user` (
    ->   `uid` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    ->   `name` varchar(255) DEFAULT NULL COMMENT '用户姓名',
    ->   `age` tinyint(3) unsigned DEFAULT 0 COMMENT '年龄',
    ->   `gender` tinyint(3) unsigned DEFAULT 2 COMMENT '性别 2 人妖 1 男 0 女',
    ->   `create_time` int(10) unsigned  DEFAULT 0 COMMENT '创建时间',
    ->   PRIMARY KEY (`uid`)
    -> ) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

mysql> DELIMITER ;;
mysql> 
mysql> DROP PROCEDURE IF EXISTS `autoFull`;;
Query OK, 0 rows affected (0.00 sec)

mysql>  
mysql> CREATE DEFINER=`root`@`localhost` PROCEDURE`autoFull`(num INT)
    -> BEGIN
    -> #Routine body goes here...
    -> DECLARE count INT DEFAULT 0;
    -> DECLARE i INT DEFAULT 0;
    -> set @exesql = concat("insert into user(name,age,gender,create_time) values ");
    -> set @exedata = "";
    -> while count<num do 
    -> set @exedata = concat(@exedata, ",('",MD5(i), "','", floor(rand()*37+18), "','", ROUND(RAND() * 1), "','",current_timestamp(), "')");
    -> set count=count+1;
    -> set i=i+1;
    -> if i%1000=0
    -> then 
    -> set @exedata = SUBSTRING(@exedata, 2);
    -> set @exesql = concat("insert into user(name,age,gender,create_time) values ", @exedata);
    -> prepare stmt from @exesql;
    -> execute stmt;
    -> DEALLOCATE prepare stmt;
    -> set @exedata = "";
    -> end if;
    -> end while;
    -> 
    -> if length(@exedata)>0 
    -> then 
    -> set @exedata = SUBSTRING(@exedata, 2);
    -> set @exesql = concat("insert into user(name,age,gender,create_time) values ", @exedata);
    -> prepare stmt from @exesql;
    -> execute stmt;
    -> DEALLOCATE prepare stmt;
    -> end if;
    -> END;;
Query OK, 0 rows affected (0.00 sec)

mysql> DELIMITER ;//还原界定符

mysql> call autoFull(1000000);
Query OK, 0 rows affected, 64 warnings (1 min 3.81 sec)
//调用下储存
```

查看下自己的储存
```bash
mysql> select count(uid) from user;
+------------+
| count(uid) |
+------------+
|    1000001 |
+------------+
1 row in set (0.20 sec)
```

原始简单粗暴的 SQL 语句 select * from user order by RAND() LIMIT 1; (切勿使用)
```bash
mysql> select * from user order by RAND() LIMIT 1;
+--------+----------------------------------+------+--------+-------------+
| uid    | name                             | age  | gender | create_time |
+--------+----------------------------------+------+--------+-------------+
| 318393 | 48f8b305de34c87af8143fe1f24732ad |   24 |      0 |        2017 |
+--------+----------------------------------+------+--------+-------------+
1 row in set (17.19 sec)
```

简单分析下：
```bash
mysql> explain select * from user order by RAND() LIMIT 1;
+----+-------------+-------+------+---------------+------+---------+------+---------+---------------------------------+
| id | select_type | table | type | possible_keys | key  | key_len | ref  | rows    | Extra                           |
+----+-------------+-------+------+---------------+------+---------+------+---------+---------------------------------+
|  1 | SIMPLE      | user  | ALL  | NULL          | NULL | NULL    | NULL | 1000340 | Using temporary; Using filesort |
+----+-------------+-------+------+---------------+------+---------+------+---------+---------------------------------+
1 row in set (0.00 sec)
```
- type => all 呵呵，全表扫描 1000340 条数据
- key => null 且没有索引，我们是随机查询
- MySql 手册专门有提醒在 Order by 后面不能使用 RAND() 函数，会导致全表扫描

简单优化 SQL 语句, 使用join
```mysql
 SELECT * FROM user  AS u1  JOIN (SELECT ROUND(RAND() * ((SELECT MAX(uid) FROM `user`)-(SELECT MIN(uid) FROM user))+(SELECT MIN(uid) FROM user)) AS uid) AS u2 WHERE u1.uid >= u2.uid ORDER BY u1.uid LIMIT 1
```

测试下：
```bash
mysql> SELECT * FROM user  AS u1  JOIN (SELECT ROUND(RAND() * ((SELECT MAX(uid) FROM `user`)-(SELECT MIN(uid) FROM user))+(SELECT MIN(uid) FROM user)) AS uid) AS u2 WHERE u1.uid >= u2.uid ORDER BY u1.uid LIMIT 1
    -> ;
+--------+----------------------------------+------+--------+-------------+--------+
| uid    | name                             | age  | gender | create_time | uid    |
+--------+----------------------------------+------+--------+-------------+--------+
| 798024 | c1a781e16b45f2ddc18b42365b8b0903 |   48 |      0 |        2017 | 798024 |
+--------+----------------------------------+------+--------+-------------+--------+
1 row in set (0.14 sec)
```

以上测试发现快了不少，来分析下这个SQL语句，该SQL 语句的核心 Join和随机，随机的基本公式: RAND()*(max-min)+mix,随机出一个 uid as u2 然后 条件查询，uid 自建索引，效率蛮高的。

```bash
mysql> explain SELECT * FROM user  AS u1  JOIN (SELECT ROUND(RAND() * ((SELECT MAX(uid) FROM `user`)-(SELECT MIN(uid) FROM user))+(SELECT MIN(uid) FROM user)) AS uid) AS u2 WHERE u1.uid >= u2.uid ORDER BY u1.uid LIMIT 1;
+----+-------------+------------+--------+---------------+---------+---------+------+--------+------------------------------+
| id | select_type | table      | type   | possible_keys | key     | key_len | ref  | rows   | Extra                        |
+----+-------------+------------+--------+---------------+---------+---------+------+--------+------------------------------+
|  1 | PRIMARY     | <derived2> | system | NULL          | NULL    | NULL    | NULL |      1 |                              |
|  1 | PRIMARY     | u1         | range  | PRIMARY       | PRIMARY | 4       | NULL | 500170 | Using where                  |
|  2 | DERIVED     | NULL       | NULL   | NULL          | NULL    | NULL    | NULL |   NULL | No tables used               |
|  5 | SUBQUERY    | NULL       | NULL   | NULL          | NULL    | NULL    | NULL |   NULL | Select tables optimized away |
|  4 | SUBQUERY    | NULL       | NULL   | NULL          | NULL    | NULL    | NULL |   NULL | Select tables optimized away |
|  3 | SUBQUERY    | NULL       | NULL   | NULL          | NULL    | NULL    | NULL |   NULL | Select tables optimized away |
+----+-------------+------------+--------+---------------+---------+---------+------+--------+------------------------------+
6 rows in set (0.01 sec)
```

如果想随机多条呢？修改LIMIT？来看看

```bash
mysql> SELECT * FROM user  AS u1  JOIN (SELECT ROUND(RAND() * ((SELECT MAX(uid) FROM `user`)-(SELECT MIN(uid) FROM user))+(SELECT MIN(uid) FROM user)) AS uid) AS u2 WHERE u1.uid >= u2.uid ORDER BY u1.uid LIMIT 5;

mysql> SELECT * FROM user  AS u1  JOIN (SELECT ROUND(RAND() * ((SELECT MAX(uid) FROM `user`)-(SELECT MIN(uid) FROM user))+(SELECT MIN(uid) FROM user)) AS uid) AS u2 WHERE u1.uid >= u2.uid ORDER BY u1.uid LIMIT 5;
+--------+----------------------------------+------+--------+-------------+--------+
| uid    | name                             | age  | gender | create_time | uid    |
+--------+----------------------------------+------+--------+-------------+--------+
| 948535 | da2c5dbe42945a0cc5b46a1e6acf746b |   46 |      0 |        2017 | 948535 |
| 948536 | 8b6f00e7098d215d4a85b160fcbbce4f |   22 |      1 |        2017 | 948535 |
| 948537 | d3caa715182997a67fdf3ab245ea53f3 |   24 |      1 |        2017 | 948535 |
| 948538 | 727659b109bfe2a21f8be7a5c1d1b301 |   27 |      0 |        2017 | 948535 |
| 948539 | 4b5038af305fb4629d38d067f806c7ab |   27 |      0 |        2017 | 948535 |
+--------+----------------------------------+------+--------+-------------+--------+
5 rows in set (0.00 sec)
```

如果使用以上的SQL语句，发现查询到的数据是连续的，我们要的是随机的，不难理解 LIMIT 5 得到当前查询条件的前五条，所以是相对连续的，uid 是自增的，因为用的是储存插入的，实际项目也是相对连续的。这条SQL 一次性查询无法达到我们的需求，则可分别一条条查询，如果要求的随机条数较多，那就不建议使用该条SQL语句了。

再来一条SQL语句
```bash
mysql>  SELECT * FROM user WHERE uid >= ((SELECT MAX(uid) FROM user)-(SELECT MIN(uid) FROM user)) * RAND() + (SELECT MIN(uid) FROM user) LIMIT 1
    -> ;
+------+----------------------------------+------+--------+-------------+
| uid  | name                             | age  | gender | create_time |
+------+----------------------------------+------+--------+-------------+
| 2343 | c8dfece5cc68249206e4690fc4737a8d |   34 |      0 |        2017 |
+------+----------------------------------+------+--------+-------------+
1 row in set (0.01 sec)
```

explain分析一下：
```bash
mysql> explain SELECT * FROM user WHERE uid >= ((SELECT MAX(uid) FROM user)-(SELECT MIN(uid) FROM user)) * RAND() + (SELECT MIN(uid) FROM user) LIMIT 1;
+----+-------------+-------+------+---------------+------+---------+------+---------+------------------------------+
| id | select_type | table | type | possible_keys | key  | key_len | ref  | rows    | Extra                        |
+----+-------------+-------+------+---------------+------+---------+------+---------+------------------------------+
|  1 | PRIMARY     | user  | ALL  | NULL          | NULL | NULL    | NULL | 1000340 | Using where                  |
|  4 | SUBQUERY    | NULL  | NULL | NULL          | NULL | NULL    | NULL |    NULL | Select tables optimized away |
|  3 | SUBQUERY    | NULL  | NULL | NULL          | NULL | NULL    | NULL |    NULL | Select tables optimized away |
|  2 | SUBQUERY    | NULL  | NULL | NULL          | NULL | NULL    | NULL |    NULL | Select tables optimized away |
+----+-------------+-------+------+---------------+------+---------+------+---------+------------------------------+
4 rows in set (0.00 sec)
```

看看随机多条
```bash
mysql> SELECT * FROM user WHERE uid >= ((SELECT MAX(uid) FROM user)-(SELECT MIN(uid) FROM user)) * RAND() + (SELECT MIN(uid) FROM user) limit 20;
+------+----------------------------------+------+--------+-------------+
| uid  | name                             | age  | gender | create_time |
+------+----------------------------------+------+--------+-------------+
|  786 | fc8001f834f6a5f0561080d134d53d29 |   24 |      0 |        2017 |
| 1961 | e4dd5528f7596dcdf871aa55cfccc53c |   54 |      1 |        2017 |
| 2958 | db5cea26ca37aa09e5365f3e7f5dd9eb |   27 |      0 |        2017 |
| 3122 | f231f2107df69eab0a3862d50018a9b2 |   43 |      1 |        2017 |
| 3445 | 12092a75caa75e4644fd2869f0b6c45a |   31 |      0 |        2017 |
| 4121 | 1b69ebedb522700034547abc5652ffac |   48 |      0 |        2017 |
| 4682 | 4f5c422f4d49a5a807eda27434231040 |   38 |      1 |        2017 |
| 4815 | 187acf7982f3c169b3075132380986e4 |   26 |      1 |        2017 |
| 5028 | f02208a057804ee16ac72ff4d3cec53b |   19 |      0 |        2017 |
| 5182 | fa3dade3a49305f27f64203452ac954c |   32 |      1 |        2017 |
| 5245 | b49d4455d64520060ac01fb5a3c757e4 |   34 |      1 |        2017 |
| 5405 | bb1443cc31d7396bf73e7858cea114e1 |   40 |      1 |        2017 |
| 5486 | 03b2ceb73723f8b53cd533e4fba898ee |   21 |      0 |        2017 |
| 5700 | 7f848746fe2599dc199a75f0d02fc3d6 |   36 |      0 |        2017 |
| 5835 | f5f3b8d720f34ebebceb7765e447268b |   36 |      0 |        2017 |
| 5991 | 1ae6464c6b5d51b363d7d96f97132c75 |   49 |      1 |        2017 |
| 6064 | 09ccf3183d9e90e5ae1f425d5f9b2c00 |   36 |      0 |        2017 |
| 6160 | 08ad21c6f9da6bdf51ae0b971f43d96d |   31 |      1 |        2017 |
| 6306 | ccf0304d099baecfbe7ff6844e1f6d91 |   48 |      1 |        2017 |
| 6810 | 6194a1ee187acd6606989f03769e8f7f |   41 |      0 |        2017 |
+------+----------------------------------+------+--------+-------------+
20 rows in set (0.01 sec)
```

随机多条也是完美的，随机核心就是用 RAND() 随机出一个用户uid，或则随机区间，然后再进行limit 即可，此处基本阐述完了，欢迎大家批评指正。