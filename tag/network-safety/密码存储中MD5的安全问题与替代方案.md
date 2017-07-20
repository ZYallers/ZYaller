# 密码存储中MD5的安全问题与替代方案

![image](https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1496297344981&di=4ce448f8e4323404f1a5adb1c9dd0f8f&imgtype=0&src=http%3A%2F%2Fpic.9ht.com%2Fup%2F2016-8%2F2016817155514.png)

### md5安全吗？

经过各种安全事件后，很多系统在存放密码的时候不会直接存放明文密码了，大都改成了存放了 md5 加密（hash）后的密码，可是这样真的安全吗？

这儿有个脚本来测试下MD5的速度
```php
<?php
$testRounds = 100;
$testTimes  = 1000000;
$times = [];
$data = 'abcdefgh';
for ($i = 0; $i < $testRounds; $i++){
    $begin = microtime(true);
    for ($j = 0; $j < $testTimes; $j++){
        $hash = md5($data);
    }
    $times[] = microtime(true) - $begin;
}
print_r([
    'rounds' => $testRounds,
    'times of a round' => $testTimes,
    'avg' => array_sum($times) / count($times),
    'max' => max($times),
    'min' => min($times),
]);
```
测试结果:
```shell
[root@f4d5945f1d7c tools]# php speed-of-md5.php
Array
(
    [rounds] => 100
    [times of a round] => 1000000
    [avg] => 0.23415904045105
    [max] => 0.28906106948853
    [min] => 0.21188998222351
)
```
有没有发现一个问题：MD5速度太快了，导致很容易进行暴力破解.

简单计算一下：
```shell
> Math.pow(10, 6) / 1000000 * 0.234
0.234
> Math.pow(36, 6) / 1000000 * 0.234 / 60
8.489451110400001
> Math.pow(62, 6) / 1000000 * 0.234 / 60 / 60
3.69201531296
```
1. 使用6位纯数字密码，破解只要0.234秒！
2. 使用6位数字+小写字母密码，破解只要8.49分钟！
3. 使用6位数字+大小写混合字母密码，破解只要3.69个小时！

当然，使用长一点的密码会显著提高破解难度：
```shell
> Math.pow(10, 8) / 1000000 * 0.234
23.400000000000002
> Math.pow(36, 8) / 1000000 * 0.234 / 60 / 60 / 24
7.640505999359999
> Math.pow(62, 8) / 1000000 * 0.234 / 60 / 60 / 24 / 365
1.6201035231755982
1.使用8位纯数字密码，破解要23.4秒！
2.使用8位数字+小写字母密码，破解要7.64小时！
3.使用8位数字+大小写混合字母密码，破解要1.62年！
```
但是，别忘了，这个速度只是用PHP这个解释型语言在笔者的弱鸡个人电脑（i5-4460 CPU 3.20GHz）上跑出来的，还只是利用了一个线程一个CPU核心。若是放到最新的 Xeon E7 v4系列CPU的服务器上跑，充分利用其48个线程，并使用C语言来重写下测试代码，很容易就能提升个几百上千倍速度。那么即使用8位数字+大小写混合字母密码，破解也只要14小时！

更何况，很多人的密码都是采用比较有规律的字母或数字，更能降低暴力破解的难度... 如果没有加盐或加固定的盐，那么彩虹表破解就更easy了...

那么如何提升密码存储的安全性呢？bcrypt!

提升安全性就是提升密码的破解难度，至少让暴力破解难度提升到攻击者无法负担的地步。（当然用户密码的长度当然也很重要，建议至少8位，越长越安全）

这里不得不插播一句：PHP果然是世界上最好的语言 -- 标准库里面已经给出了解决方案。

PHP 5.5 的版本中加入了 password_xxx 系列函数, 而对之前的版本，也有兼容库可以用：`password_compat`.

在这个名叫“密码散列算法”的核心扩展中提供了一系列简洁明了的对密码存储封装的函数。简单介绍下：

`password_hash`是对密码进行加密（hash），目前默认用（也只能用）bcrypt算法，相当于一个加强版的md5函数

