# shell sed awk 获取第几行 第几列
> https://blog.csdn.net/weixin_42350212/article/details/80558553

例如:我们需要查看 包含 sbin的进程 中的PID号

- 查看当前所有包含sbin的进程
```bash
[root@fea3 ~]# ps aux | grep sbin
```

![IMG](https://img-blog.csdn.net/20180603175932804?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjM1MDIxMg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

- 过滤出所有的PID号
```bash
[root@fea3 ~]# ps aux | grep sbin | awk '{print $2}'
```
> `awk '{print $2}'`: 过滤第2列;

![IMG](https://img-blog.csdn.net/20180603180331602?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjM1MDIxMg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

- 只获取前三行PID号
```bash
[root@fea3 ~]# ps aux | grep sbin | awk '{print $2}' | sed -n '1,3p'
```
![IMG](https://img-blog.csdn.net/20180603180642188?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3dlaXhpbl80MjM1MDIxMg==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

> `sed -n`: 指定行数； `-n '2p'`: 第二行；`-n '1,3p'`: 第一至三行。