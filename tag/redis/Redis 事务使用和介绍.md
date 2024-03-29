[//]:# "2023/4/17 17:47|Redis"

# Redis 事务使用和介绍

> 文章转载自：[cnblog](https://www.cnblogs.com/wugongzi/p/16827473.html)

## 1. 基本使用

Redis 事务可以一次执行多条命令，Redis 事务有如下特点：

- 事务是一个单独的隔离操作：事务中的所有命令都会序列化、按顺序地执行。事务在执行的过程中，不会被其他客户端发送来的命令请求所打断。
- 事务是一个原子操作：事务中的命令要么全部被执行，要么全部都不执行。

Redis 事务通过 `MULTI` 、`EXEC`、`DISCARD`、`WATCH` 几个命令来实现，MULTI 命令用于开启事务，EXEC 用于提交事务，DISCARD 用于放弃事务，WATCH 可以为 Redis 事务提供 check-and-set （CAS）行为。

```bash
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set k1 1
QUEUED
127.0.0.1:6379> incr k1
QUEUED
127.0.0.1:6379> get k1
QUEUED
127.0.0.1:6379> set k3 2
QUEUED
127.0.0.1:6379> exec
1) OK
2) (integer) 2
3) "2"
4) OK
```

## 2. 发生错误

Redis事务发生错误分为两种情况

### 2.1 第一种：事务提交前发生错误

也就是在发送命令过程中发生错误，看演示

``` bash
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set k1 aa
QUEUED
127.0.0.1:6379> set k2 bb
QUEUED
127.0.0.1:6379> incr k1 k2 
(error) ERR wrong number of arguments for 'incr' command
127.0.0.1:6379> exec
(error) EXECABORT Transaction discarded because of previous errors.
127.0.0.1:6379> get k1
(nil)
```

上面我故意将 incr 命令写错，从结果我们可以看到，这条 incr 没有入队，并且事务执行失败，k1 和 k2 都没有值。

### 2.2 第二种：事务提交后发生错误

也就是在执行命令过程中发生错误，看演示

```bash
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set k1 d
QUEUED
127.0.0.1:6379> incr k1
QUEUED
127.0.0.1:6379> get k1
QUEUED
127.0.0.1:6379> exec
1) OK
2) (error) ERR value is not an integer or out of range
3) "d"
```

上面的事务命令中，我给 k1 设置了一个 d，然后执行自增命令，最后获取 k1 的值，我们发现第二条命令执行发生了错误，但是整个事务依然提交成功了，从上面现象中可以得出，**Redis 事务不支持回滚操作**。如果支持的话，整个事务的命令都不应该被执行。

## 3. 为什么Redis不支持回滚

如果你有使用关系式数据库的经验， 那么 “Redis 在事务失败时不进行回滚，而是继续执行余下的命令”这种做法可能会让你觉得有点奇怪。

以下是这种做法的优点：

- Redis 命令只会因为错误的语法而失败（并且这些问题不能在入队时发现），或是命令用在了错误类型的键上面：这也就是说，从实用性的角度来说，失败的命令是由编程错误造成的，而这些错误应该在开发的过程中被发现，而不应该出现在生产环境中。
- 因为不需要对回滚进行支持，所以 Redis 的内部可以保持简单且快速。

有种观点认为 Redis 处理事务的做法会产生 bug ， 然而需要注意的是， 在通常情况下， 回滚并不能解决编程错误带来的问题。 举个例子， 如果你本来想通过 incr 命令将键的值加上 1 ， 却不小心加上了 2 ， 又或者对错误类型的键执行了 incr ， 回滚是没有办法处理这些情况的。

## 4. 放弃事务

当执行 discard 命令时， 事务会被放弃， 事务队列会被清空， 并且客户端会从事务状态中退出

```bash
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set k1 a
QUEUED
127.0.0.1:6379> set k2 b
QUEUED
127.0.0.1:6379> discard
OK
127.0.0.1:6379> get k1
(nil)
```

## 5. WATCH命令使用

watch 使得 exec 命令需要有条件地执行： 事务只能在所有被监视键都没有被修改的前提下执行， 如果这个前提不能满足的话，事务就不会被执行。

```bash
127.0.0.1:6379> watch k1 k2
OK
127.0.0.1:6379> multi
OK
127.0.0.1:6379> set k1 2
QUEUED
127.0.0.1:6379> exec
(nil)
127.0.0.1:6379> get k1
(nil)
```

上面我用 watch 命令监听了 k1 和 k2，然后开启事务，在事务提交之前，k1的值被修改了，watch 监听到 k1 值被修改，所以事务没有被提交。

## 6. 脚本和事务

从定义上来说， Redis 中的脚本本身就是一种事务， 所以任何在事务里可以完成的事， 在脚本里面也能完成。 并且一般来说， 使用脚本要来得更简单，并且速度更快。

因为脚本功能是 Redis 2.6 才引入的， 而事务功能则更早之前就存在了， 所以 Redis 才会同时存在两种处理事务的方法。
