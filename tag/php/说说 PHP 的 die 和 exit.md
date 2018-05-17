# 说说 PHP 的 die 和 exit
> https://segmentfault.com/a/1190000003791418

小伙伴说 exit 和 die 有一点差别。我说 die 不就是 exit 的别名吗？为了证明我的观点，翻了翻 PHP 的源码，在 zend_language_scanner.l 中，很容易就能发现这关键字是同一个 token：

```C
<ST_IN_SCRIPTING>"exit" {
    return T_EXIT;
}

<ST_IN_SCRIPTING>"die" {
    return T_EXIT;
}
```

所以最终也是同一个 Opcode：ZEND_EXIT。所以这两个关键字没有任何差别，这其实也没什么好说的。

我顺便提醒了小伙伴们一句：不要用 exit 输出整数。原因也很简单，在 PHP 官网的文档里就能看到：

> void exit ([ string $status ] )
>
> void exit ( int $status )   
>
> 如果 status 是一个字符串，在退出之前该函数会打印 status。
>
> 如果 status 是一个 integer，该值会作为退出状态码，并且不会被打印输出。 退出状态码应该在范围0至254，不应使用被PHP保留的退出状态码255。 状态码0用于成功中止程序。

所以如果 status 是一个整数，会被当成状态码输出，而不是打印，所以如果想返回给前端是不可能的。

那么这个状态码有什么用呢？

大家都知道 shell 脚本执行可以返回一个状态码，PHP 的脚本的执行返回的状态码是一样的，可以在环境变量中被捕捉到：

```shell
Scholer: ~ $ php -r 'exit(254);'

Scholer: ~ $ echo $?
254
```
我的好奇心又被勾起来了：如果给的是不在 0 ~ 255 之间的状态码会怎么样呢？经过测试，发现如果是大于 255 的状态码，会返回 status 对 256 求余之后的结果。如果是小于 0 的，在 -1 ~ - 255 之间时返回的是 status 256 求和的结果，小于 -256 的则是绝对值和 256 求余。总之都在 0 ~ 255 之间。

接着探究下去。

exit 的实现在 zend_vm_def.h 中：

```C
ZEND_VM_HANDLER(79, ZEND_EXIT, CONST|TMP|VAR|UNUSED|CV, ANY)
{
#if !defined(ZEND_VM_SPEC) || (OP1_TYPE != IS_UNUSED)
    USE_OPLINE

    SAVE_OPLINE();
    if (OP1_TYPE != IS_UNUSED) {
        zend_free_op free_op1;
        zval *ptr = GET_OP1_ZVAL_PTR(BP_VAR_R);

        if (Z_TYPE_P(ptr) == IS_LONG) {
            EG(exit_status) = Z_LVAL_P(ptr);
        } else {
            zend_print_variable(ptr);
        }
        FREE_OP1();
    }
#endif
```
从代码中我们可以很明显的看出来通过 Z_TYPE_P 来检测状态码的类型，如果是 long 的话就赋值给全局变量 exit_status（EG 这个宏就是用来便捷的访问全局变量的），如果不是，就调用 zend_print_variable 打印出来。

Z_LVAL_P 的声明在 zend_operators.h 中：

```C
#define Z_LVAL_P(zval_p)        Z_LVAL(*zval_p)
...
#define Z_LVAL(zval)            (zval).value.lval
```
再进一步就是大家都知道的 PHP 解释器中的变量定义了（我这份源码还是 PHP 5.5 的版本，不是 PHP7），在 zend.h 中：

```C
typedef union _zvalue_value {
    long lval;                    /* long value */
    double dval;                /* double value */
    struct {
        char *val;
        int len;
    } str;
    HashTable *ht;                /* hash table value */
    zend_object_value obj;
} zvalue_value;

struct _zval_struct {
    /* Variable information */
    zvalue_value value;        /* value */
    zend_uint refcount__gc;
    zend_uchar type;    /* active type */
    zend_uchar is_ref__gc;
};
```

所以这里 exit_status 的值到这里还是一个长整形。

那么问题就来了，为什么最终输出的是 0 ~ 255 之间的状态码呢？老实说这个问题我吃的也不是很透，这需要对 Linux 环境编程足够熟悉才行，这里只能简单的说一下。

通过 strace 跟踪一下执行：

```shell
$ strace php -r 'exit(258);' >& strace.log
```
在结果的最后两行可以很清楚的看到：

```shell
...
exit_group(258)                         = ?
+++ exited with 2 +++
```

exit_group 中还是原始值，但最终会变成 2 。PHP 本身并没有对这个值做特殊处理，但是 exit 或者 main 函数中的 return，只能使用 0 ~ 255 之间的值，其他值都会被处理。可以写一个简单的程序测试：

```java
int main(int argc, char const *argv[])
{
    return 258;
}
```

结果：

```shell
Scholer: ~ $ ./test

Scholer: ~ $ echo $?
2
```
##  参考资料
- http://www.laruence.com/2012/02/01/2503.html
