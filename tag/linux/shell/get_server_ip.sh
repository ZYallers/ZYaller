#!/usr/bin/env bash
# 获取服务器IP
now=`date`
ip=`ip addr |grep inet |grep -v inet6 |grep eth1|awk '{print $2}' |awk -F "/" '{print $1}'`
echo "Now: $now, My IP: $ip."