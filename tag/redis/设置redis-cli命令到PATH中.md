# 设置redis-cli命令到PATH中 

> [pansanday的专栏](http://blog.csdn.net/pansanday/article/details/72625067)

#### 问题描述:

由于Redis-cli命令没有设置到PATH中, 每次想使用时, 都需要执行find命令去找这个命令在哪里
```shell
# find / -name redis-cli  
```
找到之后, 再执行命令, 这样实在太麻烦

#### 解决方案:

将redis-cli命令配置到PATH中, 这样每次使用时, 就像ls这种命令一样不加路径执行
```shell
# vi ~/.bash_profile  
```
将redis-cli命令路径配置到PATH中
```shell
PATH=$PATH:$HOME/bin:/usr/local/redis-3.2.8/src/  
```
保存之后, 使用source命令使之生效
```shell
# source ~/.bash_profile  
```

#### 参考文章:

[Linux将命令添加到PATH中](http://victorwmh.iteye.com/blog/1074854)