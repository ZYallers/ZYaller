# PHP的一个实现将多张图片垂直拼接成一张图片的方法
```php
<?php
/**
 * 将多张图片垂直拼接成一张图片
 * @param array $pic
 * @param int $width
 * @param int $space
 * @param bool $transparent
 * @return null|string
 */
function verJoinPic(array $pic, $width = 200, $space = 0, $transparent = true)
{
    $len = count($pic);
    if ($len == 0) {
        return null;
    }
    $bgHeight = ($width * $len) + ($len - 1) * $space; // 背景图片高度
    $bg = imagecreatetruecolor($width, $bgHeight); // 背景图片
    $color = imagecolorallocate($bg, 255, 255, 255); // 为真彩色画布创建白色背景
    imagefill($bg, 0, 0, $color);
    $transparent && imageColorTransparent($bg, $color); // 再设置为透明

    $startX = 0;  // 开始位置X
    $startY = 0;  // 开始位置Y
    $picWidth = $width; // pic宽度
    $picHeight = $width; // pic高度

    foreach ($pic as $k => $pic_path) {
        $startY = $k * ($picWidth + $space);
        $pathInfo = pathinfo($pic_path);
        switch (strtolower($pathInfo['extension'])) {
            case 'jpg':
            case 'jpeg':
                $imageCreateFrom = 'imagecreatefromjpeg';
                break;
            case 'png':
                $imageCreateFrom = 'imagecreatefrompng';
                break;
            case 'gif':
            default:
                $imageCreateFrom = 'imagecreatefromstring';
                $pic_path = file_get_contents($pic_path);
                break;
        }
        $resource = $imageCreateFrom($pic_path);
        // $start_x,$start_y copy图片在背景中的位置
        // 0,0 被copy图片的位置
        // $pic_w,$pic_h copy后的宽度和高度
        // 最后两个参数为原始图片宽度和高度，copy时的图片宽度和高度
        imagecopyresized($bg, $resource, $startX, $startY, 0, 0, $picWidth, $picHeight, imagesx($resource), imagesy($resource));
    }

    ob_start();
    imagepng($bg);
    //imagedestroy($bg);
    $data = ob_get_contents();
    ob_end_clean();
    $base64 = 'data:' . 'image/png' . ';base64,' . base64_encode($data);
    return $base64;
}
?>
```
简单测试一下：
```php
<?php
$pic = array(
    'http://img104.job1001.com/upload/faceimg/20140305/5176438df39012880af6da07c725d91f_1394001874.jpeg',
    'http://img104.job1001.com/upload/faceimg/20131121/90d8df2365743b0830f57ed3090c3311_1385026102.gif',
    'http://img104.job1001.com/upload/faceimg/20131121/47e5646b82141486ccd6d490cd1c6670_1385026071.gif',
    'http://img104.job1001.com/upload/faceimg/20130820/ec2135080510a11fd163d1ebc487ea84_1376968031.png',
    'http://img104.job1001.com/upload/faceimg/20130322/427f52f63193a2ffe2ef8f4e9130c74a_1363919801.jpeg',
    'http://img104.job1001.com/upload/faceimg/20130916/65ae25bf4cf82eae8ba26d1f9e67b3ae_1379298441.jpeg',
    'http://img104.job1001.com/upload/faceimg/20131126/71c2cff7d0105602513f74568c1967ab_1385448526.gif',
    'http://img104.job1001.com/upload/faceimg/20131121/375d6cf0ce7bd3b21a48eb8e6bafa2c8_1385026044.gif',
    'http://img104.job1001.com/upload/faceimg/20131121/d5f4380f337f0b0a96592f80f83d20e5_1385026012.gif'
);
echo $src = verJoinPic($pic, 200, 10, false);
exit;
?>
```
执行上面几行代码，然后把输出的base64内容copy，然后去 `http://imgbase64.duoshitong.com/` 网站，把base64转回图片就可以看到图片了。

## 参考资料
- http://blog.csdn.net/hxb147542579/article/details/52781859
- http://blog.csdn.net/sugang_ximi/article/details/30764617
- http://imgbase64.duoshitong.com