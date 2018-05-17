# PHP调用ip2long()函数出现负数原因及解决方法
> https://blog.csdn.net/fdipzone/article/details/49532001

当ip地址比较大时，ip2long会出现负数：
```php
$ip = '192.168.101.100';
$ip_long = ip2long($ip);
echo $ip_long.PHP_EOL;  // -1062705820
echo long2ip($ip_long); // 192.168.101.100
```
### 原因说明
IPv4使用无符号32位地址，因此最多有2的32次方减1(4294967295)个地址。书写用4个小数点分开的10进制数。
记为A.B.C.D，例如：192.168.100.100。

IPv4地址每个10进制数都是无符号的字节，范围在0~255，将IPv4地址转为无符号数，其实就是将每个10进制数放在对应的8位上，组成一个4字节的无符号整型。192.168.100.100，192,168在高8位100,100在低8位。

### C实现的例子
```C
#include <stdio.h>

int main(int argc, char** argv)
{
    unsigned int ip_long = (192 << 24) | (168 << 16) | (100 << 8) | 100;
    printf("%u\n", ip_long);
    printf("%d\n", ip_long);

    return 0;
}

fdipzone@ubuntu:~/C$ gcc -o ip2long ip2long.c
fdipzone@ubuntu:~/C$ ./ip2long
3232261220
-1062706076
```

可以看到，即使ip_long声明是无符号整型，输出时依然需要指明%u来格式化输出为无符号整型。
因为192大于127(二进制为01111111),192(8位)用二进制表示，最高位必然是1。导致这个4字节整型的最高位为1。
虽然ip_long定义为无符号整型，但printf方法是不理会声明的。所以需要使用%u格式化来输出。如果最高位是0，则使用%d即可。

### 解决方法
> 输出时用%u来格式化为无符号整型。
```php
$ip = '192.168.101.100';
$ip_long = sprintf('%u',ip2long($ip));
echo $ip_long.PHP_EOL;  // 3232261476 
echo long2ip($ip_long); // 192.168.101.100
```
