# Mac升级10.12，想要允许任何来源应用，如何操作？

进这篇文章的人应该都知道，在升级了macOS Sierra (10.12)版本后在“安全性与隐私”中不再有“任何来源”选项，如下图：

![image](http://www.fengimg.com/data/attachment/forum/201608/16/201233oamz6w0g0zmzzwzz.png)

这可不是好消息，若我们想要装一些收费却很好用，想用却米粒不足，有资源却要允许任何来源的朋友就不知该怎么办了。

经研究发现（好像网上也已经有人给出办法啦）
其实只要用我们万能的终端，这个问题还是能迎刃而解。

接下来，我们就打开终端，然后输入以下命令：
```shell
sudo spctl --master-disable
```
如下图：

![image](http://www.fengimg.com/data/attachment/forum/201608/16/201722f83pt8ccmp0j0jr0.png)

输入后，可能会让你输入电脑的密码，输入就可以（屏幕上不会显示，但你真的输入了，Linux和Unix核心输入密码都是这样的）

然后再重新打开安全隐私，就惊奇地发现，已经出现并选中“任何来源”了。

如下图：

![image](http://www.fengimg.com/data/attachment/forum/201608/16/202115tnzbacb69lzlcf1n.png)