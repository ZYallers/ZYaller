[//]:# (2017/7/21 10:34|GIT|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/b6a2bbaf4908390ca8341928c4eecfe216deb26d.png)
# Fatal: cannot do a partial commit during a merge

在提交单个文件的时候出现这个错误，意思是不能部分提交代码。原因是Git认为你有部分代码没有做好提交的准备。比如没有添加...

## 解决方法

### 1、提交全部
```bash
git commit -a
```
### 2、如果不想提交全部,那么可以通过添加 -i 选项
```bash
git commit file/to/path -i -m "merge"
```
上述情况一般出现在解决本地working copy冲突时出现, 本地文件修改(手工merge)完成后,要添加并提交,使得本地版本处于clean的状态。这样以后git pull就不再会报错！