`password_verify`是一个验证密码的函数，内部采用的安全的字符串比较算法，可以预防基于时间的攻击, 相当于 $hashedPassword === md5($inputPassword)

`password_needs_rehash`是判断是否需要升级的一个函数，这个函数厉害了，下面再来详细讲

`password_hash`需要传入一个算法，现在默认和可以使用的都只有bcrypt算法，这个算法是怎么样的一个算法呢？为什么PHP标准库里面会选择bcrypt呢?

bcrypt是基于 Blowfish 算法的一种专门用于密码哈希的算法，由 Niels Provos 和 David Mazieres 设计的。这个算法的特别之处在于，别的算法都是追求快，这个算法中有一个至关重要的参数：cost. 正如其名，这个值越大，耗费的时间越长，而且是指数级增长 -- 其加密流程中有一部分是这样的：
```
EksBlowfishSetup(cost, salt, key)
    state <- InitState()
    state <- ExpandKey(state, salt, key)
    repeat (2^cost)                         // "^"表示指数关系
        state <- ExpandKey(state, 0, key)
        state <- ExpandKey(state, 0, salt)
    return state
```
比如下面是笔者的一次测试
```php
<?php
echo sprintf("%10s %10s\n", 'cost', 'time');
for ($cost = 8; $cost < 20; $cost++) {
    $begin = microtime(true);
    password_hash('test1234', PASSWORD_BCRYPT, ['cost' => $cost]);
    $delta = microtime(true) - $begin;
    echo sprintf("%10d %10.6f\n", $cost, $delta);
}
```
测试结果（个人弱机PC, i5-4460 CPU 3.20GHz） ：
```
cost       time
 8   0.021307
 9   0.037150
10   0.079283
11   0.175612
12   0.317375
13   0.663080
14   1.330451
15   2.245152
16   4.291169
17   8.318790
18  16.472902
19  35.146999
```
这个速度与md5相比简直是蜗牛与猎豹的差别 -- 即使按照cost=8, 一个8位的大小写字母+数字的密码也要14万年才能暴力破解掉，更何况一般服务器都会至少设置为10或更大的值（那就需要54万年或更久了）。

显然，cost不是越大越好，越大的话会越占用服务器的CPU，反而容易引起DOS攻击。建议根据服务器的配置和业务的需求设置为10~12即可。最好同时对同一IP同一用户的登录尝试次数做限制，预防DOS攻击。

### 一个安全地存储密码的方案

总上所述，一个安全地存储密码的方案应该是这样子的：
```php
<?php
class User extends BaseModel
{
    const PASSWORD_COST = 11; // 这里配置bcrypt算法的代价，根据需要来随时升级
    const PASSWORD_ALGO = PASSWORD_BCRYPT; // 默认使用（现在也只能用）bcrypt
    /**
    * 验证密码是否正确
    *
    * @param string $plainPassword 用户密码的明文
    * @param bool  $autoRehash    是否自动重新计算下密码的hash值（如果有必要的话）
    * @return bool
    */
    public function verifyPassword($plainPassword, $autoRehash = true)
    {
        if (password_verify($plainPassword, $this->password)) {
            if ($autoRehash && password_needs_rehash($this->password, self::PASSWORD_ALGO, ['cost' => self::PASSWORD_COST])) {
                $this->updatePassword($plainPassword);
            }
            return true;
        }
        return false;
    }
    /**
    * 更新密码
    *
    * @param string $newPlainPassword
    */
    public function updatePassword($newPlainPassword)
    {
        $this->password = password_hash($newPlainPassword, self::PASSWORD_ALGO, ['cost' => self::PASSWORD_COST]);
        $this->save();
    }
}
```
这样子，在用户注册或修改密码的时候就调用`$user->updatePassword()` 来设置密码，而登录的时候就调用`$user->verifyPassword()`来验证下密码是否正确。

当硬件性能提升到一定程度，而cost=11无法满足安全需求的时候，则修改下`PASSWORD_COST` 的值即可无缝升级，让存放的密码更安全。