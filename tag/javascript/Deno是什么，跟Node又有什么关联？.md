# Deno是什么，跟Node又有什么关联？
> https://www.jianshu.com/p/0056843df8a9

deno 是 Node 之父 Ryan Dahl 发布新的开源项目。
从官方介绍来看，可以认为它是下一代 Node，使用 Go 语言代替 C++ 重新编写跨平台底层内核驱动，上层仍然使用 V8 引擎，最终提供一个安全的 TypeScript 运行时。

### 特性
- 支持 TypeScript 2.8 开箱即用；
- 无 package.json，无 npm，不追求兼容 Node；
- 通过 URL 方式引入依赖而非通过本地模块，并在第一次运行的时候进行加载和缓存，并仅在代码使用–reload运行，依赖才会更新，引入方式如：

```javascript
import { test } from "https://unpkg.com/deno_testing@0.0.5/testing.ts" 
import { log } from "./util.ts"
```

- 可以控制文件系统和网络访问权限以运行沙盒代码，默认访问只读文件系统可访问，无网络权限。V8 和 Golang 之间的访问只能通过 protobuf 中定义的序列化消息完成；
- 发生未捕捉错误时自动终止运行；
- 支持 top-level 的 await；
- 最终创建单一可执行文件；
- 目标是兼容浏览器；
- 可以作为库引入，用于建立自己的 JavaScript runtime。

这几个特性，有好几个都是针对目前 Node 的痛点而来的，包括无 package.json、依赖的引入和更新方式，针对的就是被广泛吐槽的过大的node_modules。

### Github仓库
https://github.com/ry/deno

deno的出现确实引起不少轰动。比如在deno项目Issues里的这个话题：
![image](https://upload-images.jianshu.io/upload_images/5099107-11288bcffb362643.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/700)

这个Issues是不是引起你的共粪？感觉不仅没拉进跟大神的距离，反倒是越拉越远。