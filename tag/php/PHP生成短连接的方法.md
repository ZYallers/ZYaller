# PHP生成短连接的方法

直接贴上方法，函数可以查看手册。

```php
<?php
/** 生成短网址 
 * @param  String $url 原网址 
 * @return String 
 */  
function dwz($url){  
    $code=floatval(sprintf('%u', crc32($url)));  
    $surl='';  
    while($code){  
      $mod=fmod($code, 62);  
      if($mod>9 && $mod<35){  
        $mod=chr($mod + 61);  
      }  
      $surl .= $mod;  
      $code = floor($code/62);  
    }  
    return $surl;  
}  

//test
echo dwz('http://www.zyall.com');
```
