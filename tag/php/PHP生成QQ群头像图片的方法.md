# PHP生成QQ群头像图片的方法
```php
<?php
/**
 * 生成QQ群头像图片
 * @param array $pic
 * @param int $bgWidth
 * @param bool $transparent
 * @return string
 *
 */
function genQqGroupHead($pic, $bgWidth = 200, $transparent = false)
{
    $len = count($pic);
    if ($len == 0) {
        return null;
    }
    $pic = array_slice($pic, 0, 4); // 只操作前4个图片

    $bgHeight = $bgWidth;
    $srcImg = imagecreatetruecolor($bgWidth, $bgHeight); // 背景图片
    $color = imagecolorallocate($srcImg, 255, 255, 255); // 为真彩色画布创建白色背景
    imagefill($srcImg, 0, 0, $color);
    $transparent && imageColorTransparent($srcImg, $color); // 再设置为透明

    $spaceX = 2;
    $spaceY = 2;
    $startX = 0;
    $startY = 0;
    $picWidth = ($bgWidth - $spaceX) / 2;
    $picHeight = $picWidth;
    $line = [3]; // 需要换行的位置
    $lineX = 0;

    foreach ($pic as $key => $value) {
        $lineKey = $key + 1;
        if (in_array($lineKey, $line)) {
            $startX = $lineX;
            $startY = $startY + $picHeight + $spaceY;
        }
        $pathInfo = pathinfo($value);
        switch (strtolower($pathInfo['extension'])) {
            case 'jpg':
            case 'jpeg':
                $createImageFrom = 'imagecreatefromjpeg';
                break;
            case 'png':
                $createImageFrom = 'imagecreatefrompng';
                break;
            case 'gif':
            default:
                $createImageFrom = 'imagecreatefromstring';
                $value = file_get_contents($value);
                break;
        }
        $resource = $createImageFrom($value);
        imagecopyresized($srcImg, $resource, $startX, $startY, 0, 0, $picWidth, $picHeight, imagesx($resource), imagesy($resource));
        $startX = $startX + $picWidth + $spaceX;
    }

    /*header("Content-type: image/png");
    imagepng($srcImg);
    imagedestroy($srcImg);
    exit;*/

    // 开始半圆处理
    $img = imagecreatetruecolor($bgWidth, $bgHeight); // 背景图片
    $color = imagecolorallocate($img, 255, 255, 255); // 为真彩色画布创建白色背景
    imagefill($img, 0, 0, $color);
    $transparent && imageColorTransparent($img, $color); // 再设置为透明

    $radius = $bgWidth / 2; // 圆角半径
    for ($x = 0; $x < $bgWidth; $x++) {
        for ($y = 0; $y < $bgHeight; $y++) {
            $rgbColor = imagecolorat($srcImg, $x, $y);
            if (($x >= $radius && $x <= ($bgWidth - $radius)) || ($y >= $radius && $y <= ($bgHeight - $radius))) {
                // 不在四角的范围内,直接画
                imagesetpixel($img, $x, $y, $rgbColor);
            } else {
                // 在四角的范围内选择画
                // 上左
                $y_x = $radius; // 圆心X坐标
                $y_y = $radius; // 圆心Y坐标
                if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($radius * $radius))) {
                    imagesetpixel($img, $x, $y, $rgbColor);
                }
                // 上右
                $y_x = $bgWidth - $radius; // 圆心X坐标
                $y_y = $radius; // 圆心Y坐标
                if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($radius * $radius))) {
                    imagesetpixel($img, $x, $y, $rgbColor);
                }
                // 下左
                $y_x = $radius; // 圆心X坐标
                $y_y = $bgHeight - $radius; // 圆心Y坐标
                if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($radius * $radius))) {
                    imagesetpixel($img, $x, $y, $rgbColor);
                }
                // 下右
                $y_x = $bgWidth - $radius; // 圆心X坐标
                $y_y = $bgHeight - $radius; // 圆心Y坐标
                if (((($x - $y_x) * ($x - $y_x) + ($y - $y_y) * ($y - $y_y)) <= ($radius * $radius))) {
                    imagesetpixel($img, $x, $y, $rgbColor);
                }
            }
        }
    }

    /*header("Content-type: image/png");
    imagepng($img);
    imagedestroy($img);*/

    ob_start();
    imagepng($img);
    imagedestroy($img);
    $base64 = 'data:' . 'image/png' . ';base64,' . base64_encode(ob_get_contents());
    ob_end_clean();

    return $base64;
}
```
简单测试一下：
```php
<?php
$pic = array(
    'http://img104.job1001.com/upload/faceimg/20131126/71c2cff7d0105602513f74568c1967ab_1385448526.gif',
    'http://img104.job1001.com/upload/faceimg/20131121/90d8df2365743b0830f57ed3090c3311_1385026102.gif',
    'http://img104.job1001.com/upload/faceimg/20130820/ec2135080510a11fd163d1ebc487ea84_1376968031.png',
    'http://img104.job1001.com/upload/faceimg/20130322/427f52f63193a2ffe2ef8f4e9130c74a_1363919801.jpeg',
    'http://img104.job1001.com/upload/faceimg/20131121/47e5646b82141486ccd6d490cd1c6670_1385026071.gif',
    'http://img104.job1001.com/upload/faceimg/20131121/375d6cf0ce7bd3b21a48eb8e6bafa2c8_1385026044.gif',
    'http://img104.job1001.com/upload/faceimg/20140305/5176438df39012880af6da07c725d91f_1394001874.jpeg',
    'http://img104.job1001.com/upload/faceimg/20131121/d5f4380f337f0b0a96592f80f83d20e5_1385026012.gif',
    'http://img104.job1001.com/upload/faceimg/20130820/ec2135080510a11fd163d1ebc487ea84_1376968031.png',
);
echo genQqGroupHead($pic, 400, true);
exit;
?>
```
执行上面几行代码，然后把输出的base64内容copy，然后去 `http://imgbase64.duoshitong.com/` 网站，把base64转回图片就可以看到图片了。

## 参考资料
- https://www.zhaokeli.com/article/8031.html
- http://blog.csdn.net/sugang_ximi/article/details/30764617
- http://imgbase64.duoshitong.com