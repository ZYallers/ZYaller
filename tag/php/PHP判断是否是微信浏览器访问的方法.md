# PHP判断是否是微信浏览器访问的方法

都是干货，微信开发可能需要用到，留着日后COPY。

```php
public function isWeichatBrowser() {
  if ( false !== strpos( $_SERVER[ 'HTTP_USER_AGENT' ], 'MicroMessenger' ) ) {
    return true;
  }
  return false;
}
```
