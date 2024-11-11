[//]:# "2024/11/11 13:44|REDIS"

# 线上踩坑：Redis集群调用Lua脚本

```
-ERR bad lua script for redis cluster, 
all the keys that the script uses should be passed using the KEYS arrayrn
```

第一次看到这样的错误提示挺懵逼～。

上线遇到一个阿里云Redis集群的坑，特地写出来，供各位遇到此问题的道友参考，这是因为阿里云的Redis集群对Lua脚本调用的时候做了限制：

为了保证脚本里面的所有操作都在相同slot进行，云数据库Redis集群版本会对Lua脚本做如下限制：

**所有key都应该由KEYS数组来传递，redis.call/pcall 中调用的redis命令，key的位置必须是KEYS array（不能使用Lua变量替换KEYS）**，否则直接返回错误信息：

> -ERR bad lua script for redis cluster, all the keys that the script uses should be passed using the KEYS arrayrn 

例如下面的示例代码：

```shell
--获取KEY
local key1 = KEYS[1]

local val = redis.call('incr', key1)
local ttl = redis.call('ttl', key1)

--获取ARGV内的参数并打印
local times = ARGV[1]
local expire = ARGV[2]

redis.log(redis.LOG_DEBUG,tostring(times))
redis.log(redis.LOG_DEBUG,tostring(expire))

redis.log(redis.LOG_NOTICE, "incr "..key1.." "..val);
if val == 1 then
    redis.call('expire', key1, tonumber(expire))
else
    if ttl == -1 then
        redis.call('expire', key1, tonumber(expire))
    end
end

if val > tonumber(times) then
    return 0
end

return 1

```

本脚本的功能是通过Redis做集群的限流，此处不做赘述。有时间会专门写一节关于Redis实现分布式限流的文章。

因为使用的是redis集群，在调用lua脚本的时候，key的位置必须是数组（不能使用Lua变量替换KEYS数组），否则直接返回错误信息。

所以需要对`lua`脚本进行改正，去掉自定义的变量local，直接使用传入的KEYS数组。

看修改之后的代码：

```shell
--获取KEY
-- local key1 = KEYS[1] **去掉**

local val = redis.call('incr', KEYS[1])
local ttl = redis.call('ttl', KEYS[1])

--获取ARGV内的参数并打印
local times = ARGV[1]
local expire = ARGV[2]

redis.log(redis.LOG_DEBUG,tostring(times))
redis.log(redis.LOG_DEBUG,tostring(expire))

redis.log(redis.LOG_NOTICE, "incr "..KEYS[1].." "..val);
if val == 1 then
    redis.call('expire', KEYS[1], tonumber(expire))
else
    if ttl == -1 then
        redis.call('expire', KEYS[1], tonumber(expire))
    end
end

if val > tonumber(times) then
    return 0
end

return 1

```

最后，再贴一下阿里云对lua的一些限制及要求：

#### Lua使用限制

为了保证脚本里面的所有操作都在相同slot进行，云数据库Redis集群版本会对Lua脚本做如下限制：

1. 所有key都应该由KEYS数组来传递

redis.call/pcall 中调用的redis命令，key的位置必须是KEYS array（不能使用Lua变量替换KEYS），否则直接返回错误信息：

> -ERR bad lua script for redis cluster, all the keys that the script uses should be passed using the KEYS arrayrn

2. 所有key必须在一个slot上，否则返回错误信息：

> -ERR eval/evalsha command keys must be in same slotrn

3. 调用必须要带有key，否则直接返回错误信息：

> -ERR for redis cluster, eval/evalsha number of keys can't be negative or zerorn

### 参考文献

- [Lua脚本支持与限制](https://help.aliyun.com/document_detail/92942.html?spm=5176.13910061.sslink.1.36426f0dV6cOrU) 