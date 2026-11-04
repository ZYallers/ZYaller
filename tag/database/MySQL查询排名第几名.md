# MySQL查询排名第几名
> https://www.2cto.com/database/201708/672692.html

## 查询所有数据排名
```mysql
SELECT 
T1.user_id,T1.nickname,T1.score,(@ranking:=@ranking+1) AS ranking 
FROM user_score T1,(select (@ranking:=0)) T2 
ORDER BY T1.score DESC
```
## 指定查询某条数据的排名
```mysql
SELECT T3.ranking FROM 
(
  SELECT 
  T1.user_id,T1.nickname,T1.score,(@ranking:=@ranking+1) AS ranking 
  FROM user_score T1,(select (@ranking:=0)) T2 
  ORDER BY T1.score DESC
) T3
WHERE T3.user_id='38912'
```