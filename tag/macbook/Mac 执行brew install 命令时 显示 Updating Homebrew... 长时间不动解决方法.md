# Mac 执行brew install 命令时 显示 Updating Homebrew... 长时间不动解决方法
> https://blog.csdn.net/Boyqicheng/article/details/80809983

在配置开发环境时遇到了问题。执行：
```bash
$ brew install swoole
```
在安装watchman的时候卡在（updating homebrew...）不动，开始以为是网络问题，后来不甘心还是网上找找解决方案，结果还是找到了。

首先，确保你已安装Homebrew了，还没安装的自行百度！

依次输入下面的命令：
```bash
## 替换 brew.git:
cd "$(brew --repo)"
git remote set-url origin https://mirrors.ustc.edu.cn/brew.git

## 替换 homebrew-core.git:
cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
git remote set-url origin https://mirrors.ustc.edu.cn/homebrew-core.git 


## 重置 brew.git:
cd "$(brew --repo)"
git remote set-url origin https://github.com/Homebrew/brew.git

## 重置 homebrew-core.git:
cd "$(brew --repo)/Library/Taps/homebrew/homebrew-core"
git remote set-url origin https://github.com/Homebrew/homebrew-core.git
```
这里还有别的替换及重置Homebrew默认源，https://lug.ustc.edu.cn/wiki/mirrors/help/brew.git。根据本地网络实际情况可以对应替换。
