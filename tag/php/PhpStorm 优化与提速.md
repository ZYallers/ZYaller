# PhpStorm 优化与提速
> https://learnku.com/articles/22458

### 相关链接
- [插件](http://plugins.jetbrains.com/phpstorm) - 官网插件。
- [注册](http://idea.lanyus.com/) - IntelliJ IDEA 注册码。
- [主题](http://daylerees.github.io/) -Daylerees 主题预览

### 推荐插件
- Laravel Plugin - 支持 Laravel
- .env files support - 支持.env 文件
- BashSupport - 支持 Bash
- EditorConfig - 支持 EditorConfig 标准
- Handlebars/Mustache - 支持 Handlebars、Mustache
- Ideolog - 有好的插件 .log 文件
- Material Theme UI - Material Theme 主题
- .ignore - 友好的查看 .ignore 文件
- NodeJS - 集成 Node.js
- Markdown support - 支持 Markdown
- IdeaVim - 支持 Vim
- LiveEdit - 可以实时编辑 HTML/CSS/JavaScript
- Markdown Navigator - 支持 Markdown
- PHP composer.json support - 支持 composer.json 文件
- Nyan Progress Bar - 改变进度条样式
- Grep Console - Grep 控制台
- CodeGlance - 类似于 Sublime 中的代码小地图
- Translation - 最好用的翻译插件
- Key promoter - 这款插件适合新手使用。当你点击鼠标一个功能的时候，可以提示你这个功能快捷键是什么。这是一个非常有用的功能，很快就可以熟悉软件的快捷功能了。 如果有快捷键的，会直接显示快捷键
- ApiDebugger - 一个开源的接口调试插件

### 速度优化
#### Java VM options
PHPStorm 依赖 java 虚拟机，找到 help > Edit Custom VM Options，然后在这个文件里可以根据需要增加或减少 PhpStorm 使用的内存
![IMG](https://iocaffcdn.phphub.org/uploads/images/201901/16/16876/PDuEqwPzga.png!large)
```bash
-Xms128m
-Xmx1024m

-Dawt.useSystemAAFontSettings=lcd
-Dawt.java2d.opengl=true

# 这一条只适合于Mac, 可以使java调用优化过的图形引擎
-Dapple.awt.graphics.UseQuartz=true
```
#### 排除对特定目录的索引
在 Settings > Directories 下可以将特定的目录标记排除，然后 PHPstorm 就不会索引其中的文件了。建议排除的目录一般是类似 cache、public、storage 等包含资源编译文件的，当然还有两个大头，就是 vendor 和 node_modules 目录。

##### Node modules 目录
Node modules 目录实际上默认已经被排除掉了，但是呢，在 Settings > Languages & Frameworks > JavaScript > Libraries 下，你会看到，它们又被额外引入进来了，假设说你写 js 不是那么多，你也可以在这里将其完全排除掉。

##### vendor 目录的处理
排除掉 vendor 目录，意味着就不能基于那里面的组件进行自动补全（auto-complete）了，所以这可能不是个好主意。但是呢，有个小技巧就是，你可以整体上排除掉 vendor 目录，然后在 Settings > Languages & Frameworks > PHP 下，将你真正用到的组件目录给额外添加上。

#### 改变渲染字体的方式
进入 help > Edit Custom Properties 来设置 PHPStorm 的自定义属性.
```bash
editor.zero.latency.typing=true
```
上面这条，改变的是 PHPstorm 如何渲染字体：立即渲染文字，而不是先进行内容分析。可能会因此导致偶尔有那么一瞬间文字都是不带样式的，但是整体上会顺畅很多。

#### 禁掉你不用的 plugin
PHPstorm 默认加了很多功能，而我们可能平时根本用不到。找到 preferences -> plugins，把我们根本用不到的很多 plugin，禁用掉。

### 设置完后
设置完后一定用清除缓存重启，否则可能打不开软件，选择 File->Invalidate Caches/Restart 对话框的 Invalidate and restart


### 参考资料
- [PHPStorm 快捷键大全（Win/Linux/Mac）](https://learnku.com/laravel/t/5420/your-keyboard-shortcuts-please)
- [PHPstorm 优化、设置与提速篇](http://www.pilishen.com/posts/lets-optimize-phpstorm)
- [大牛们的 PHPstorm 使用技巧和建议](http://www.pilishen.com/posts/phpstorm-tips-and-tricks)





