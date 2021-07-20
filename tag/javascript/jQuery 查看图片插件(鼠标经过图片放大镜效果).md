[//]:# (2018/7/19 17:57|javascript|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/74c7fb9c9aa5991a714249fac6fdfdc21cdecce0.jpg)
# jQuery 查看图片插件(鼠标经过图片放大镜效果)
> https://github.com/paulkr/blowup.js

近来做后台管理列表，有个需求要实现鼠标经过放大查看图片的功能，本想比较简单，直接网上copy相关代码就可以完成。
然而，不非如此～，网上很多例子都不够完善，还需要修改很多地方，但现有的一些业务代码不能随便修改。
找了几天，在Github看到一个jquery插件--"blowup"，效果不错。代码量也不多，需要修改的地方也少。赞！

调用是例子：
```js
<script src="//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
<script type="text/javascript" src="lib/blowup.js"></script>
<script>
$(document).ready(function () {
    $("img").blowup();
})
</script>
```

然而，使用过程中发现，blowup只能真的单个dom对象，多个dom对象得逐个遍历去调用。
还有个痛点是即使我通过遍历各每个dom对象添加了响应事件，细心的朋友会发现它会在你的页面底层为每个dom对象都
创建一个对应隐藏都放大镜dom对象，而且有个bug这些放大镜dom对象是用`visibility: hidden`来隐藏，而不是`display: none`。
导致整个页面会被拉长。

暂时发现这些问题，后面看了下作者源码，在此基础上针对上述几个问题改动了下，代码如下：
```js
$(function ($) {
    $.fn.blowup = function (attributes) {
        // Default attributes
        var defaults = {
            round: true,
            width: 200,
            height: 200,
            background: "#fff",
            shadow: "0 8px 17px 0 rgba(0, 0, 0, 0.2)",
            border: "6px solid #fff",
            cursor: true,
            zIndex: 999999,
            scale: 1
        };
        // Lens id
        var LENS_ID = 'blowup-lens-' + Math.floor(Math.random() * 1000000);

        // Update defaults with custom attributes
        var $options = $.extend(defaults, attributes);

        // Create magnification lens element
        var lens = document.createElement('div');
        lens.id = LENS_ID;

        // Attack the element to the body
        $('body').append(lens);
        var $lens = $('#' + LENS_ID);

        // Updates styles
        $lens.css({
            "display": "none",
            "position": "absolute",
            "pointer-events": "none",
            "zIndex": $options.zIndex,
            "width": $options.width,
            "height": $options.height,
            "border": $options.border,
            "background": $options.background,
            "border-radius": $options.round ? "50%" : "none",
            "box-shadow": $options.shadow,
            "background-repeat": "no-repeat"
        });

        // Foreach one image
        $(this).each(function () {
            var $element = $(this);
            // If the target element is not an image
            if (!$element.is('img')) {
                console.log("%c Blowup.js Error: " + "%cTarget element is not an image.",
                    "background: #FCEBB6; color: #F07818; font-size: 17px; font-weight: bold;",
                    "background: #FCEBB6; color: #F07818; font-size: 17px;");
                return;
            }

            // Constants
            var $IMAGE_URL = $element.attr('src');
            var $IMAGE_WIDTH = $element.width();
            var $IMAGE_HEIGHT = $element.height();
            var NATIVE_IMG = new Image();
            NATIVE_IMG.src = $element.attr('src');

            $element.css('cursor', $options.cursor ? 'crosshair' : 'none')
                .on('dragstart', function (e) { // Modify target image
                    e.preventDefault();
                }).mouseenter(function () { // Show magnification lens
                $lens.css('display', 'block');
            }).mousemove(function (e) { // Mouse motion on image
                // Lens position coordinates
                var lensX = e.pageX - $options.width / 2;
                var lensY = e.pageY - $options.height / 2;

                // Relative coordinates of image
                var relX = e.pageX - $(this).offset().left;
                var relY = e.pageY - $(this).offset().top;

                // Zoomed image coordinates
                var zoomX = -Math.floor(relX / $element.width() * (NATIVE_IMG.width * $options.scale) - $options.width / 2);
                var zoomY = -Math.floor(relY / $element.height() * (NATIVE_IMG.height * $options.scale) - $options.height / 2);
                var backPos = zoomX + "px " + zoomY + "px";
                var backgroundSize = NATIVE_IMG.width * $options.scale + "px " + NATIVE_IMG.height * $options.scale + "px";

                // Apply styles to lens
                $lens.css({
                    left: lensX,
                    top: lensY,
                    "background-image": "url(" + $IMAGE_URL + ")",
                    "background-size": backgroundSize,
                    "background-position": backPos
                });

            }).mouseleave(function () { // Hide magnification lens
                $lens.css("display", "none");
            });
        });
    }
});
```
改动之后，针对包含多个img对象的dom添加事件就不需要逐个遍历了，并且内部也只会生成一个隐藏的放大镜dom对象，
通过display属性来控制显示状态。

具体配置可以看原作者Github地址，也可以参考下面：

参数 | 描述 | 默认值
---|---|---
`round` | If you want the magnification lens to be round. Setting this to false will give you a square lens. | true
`width` | Lens Width in pixels. | 200
`height` | Lens height in pixels. | 200
`background` | Color for background (will be visible on image edges). | "#FFF"
`shadow` | CSS style for lens shadow.	| "0 8px 17px 0 rgba(0, 0, 0, 0.2)"
`border` | CSS style for lens border. | "6px solid #FFF"
`cursor` | Set to false if you do not want the crosshair cursor visible. | true
`zIndex` | z-index value of the lens. | 999999
`scale` | Scale factor for zoom. | 1

演示：
```js
$("img").blowup({
    "background" : "#F39C12",
    "width" : 250,
    "height" : 250
})
```
> 记得引入jquery
