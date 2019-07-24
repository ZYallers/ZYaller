# shell 获得nohup后台运行进程的PID
> 转载自：https://www.jianshu.com/p/5a04e2452e3f

用nohup可以启动一个后台进程。让一个占用前台的程序在后台运行，并静默输出日志到文件：

```bash
nohup command > logfile.txt &
```

但是如果需要结束这个进程，一般做法是用ps命令找出这个进程，用grep过滤进程名，最后得到pid，然后再用kill命令结束进程：

```bash
ps -ef | grep command | grep -v grep | awk '{print $2}' |xargs kill -9
```

有一个更简单的办法是，在用nohup创建进程时，就用 shell 的特殊变量 `$!` 把最后一个后台进程的 `PID` 保存下来：

```bash
nohup command > logfile.txt & 
echo $! > command.pid
```

需要结束进程的时候，直接进行kill：

```bash
kill -9 `cat command.pid`
```

### 附：Shell中的特殊变量说明

变量	| 说明
---|---
$$ | Shell本身的PID（ProcessID）
$! | Shell最后运行的后台Process的PID
$? | 最后运行的命令的结束代码（返回值）
$- | 使用Set命令设定的Flag一览
$* | 所有参数列表。如"$*"用「"」括起来的情况、以"$1 $2 … $n"的形式输出所有参数
$@ | 所有参数列表。如"$@"用「"」括起来的情况、以"$1" "$2" … "$n" 的形式输出所有参数
$# | 添加到Shell的参数个数
$0 | Shell本身的文件名
$1～$n | 添加到Shell的各参数值。$1是第1参数、$2是第2参数...$n是第n参数


