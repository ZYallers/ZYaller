[//]:# (2018/6/28 12:38|API|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/b33abca8847476519041cff3ef49070da8457ebd.jpg)
# Chrome怎么导出扩展程序（插件）为crx文件
> [百度经验](https://jingyan.baidu.com/article/9158e0004ff9bba25512284d.html)

现在都知道，现在Chrome浏览器的应用商店都打不开，进不去了，需要翻出去才能上。所以对于一些已经安装过的扩展程序（插件）想导出保存一下。因为Chrome默认安装在C盘，怕重装系统后又要重新安装这些插件了。Chrome其实也自带了这种功能。

## 1.打开扩展程序页

打开Chrome菜单中的“更多工具”项中的“扩展程序”。当然，你也可以打开“设置”项，然后再打开扩展程序页。我们就可以看到有“打包扩展程序”这个选项。

![image](https://imgsa.baidu.com/exp/w=480/sign=10140a15b08f8c54e3d3c4270a282dee/d0c8a786c9177f3ed84c30f674cf3bc79e3d56d5.jpg)

## 2.找到扩展程序目录

Chrome安装的扩展程序其实都保存在本地磁盘了。Win7系统下Chrome扩展程序的默认保存目录在：C:\Users\Administrator\AppData\Local\Google\Chrome\User Data\Default\Extensions （其中Administrator为当前系统用户，我的就是Administrator）。找到目录后，可以看到目录下有好些都是n多字母为文件名的文件。

![image](https://imgsa.baidu.com/exp/w=480/sign=9c66a364a00f4bfb8cd09f5c334e788f/060828381f30e924a6fd50ca48086e061c95f7f4.jpg)

## 3.查看需要打包的扩展程序的ID

在Chrome的扩展程序页中，可以看到每个安装的扩展的ID（都是唯一的）和版本。版本是很有必要的，比如这个扩展的版本是3.1.4。

![image](http://h.hiphotos.baidu.com/exp/w=480/sign=1c01f5f88344ebf86d716537e9f8d736/0df431adcbef76093c5755642adda3cc7dd99ee9.jpg)

## 4.找到扩展程序对应的文件夹

知道ID和版本号后，再到Extensions目录下查找该ID对应的文件夹。

![image](http://a.hiphotos.baidu.com/exp/w=480/sign=be952cf2b2003af34dbadd68052bc619/2e2eb9389b504fc25d247cfee1dde71191ef6dd6.jpg)

打开文件夹后，找到对应的版本号。也可以看一下文件夹中的文件。

![image](http://a.hiphotos.baidu.com/exp/w=500/sign=baca40ca4e90f60304b09c470913b370/8b13632762d0f703a1c759270cfa513d2797c5d0.jpg)

## 5.打包扩展程序

### 5.1.打开扩展程序页中的“打包扩展程序”按钮

![image](http://c.hiphotos.baidu.com/exp/w=500/sign=0cbde21ea96eddc426e7b4fb09dab6a2/eac4b74543a98226cdb5e7dc8e82b9014b90ebd1.jpg)

### 5.2.选择要打包的扩展程序的根目录

该扩展程序的根目录就是刚才找到的Chrome的Extensions目录下的该扩展ID目录下的，以版本号为名的文件夹。比如这个ID的就是3.1.4_0。

![image](http://c.hiphotos.baidu.com/exp/w=500/sign=fecca71489b1cb133e693c13ed5556da/bba1cd11728b471073763137c7cec3fdfd0323f4.jpg)

![image](http://h.hiphotos.baidu.com/exp/w=500/sign=5e6c45fa586034a829e2b881fb1249d9/9e3df8dcd100baa10a588b404310b912c9fc2ed1.jpg)

### 5.3.生成打包好的crx文件

选择好目录后，最后点击“打包扩展程序”。打包完成后会提示你打包好的文件位置，其实就是在ID为名的文件夹下。

![image](http://h.hiphotos.baidu.com/exp/w=500/sign=5e7bf39eb719ebc4c0787699b227cf79/0b7b02087bf40ad145930b18532c11dfa8ecced2.jpg)

![image](http://g.hiphotos.baidu.com/exp/w=500/sign=47b950278e13632715edc233a18ea056/6159252dd42a283462fdfaf05fb5c9ea14cebff6.jpg)

![image](http://h.hiphotos.baidu.com/exp/w=500/sign=b1b52cf2b2003af34dbadc60052bc619/37d12f2eb9389b50c8a42ca98135e5dde6116ef6.jpg)

## 6.安装扩展程序

需要安装扩展程序的时候，直接把.crx的文件拖动到Chrome的扩展程序页上就行。
提示你是否要添加，点击添加即可。

![image](http://c.hiphotos.baidu.com/exp/w=500/sign=78db0fc8778da9774e2f862b8050f872/63d0f703918fa0ec3ab1a8f6229759ee3c6ddbd3.jpg)







