[//]:# (2017/7/20 10:31|javascript|)
# JS格式化显示JSON数据

APP接口开发，需求提供一个接口测试页面给APP开发者，由于接口调用返回的是经过压缩处理过的JSON数据，直接显示在页面上阅读性比较差，但又不想搞个接口开放平台那样浪费时间，于是便想到直接对返回的JSON数据进行处理。

```javascript
/* 格式化JSON源码(对象转换为JSON文本) */
function formatJson(txt, compress/*是否为压缩模式*/) {
  var indentChar = '&nbsp;&nbsp;';
  if (/^\s*$/.test(txt)) {
    alert('数据为空,无法格式化! ');
    return;
  }
  try {
    var data = eval('(' + txt + ')');
  }
  catch (e) {
    alert('数据源语法错误,格式化失败! 错误信息: ' + e.description, 'err');
    return;
  }
  var draw = [], last = false, This = this, line = compress ? '' : '\n', nodeCount = 0, maxDepth = 0;

  var notify = function (name, value, isLast, indent/*缩进*/, formObj) {
    nodeCount++;
    /*节点计数*/
    for (var i = 0, tab = ''; i < indent; i++)tab += indentChar;
    /* 缩进HTML */
    tab = compress ? '' : tab;
    /*压缩模式忽略缩进*/
    maxDepth = ++indent;
    /*缩进递增并记录*/
    if (value && value.constructor == Array) {/*处理数组*/
      draw.push(tab + (formObj ? ('"' + name + '":') : '') + '[' + line);
      /*缩进'[' 然后换行*/
      for (var i = 0; i < value.length; i++) {
        notify(i, value[i], i == value.length - 1, indent, false);
      }
      draw.push(tab + ']' + (isLast ? line : (',' + line)));
      /*缩进']'换行,若非尾元素则添加逗号*/
    } else if (value && typeof value == 'object') {/*处理对象*/
      draw.push(tab + (formObj ? ('"' + name + '":') : '') + '{' + line);
      /*缩进'{' 然后换行*/
      var len = 0, i = 0;
      for (var key in value) {
        len++;
      }
      for (var key in value) {
        notify(key, value[key], ++i == len, indent, true);
      }
      draw.push(tab + '}' + (isLast ? line : (',' + line)));
      /*缩进'}'换行,若非尾元素则添加逗号*/
    } else {
      if (typeof value == 'string') {
        value = '"' + value + '"';
      }
      draw.push(tab + (formObj ? ('"' + name + '":') : '') + value + (isLast ? '' : ',') + line);
    }
  };
  var isLast = true, indent = 0;
  notify('', data, isLast, indent, false);
  return draw.join('');
}
```

希望对你有帮助！
