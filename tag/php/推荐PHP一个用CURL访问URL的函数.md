# 推荐PHP一个用CURL访问URL的函数

其实，php访问url的方式有好几种，这里只介绍其中一种curl方式，觉得有用的就收藏。

```php
/**
 * curl发送HTTP请求方法
 * @param $url
 * @param string $method
 * @param array $params
 * @param array $header
 * @param int $timeout
 * @param bool|false $multi
 * @return mixed
 * @throws Exception
 */
 static public function curlHttp( $url, $method = 'GET', $params = array(), $header = array(),
                                 $timeout = 30, $multi = false ) {
    $curl = curl_init();
    curl_setopt( $curl, CURLOPT_TIMEOUT, $timeout );
    curl_setopt( $curl, CURLOPT_RETURNTRANSFER, true );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYPEER, false );
    curl_setopt( $curl, CURLOPT_SSL_VERIFYHOST, false );
    curl_setopt( $curl, CURLOPT_HTTPHEADER, $header );
    switch ( strtoupper( $method ) ) {
        case 'GET':
            if ( !empty( $params ) ) {
                $uri = parse_url( $url );
                $url .= ( empty( $uri[ 'query' ] ) ? '?' : '&' ) . http_build_query( $params );
            }
            curl_setopt( $curl, CURLOPT_URL, $url );
            break;
        case 'POST':
            curl_setopt( $curl, CURLOPT_URL, $url );
            curl_setopt( $curl, CURLOPT_POST, true );
            $params = $multi ? $params : http_build_query( $params );  //判断是否传输文件
            curl_setopt( $curl, CURLOPT_POSTFIELDS, $params );
            break;
        default:
            throw new Exception( '不支持的请求方式！' );
    }
    $response = curl_exec( $curl );
    $error = curl_error( $curl );
    curl_close( $curl );
    if ( $error ) {
        throw new Exception( '请求发生错误：' . $error );
    }
    return $response;
}
```

参考资料：[php访问url的四种方式](http://blog.csdn.net/e421083458/article/details/17580959)