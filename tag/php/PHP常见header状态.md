# PHP常见header状态

老了，容易忘记，记录一下：

```php
<?php  
    //200 正常状态  
    header('HTTP/1.1 200 OK');  
      
    // 301 永久重定向，记得在后面要加重定向地址 Location:$url  
    header('HTTP/1.1 301 Moved Permanently');  
      
    // 重定向，其实就是302 暂时重定向  
    header('Location: http://www.maiyoule.com/');  
      
    // 设置页面304 没有修改  
    header('HTTP/1.1 304 Not Modified');  
      
    // 显示登录框，  
    header('HTTP/1.1 401 Unauthorized');  
    header('WWW-Authenticate: Basic realm="登录信息"');  
    echo '显示的信息！';  
      
    // 403 禁止访问  
    header('HTTP/1.1 403 Forbidden');  
       
    // 404 错误  
    header('HTTP/1.1 404 Not Found');  
      
    // 500 服务器错误  
    header('HTTP/1.1 500 Internal Server Error');  
       
    // 3秒后重定向指定地址(也就是刷新到新页面与 <meta http-equiv="refresh" content="10;http://www.maiyoule.com/ /> 相同)  
    header('Refresh: 3; url=http://www.maiyoule.com/');  
    echo '10后跳转到http://www.maiyoule.com';  
       
    // 重写 X-Powered-By 值  
    header('X-Powered-By: PHP/5.3.0');  
    header('X-Powered-By: Brain/0.6b');  
       
    //设置上下文语言  
    header('Content-language: en');  
       
    // 设置页面最后修改时间（多用于防缓存）  
    $time = time() - 60; //建议使用filetime函数来设置页面缓存时间  
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', $time).' GMT');  
      
    // 设置内容长度  
    header('Content-Length: 39344');  
       
    // 设置头文件类型，可以用于流文件或者文件下载  
    header('Content-Type: application/octet-stream');  
    header('Content-Disposition: attachment; filename="example.zip"');   
    header('Content-Transfer-Encoding: binary');  
    readfile('example.zip');//读取文件到客户端  
       
    //禁用页面缓存  
    header('Cache-Control: no-cache, no-store, max-age=0, must-revalidate');  
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');   
    header('Pragma: no-cache');  
       
    //设置页面头信息  
    header('Content-Type: text/html; charset=iso-8859-1');  
    header('Content-Type: text/html; charset=utf-8');  
    header('Content-Type: text/plain');   
    header('Content-Type: image/jpeg');   
    header('Content-Type: application/zip');   
    header('Content-Type: application/pdf');   
    header('Content-Type: audio/mpeg');  
    header('Content-Type: application/x-shockwave-flash');   
    //.... 至于Content-Type 的值 可以去查查 w3c 的文档库，那里很丰富  
```
