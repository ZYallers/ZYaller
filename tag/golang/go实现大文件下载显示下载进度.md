[//]:# (2021/10/26 17:05|GOLANG|https://img2.baidu.com/it/u=1764514498,1537292893&fm=26&fmt=auto)
# go实现大文件下载显示下载进度

go下载文件的方法很简单，性能也不错。但下载大文件还能现在进度的还是有点不同，这里写个案例，方便后面回忆。


```go
package test

import (
	"io"
	"log"
	"net/http"
	"os"
	"testing"
)

type Downloader struct {
	io.Reader
	Total   int64
	Current int64
}

func (d *Downloader) Read(p []byte) (n int, err error) {
	n, err = d.Reader.Read(p)
	d.Current += int64(n)
	if d.Current == d.Total {
		log.Printf("\r下载完成，下载进度：%.2f%%", float64(d.Current*10000/d.Total)/100)
	} else {
		log.Printf("\r正在下载...，下载进度：%.2f%%", float64(d.Current*10000/d.Total)/100)
	}
	return
}

func DownloadFile(url, filePath string) error {
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	downloader := &Downloader{
		Reader: resp.Body,
		Total:  resp.ContentLength,
	}
	if _, err := io.Copy(file, downloader); err != nil {
		return err
	}
	return nil
}

func Test_fileDownload(t *testing.T) {
	err := DownloadFile("https://dl.softmgr.qq.com/original/game/WeGameSetup3.32.4.6183_gjwegame_0_0.exe", "./wegame.exe")
	if err != nil {
		t.Error(err)
	}
}
```
