# JS鼠标悬停经过图片由中心点逐渐放大效果

原理很简单，就是调用jq的动画方法，鼠标经过时候，图片宽高放大，然后左右位置向外扩展。

```
//鼠标经过中心缩放图片效果
$.checkImgLoadCompete = function(img, callback) {
var timer = setInterval(function() {
  if (img.complete) {
    clearInterval(timer);
    callback.call(img);
  }
}, 50);
};
$.fn.hoverZoomPic = function(){
$(this).each(function(){
  $.checkImgLoadCompete(this, function(){
    //console.log($(this).width(), $(this).height());
    $(this).data('origin-width', $(this).width()).data('origin-height', $(this).height());
    $(this).hover(function(){
     var w = parseInt( $(this).data('origin-width') ), h = parseInt( $(this).data('origin-height') );
     var w2 = w + w * 0.02, h2 = h + h * 0.02;
     var space = w * 0.02 / 2;
     $(this).stop().animate({height: h2, width: w2, left: -space, right: space}, 500);
    },function(){
     var w = parseInt( $(this).data('origin-width') ), h = parseInt( $(this).data('origin-height') );
     $(this).stop().animate({height: h, width: w, left:'0', right:'0'}, 400);
  });
});
});
};
```

参考资料：[http://www.lanrenzhijia.com/jquery/2884.html](http://www.lanrenzhijia.com/jquery/2884.html)