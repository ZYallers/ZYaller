# crontab每分钟、每小时、每天、每周、每月、每年定时执行

> http://blog.csdn.net/youngqj/article/details/6798065

怎么设置crontab每分钟定时执行之类的问题经常短路一时想不起来 ，今天我就贴了上来方便日后快速查阅。

```bash
# 每2分钟执行1次
*/2 * * * * [command]

# 每1小时执行1次
0 */1 * * * [command]

# 每天执行1次
0 0 * * * [command]

# 每周执行1次
0 0 * * 0 [command]

# 每月执行1次
0 0 1 * * [command]

# 每年执行1次
0 0 1 1 * [command]
```