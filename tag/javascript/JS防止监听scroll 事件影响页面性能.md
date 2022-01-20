[//]:# "2022/1/20 10:55|JAVASCRIPT|"
# 防止监听scroll 事件影响页面性能
> [CSDN](https://blog.csdn.net/bigbear00007/article/details/102615665)

### 问题

[scroll](https://so.csdn.net/so/search?q=scroll&spm=1001.2101.3001.7020)事件在文档或文档元素滚动时触发，主要出现在用户拖动滚动条。

```javascript
window.addEventListener('scroll', callback);
```

该事件会连续地大量触发，所以它的监听函数之中不应该有非常耗费计算的操作。



### 解决方案

推荐的做法是使用`requestAnimationFrame`或`setTimeout`控制该事件的触发频率，然后可以结合`customEvent`抛出一个新事件。

#### [requestAnimationFrame](https://so.csdn.net/so/search?q=requestAnimationFrame&spm=1001.2101.3001.7020)()

```javascript
  var throttle = function (type, name, obj) {
    var obj = obj || window;
    var running = false;
    var func = function () {
      if (running) { return; }
      running = true;
      requestAnimationFrame(function() {
        obj.dispatchEvent(new CustomEvent(name));
        running = false;
      });
    };
    obj.addEventListener(type, func);
  };

  // 将 scroll 事件重定义为 optimizedScroll 事件
  throttle('scroll', 'optimizedScroll');
})();

window.addEventListener('optimizedScroll', function() {
  console.log('Resource conscious scroll callback!');
});
```

上面代码中，throttle函数用于控制事件触发频率，requestAnimationFrame方法保证每次页面重绘（每秒60次），只会触发一次scroll事件的监听函数。也就是说，上面方法将scroll事件的触发频率，限制在每秒60次。具体来说，就是scroll事件只要频率低于每秒60次，就会触发optimizedScroll事件，从而执行optimizedScroll事件的监听函数。



#### setTimeout()

`setTimeout`方法，可以放置更大的时间间隔。

```javascript
(function() {
  window.addEventListener('scroll', scrollThrottler, false);

  var scrollTimeout;
  function scrollThrottler() {
    if (!scrollTimeout) {
      scrollTimeout = setTimeout(function () {
        scrollTimeout = null;
        actualScrollHandler();
      }, 66);
    }
  }

  function actualScrollHandler() {
    // ...
  }
}());
```

上面代码中，每次scroll事件都会执行`scrollThrottler`函数。该函数里面有一个定时器`setTimeout`，每66毫秒触发一次（每秒15次）真正执行的任务`actualScrollHandler`。



#### throttle

```javascript
function throttle(fn, wait) {
  var time = Date.now();
  return function() {
    if ((time + wait - Date.now()) < 0) {
      fn();
      time = Date.now();
    }
  }
}

window.addEventListener('scroll', throttle(callback, 1000));
```

上面的代码将scroll事件的触发频率，限制在一秒一次。



**知识拓展**
`debounce`与`throttle`的区别

`throttle`是“节流”，确保一段时间内只执行一次，而`debounce`是“防抖”，要连续操作结束后再执行。以网页滚动为例，`debounce`要等到用户停止滚动后才执行，`throttle`则是如果用户一直在滚动网页，那么在滚动过程中还是会执行。