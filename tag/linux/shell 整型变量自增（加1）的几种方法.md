# shell 整型变量自增（加1）的几种方法

> <http://blog.csdn.net/zhaojinjia/article/details/25652983>

```bash
#!/bin/sh

a=1
a=$(($a+1))
a=$[$a+1]
a=`expr $a + 1`
let a++
let a+=1
((a++))

echo $a
#ouput 6
```