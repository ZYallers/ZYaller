# shell下执行mysql命令使输出结果不打印列名

> <http://zacharyhu.org/?p=203>

添加参数 `-N` 即可。

说明：

- –column-names Write column names in results.
- -N, –skip-column-names
- Don’t write column names in results. 
- WARNING: -N is column-names TRUE

对于shell脚本获取结果极为方便。
