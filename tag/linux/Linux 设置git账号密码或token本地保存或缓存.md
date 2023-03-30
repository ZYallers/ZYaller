[//]:# "2023/3/30 15:12|LINUX"
# Linux 设置git账号密码本地保存或缓存

> 文章转载自：[博客园](https://www.cnblogs.com/houchaoying/p/9002007.html)

这里以Github为举例，其他GitLab等BitBucket版本控制服务基本操作差不多。

本身提供了多种认证方式，开发人员可以各取所需，但从2021年8月13日开始，在GitHub.com上执行Git操作时，不再接受以账户密码的形式完成身份验证，在所有需要身份验证的Git操作中使用基于令牌的验证机制，比如个人访问、OAuth或者GitHub App安装令牌。如果您目前正在使用密码通过GitHub.com对Git操作进行身份验证，则将很快收到一封电子邮件，敦促您更新身份验证方法或第三方客户端。

我们平日通常拿到token之后是这样拼接出远程仓库的地址，比如：

```https://$username:$token@github.com/$username/repo.git```

从以上地址克隆或使用git remote add 的方式关联本地仓库，之后都不需要输入用户名和密码信息。

但假如管理的git项目比较多，每次拼接地址会耗时一点。那有没设置一次，一劳永逸的方法？答案是有的，下面我介绍两种方法：

## 一、通过文件方式

1. 在~/下， touch创建文件 .git-credentials，用vim编辑此文件，输入内容格式：

   ```bash
   cd ~
   touch .git-credentials
   vim .git-credentials
   ```

   在里面按“i”，然后输入： https://{username}:{password}@github.com 

   > 这里{password}不单单是可以是账号密码，也可以是你设置的access_token。

2. 在终端下执行

   ```git config --global credential.helper store```

3. 可以看到~/.gitconfig文件，会多了一项

   ```bash
   [credential]
   helper = store
   ```

   至此，设置完成了。

   

## 二、通过缓存方式

> 要求：git版本需要>=1.7.10

```bash
git config --global credential.helper cache
# 默认缓存密码15分钟，可以改得更长, 比如1小时
git config --global credential.helper 'cache --timeout=3600'
```

