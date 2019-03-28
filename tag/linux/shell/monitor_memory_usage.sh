#!/bin/bash
# 监控内存使用情况
total=$(free -m|awk '{print $2}'|sed -n '2p')
used=$(free -m|awk '{print $3}'|sed -n '3p')
free=$(free -m|awk '{print $4}'|sed -n '3p')
usedPer=$(awk 'BEGIN{printf "%.0f",('$used'/'$total')*100}')
freePec=$(awk 'BEGIN{printf "%.0f",('$free'/'$total')*100}')
echo "total:$total MB,used:$used MB,free:$free MB,usedPer:$usedPer%,freePer:$freePec%."
if [ $usedPer -ge 80 ];then
exit 1
fi

