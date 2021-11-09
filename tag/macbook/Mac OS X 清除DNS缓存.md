[//]:# (2021/11/09 11:09|MaCBOOK|https://img0.baidu.com/it/u=3364720490,2135423737&fm=26&fmt=auto)
# Mac OS X 清除DNS缓存
> [Wasdns](https://www.cnblogs.com/qq952693358/p/9126860.html)

根据Mac OS X操作系统的版本选择以下命令：

### Mac OS X 12 (Sierra) and later:
```bash
sudo killall -HUP mDNSResponder
sudo killall mDNSResponderHelper
sudo dscacheutil -flushcache
```

### Mac OS X 11 (El Capitan) and OS X 12 (Sierra):
```bash
sudo killall -HUP mDNSResponder
```

### Mac OS X 10.10 (Yosemite), Versions 10.10.4+:
```bash
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder
```

