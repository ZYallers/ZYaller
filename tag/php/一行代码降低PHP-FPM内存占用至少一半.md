# 一行代码降低PHP-FPM内存占用至少一半
> https://segmentfault.com/a/1190000010413463

PHP-FPM是PHP的FastCGI过程管理器。在类Unix操作系统（包括Linux以及BSD系统）中，PHP-FPM通过安装php5-fpm(Linux)或者php56-fpm(FreeBSD 10.1)来使用。

但是缺省安装以及按照大量博客推荐安装的PHP-FPM的最大问题是它会消耗大量资源，包括内存和CPU。本博客使用的服务器也遭遇了类似的命运。因为我也是按照那些教程安装的，而教程里对于PHP-FPM的配置选项描述的不够有效。

你可以在`/etc/php5/fpm/pool.d`目录下发现这些低效的配置选项。举例来说，以下是我的服务器（当然不是目前这个站点）上的那些低效选项：

```bash
; Choose how the process manager will control the number of child processes.
pm = dynamic
pm.max_children = 75
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 500
```

那台服务器是一台DigitalOcean Droplet，配置512M内存。它上面运行了一个新网站，即使完全空闲时，也必须要靠交换内存才能避免僵死。执行`top`命令显示了服务器上占用内存最多的进程。

```bash
  PID USER      PR  NI    VIRT    RES    SHR S %CPU %MEM     TIME+ COMMAND
13891 cont      20     396944  56596  33416 S  0.0 11.3   :14.05 php5-fpm
13889 cont      20     396480  56316  32916 S  0.0 11.2   :17.67 php5-fpm
13887 cont      20     624212  55088  32008 S  0.0 11.0   :14.02 php5-fpm
13890 cont      20     396384  55032  32312 S  0.0 11.0   :13.39 php5-fpm
13888 cont      20     397056  54972  31988 S  0.0 11.0   :14.16 php5-fpm
14464 cont      20     397020  54696  31832 S  0.0 10.9   :09.44 php5-fpm
13892 cont      20     396640  54704  31936 S  0.0 10.9   :12.84 php5-fpm
 
13883 cont      20     396864  54692  31940 S  0.0 10.9   :15.64 php5-fpm
13893 cont      20     396860  54628  32004 S  0.0 10.9   :15.13 php5-fpm
13885 cont      20     396852  54412  32116 S  0.0 10.8   :13.94 php5-fpm
13884 cont      20     395164  53916  32364 S  0.0 10.7   :13.51 php5-fpm
13989 cont      20     394960  53548  32108 S  3.7 10.7   :14.37 php5-fpm
2778 mysql     20    1359152  31704   1728 S  0.7  6.3   1:38.80 mysqld
 
13849 root      20     373832   1180    188 S  0.0  0.2   :03.27 php5-fpm
```

输出结果显示有12个php5-fpm子进程（用户名是cont）和一个主进程（用户名是root）。而这12个子进程只是呆坐在那里，什么事也不做，每个子进程白白消耗超过10%的内存。这些子进程主要是由pm=dynamic这个配置选项产生的。

老实说，绝大部分的云主机拥有者也不知道所有这些配置选项是干什么用的，只是简单地复制粘贴而已。我也不准备假装我了解每个PHP配置文件里的每一个选项的目的和意义。我在很大程度上也是复制粘贴的受害者。

但是我经常检查服务器的资源占用情况，困惑于为什么我的服务器占用这么多的内存和CPU。举另外一个例子，是这台服务器上的`free -mt`命令的结果：

```bash
              total       used       free     shared    buffers     cached
Mem:           490        480          9         31          6         79
-/+ buffers/cache:        393         96
Swap:         2047        491       1556
Total:        2538        971       1566
```

在没有任何访问量的情况下，也几乎有整整1G的内存（实际内存加上交换内存）被占用。当然，通过调整配置pm的数量可以有所改变，但只是轻微的。只要设置pm=dynamic，就会有空闲的子进程等在那里等待被使用。

直到读了一篇文章《A better way to run PHP-FPM》(更好地运行PHP-FPM)之后，我开始意识到应该如何修改我的配置文件。那篇文章是大约一年前写的，令人失望的是我从昨天晚上搜索相关主题时才看到它。如果你也有服务器并且使用PHP-FPM的话，我建议你好好读一下那篇文章。

读完文章之后，我修改了我的pm选项，如下：

```bash
; Choose how the process manager will control the number of child processes.
pm = ondemand
pm.max_children = 75
pm.process_idle_timeout = 10s
pm.max_requests = 500
```

最主要的改动就是用`pm=ondemand`替换了`pm=dynamic`。这一改动对资源占用的影响是巨大的。下面是改动并重新加载php5-fpm之后运行`free -mt`的结果：

```bash
              total       used       free     shared    buffers     cached
Mem:           490        196        293         28          9         70
-/+ buffers/cache:        116        373
Swap:         2047        452       1595
Total:        2538        649       1888
```

和之前的结果对比，内存使用量下降了50%。产生这一下降的原因通过执行top命令一目了然：

```bash
 2778 mysql     20    1359152  56708   3384 S  0.0 11.3   2:11.06 mysqld                               
26896 root      20     373828  19000  13532 S  0.0  3.8   :02.42 php5-fpm                             25818 root      20      64208   4148   1492 S  0.0  0.8   :01.88 php5-fpm
25818 root      20      64208   4148   1492 S  0.0  0.8   :01.88 php5-fpm                            
17385 root      20      64208   4068   1416 S  0.0  0.8   :02.23 php5-fpm                              1465 ossec     20      15592   2960    480 S  0.0  0.6   :08.60 ossec-analysisd                      
 1500 root      20       6312   2072    328 S  0.0  0.4   :45.55 ossec-syscheckd  
```

你注意到这里已经没有子进程了吗？它们去哪里了？这就是设置pm=ondemand的作用。这样设置之后，只有当有需要的时候，子进程才会被产生。事情做完之后，子进程会留在内存中10秒钟时间（pm.process_idle_timeout = 10s），然后自己退出。

> 访问量少，主机配置不高可以这么干，高并发情况不适用。