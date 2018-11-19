# golang 文件以及文件夹路径相关操作
> https://blog.csdn.net/wangshubo1989/article/details/77933654?locationNum=4&fps=1

![IMG](https://img-blog.csdn.net/20170911152638909?watermark/2/text/aHR0cDovL2Jsb2cuY3Nkbi5uZXQvd2FuZ3NodWJvMTk4OQ==/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70/gravity/SouthEast)

### 获取目录中所有文件
> 使用包：io/ioutil

> 使用方法：ioutil.ReadDir 

读取目录 dirmane 中的所有目录和文件（不包括子目录） 

返回读取到的文件的信息列表和读取过程中遇到的任何错误
 
返回的文件列表是经过排序的

#### FileInfo
```go
type FileInfo interface {
        Name() string       // base name of the file
        Size() int64        // length in bytes for regular files; system-dependent for others
        Mode() FileMode     // file mode bits
        ModTime() time.Time // modification time
        IsDir() bool        // abbreviation for Mode().IsDir()
        Sys() interface{}   // underlying data source (can return nil)
}
```

#### 代码：
```go
package main

import (
    "fmt"
    "io/ioutil"
)

func main() {
    myfolder := `d:\go_workspace\`

    files, _ := ioutil.ReadDir(myfolder)
    for _, file := range files {
        if file.IsDir() {
            continue
        } else {
            fmt.Println(file.Name())
        }
    }
}
```

### 获取目录以及子目录中所有文件

在上面代码的基础上，使用递归，遍历所有的文件夹和子文件夹。

#### 代码：
```go
package main

import (
    "fmt"
    "io/ioutil"
)

func main() {
    myfolder := `d:\go_workspace\`
    listFile(myfolder)
}

func listFile(myfolder string) {
    files, _ := ioutil.ReadDir(myfolder)
    for _, file := range files {
        if file.IsDir() {
            listFile(myfolder + "/" + file.Name())
        } else {
            fmt.Println(myfolder + "/" + file.Name())
        }
    }
}
```

### 获取执行文件所在目录

#### 代码1：
> 使用包：path/filepath os
```go
package main

import (
    "fmt"
    "log"
    "os"
    "path/filepath"
)

func main() {
    dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(dir)
}
```

#### 代码2：
> 使用包：path/filepath os
```go
package main

import (
    "fmt"
    "os"
    "path/filepath"
)

func main() {
    ex, err := os.Executable()
    if err != nil {
        panic(err)
    }
    exPath := filepath.Dir(ex)
    fmt.Println(exPath)
}
```

#### 代码3：
>使用包：os
```go
package main

import (
    "fmt"
    "os"
)

func main() {
    pwd, err := os.Getwd()
    if err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
    fmt.Println(pwd)
}
```

#### 代码4：
>使用包：path/filepath
```go
package main

import (
    "fmt"
    "path/filepath"
)

func main() {
    fmt.Println(filepath.Abs("./"))
}
```

#### 代码5：
>第三方库：https://github.com/kardianos/osext
```go
package main

import (
    "fmt"
    "log"

    "github.com/kardianos/osext"
)

func main() {
    folderPath, err := osext.ExecutableFolder()
    if err != nil {
        log.Fatal(err)
    }
    fmt.Println(folderPath)
}
```

### 获取文件夹中所有文件以及文件的大小

> 使用包：path/filepath os

#### 代码：
```go
package main

import (
    "fmt"
    "os"
    "path/filepath"
)

func main() {
    dirname := "." + string(filepath.Separator)
    d, err := os.Open(dirname)
    if err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
    defer d.Close()
    fi, err := d.Readdir(-1)
    if err != nil {
        fmt.Println(err)
        os.Exit(1)
    }
    for _, fi := range fi {
        if fi.Mode().IsRegular() {
            fmt.Println(fi.Name(), fi.Size(), "bytes")
        }
    }
}
```

### 重命名文件
#### 代码：
```go
package main

import (
    "log"
    "os"
)

func main() {
    originalPath := "test"
    newPath := "test_new"
    err := os.Rename(originalPath, newPath)
    if err != nil {
        log.Fatal(err)
    }
}
```

### 判断某个文件是否存在
#### 代码：
```go
package main

import (
    "fmt"
    "os"
)

func main() {
    originalPath := "test.txt"
    result := Exists(originalPath)
    fmt.Println(result)
}

func Exists(name string) bool {
    if _, err := os.Stat(name); err != nil {
        if os.IsNotExist(err) {
            return false
        }
    }
    return true
}
```

### 判断某个文件的读写权限
#### 代码：
```go
package main

import (
    "log"
    "os"
)

func main() {

    //Write permission
    file, err := os.OpenFile("./test.txt", os.O_WRONLY, 0666)
    if err != nil {
        if os.IsPermission(err) {
            log.Println("Error: Write permission denied.")
        }
    }
    file.Close()

    //Read permission
    file, err = os.OpenFile("./test.txt", os.O_RDONLY, 0666)
    if err != nil {
        if os.IsPermission(err) {
            log.Println("Error: Read permission denied.")
        }
    }
    file.Close()
}
```