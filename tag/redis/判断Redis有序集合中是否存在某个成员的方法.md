# 判断Redis有序集合中是否存在某个成员的方法

## 方法一

有序集合中，redis没有命令直接判断有序集合中是否存在某个成员，但可以借助`ZLEXCOUNT`命令实现：<http://redis.cn/commands/zlexcount.html>

`ZLEXCOUNT key min max`

- 有序集合中成员名称 min 和 max 之间的成员数量; Integer类型。

命令使用示例如下：

```bash
127.0.0.1:6379> zrevrange zsetkey 0 -1
1) "e"
2) "d"
3) "c"
4) "b"
5) "a"
127.0.0.1:6379> zlexcount zsetkey [a [a
(integer) 1 # 存在
127.0.0.1:6379> zlexcount zsetkey [m [m
(integer) 0 # 不存在
```

php代码示例如下：

```php
public function checkExists($zsetkey, $member, $redis)
{
    $ret = intval($redis->zLexCount($zsetkey, '['.$member, '['.$member));
    return $ret > 0 ? true : false;
}
```

## 方法二

使用redis有序集合的`ZSCORE`命令实现：<http://redis.cn/commands/zscore.html>

`ZSCORE key member`

- 返回有序集key中，成员member的score值。
- 如果member元素不是有序集key的成员，或key不存在，返回nil。

命令使用示例如下：

```bash
127.0.0.1:6379> zadd myzset 1 "one"
(integer) 1
127.0.0.1:6379> zscore myzset "one"
"1"
127.0.0.1:6379> zscore myzset "two"
nil
```

php代码示例如下：

```php
public function checkExists($zsetkey, $member, $redis)
{
    $ret = $redis->zScore($zsetkey, $member);
    return false === $ret ? false : true;
}
```

## 参考资料

- 秋叶原 && Mike || 麦克|<http://blog.csdn.net/tennysonsky/article/details/70997922>
