[//]:# (2020/5/25 17:03|GOLANG|https://images.weserv.nl/?url=https://i0.hdslb.com/bfs/article/f19d5bd98ba6ab613c852bad989d6d543ef88c6b.jpg)
# go mysql表结构转换成struct结构体

Goper们都会有这个痛点，在Model层读写数据都时候，需要给对应操作表映射一个结构体struct，然后再一一赋值给对应表字段。
如果表才五六个字段还好，但现在开发项目中，都是有很多字段。。要撸的代码就多了。

所以，某人开始研究这里要说这个工具，我在巨人的基础上进行了定制完善。

核心代码如下：
```go
// Copyright (c) 2020 HXS R&D Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
//
// @Title mcs
// @Description mysql_convert_struct
//
// @Author zhongyongbiao
// @Version 1.0.0
// @Time 2020/5/25 上午9:57
// @Software GoLand
package main

import (
	"bufio"
	"bytes"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
)

func convert(str string) string {
	// 转换数据表名为 model 名称
	matchTableName := regexp.MustCompile("CREATE TABLE `([a-z_0-9]+)`.*").FindAllStringSubmatch(str, -1)
	if len(matchTableName) > 0 {
		for _, row := range matchTableName {
			tableName := row[1]
			modelName := strings.ReplaceAll(strings.Title(strings.ReplaceAll(tableName, `_`, ` `)), ` `, ``)
			str = strings.ReplaceAll(str, row[0], `type `+modelName+` struct {`)

			// 转换数据表结束符
			tableTail := regexp.MustCompile("\\) (ENGINE|AUTO_INCREMENT=|ROW_FORMAT).*").FindAllString(str, 1)
			if len(tableTail) > 0 {
				str = strings.ReplaceAll(str, tableTail[0], "}\n\nfunc (tb "+modelName+") TableName() string {\n    return \""+tableName+"\"\n}")
			}
		}
	}

	// 转换为小写并且加上前缀;号
	str = strings.ReplaceAll(str, ` NOT NULL`, `;not null`)
	str = strings.ReplaceAll(str, ` NULL`, `;null`)
	str = strings.ReplaceAll(str, ` AUTO_INCREMENT`, `;AUTO_INCREMENT`)
	str = strings.ReplaceAll(str, ` unsigned`, `;unsigned`)
	str = regexp.MustCompile(" DEFAULT '(.*?)'").ReplaceAllString(str, `;default:'$1'`)
	str = strings.ReplaceAll(str, ` DEFAULT CURRENT_TIMESTAMP`, `;default:CURRENT_TIMESTAMP`)

	// 转换备注
	matchComment := regexp.MustCompile(" COMMENT '(.*?)',").FindAllStringSubmatch(str, -1)
	if len(matchComment) > 1 {
		for _, row := range matchComment {
			// 英文逗号转中文，要不然会正则匹配有问题，再把中文逗号转成|符号
			comment := strings.ReplaceAll(strings.ReplaceAll(row[1], `,`, `，`), `，`, `|`)
			str = strings.ReplaceAll(str, row[0], ",  // "+comment)
		}
	}

	// 转换字段名
	matchFieldName := regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*,)").FindAllStringSubmatch(str, -1)
	if len(matchFieldName) > 1 {
		for _, row := range matchFieldName {
			fieldName := row[1]
			attribute := row[2]
			newFieldName := strings.ReplaceAll(strings.Title(strings.ReplaceAll(fieldName, `_`, ` `)), ` `, ``)
			str = strings.ReplaceAll(str, row[0], "`"+newFieldName+"` json:\""+fieldName+"\" gorm:\"column:"+fieldName+";"+attribute)
		}
	}

	// 转换属性
	str = regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*?;)(bigint|int|tinyint|smallint)(.*),").ReplaceAllString(str, "$1    int    `${2}type:$3$4\"`")
	str = regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*?;)(decimal|float)(.*),").ReplaceAllString(str, "$1    float64    `${2}type:$3$4\"`")
	str = regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*?;)(varchar|char)(.*),").ReplaceAllString(str, "$1    string    `${2}type:$3$4\"`")
	str = regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*?;)(text)(.*),").ReplaceAllString(str, "$1    string    `${2}type:$3$4\"`")
	str = regexp.MustCompile("`([a-z_0-9A-Z]+)` (.*?;)(timestamp;)(.*),").ReplaceAllString(str, "$1    time.Time    `${2}type:$3$4\"`")

	// 删除不知道怎么转换的属性
	str = strings.ReplaceAll(str, ` ON UPDATE CURRENT_TIMESTAMP`, ``)
	str = regexp.MustCompile("\\s*(PRIMARY|UNIQUE)? KEY .*(,)?").ReplaceAllString(str, ``)

	// 增加 package 和 import
	if regexp.MustCompile(`time.Time`).MatchString(str) {
		str = "package table\n\nimport \"time\"\n\n" + str
	} else {
		str = "package table\n\n" + str
	}

	return str
}

