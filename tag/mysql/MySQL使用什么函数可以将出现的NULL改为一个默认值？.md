# MySQL使用什么函数可以将出现的NULL改为一个默认值？

**Question：**

```mysql
SELECT a.id,b.name FROM tab1 AS a LEFT JOIN tab2 AS b ON(a.id = p.id) WHERE a.id > 10
```

以上sql返回的结果中name列也许会出现 null 的情况，那么在name字段上使用什么函数可以将出现的 null 改为一个默认值

**Answer：**

MySQL 也拥有类似 ISNULL() 的函数。不过它的工作方式与微软的 ISNULL() 函数有点不同。
在 MySQL 中，我们可以使用 IFNULL() 函数，就像这样：

```mysql
SELECT ProductName,UnitPrice*(UnitsInStock+IFNULL(UnitsOnOrder,0)) FROM Products
```

或者我们可以使用 COALESCE() 函数，就像这样：

```mysql
SELECT ProductName,UnitPrice*(UnitsInStock+COALESCE(UnitsOnOrder,0)) FROM Products
```
