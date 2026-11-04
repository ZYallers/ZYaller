# Macbook怎么开启HiDPI模式方法
> http://iphone.265g.com/faq/164339.html

HiDPI模式能够帮助Mac用户获得更细腻的显示效果，并且黑苹果也同样适用，下面为大家介绍一下如何开启。

## 1. 开启 HiDPI
打开终端输入：
```shell
sudo defaults write /Library/Preferences/com.apple.windowserver.plist DisplayResolutionEnabled -bool true
```

按下回车键后，输入当前系统管理员的密码，再次按下回车键确认。

## 2. 获取显示器的两个ID

这一点非常重要，分别是 `DisplayVendorID` 和 `DisplayProductID`，前者用于命名文件夹，后者用于命名文件。

打开终端, 命令分别是:
```shell
ioreg -l | grep "DisplayVendorID"
ioreg -l | grep "DisplayProductID"
```
输出结果：
```shell
 $ ioreg -l | grep "DisplayVendorID"
 $ "DisplayVendorID" = 4268
 $ ioreg -l | grep "DisplayProductID"
 $ "DisplayProductID" = 53358
```

记下这两个命令输出的 10 进制数字。

## 3. 将 10 进制数字转换为 16 进制

可使用在线转换工具([点击这里](http://tool.oschina.net/hexconvert/))。

## 4. 新建文件夹

在任意位置新建一个文件夹。文件夹命名的模式是：DisplayVendorID-XXXX，其中 XXXX 是 DisplayVendorID 的 16 进制值小写。
然后在 DisplayVendorID-XXXX 的文件夹里新建一个名为：DisplayProductID-YYYY 的空文件(没有扩展名)。YYYY 就是 DisplayProductID 的 16 进制数字。
![image](http://i4.265g.com/images/201702/201702281756458316.jpg)

## 5. 创建 DisplayProductID-YYYY 文件的内容

在线生成显示器的配置文件([点击这里](https://comsysto.github.io/Display-Override-PropertyList-File-Parser-and-Generator-with-HiDPI-Support-For-Scaled-Resolutions/))，并把生成的文件内容复制出来。用记事本打开 DisplayProductID-YYYY，并把内容粘贴进去。

## 6. 拷贝文件到指定目录
把 DisplayVendorID-XXXX 文件夹拷贝到 /System/Library/Displays/Contents/Resources/Overrides/，(10.10 版本及以下为 /System/Library/Displays/Overrides/ )，然后重启设备。

## 7. 安装RDM
下载 RDM 方便切换分辨率([点击这里](http://avi.alkalay.net/software/RDM/)，安装好 RDM 即可。
![image](http://i4.265g.com/images/201702/201702281756546304.jpg)


