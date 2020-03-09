# Elasticsearch Kibana查询语法
> https://blog.csdn.net/wangpei1949/article/details/80518541

Elasticsearch Kibana Discover的搜索框中，使用的是Lucene Query Syntax。经常使用，在这里梳理并总结。

## 查询语法

### 全文搜索
#### 单词
> apple pear ,返回所有字段中包含单词apple或pear的文档

#### 短语
> "apple pear" ,返回所有字段中包含短语"apple pear"的文档

### 按字段搜索
#### 一个字段
> nickname:apple pear,返回nickname字段包含单词apple或pear的文档
>
> nickname:"apple pear",返回username字段包含短语"apple pear"的文档

#### 多个字段
> name:jack AND nickname:"apple pear",返回name字段包含单词jack 并且 nickname字段包含短语"apple pear"的文档

### 通配符搜索
#### 匹配单一字符
> nickname:appl? ,返回nickname字段包含单词(appl+任意一个字符)的文档

#### 匹配任意多个字符
> nickname:app*e,返回nickname字段包含单词(以app开头,以e结尾)的文档

### 范围搜索
#### 包括首尾
> dt:["2016-06-25" TO "2016-08-25"],返回"2016-06-25"≤ dt ≤"2016-08-25"的文档

#### 不包括首尾
> dt:{"2016-06-25" TO "2016-08-25"},返回"2016-06-25"< dt <"2016-08-25"的文档

#### 包括首或尾
> dt:{"2016-06-25" TO "2016-08-25"],返回"2016-06-25"< dt ≤"2016-08-25"的文档

### 布尔搜索
#### AND
> name:"jack ma" AND nickname:"apple pear pear",返回name字段包含"jack ma" 且 nickname字段包含"apple pear pear"的文档

#### OR
> name:jack OR nickname:apple,返回name字段包含jack或nickname字段包含apple的文档

#### NOT
> name:jack NOT nickname:"pear pear",返回name字段包含jack,nickname字段不包含"pear pear"的文档

#### 分组搜索
> (name:"jack chen" OR name:lucy ) AND  nickname:"apple pear",返回name字段包含"jack chen"或lucy，同时nickname字段包含"apple pear"的文档
>
> name:("jack chen" NOT lucy ) AND  nickname:"apple pear",返回name字段包含"jack chen"不包含lucy,同时nickname字段包含"apple pear"的文档

### 转义特殊字符
> `{ }  + - && || ! ( ) [ ] ^ " ~ * ? \ :`, 用 \ 转义。能搜索到的内容和选择的分词器有关。