# linux grep 同时满足多个关键字和满足任意关键字
> https://www.cnblogs.com/smallrookie/p/6102691.html

### 满足任意条件（word1、word2和word3之一）将匹配
```bash
grep -E "word1|word2|word3"   file.txt
```

### 必须同时满足三个条件（word1、word2和word3）才匹配
grep word1 file.txt | grep word2 |grep word3

### 同时排除多个关键字
例如需要排除`abc.txt`中的`mmm`和`nnn`
```bash
grep -v 'mmm\|nnn' abc.txt
```
