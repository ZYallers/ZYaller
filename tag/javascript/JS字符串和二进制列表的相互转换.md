[//]:# (2017/7/20 10:11|javascript|)
# JS字符串和二进制列表的相互转换

**string --> binary array**

```javascript
var str = 'test string.';
var arr = Array.prototype.map.call( str , function( c ) { return c.charCodeAt(0); } );
```

**binary array --> string**

```javascript
String.fromCharCode.apply( null , arr );
```

