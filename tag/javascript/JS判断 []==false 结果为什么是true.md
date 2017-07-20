# JS判断 []==false 结果为什么是true？

```
var tmp = 'a';
if([] == false) tmp += 'b';
if(![]) tmp += 'c';
alert(tmp); //tmp 值为 ？
```

你或许会不理解[]==false为什么会判断为true？

这个js 的判定 在权威指南中有明确说明。主要是js的机制问题 任何类型在特定环境 会把类型改变成匹配环境的类型。
if()这个括号环境里面 需要的是bool值 那么不管你在括号里写什么 最终将会被转化成bool。
而[]等于false，在等于运算符的左边权威指南中用了左值这个名词 在==这个环境中首先将左值进行了类型转化。
在js看来 空数组 空对象 0 空字符串 等当作false 所以[]==false 这个返回的是true。

再补充扩展：

```
alert(typeof(false) === 'boolean');
alert(typeof(0) === 'number');
alert(typeof("") === 'string');
alert(typeof(null) === 'object');
alert(typeof undefined === 'undefined');
```

运行上述代码，弹出的对话框应该显示的都是true。也就是说，false是布尔类型对象，0是数字类型对象，空字符串是字符串类型对象，null是object对象，undefined类型还是undefined。

当你用==操作符将false对象和其他对象进行比较的时候，你会发现， 只有0和空字符串、空数组等于false；undefined和null对象并不等于false对象，而null和undefined是相等的。

```
var a=[];
alert(a==false);
alert(false == undefined);
alert(false == null);
alert(false == 0);
alert(false == "");
alert(null == undefined);
```

我们可以把0、空字符串、空数组和false归为一类，称为"假值"；把null和undefined归为一类，称为"空值"。