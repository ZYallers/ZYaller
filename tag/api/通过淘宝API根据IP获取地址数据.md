[//]:# (2018/5/17 18:22|API|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/cfb605e3a20668c06ba625f31f9b6e4a74f2833d.jpg)
# 通过淘宝API根据IP获取地址数据
> http://www.loveteemo.com/article-90.html

- 请求方式
> GET

- 接口地址
> http://ip.taobao.com/service/getIpInfo.php

- 请求参数

参数名 | 长度 | 必填 | 类型 | 举例
---|---|---|---|---
ip | 15 | Y | String| 121.40.81.149

- 返回参数
```json
//eg: http://ip.taobao.com/service/getIpInfo.php?ip=121.40.81.149
{
  "code": 0,
  "data": {
    "ip": "121.40.81.149",
    "country": "中国",
    "area": "",
    "region": "浙江",
    "city": "杭州",
    "county": "XX",
    "isp": "阿里云",
    "country_id": "CN",
    "area_id": "",
    "region_id": "330000",
    "city_id": "330100",
    "county_id": "xx",
    "isp_id": "1000323"
  }
}
```
