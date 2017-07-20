# PHP使用Image Magick将PDF文件转换为JPG文件的方法

这篇文章主要介绍了php使用Image Magick将PDF文件转换为JPG文件的方法，具有一定参考借鉴价值,需要的朋友可以参考下。这是一个非常简单的格式转换代码，可以把.PDF文件转换为.JPG文件，代码要起作用，服务器必须要安装Image Magick 扩展。

```php
$pdf_file  = './pdf/demo.pdf'; 
$save_to  = './jpg/demo.jpg'; //make sure that apache has permissions to write in this folder! 

//execute ImageMagick command 'convert' and convert PDF 
//to JPG with applied settings 
exec('convert "'.$pdf_file.'" -colorspace RGB -resize 800 "'.$save_to.'"', $output, $return_var); 
   
if($return_var == 0) { 
  //if exec successfuly converted pdf to jpg   
  print "Conversion OK"; 
} else {
  print "Conversion failed.".$output;
}
```
