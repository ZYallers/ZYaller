# linux top 实时监控某进程使用占用CPU和内存情况

完整命令格式如下：
```bash
top -d刷新秒数 -p$(echo $(ps -ef|grep '进程名'|grep -v grep|awk '{print $2}')|awk -v OFS=',' '{NF=NF; print $0}')
```

命令说明：
- `刷新秒数` 多少秒刷新一次，推荐3秒
- `进程名` 如php

输出结果：
```bash
top - 15:43:25 up 777 days,  4:10,  5 users,  load average: 1.00, 0.94, 1.04                                                                                                              
Tasks:  20 total,   0 running,  20 sleeping,   0 stopped,   0 zombie                                                                                                                      
Cpu(s): 12.5%us,  3.9%sy,  0.0%ni, 82.4%id,  1.1%wa,  0.0%hi,  0.1%si,  0.1%st                                                                                                            
Mem:  16330820k total, 14803624k used,  1527196k free,   614452k buffers                                                                                                                  
Swap:        0k total,        0k used,        0k free,  5434568k cached                                                                                                                   
                                                                                                                                                                                          
  PID USER      PR  NI  VIRT  RES  SHR S %CPU %MEM    TIME+  COMMAND                                                                                                                      
 5044 bravo     20   0  581m 7784 1448 S  0.0  0.0   0:00.18 php                                                                                                                          
 5045 bravo     20   0  283m 6804  828 S  0.0  0.0   0:00.00 php                                                                                                                          
 5050 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.00 php                                                                                                                          
 5051 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.00 php                                                                                                                          
 5052 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.02 php                                                                                                                          
 5053 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.01 php                                                                                                                          
 5054 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.02 php                                                                                                                          
 5055 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.01 php                                                                                                                          
 5056 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.02 php                                                                                                                          
 5057 bravo     20   0  258m  11m 5072 S  0.0  0.1   0:00.00 php                                                                                                                          
 5058 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.02 php                                                                                                                          
 5059 bravo     20   0  296m  14m 7240 S  0.0  0.1   0:01.02 php                                                                                                                          
 5060 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5061 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5062 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5063 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5064 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5065 bravo     20   0  260m  10m 4996 S  0.0  0.1   0:00.03 php                                                                                                                          
 5067 bravo     20   0  287m  10m 4780 S  0.0  0.1   0:00.07 php                                                                                                                          
 5068 bravo     20   0  289m  10m 4364 S  0.0  0.1   0:00.08 php
```
结果中信息的具体详解可以参考这篇文章：https://blog.csdn.net/chenleixing/article/details/46678413
