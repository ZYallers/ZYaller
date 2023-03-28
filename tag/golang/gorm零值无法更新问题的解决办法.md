[//]:# "2022/4/19 14:26|GOLANG"
# gorm零值无法更新问题的解决办法

> 文章转载自：[CSDN](https://www.csdn.net/tags/MtTaMgysMjY5ODE4LWJsb2cO0O0O.html)

## 1. 场景

在配置某一个参数时，假如该参数为bool类型。在从“ture"切换到”false"时发现数据库中没有更换过来，

删除一个文本描述信息时，发现修改失败，描述依然存在。

这种情况基本上是由于一个原因导致的：**Gorm使用Updates更新数据库操作时，只会更新非零字段。**

**在Go中0值的说明**：

| 类型       | 对应的零值 |
| ---------- | ---------- |
| string     | ""         |
| int uint类 | 0          |
| bool       | false      |



## 2.gorm中更新操作说明

### 1）更新全部字段：Save()

使用Save方法保存所有的字段区，即使是零值字段。

```golang
db.First(&user)

user.Name = "jinzhu 2"
user.Age = 100

db.Save(&user)
// UPDATE users SET name='jinzhu 2', age=100, birthday='2016-01-01', updated_at = '2013-11-17 21:34:10' WHERE id=111;
```

###  2)  更新单列字段：Update()

当使用Update方法更新单个列时，你需要指定条件，否则会返回ErrMissingWhereClause错误。当使用了Model方法，且该对象有值，该值会被用于构建条件；如果同时存在where条件，则两个需要同时满足，例如：

```golang
// 条件更新
db.Model(&User{}).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE active=true;

// User 的 ID 是 `111`
db.Model(&user).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111;

// 根据条件和 model 的值进行更新
db.Model(&user).Where("active = ?", true).Update("name", "hello")
// UPDATE users SET name='hello', updated_at='2013-11-17 21:34:10' WHERE id=111 AND active=true;

```

###  3)  更新多列字段：Updates()

>  Updates方法制成struct和map[string]interface{}参数，当使用struct更新时，默认情况下，GORM只会更新非零值当字段

👉👉👉 从这里可以看出：

当通过struct更新时，GORM只会更新非零字段。如果你想确保指定字段被更新，你应该使用Select方法指定更新字段，或使用map来完成更新操作。例如：

```golang
// 根据 `struct` 更新属性，只会更新非零值的字段
db.Model(&user).Updates(User{Name: "hello", Age: 18, Active: false})
// UPDATE users SET name='hello', age=18, updated_at = '2013-11-17 21:34:10' WHERE id = 111;

// 根据 `map` 更新属性
db.Model(&user).Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET name='hello', age=18, active=false, updated_at='2013-11-17 21:34:10' WHERE id=111;

// 使用`select`更新指定字段, 无论是否存在零值 👈👈👈
db.Select("name", "desc", "class").Where(&user).Updates(users)
// 或者
db.Select([]string{"name", "desc", "class"}).Where(&user).Updates(users)
```

### 4)  指定(忽略)更新字段：Select，Omit

如果你想要再更新时指定、忽略某些字段，你可以用户Select、Omit方法。例如：

```golang
// 使用 Map 进行 Select
// User's ID is `111`:
db.Model(&user).Select("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET name='hello' WHERE id=111;

db.Model(&user).Omit("name").Updates(map[string]interface{}{"name": "hello", "age": 18, "active": false})
// UPDATE users SET age=18, active=false, updated_at='2013-11-17 21:34:10' WHERE id=111;

// 使用 Struct 进行 Select（会 select 零值的字段）
db.Model(&user).Select("Name", "Age").Updates(User{Name: "new_name", Age: 0})
// UPDATE users SET name='new_name', age=0 WHERE id=111;

// Select 所有字段（查询包括零值字段的所有字段）
db.Model(&user).Select("*").Update(User{Name: "jinzhu", Role: "admin", Age: 0})

// Select 除 Role 外的所有字段（包括零值字段的所有字段）
db.Model(&user).Select("*").Omit("Role").Update(User{Name: "jinzhu", Role: "admin", Age: 0})
```

