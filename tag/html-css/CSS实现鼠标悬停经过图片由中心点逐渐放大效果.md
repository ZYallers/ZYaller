[//]:# (2017/7/20 10:11|html-css|)
# CSS实现鼠标悬停经过图片由中心点逐渐放大效果

前几天写了类似用JS实现的效果，但并不理想，后来发现一个网站也用了类似功能，由于它代码结构比较清晰，所以可以从中看出其实现的原理和作用的代码。不想之前在仿照腾讯科技数码首页类似功能的实现，一直看代码都看不懂，没办法毕竟人家是大网站。

知道了后才发现可以用CSS实现，就只需要简单的添加几个样式，可能做前端开发的会不屑于看我这样的菜鸟，但我不是只能这样一点点弄懂，呵呵。

```css
#mainer-list > .panel > .panel-body > .element > a > img{width: 100%;opacity: 1;padding: 0;margin: 0;transform: scale(1);transition: transform 1s ease 0s;}
#mainer-list > .panel > .panel-body > .element > a > img:hover{opacity: 0.9;transform: scale(1.05);}
```

代码中起作用的是“`transform: scale(1);transition: transform 1s ease 0s`”和“`transform: scale(1.05)`”这两句，我就不多解释，俺也只懂些表皮，详细的可以问度娘。
