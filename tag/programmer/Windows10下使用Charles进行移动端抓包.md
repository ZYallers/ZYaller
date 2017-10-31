# windows10下使用Charles进行移动端抓包

> http://blog.csdn.net/android_1996/article/details/74279441

首先去官网下载Charles，地址：https://www.charlesproxy.com/，随后选择对应的系统版本进行下载即可。

## 配置
1、安装完以后，去掉windows proxy的勾选。原因是去掉后过滤掉PC上抓到的包，只抓取移动终端上的信息，如图：

![](http://img.blog.csdn.net/20160421144349363?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center/)

2、查看自己的IP:192.168.1.110（命令ipconfig）

 ![](http://img.blog.csdn.net/20160421144414176?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

3、代理设置，如下图所示：（默认端口：8888）

![](http://img.blog.csdn.net/20160421144438627?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQv/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/Center)

4、在手机上设置代理IP和端口

在手机上打开连接的WiFi -> 里面有个代理选项 -> 选择手动 -> 输入IP地址和端口号 -> 确定设置。

完成以后Charles会弹出一个对话框，选择允许抓取。

## 问题
如果没有弹出提示框，可以在Proxy -> Access Controll Settings里面添加自己手机的IP地址。

最后如果还不行，说明可能被Windows系统防火墙阻止了。
要么关闭本机的防火墙，要么在防火墙高级设置--->入站规则中设置允许Charles连接。 如果不关闭防火墙，Charles就抓不到包

以上如果都设置完了以后，再次运行程序Charles中就会显示对应的抓包数据。


