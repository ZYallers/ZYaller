# linux实现按天生成日志文件并自动清理

前篇文章中讲到如何在Linux crontab创建每秒执行的方法，高人可能早意识到日志文件没做处理，假如没人工处理久了日后越来越大肯定会出现问题，当然人工处理也不现实。为了解决这个问题，所以有了这篇文章，此文章所描述的方法肯定不是最好的。

![image](https://raw.githubusercontent.com/ZYallers/ZYaller/master/upload/image/201705/25/1495682474209715.jpg)

### 1、按照天数输出日志文件

之前任务队列轮循输出的内容都默认写在一个文件里，现在改成每天生成一个日志文件。
`act_wdraw_accesslog_rds_list.sh`
```bash
for (( i=0; i<60; i=(i+step) )); do 
  $($phpexec -c $phpini -f $index_file weightDraw/Stat logAccess/30 >> /tmp/act_wdraw_access_log/`date +%Y-%m-%d`.log 2>&1) 
   sleep $step
done
exit 0
```
### 2、自动删除N天前的日志文件

日志文件虽然按天分开了，但其实还是没有解决占用磁盘越来越大的问题，所以需要加入自动删除计划任务，一般日志保存不会很久，我这里默认删除30天前的日志文件。

新建自动清理shell脚本 act_wdraw_accesslog_cleaner.sh
```bash
#!/bin/sh
find /tmp/act_wdraw_access_log/ -mtime +30 -name "*.log" -exec rm -rf {} \;
```
添加crontab计划任务。每天凌晨3点15分执行该清理日志脚本
```bash
15 3 * * * /apps/sh/act_wdraw_accesslog_cleaner.sh > /dev/null 2>&1
```