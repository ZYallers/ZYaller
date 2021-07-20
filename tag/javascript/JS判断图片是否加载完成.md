[//]:# (2017/7/20 10:11|javascript|)
# JS判断图片是否加载完成

有时需要获取图片的尺寸，这需要在图片加载完成以后才可以。这里介绍一种方法。是通过img的compete属性。

```
<!DOCTYPE HTML>
<html>
<head>
 <meta charset="utf-8">
 <title>img - complete attribute</title>
</head>
<body>
 <img id="img1" src="http://pic1.win4000.com/wallpaper/f/51c3bb99a21ea.jpg">
 <p id="p1">loading...</p>
 <script type="text/javascript">
   function imgLoad(img, callback) {
     var timer = setInterval(function() {
       if (img.complete) {
         callback(img);
         clearInterval(timer);
       }
     }, 50);
   }
   imgLoad(img1, function() {
     p1.innerHTML('加载完毕');
   })
 </script>
</body>
</html>
```

轮询不断监测img的complete属性，如果为true则表明图片已经加载完毕，停止轮询。该属性所有浏览器都支持。
