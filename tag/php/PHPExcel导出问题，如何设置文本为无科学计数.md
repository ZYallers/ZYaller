# PHPExcel导出问题，如何设置文本为无科学计数

可以直接设置那一列的宽度，让他适合你的数字长度
```php
$objActSheet->getColumnDimension('B')->setAutoSize(true);  $objActSheet->getColumnDimension('A')->setWidth(30);
```
也可以把该列的设置成文档
```php
$objActSheet->setCellValueExplicit('A5','847475847857487584',PHPExcel_Cell_DataType::TYPE_STRING);
```