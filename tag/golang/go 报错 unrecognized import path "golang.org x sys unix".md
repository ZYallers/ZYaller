# unrecognized import path "golang.org/x/sys/unix"
> https://blog.csdn.net/wzygis/article/details/89030353

安装的过程报错：
```bash
package golang.org/x/sys/unix: unrecognized import path "golang.org/x/sys/unix" (https fetch: Get https://golang.org/x/sys/unix?go-get=1: dial tcp 216.239.37.1:443: i/o timeout)
```
原因是该链接被墙了。

可以这么操作解决：
```bash
cd ~/go/src
mkdir -p golang.org/x
cd golang.org/x
git clone https://github.com/golang/sys.git
```