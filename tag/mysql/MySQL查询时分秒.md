# MySQL查询时分秒
> http://blog.csdn.net/q6844296/article/details/49583719
## 获取当前的年月日：
```mysql
SELECT DATE_FORMAT(NOW(),'%Y-%m-%d %T') FROM DUAL; 
``` 
## 获取当前时分秒：
```mysql
SELECT DATE_FORMAT(NOW(),'%T') FROM DUAL; 
```
## 查询项目 超过12点的数据
```mysql
SELECT * FROM project WHERE  DATE_FORMAT(paytime,'%T')  >'12:00:00';
```  