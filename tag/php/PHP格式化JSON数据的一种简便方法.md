# PHP格式化JSON数据的一种简便方法

在前面的一篇文章里介绍过JS格式化JSON显示数据的方法，现在介绍一种PHP相同的简便方法。
php5.4 以后，json_encode增加了JSON_UNESCAPED_UNICODE , JSON_PRETTY_PRINT 等几个常量参数。使显示中文与格式化更方便。

```php
header('content-type:application/json;charset=utf8');    
    
$arr = array(    
    'status' => true,    
    'errMsg' => '',    
    'member' =>array(    
        array(    
            'name' => '李逍遥',    
            'gender' => '男'    
        ),    
        array(    
            'name' => '赵灵儿',    
            'gender' => '女'    
        )    
    )    
);
```

```php
echo json_encode($arr, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
```

输出显示：

```json
{  
    "status": true,  
    "errMsg": "",  
    "member": [  
        {  
            "name": "李逍遥",  
            "gender": "男"  
        },  
        {  
            "name": "赵灵儿",  
            "gender": "女"  
        }  
    ]  
}
```
