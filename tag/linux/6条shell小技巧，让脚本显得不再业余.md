[//]:# "2022/9/19 16:12|LINUX"
# 6条shell小技巧，让脚本显得不再业余

> 文章转载自：[架构师之路](https://mp.weixin.qq.com/s/ixVK4ockNE46bTdmarsDHQ)

如何能让自己的shell显得不那么业余？分享6点实践。

## 一、以下面的语句开场

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzgrvmfpj205c02c3yd.jpg)

```bash
set -o nounset
```

在默认情况下，遇到不存在的变量，会忽略并继续执行，而这往往不符合预期，加入该选项，可以避免恶果扩大，终止脚本的执行。

> 有些变量名的手误，会让人崩溃的调试半天，通过这个方式，这类手误秒发现。

```bash
set -o errexit
```

在默认情况下，遇到执行出错，会跳过并继续执行，而这往往不符合预期，加入该选项，可以避免恶果扩大，终止脚本的执行。

> 有些Linux命令，例如rm的-f参数可以强制忽略错误，此时脚本便无法捕捉到errexit，这样的参数在脚本里是不推荐使用的。

这两个选项，都符合fail fast设计理念。



## 二、封装函数有必要

别光顾着一溜往下写，封装可以提高复用。

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzj0ijvwj20b903j74f.jpg)

如上例：

log()

简单封装，能够省去很多 **[$(date +%Y/%m/%d\ %H:%M:%S)]** 的重复代码。

同时，封装还能提高代码的可读性。

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzk8vwybj20ad04l74g.jpg)

如上例：**ExtractBashComments** 比 **egrep "^#"** 的可读性就高很多。



## 三、使用readonly和local修饰变量

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzlhiruoj20c505qgm2.jpg)

**readonly** 顾名思义，只读。

**local** 函数内变量。

别图省事，提高安全性的同时，能避免很多让人崩溃的莫名其妙的错误。脚本写得专不专业，往往不是什么高深的点，而是基本功的体现。



## 四、使用$()代替`(反单引号)

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzmmperzj20a202iwek.jpg)

为什么？看了上面的例子你就懂了：

（1）$()能够支持内嵌；

（2）$()不用转义；

（3）有些字体，`(反单引号)和’(单引号)很像，容易把人搞晕；



## 五、使用[[]]代替[]

用单中括号：

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bznddvzdj209601kt8k.jpg)

用双中括号：

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bznmae1fj209801ca9w.jpg)

看出差别了么？[[]]更符合人性编码：

（1）避免转义问题；

（2）有不少新功能；

新功能包含但不限于：

|| ：逻辑or

&& ：逻辑and

< ：字符串比较（不需要转义）

== ：通配符(globbing)字符串比较

=~ ：正则表达式(regular expression, RegEx)字符串比较

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzpckcgtj20b603o0t0.jpg)

>  需要注意的是，从bash3.2开始，通配符和正则表达式都不能用引号包裹了（所以，上面的例子，加了引号就是字面比较）。

![图片](https://tva1.sinaimg.cn/large/e6c9d24egy1h6bzprjzquj207w01q744.jpg)

所以如果表达式里有空格，必须存储到一个变量里，再进行通配符与正则的比较。



## 六、echo不是唯一的调试方法

```bash
bash -n myscript.sh
```

可以用 **-n** 对脚本进行语法检查。

```bash
bash -v myscript.sh
```

可以用 **-v** 跟踪脚本里的每个命令的执行。

```bash
bash -x myscript.sh
```

可以用 **-x** 跟踪脚本里的每个命令的执行，并附加扩充信息。

当然，也可以在脚本里，添加：

```bash
set -o verbose
set -o xtrace
```

来永久指定输出调试信息。