func shellEcho(str, msgType string) {
	switch msgType {
	case "ok":
		fmt.Printf("\033[32m%s\033[0m\n", str)
	case "err":
		fmt.Printf("\033[31m%s\033[0m\n", str)
	case "tip":
		fmt.Printf("\033[33m%s\033[0m\n", str)
	case "title":
		fmt.Printf("\033[42;34m%s\033[0m\n", str)
	default:
		fmt.Printf("%s\n", str)
	}
}

func execShell(name string, arg ...string) ([]byte, error) {
	// 函数返回一个*Cmd，用于使用给出的参数执行name指定的程序
	cmd := exec.Command(name, arg...)

	// 读取io.Writer类型的cmd.Stdout，再通过bytes.Buffer(缓冲byte类型的缓冲器)将byte类型转化为[]byte类型
	var out bytes.Buffer
	cmd.Stdout = &out

	// Run执行c包含的命令，并阻塞直到完成。这里stdout被取出，cmd.Wait()无法正确获取stdin,stdout,stderr，则阻塞在那了。
	if err := cmd.Run(); err != nil {
		return nil, err
	} else {
		return out.Bytes(), nil
	}
}

func main() {
	reader := bufio.NewReader(os.Stdin)
	shellEcho(`请输入您的内容：`, "title")
	var buf bytes.Buffer

LOOP:
	for {
		text, _ := reader.ReadString('\n')
		if runtime.GOOS == "windows" {
			text = strings.Replace(text, "\r\n", "", -1)
		} else {
			text = strings.Replace(text, "\n", "", -1)
		}
		switch text {
		case ":h":
			shellEcho("->:p		--(print)显示已输入内容；", "tip")
			shellEcho("->:r		--(reset)清空已输入内容；", "tip")
			shellEcho("->:c		--(convert)转义已输入内容；", "tip")
			shellEcho("->:q		--(quit)退出程序；", "tip")
			shellEcho("->:h		--(help)显示帮助信息！", "tip")
		case ":c":
			shellEcho("Convert Result:", "title")
			shellEcho("-----------BEGIN-----------", "tip")
			output := convert(buf.String())
			dir, _ := os.Getwd()
			tmpFile := dir + "/bin/mcs.tmp"
			if err := ioutil.WriteFile(tmpFile, []byte(output), os.ModePerm); err != nil {
				shellEcho("ioutil.WriteFile Error: "+err.Error(), "err")
			} else {
				if _, err := execShell("gofmt", "-l", "-w", "-s", tmpFile); err != nil {
					shellEcho("execShell Error: "+err.Error(), "err")
				} else {
					if body, err := ioutil.ReadFile(tmpFile); err != nil {
						shellEcho("ioutil.ReadFile Error: "+err.Error(), "err")
					} else {
						if err := os.Remove(tmpFile); err != nil {
							shellEcho("os.Remove Error: "+err.Error(), "err")
						} else {
							shellEcho(string(body), "ok")
						}
					}
				}
			}
			shellEcho("------------END------------", "tip")
		case ":q":
			shellEcho("已退出！", "ok")
			break LOOP
		case ":r":
			buf.Reset()
			shellEcho("已清空！", "ok")
			shellEcho("请重新输入您的内容：", "title")
		case ":p":
			shellEcho("您已输入的内容：", "title")
			shellEcho(buf.String(), "ok")
		default:
			buf.WriteString(text + "\n")
		}
	}
}
```
对于如何使用，代码量不多，相信Goper都能看懂，大概就是编译这些代码的go文件，然后执行编译出来的文件，输入参数`:h`查看帮助信息即知晓如何使用。

> 提醒：这里使用了gofmt工具对输出的go代码进行格式化，一般gofmt都是在安装go时候已经自带了。如提示gofmt命令不存在，可能是你PATH没设置，又或许gofmt真的没！这时候你就要自己找度娘了。

如觉得有用，可以先Mark一下！