# MySQL查看数据表的结构和注释

> http://blog.sina.com.cn/s/blog_969b47ce0102uydm.html

```mysql
USE `activities`;
SHOW FULL COLUMNS FROM `et_user_commend`;
```
结果展示：
```bash
mysql> SHOW FULL COLUMNS FROM et_user_commend;
+-------------+---------------------+-----------+------+-----+---------------------+-----------------------------+---------------------------------+------------------------------------------------------------+
| Field       | Type                | Collation | Null | Key | Default             | Extra                       | Privileges                      | Comment                                                    |
+-------------+---------------------+-----------+------+-----+---------------------+-----------------------------+---------------------------------+------------------------------------------------------------+
| id          | bigint(20) unsigned | NULL      | NO   | PRI | NULL                | auto_increment              | select,insert,update,references | 主键id                                                     |
| user_id     | int(11) unsigned    | NULL      | NO   | MUL | 0                   |                             | select,insert,update,references | 用户ID                                                     |
| type        | tinyint(1)          | NULL      | NO   | MUL | 0                   |                             | select,insert,update,references | 点赞对象的类型，文章=0/评论=1/动态=2/课程=3/100=随身听音频 |
| data_id     | int(10)             | NULL      | NO   |     | 0                   |                             | select,insert,update,references | 点赞对象的id                                               |
| ip          | int(11)             | NULL      | NO   |     | 0                   |                             | select,insert,update,references | ip                                                         |
| create_time | timestamp           | NULL      | NO   |     | 0000-00-00 00:00:00 |                             | select,insert,update,references | 创建时间                                                   |
| update_time | timestamp           | NULL      | NO   |     | CURRENT_TIMESTAMP   | on update CURRENT_TIMESTAMP | select,insert,update,references | 更新时间                                                   |
+-------------+---------------------+-----------+------+-----+---------------------+-----------------------------+---------------------------------+------------------------------------------------------------+
7 rows in set
```
试了其他几种方式，还是觉得这种方式简单方便些。
