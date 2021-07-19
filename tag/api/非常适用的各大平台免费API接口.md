[//]:# (2018/6/28 12:38|API|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/207b05ca4290122ac8ea5ef64c880a7ac4e264d6.png)
# 非常适用的各大平台免费API接口

### 物流接口

#### 快递接口

> http://www.kuaidi100.com/query?type=快递公司编码&postid=快递单号

快递公司编码表：

快递公司 | 编码
---|---
申通|shentong
EMS|ems
顺丰|shunfeng
圆通|yuantong
中通|zhongtong
韵达|yunda
天天|tiantian
汇通|huitongkuaidi
全峰|quanfengkuaidi
德邦|debangwuliu
宅急送|zhaijisong

演示例子：
http://www.kuaidi100.com/query?postid=800125432030318719&type=yuantong

返回结果：
```json
{
    "message": "ok",
    "nu": "800125432030318719",
    "ischeck": "1",
    "condition": "F00",
    "com": "yuantong",
    "status": "200",
    "state": "3",
    "data": [
        {
            "time": "2018-06-14 11:50:36",
            "ftime": "2018-06-14 11:50:36",
            "context": "客户 签收人: 已签收，签收人凭取货码签收。 已签收 感谢使用圆通速递，期待再次为您服务",
            "location": ""
        },
        {
            "time": "2018-06-14 09:37:25",
            "ftime": "2018-06-14 09:37:25",
            "context": "快件已被明福智富广场二座速递易【自提柜】代收，请及时取件。有问题请联系派件员15295855857",
            "location": ""
        },
        {
            "time": "2018-06-14 09:10:14",
            "ftime": "2018-06-14 09:10:14",
            "context": "【广东省佛山市江湾公司】 派件人: 彭明喜 派件中 派件员电话15295855857",
            "location": ""
        },
        {
            "time": "2018-06-14 08:39:00",
            "ftime": "2018-06-14 08:39:00",
            "context": "【广东省佛山市江湾公司】 已收入",
            "location": ""
        },
        {
            "time": "2018-06-14 02:17:01",
            "ftime": "2018-06-14 02:17:01",
            "context": "【广东省佛山市南海公司】 已发出 下一站 【广东省佛山市江湾公司】",
            "location": ""
        },
        {
            "time": "2018-06-14 00:30:43",
            "ftime": "2018-06-14 00:30:43",
            "context": "【佛山转运中心】 已发出 下一站 【广东省佛山市南海公司】",
            "location": ""
        },
        {
            "time": "2018-06-14 00:25:41",
            "ftime": "2018-06-14 00:25:41",
            "context": "【佛山转运中心】 已收入",
            "location": ""
        },
        {
            "time": "2018-06-12 23:16:44",
            "ftime": "2018-06-12 23:16:44",
            "context": "【宁波转运中心】 已发出 下一站 【佛山转运中心】",
            "location": ""
        },
        {
            "time": "2018-06-12 23:13:46",
            "ftime": "2018-06-12 23:13:46",
            "context": "【宁波转运中心】 已收入",
            "location": ""
        },
        {
            "time": "2018-06-12 20:53:52",
            "ftime": "2018-06-12 20:53:52",
            "context": "【浙江省宁波市慈杭新区公司】 已发出 下一站 【宁波转运中心】",
            "location": ""
        },
        {
            "time": "2018-06-12 20:19:17",
            "ftime": "2018-06-12 20:19:17",
            "context": "【浙江省宁波市慈杭新区公司】 已打包",
            "location": ""
        },
        {
            "time": "2018-06-12 18:47:10",
            "ftime": "2018-06-12 18:47:10",
            "context": "【浙江省宁波市慈杭新区公司】 已收件",
            "location": ""
        }
    ]
}
```

### 参考资料
- http://developer.51cto.com/art/201412/458778.htm
- https://www.cnblogs.com/liuying1995/p/6723185.html
- https://blog.csdn.net/eligah825/article/details/53690783
