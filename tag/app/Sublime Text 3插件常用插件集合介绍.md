# Sublime Text 3插件常用插件集合介绍

## 前言

### 安装准备：Package Control

通俗易懂地说，这个是你在完成安装SublimeText后必须安装的东西。你问为什么？因为有了这个特殊的“插件包”，你可以很容易地安装、升 级、删除，甚至非常方便地查看您已经安装在SublimeText中的包或插件的列表。它通过菜单和对应的行为使这些过程变得非常容易和有组织。

- 找到菜单栏：Preferences → Package Control → Package Control:Install Package；
- 没有找到Package Control，那么点击 [Package Control](https://packagecontrol.io/installation) 安装吧，安装完重启Sublime。


### MarkdownEditing + MarkdownLivePreview
SublimeText不仅仅是能够查看和编辑 Markdown 文件，但它会视它们为格式很糟糕的纯文本。这个插件通过适当的颜色高亮和其它功能来更好地完成这些任务。

这两个插件作用是实现在Sublime里面可以实现编辑Markdown文档时时预览。

简单设置：

Preferences → Package Settings → MarkdownLivePreview → Setting，打开后将左边default的设置代码复制到右边User栏，找到"markdown_live_preview_on_open": false,把false改为true，保存。


### AdvancedNewFile

可以实现像一般IDE那样，在指定或选中的文件夹下新建文件，这里需要设置一下：找到"default_root": "project_folder",，把project_folder改为current，保存。


### Emment

概括地说，Emmet 是一个插件，它可以让你更快更高效地编写HTML和CSS，节省你大量的时间。怎么实现的？你只需使用约定的缩写形式而不用写整个代码，然后这些缩写会自动扩展转换为对应的有效的标签。 比如，你只需要输入 ((h4>a[rel=external])+p>img[width=500 height=320])*12 ，然后它会被扩展转换成12个列表项和紧随其后的图像。然后您可以填写上内容，就这么简单。


### SublimeLinter

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_511.gif)

这个插件最近才为SublimeText3重建和发布。新版本显然带来了很多新的和不同的功能，而不是把所有的Linter 放在一个包中，开发者允许你在更新时选择并安装你经常使用的Linter。很明显，这可以节省磁盘空间。“更多的定制”，这就是我需要的。

### PackageResourceViewer

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_51.gif)

通过这个特殊的插件，会给你查看和编辑SublimeText附带的不同的包带来很多方便。您也可以提取任何给定的包。这一行动将其复制到用户文件夹，以便您可以安全地对其进行编辑。

### GIt

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_971.gif)

虽然名字看上去并不友好，但作为开发者的你肯定一眼就能明白它是干什么的。这个插件会将Git整合进你的SublimeText，使的你可以在SublimeText中运行Git命令，包括添加，提交文件，查看日志，文件注解以及其它Git功能。

### Terminal

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_949.gif)

这个插件可以让你在Sublime中直接使用终端打开你的项目文件夹，并支持使用快捷键。


### CSSComb

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_505.gif)

这是用来给CSS属性进行排序的格式化插件。如果你想保持的代码干净整洁，并且希望按一定的顺序排列（是不是有点强迫症了？），那么这个插件是一种有效解决的方案。特别是当你和其他有自己代码编写风格的开发者一同协作的时候。

### Can I Use

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_731.gif)

如果您想检查浏览器是否支持你包括在你的代码中的CSS和HTML元素，那么这是你需要的插件。所有您需要做的就是选择有疑问的元素，插件将为你做其余的事情。

### Alignment

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_247.gif)

这个插件让你能对齐你的代码，包括 PHP、CSS 和 Javascript。代码看起来更简洁和可读，便于编辑。您可以查看下面的图片来明白我说的意思。

### Trmmer

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_916.gif)

你知道当你编写代码时，由于错误或别的某些原因，会产生一些不必要的空格。需要注意的是多余的空格有时也会造成错误。这个插件会自动删除这些不必要的空格。

### ColorPicker

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_937.gif)

如果你经常要查看或设置颜色值，这个插件可以很方便地调用你本机的调色板应用。（译者扩充：）这是一个双向的功能，你既可以在调色板中选择一个颜 色，然后按“确定”按钮把该值填写到 SublimeText 中活动文档的当前位置，也可以在活动文档中选择一个颜色的值，按此插件的快捷键就会在显示的调色板中定位到该值所对应的颜色。

### FileDiffs

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_519.gif)

这个插件允许你看到SublimeText中两个不同文件的差异。你可以比较的对象可以是从剪贴板中复制的数据，或工程中的文件，当前打开的文件等。

### DocBlockr

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_500.gif)

DocBlockr 可以使你很方便地对代码建立文档。它会解析函数，变量，和参数，根据它们自动生成文档范式，你的工作就是去填充对应的说明。

### SublimeCodeIntel

![](http://cdn.cocimg.com/ueditor/upload/image/20160225/1456389071910070.png)

SublimeCodeIntel 作为一个代码提示和补全插件，支持 JavaScript、Mason、XBL、XUL、RHTML、SCSS、Python、HTML、Ruby、Python3、XML、Sass、XSLT、Django、HTML5、Perl、CSS、Twig、Less、Smarty、Node.js、Tcl、TemplateToolkit 和 PHP 等所有语言，是 Sublime Text 自带代码提示功能基础上一个更好的扩展，自带代码提示功能只可提示系统代码，而SublimeCodeIntel则可以提示用户自定义代码。SublimeCodeIntel支持跳转到变量、函数定义的功能，另外还有自动补全的功能，十分方便。

### AutoPrefixr

写 CSS可自动添加 -webkit 等私有词缀，Ctrl+Alt+X触发。

### SideBarEnhancements

![](http://static.open-open.com/news/uploadImg/20140209/20140209103404_405.gif)

这个插件可以给SublimeText的边栏菜单带来扩充的功能，包括：在当前工程文件夹中新建文件，移动文件或文件夹，产生文件或文件夹的副本，在新窗口或浏览器中打开，刷新等。这只是概括地说，安装后探索它更多的功能吧。

### Theme – Soda

完美的编码主题，用过的都说好，Setting user里面添加"theme": "Soda Dark.sublime-theme"



