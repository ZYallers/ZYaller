# shell读取mysql数据并转成二维数组

mysql配置信息通过server_env.sh脚本文件加载，正确的方式是配置在my.conf里，这样才不会提示`Warning`警告错误提示。

代码示例如下：

```bash
#! /bin/bash

source /apps/sh/.server_env.sh

execsql="mysql -h${mysql_host}  -P3306  -u${mysql_username} -p${mysql_password} -D${mysql_database}"
sql="SELECT user_id,COUNT(id) AS amount FROM et_user_share_log WHERE create_time>'2017-01-01 00:00:00' GROUP BY user_id ORDER BY amount DESC LIMIT 50;"

step=0
arr=()
while read -a row
do
   arr[$step]="${row[0]} ${row[1]}"
   step=$(($step+1))
done< <(echo $sql | ${execsql} -N)

if [ 0 == "${#arr[*]}" ]; then
    echo "arr length is zero."
else
    for ((i=0;i<${#arr[*]};i++));
    do
        arr2=(${arr[$i]})
        uid=${arr2[0]}
        amount=${arr2[1]}
        echo "user_id=$uid, amount=$amount"
    done
fi

```