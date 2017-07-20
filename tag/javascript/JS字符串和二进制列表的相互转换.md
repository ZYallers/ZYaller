# JS字符串和二进制列表的相互转换

**string --> binary array**

```
var str = 'test string.';
var arr = Array.prototype.map.call( str , function( c ) { return c.charCodeAt(0); } );
```

**binary array --> string**

```
String.fromCharCode.apply( null , arr );
```

