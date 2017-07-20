# vim常用技巧

> 转载自：Linux学习笔记|www.kancloud.cn/curder/linux/106659

![image](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1496314728332&di=ca2856884f8dd6a2856eff5e586cc29e&imgtype=0&src=http%3A%2F%2Fdbpoo.qiniudn.com%2Fwp-content%2Fuploads%2F2014%2F10%2Fvim.jpg)

### 常用复制粘贴
```
d  删除
y  复制 (默认是复制到"寄存器")
p  粘贴 (默认从"寄存器"取出内容粘贴)
+y 复制到系统剪贴板(也就是vim的+寄存器) 
+p 从系统剪贴板粘贴 
u  撤销
v  从光标当前位置开始，光标所经过的地方会被选中，再按一下v结束。
V  从光标当前行开始，光标经过的行都会被选中，再按一下Ｖ结束。 
ggVG 文章全选（gg-到首行，V-选择行，G-到尾行）
```
### 显示行号/去掉行号:
```
set num / set number
set nonum / set number! / set nonumber
```
### 字符查找
```
/magic 从开始到结尾处搜索magic字符串
?magic 从结尾到开始出搜索magic字符串
```
### 字符替换
```
:%s/code/magic/g
```
### 把文件中所有匹配code的地方替换成magic
```
:%s/code/magic/gc
```
把文件中所有匹配code的地方替换成magic，但每次替换前会进行确认

### 在当前窗口中编辑其它文件

如当前编辑a.txt文件，保存后执行
```
:e b.txt
```
当前窗口会打开b.txt文件

### 分割窗口打开文件

有时候我们需要对比一个文件来进行修改另一个文件 ，此时，我们可以使用vim的分屏操作。

如当前编辑a.txt文件，执行
```
:split b.txt
```
我们就会发现当前窗口分为了两个屏幕，你可以按`Ctrl+W`进行屏幕间的切换。

执行`:hide`会关闭当前窗口。

执行`:nly`会关闭除当前窗口以外的所有窗口。

### 缩写

有时候我们有很长的一个字符串需要多次编写，这个时候我们就可以用VIM的简写。在命令行模式下键入
```
:ab magic magiclife
```
这样我们在插入模式下当如magic后按下回车就会自动将 magic 变为 magiclife 。

### vim与终端的切换

在用vim编写东西的时候，你往往想回到bash里面在去运行一些东西，可是额外开一个终端就有些浪费了，这里有两个可行的方法。

当你是在写shell脚本想运行脚本的时候，切换到底线命令行模式，这时候打`:sh`，vim就将会执行你的脚本并返回到终端，当想继续编写脚本时，只需按 `ctrl+d` 结束进程，就会继续切换回vim界面了。

只是想单纯的回到终端运行一些命令，则按下 `ctrl+z` 就可以stop掉vim，回到终端，当想回到vim时，只需按下`fg`并回车。