[//]:# (2019/4/18 11:27|GIT|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/32c28836e0f11d0154f4af90a7429853eb7ed274.jpg)
# Git 使用规范和工作流说明
> 在进入本文档的阅读和学习前，请确保你已通读 [Git 官方手册 V2 版](http://git-scm.com/book/zh/v2/)中核心前 5 个章节，并了解和掌握了 Git 的基本概念和使用方法。

## 0 声明

除特别说明，游子科技/奥飞智能旗下所有涉及版本控制 Git 的使用和所涉及工作流，均必须「MUST」严格遵守本规范。

本规范自 2016Q1 起正式对游子科技和奥飞智能科技（奥飞娱乐智能事业部）研发部生效。

## 1 推荐客户端工具

推荐各开发人员使用 [SourceTree](https://www.sourcetreeapp.com/) 作为主要的代码管理工具，将命令行作为辅助工具。

## 2 Git 全局配置

* 必须「MUST」设置 Git 用户相关信息，如下所示：

```bash
# 中文名 公司邮箱
# 张三 zhangsan@domain.com
git config --global user.name "张三"
git config --global user.email "zhangsan@domain.com"
```

* 必须「MUST」设置如下编码配置：

```bash
# 原样checkout，Unix LF 换行格式commit。
git config --global core.autocrlf input
# UTF-8 编码
git config --global i18n.logoutputencoding utf8
git config --global i18n.commitencoding utf8
```

## 3 使用 `.gitignore` file

不同平台语言的项目工程库需要合理使用 `.gitignore` 将以下类别文件从版本控制中剔除：

* 各种密钥、密码等服务器敏感配置文件。
* 针对本地开发环境的配置文件。
* 文件缓存类临时性文件。
* 其他项目规定的文件类型。

开发人员可以在 [gitignore项目](https://github.com/github/gitignore) 中找到平台/语言/框架相关的基础 `.gitignore` 配置。

## 4 使用 `.gitattributes` file

不同平台语言的项目工程库需要设置 [Git 属性](https://git-scm.com/book/zh/v1/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git%E5%B1%9E%E6%80%A7)来规范 Git 对比（diff）和合并（merge）的方式，开发人员可以在 [Git 属性模板](https://github.com/Danimoth/gitattributes)基础上对项目工程库进行定义。

> See Also:
Path-based git attributes
https://www.kernel.org/pub/software/scm/git/docs/gitattributes.html

## 5 使用 Git-flow 工作流

所有项目和产品研发必须「MUST」以 [Git-flow 工作流](http://nvie.com/posts/a-successful-git-branching-model/) 模型进行分支定义。

* 图形化界面请使用 SourceTree 提供的 Git-flow 功能进行分支创建和合并。
* 命令行工具请参考 [Git-flow 工作流](http://nvie.com/posts/a-successful-git-branching-model/) 中的示例，推荐使用 [nvie/gitflow](https://github.com/nvie/gitflow) 脚本创建各种分支。

## 6 一个日常开发示例

以下命令行示例用于讲解日常新功能开发时的基本操作。

1. 首先克隆 `ssh://git@github.com/xxx/test.git`
```bash
# ~/home
git clone ssh://git@github.com/xxx/test.git
```

2. 建立分支 `develop` 和 `feature/user-extension`
```bash
# ~/home
cd test
(master)$: git branch develop
(master)$: git branch feature/user-extension
```

3. 切换当前分支到 `feature/user-extension`，开发新功能
```bash
(master)$: git checkout feature/user-extension
(feature/user-extension)$: git add xxx
(feature/user-extension)$: git commit -am 'Added function user-add' -s
## BLABLABLA
(feature/user-extension)$: git add xxx
(feature/user-extension)$: git commit -am 'Added function user-delete' -s
```

4. 功能开发完成后，Push 本地 `feature/user-extension` 至 remote `feature/user-extentsion`
```bash
git push origin feature/user-extension
```

5. 建议在 `http://github.com/` 上发起 Pull Request  之前 rebase

## 7 Git commit message 书写规范

开发人员必须「MUST」遵循 [Git 官方使用手册](http://git-scm.com/book/zh/v2/%E5%88%86%E5%B8%83%E5%BC%8F-Git-%E5%90%91%E4%B8%80%E4%B8%AA%E9%A1%B9%E7%9B%AE%E8%B4%A1%E7%8C%AE)中给出的 commit 书写规范：

> 本次提交 commit 的摘要（50 个字符或更少）

> 如果必要的话，加入更详细的解释文字。在大概 72 个字符的时候换行。在某些情形下，第一行被当作一封电子邮件的标题，剩下的文本作为正文。分隔摘要与正文的空行是必须的（除非你完全省略正文）；如果你将两者混在一起，那么类似变基等工具无法正常工作。

> 空行接着更进一步的段落。

>  - 句号也是可以的。
>  - 项目符号可以使用典型的连字符或星号
    前面一个空格，之间用空行隔开，
    但是可以依据不同的惯例有所不同。

### 7.1 规范讲解

1. 第一行为对改动的简要总结，建议长度不超过 50 个字符，用语采用命令式而非过去式。第一行结尾不要留句号，无论是英文的「.」句号或者是中文「。」句号。
2. 第二行为空行。
3. 第三行开始，是对改动的详细介绍，可以是多行内容，建议每行长度不超过 72 个字符。如果代码托管在 Github 上，那么推荐在此通过 ``#ID`` 方式引用本次提交所关联的任务（Issue）。
4. 建议使用中文，务必 UTF-8 编码。也可使用全英文，首字母大写。除专有名词外，禁止在描述中中英文语句混搭。
5. 避免注释不清晰。比如只有「修正 BUG」、「改错」、「升级」、「添加某文件」等，没有其他内容，等于没说。
6.「提交」的概念是具有独立的功能、修正等作用。小可以小到只修改一行，大可以到改动很多文件，但划分的标准不变，一个提交就是解决一个问题的。对格式的修正，不应该和其他功能修补一起提交，这种情况应该考虑使用 `git add --edit` ，`git add -p` 也可以用用，更复杂和强大一些。在提交前，按实际情况，可使用 `Rebase` 压缩自己本地的多个小提交。

### 7.2 摘要前缀

每次提交的改动建议添加「英文」关键词前缀，用于指示本次改动的主题。

* Add 新加入的需求
* Fixed 修正Bug
* Change 修改功能
* Update 完成任务或者模块变化做的更新
* Remove 移除功能
* Refactor 重构功能

### 7.3 注意事项

* 以上示例中除第一行摘要部分必须「MUST」填写外，其余内容可选择性编写，但一旦选择编写，必须「MUST」遵守 7.1 中的规范。
* 始终保持第二行留空。
* 特殊情况
    * 版本号更新
        格式： `Bump version: 0.1.2-dev → 0.1.2`

## 8 Github Pull Request (PR) 提交规范

1. 每个 PR 必须「MUST」在提交时需在标题中添加 ``[PR]`` 前缀用于邮件推送时区分 PR 和 ISSUE.
2. 每个 PR 必须「MUST」仅包含一个主题。每个 PR 应该仅包含针对单一主题的一系列变更，不要在一个 PR 中包含多个主题。举例来说：假设你开发了 X 和 Y 两个不同主题的相关内容，若此时将所有 commit 以同一 PR 的形式进行提交，如若 Reviewer 仅认可与 X 相关的变更但不同意 Y 主题的相关变更——这将导致我们将无法对此 PR 进行合并操作。
3. 每个 PR 提交人必须「MUST」指定一名 Code Reviewer 进行代码审查，并必须「MUST」由 Code Reviewer 进行合并。

## 9 参考资料

1. https://ruby-china.org/topics/15737
2. https://github.com/erlang/otp/wiki/Writing-good-commit-messages
3. https://www.gitignore.io
4. https://github.com/thephpleague/skeleton
5. https://www.reddit.com/r/PHP/comments/2jzp6k/i_dont_need_your_tests_in_my_production
6. https://www.kernel.org/pub/software/scm/git/docs/gitattributes.html
