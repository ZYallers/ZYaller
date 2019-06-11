# shell 监控CPU使用情况

代码如下：
```bash
#!/bin/bash
used=$(top -bn1|awk -F '[ %]+' 'NR==3 {print $2}')
echo "cpu used: $used %."
if [ $(echo "$used > 80"|bc) = 1 ];then
echo 'too high!'
exit 1
fi
```