# PHP的一个实现类似微信群头像的图片合并方法
```php
<?php
/**
 * 实现类似微信群头像的图片合并方法
 * @param array $pic
 * @param int $bgWidth
 * @param bool $transparent
 * @return string
 */
function genWeiChatGroupHead(array $pic, $bgWidth = 200, $transparent = false)
{
    $len = count($pic);
    if ($len == 0) {
        return null;
    }
    $pic = array_slice($pic, 0, 9); // 只操作前9个图片

    $bgHeight = $bgWidth;
    $bg = imagecreatetruecolor($bgWidth, $bgHeight); // 背景图片
    $color = imagecolorallocate($bg, 255, 255, 255); // 为真彩色画布创建白色背景
    imagefill($bg, 0, 0, $color);
    $transparent && imageColorTransparent($bg, $color); // 再设置为透明

    $line = []; // 需要换行的位置
    $spaceX = 3;
    $spaceY = 3;
    $lineX = 0;
    switch ($len) {
        case 1:
            $picWidth = $bgWidth - $spaceX * 2; // 宽度
            $picHeight = $picWidth; // 高度
            $startX = $spaceX;  // 开始位置X
            $startY = $spaceY;  // 开始位置Y
            break;
        case 2:
            $picWidth = ($bgWidth - $spaceX * 3) / 2;
            $picHeight = $picWidth;
            $startX = $spaceX;
            $startY = ($bgHeight - $picHeight) / 2;
            break;
        case 3:
            $picWidth = ($bgWidth - $spaceX * 3) / 2;
            $picHeight = $picWidth;
            $startX = ($bgWidth - $picWidth) / 2;
            $startY = $spaceY;
            $line = [2];
            $lineX = 3;
            break;
        case 4:
            $startX = $spaceX;
            $startY = $spaceY;
            $picWidth = ($bgWidth - $spaceX * 3) / 2;
            $picHeight = $picWidth;
            $line = [3];
            $lineX = 4;
            break;
        case 5:
            $picWidth = ($bgWidth - $spaceX * 4) / 3;
            $picHeight = $picWidth;
            $startX = ($bgWidth - $picWidth * 2 + $spaceX) / 2;
            $startY = ($bgHeight - $picHeight * 2 - $spaceX) / 2;
            $line = [3];
            $lineX = $spaceX;
            break;
        case 6:
            $startX = $spaceX;
            $picWidth = ($bgWidth - $spaceX * 4) / 3;
            $picHeight = $picWidth;
            $startY = ($bgHeight - $picHeight * 2 - $spaceX) / 2;
            $line = [4];
            $lineX = $spaceX;
            break;
        case 7:
            $picWidth = ($bgWidth - $spaceX * 4) / 3;
            $picHeight = $picWidth;
            $startX = ($bgWidth - $picWidth) / 2;
            $startY = $spaceY;
            $line = [2, 5];
            $lineX = $spaceX;
            break;
        case 8:
            $picWidth = ($bgWidth - $spaceX * 4) / 3;
            $picHeight = $picWidth;
            $startX = ($bgWidth - $picWidth * 2 - $spaceX) / 2;
            $startY = $spaceY;
            $line = [3, 6];
            $lineX = $spaceX;
            break;
        case 9:
            $picWidth = ($bgWidth - $spaceX * 4) / 3;
            $picHeight = $picWidth;
            $startX = $spaceX;
            $startY = $spaceY;
            $line = [4, 7];
            $lineX = $spaceX;
            break;
    }

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
        // $start_x,$start_y copy图片在背景中的位置
        // 0,0 被copy图片的位置
        // $pic_w,$pic_h copy后的高度和宽度
        // 最后两个参数为原始图片宽度和高度，为copy时的图片宽度和高度
        imagecopyresized($bg, $resource, $startX, $startY, 0, 0, $picWidth, $picHeight, imagesx($resource), imagesy($resource));
        $startX = $startX + $picWidth + $spaceX;
    }

    /*header("Content-type: image/png");
    imagepng($bg);*/

    ob_start();
    imagepng($bg);
    imagedestroy($bg);
    $data = ob_get_contents();
    ob_end_clean();
    $base64 = 'data:' . 'image/png' . ';base64,' . base64_encode($data);
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
echo genWeiChatGroupHead($pic, 400, false);
exit;
?>
```
执行上面几行代码，然后把输出的base64内容copy，然后去 `http://imgbase64.duoshitong.com/` 网站，把base64转回图片就可以看到图片了。

## 参考资料
- http://blog.csdn.net/sugang_ximi/article/details/30764617
- http://imgbase64.duoshitong.com