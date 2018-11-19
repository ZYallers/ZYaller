# PHP 反序列化存储在 session 里面的数据
> https://www.cnblogs.com/xuxiang/p/5320178.html

session 数据存取的方法可通过`session.serialize_handler`方法来判断，反序列化可通过下面的unserialize方法。

```php
public static function unserialize($session_data) {
    $method = ini_get("session.serialize_handler");
    switch ($method) {
        case "php":
            return self::unserialize_php($session_data);
            break;
        case "php_binary":
            return self::unserialize_phpbinary($session_data);
            break;
        default:
            throw new Exception("Unsupported session.serialize_handler: " . $method . ". Supported: php, php_binary");
    }
}

private static function unserialize_php($session_data) {
    $return_data = array();
    $offset = 0;
    while ($offset < strlen($session_data)) {
        if (!strstr(substr($session_data, $offset), "|")) {
            throw new Exception("invalid data, remaining: " . substr($session_data, $offset));
        }
        $pos = strpos($session_data, "|", $offset);
        $num = $pos - $offset;
        $varname = substr($session_data, $offset, $num);
        $offset += $num + 1;
        $data = unserialize(substr($session_data, $offset));
        $return_data[$varname] = $data;
        $offset += strlen(serialize($data));
    }
    return $return_data;
}

private static function unserialize_phpbinary($session_data) {
    $return_data = array();
    $offset = 0;
    while ($offset < strlen($session_data)) {
        $num = ord($session_data[$offset]);
        $offset += 1;
        $varname = substr($session_data, $offset, $num);
        $offset += $num;
        $data = unserialize(substr($session_data, $offset));
        $return_data[$varname] = $data;
        $offset += strlen(serialize($data));
    }
    return $return_data;
}
```

如果想重新序列号数据可以用下面的方法。
```php
public function serialize_php(array $vars): string
{
    $ret = '';
    foreach ($vars as $key => $value) {
        $ret .= $key . '|' . serialize($value);
    }
    return $ret;
}
```