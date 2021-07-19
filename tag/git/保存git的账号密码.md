[//]:# (2021/6/29 15:55|GIT|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/c6aa0789b72b81a7fb4c8e311c0fdd25db0b2ad0.jpg)
# 保存git的账号密码
> https://www.cnblogs.com/houchaoying/p/9002007.html

在弄jenkins建发版，遇到了git下载每次都要输入账号密码，所以百度了一下保存git账号密码的方法。

## 一、通过文件方式

1. 在~/下， touch创建文件 .git-credentials, 用vim编辑此文件，输入内容格式：

```bash
touch .git-credentials
vim .git-credentials
```

然后切换输入模式，输入：`https://{username}:{password}@github.com `

比如: `https://account:password@github.com`

2. 在终端下执行: 

```bash
git config --global credential.helper store
```

可以看到 `~/.gitconfig` 文件，会多了一项：
```bash
[credential]
helper = store
```

## 二、通过缓存方式

> 要求：git版本需要>=1.7.10

```bash
git config --global credential.helper cache

# 默认缓存密码15分钟，可以改得更长, 比如1小时
git config --global credential.helper 'cache --timeout=3600'
```





