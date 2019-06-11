# shell 查看端口占用情况 lsof，并关闭对应进程 kill
> https://newsn.net/say/linux-lsof-kill.html

查看某个端口号被哪个进程占用了，并且杀掉对应进程。
```bash
lsof -n -P| grep ":<端口号>" | grep LISTEN  #监听对应端口号的进程
lsof -i tcp:<端口号> #和对应端口号有关的进程
kill -9 <进程号>
```

```bash
lsof -n -P| grep ":80" | grep LISTEN
```
> 这条语句，就是查找哪个程序占用了80端口的意思

```bash
lsof -i tcp:80 
```
> 这条语句的时候，端口号，可能是进程占用着这个端口，也可能是访问着这个端口。需要具体情况具体分析。

```bash
kill -9 <进程号>
```
> kill的-9参数，是强制关闭的意思。

