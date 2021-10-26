[//]:# (2021/10/26 15:42|GOLANG|https://img0.baidu.com/it/u=1375412460,640457515&fm=26&fmt=auto)
# 四舍五入在go语言中为何如此困难
> [戚银|知乎](https://zhuanlan.zhihu.com/p/341371195)

四舍五入是一个非常常见的功能，在流行语言标准库中往往存在 Round 的功能，它最少支持常用的 Round half up 算法。

而在 Go 语言中这似乎成为了难题，在 stackoverflow 上搜索 [go] Round 会存在大量相关提问，Go 1.10 开始才出现 math.Round 的身影，本以为 Round 的疑问就此结束，但是一看函数注释 Round returns the nearest integer, rounding half away from zero ，这是并不常用的 Round half away from zero 实现呀，说白了就是我们理解的 Round 阉割版，精度为 0 的 Round half up 实现，Round half away from zero 的存在是为了提供一种高效的通过二进制方法得结果，可以作为 Round 精度为 0 时的高效实现分支。

带着对 Round 的‘敬畏’，我在 stackoverflow 翻阅大量关于 Round 问题，开启寻求最佳的答案，本文整理我认为有用的实现，简单分析它们的优缺点，对于不想逐步了解，想直接看结果的小伙伴，可以直接看文末的最佳实现，或者跳转 exmath.Round 直接看源码和使用吧！

## Round 第一弹

在 stackoverflow 问题中的最佳答案首先获得我的关注，它在 mathx.Round 被开源，以下是代码实现：

```go
//source: https://github.com/icza/gox/blob/master/mathx/mathx.go
package mathx

import "math"

// Round returns x rounded to the given unit.
// Tip: x is "arbitrary", maybe greater than 1.
// For example:
//     Round(0.363636, 0.001) // 0.364
//     Round(0.363636, 0.01)  // 0.36
//     Round(0.363636, 0.1)   // 0.4
//     Round(0.363636, 0.05)  // 0.35
//     Round(3.2, 1)          // 3
//     Round(32, 5)           // 30
//     Round(33, 5)           // 35
//     Round(32, 10)          // 30
//
// For details, see https://stackoverflow.com/a/39544897/1705598
func Round(x, unit float64) float64 {
    return math.Round(x/unit) * unit
}
```

这个实现非常的简洁，借用了 math.Round，由此看来 math.Round 还是很有价值的，大致测试了它的性能一次运算大概 0.4ns，这非常的快。

但是我也很快发现了它的问题，就是精度问题，这个是问题中一个回答的解释让我有了警觉，并开始了实验。他认为使用浮点数确定精度（mathx.Round的第二个参数）是不恰当的，因为浮点数本身并不精确，例如 0.05 在64位IEEE浮点数中，可能会将其存储为0.05000000000000000277555756156289135105907917022705078125。

```go
//source: https://play.golang.org/p/0uN1kEG30kI
package main

import (
    "fmt"
    "math"
)

func main() {
    f := 12.15807659924030304
    fmt.Println(Round(f, 0.0001)) // 12.158100000000001

    f = 0.15807659924030304
    fmt.Println(Round(f, 0.0001)) // 0.15810000000000002
}

func Round(x, unit float64) float64 {
    return math.Round(x/unit) * unit
}
```

以上代码可以在 Go Playground 上运行，得到结果并非如期望那般，这个问题主要出现在 math.Round(x/unit) 与 unit 运算时，math.Round 运算后一定会是一个精确的整数，但是 0.0001 的精度存在误差，所以导致最终得到的结果精度出现了偏差。

## 格式化与反解析

在这个问题中也有人提出了先用 fmt.Sprintf 对结果进行格式化，然后再采用 strconv.ParseFloat 反向解析，Go Playground 代码在这个里。

```go
source: https://play.golang.org/p/jxILFBYBEF
package main

import (
    "fmt"
    "strconv"
)

func main() {
    fmt.Println(Round(0.363636, 0.05)) // 0.35
    fmt.Println(Round(3.232, 0.05))    // 3.25
    fmt.Println(Round(0.4888, 0.05))   // 0.5
}

func Round(x, unit float64) float64 {
    var rounded float64
    if x > 0 {
        rounded = float64(int64(x/unit+0.5)) * unit
    } else {
        rounded = float64(int64(x/unit-0.5)) * unit
    }
    formatted, err := strconv.ParseFloat(fmt.Sprintf("%.2f", rounded), 64)
    if err != nil {
        return rounded
    }
    return formatted
}
```

这段代码中有点问题，第一是结果不对，和我们理解的存在差异，后来一看第二个参数传错了，应该是 0.01，我想试着调整调整精度吧，我改成了 0.0001 之后发现一直都是保持小数点后两位，我细细研究了下这段代码的逻辑，发现 fmt.Sprintf("%.2f", rounded) 中写死了保留的位数，所以它并不通用，我尝试如下简单调整一下使其生效。

```go
package main

import (
    "fmt"
    "strconv"
)

func main() {
    f := 12.15807659924030304
    fmt.Println(Round(f, 0.0001)) // 12.1581

    f = 0.15807659924030304
    fmt.Println(Round(f, 0.0001)) // 0.1581

    fmt.Println(Round(0.363636, 0.0001)) // 0.3636
    fmt.Println(Round(3.232, 0.0001))    // 3.232
    fmt.Println(Round(0.4888, 0.0001))   // 0.4888
}

func Round(x, unit float64) float64 {
    var rounded float64
    if x > 0 {
        rounded = float64(int64(x/unit+0.5)) * unit
    } else {
        rounded = float64(int64(x/unit-0.5)) * unit
    }

    var precision int
    for unit < 1 {
        precision++
        unit *= 10
    }

    formatted, err := strconv.ParseFloat(fmt.Sprintf("%."+strconv.Itoa(precision)+"f", rounded), 64)
    if err != nil {
        return rounded
    }
    return formatted
}
```

确实获得了满意的精准度，但是其性能也非常客观，达到了 215ns/op，暂时看来如果追求精度，这个算法目前是比较完美的。

## 大道至简

很快我发现了另一个极简的算法，它的精度和速度都非常的高，实现还特别精简：

```go
package main

import (
    "fmt"

    "github.com/thinkeridea/go-extend/exmath"
)

func main() {
    f := 0.15807659924030304
    fmt.Println(float64(int64(f*10000+0.5)) / 10000) // 0.1581
}
```

这并不通用，除非像以下这么包装：

```go
func Round(x, unit float64) float64 {
    return float64(int64(x*unit+0.5)) / unit
}
```

unit 参数和之前的概念不同了，保留一位小数 uint =10，只是整数 uint=1, 想对整数部分进行精度控制 uint=0.01 例如： Round(1555.15807659924030304, 0.01) = 1600，Round(1555.15807659924030304, 1) = 1555，Round(1555.15807659924030304, 10000) = 1555.1581。

这似乎就是终极答案了吧，等等……

## 终极方案

上面的方法够简单，也够高效，但是 api 不太友好，第二个参数不够直观，带了一定的心智负担，其它语言都是传递保留多少位小数，例如 Round(1555.15807659924030304, 0) = 1555，Round(1555.15807659924030304, 2) = 1555.16，Round(1555.15807659924030304, -2) = 1600，这样的交互才符合人性啊。

别急我在 go-extend 开源了 exmath.Round，其算法符合通用语言 Round 实现，且遵循 Round half up 算法要求，其性能方面在 3.50ns/op, 具体可以参看调优exmath.Round算法， 具体代码如下：

```go
//source: https://github.com/thinkeridea/go-extend/blob/main/exmath/round.go

package exmath

import (
    "math"
)

// Round 四舍五入，ROUND_HALF_UP 模式实现
// 返回将 val 根据指定精度 precision（十进制小数点后数字的数目）进行四舍五入的结果。precision 也可以是负数或零。
func Round(val float64, precision int) float64 {
    p := math.Pow10(precision)
    return math.Floor(val*p+0.5) / p
}
```

## 总结

Round 功能虽简单，但是受到 float 精度影响，仍然有很多人在四处寻找稳定高效的算法，参阅了大多数资料后精简出 exmath.Round 方法，期望对其他开发者有所帮助，至于其精度使用了大量的测试用例，没有超过 float 精度范围时并没有出现精度问题，未知问题等待社区检验，具体测试用例参见 round_test。
