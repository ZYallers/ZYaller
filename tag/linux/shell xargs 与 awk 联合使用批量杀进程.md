# shell xargs 与 awk 联合使用批量杀进程
> https://blog.csdn.net/foxliucong/article/details/4224965

shell例子：
```bash
ps -ef|grep monitor_psr.sh|grep iboss2|grep ismp|grep -v grep|awk '{print $2}'|xargs kill -9
```

说明：
1. `$2` 表示第2列,即进程号PID; `awk` 很强大,这里不再详细介绍;
2. `grep -v grep` 是列出除开 grep 命令本身的进程,`grep iboss2` 确认进程关键字
3. `kill -9` 强杀进程;
4. `xargs` 使用上一个操作的结果作为下一个命令的参数使用

本来就是针对字符的操作，无需使用 `XAGRS`,直接管道即可.对于不是对字符进行操作的才需要用 `xargs`。

例如：
```bash
ps -ef|grep mm|xargs wc -l  # WRONG
ps -ef|grep mm|wc -l        # RIGHT
```
5. `grep ismp` 加这个为了更加保险,确实此进程是 `ismp` 这个 `UNIX USER` 建立的进程,避免误杀进程;

对打开这个进程的用户 `ismp` 再进行一次搜索过滤，避免把别的用户的进程杀掉了。