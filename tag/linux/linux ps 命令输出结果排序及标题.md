# linux ps 命令输出结果排序及标题

#### 按实际内存消耗的指定序列显示前10条记录

- 降序
```bash
ps auxw|head -1;ps auxw|sort -rn -k6|head -10
```
- 升序
```bash
ps auxw|head -1;ps auxw|sort -n -k6|head -10
```
#### 命令说明
- `ps auxw|head -1` 获取第一行，即标题头
- `sort -n -k6` 按第6个关键字(key)排序，key从1开始

#### 不带标题头(降序)
```bash
ps auxw|sort -rn -k6|head -10
```

#### 用--sort选项排序
- 降序
```bash
ps aux --sort=-rss|head -10
```
- 升序
```bash
ps aux --sort=rss|head -10
```