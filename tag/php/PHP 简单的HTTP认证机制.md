# PHP 简单的HTTP认证机制
> https://www.cnblogs.com/thinksasa/p/3421379.html

PHP 的 HTTP 认证机制仅在 PHP 以 Apache 模块方式运行时才有效，因此该功能不适用于 CGI 版本。

在 Apache 模块的 PHP 脚本中，可以用 header() 函数来向客户端浏览器发送`Authentication Required`信息，
使其弹出一个用户名/密码输入窗口。
当用户输入用户名和密码后，包含有 URL 的 PHP 脚本将会再次和预定义变量 PHP_AUTH_USER、PHP_AUTH_PW 和 AUTH_TYPE 
一起被调用，这三个变量分别被设定为用户名，密码和认证类型。预定义变量保存在 $_SERVER 或者 $HTTP_SERVER_VARS 数组中。

简单的例子：
```php
<?php
/**
 * 简单的帐号验证
 */
private function auth()
{
    if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])
        || md5($_SERVER['PHP_AUTH_USER']) != '21232f297a57a5a743894a0e4a801fc3'
        || md5($_SERVER['PHP_AUTH_PW']) != '49545bc1be0b8aaaec5c1b24d80fd4c0') {
        Header('WWW-Authenticate: Basic realm="权限认证"');
        Header('HTTP/1.0 401 Unauthorized');
        die("<script>window.alert('Access Denied!');</script>");
    }
}
```
