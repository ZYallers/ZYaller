# linux shell case语句用法 以及 case default设置
> https://blog.csdn.net/weixin_42350212/article/details/80632160

case语句使用于需要进行多重分支的应用情况。

格式：
```bash
case $变量名 in
    模式1）
        命令序列1
    ;;
    模式2）
        命令序列2
    ;; 
    *）
        默认执行的命令序列     
    ;; 
    esac 
```

例子：
```bash
#!/bin/sh
case $1 in
    start | begin)
        echo "start something"
    ;;
    stop | end)
        echo "stop something"
    ;;
    *)
        echo "Ignorant"
    ;;
esac
```
```bash
#!/bin/sh 
SYSTEM=`uname -s` 
case $SYSTEM in 
    Linux) 
        echo "My system is Linux" 
        echo "Do Linux stuff here..." 
    ;; 
    FreeBSD) 
        echo "My system is FreeBSD" 
        echo "Do FreeBSD stuff here..." 
    ;; 
    *) 
        echo "Unknown system : $SYSTEM" 
        echo "I don't what to do..." 
    ;; 
esac
```