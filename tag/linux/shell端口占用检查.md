# shell端口占用检查
> 全栈记 | http://infullstack.com/shell_port.html
```bash
#!/bin/bash
#检查8080端口是否被占用，如果占用输出1，如果没有被占用输入0
pIDa=`/usr/sbin/lsof -i :8080|grep -v "PID" | awk '{print $2}'`
echo $pIDa
if [ "$pIDa" != "" ];
then
   echo "1"
else
   echo "0"
fi
```