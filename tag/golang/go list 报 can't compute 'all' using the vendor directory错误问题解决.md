[//]:# "2022/1/17 10:40|GOLANG|"
# go list 报 can't compute 'all' using the vendor directory错误问题解决
> [CSDN](https://blog.csdn.net/zf766045962/article/details/106472122)

### 问题一

```bash
go list -m: can't compute 'all' using the vendor directory
	(Use -mod=mod or -mod=readonly to bypass.)

```

解决方法：
目前根据提示，我们需要删除代码库下vendor目录才能解决问题

```bash
rm -rf vendor
```

### 问题二

IDE里需要设置Proxy：`https://goproxy.cn,direct`

![IMG](https://img-blog.csdnimg.cn/2020060114443057.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3pmNzY2MDQ1OTYy,size_16,color_FFFFFF,t_70)

