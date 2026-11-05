# ESP32 模拟板使用说明

一块 ESP32-S3 开发板 + 一份固件 = 一台可以随意"造数据、造故障"的 iHealth 设备。本文给第一次拿到板子的同事：
买什么、怎么接、怎么刷、怎么用、出问题怎么查。

## 1. 需要什么

| 项 | 说明 |
|---|---|
| 开发板 | 微雪 **ESP32-S3-DEV-KIT-N16R8**（ESP32-S3，16MB Flash，8MB PSRAM，板载 RGB 灯，两个 USB-C 口）。其他 ESP32-S3 板子只要 16MB Flash、带 CH343/CP210x 串口也能用，但 RGB 灯脚位可能不同 |
| 线 | USB-C **数据线**（充电线刷不了） |
| 电脑 | macOS / Linux / Windows 均可；装 Python 3 和 `esptool`（`python3 -m pip install esptool`）。macOS 不用装串口驱动 |
| 手机 | 装了被测 App（或 SDKDemo）的 iPhone / Android 手机，蓝牙打开 |

一部手机同一时间只能连一块板子；一块板子同一时间只能被一部手机连。要同时测 iOS 和 Android 就用两块板子。

## 2. 接线和认串口

板子有两个 USB-C 口：**标 UART（或 COM）的口**接电脑，这是 CH343 串口芯片；标 USB 的口是芯片原生口，刷固件和看日志都不用它。

插上后找串口：

```bash
ls /dev/cu.usbmodem*          # macOS，形如 /dev/cu.usbmodem5D280877791（数字是 CH343 的序列号，每块板不同）
ls /dev/ttyACM* /dev/ttyUSB*  # Linux
# Windows：设备管理器 → 端口 → USB Single Serial (COMx)
```

多块板子同时插时，用序列号区分，并且**把串口名固定写进你的脚本或环境变量**（例如 `IH_BOARD_PORT=/dev/cu.usbmodem5D280877791`），
不要用"第一个串口"，USB 枚举顺序会变。

## 3. 刷固件

```bash
cd simulator
./flash.sh                              # 只插了一块板
./flash.sh /dev/cu.usbmodem5D280877791  # 多块板时指定
```

脚本做的事就是一条 esptool 命令（Windows 用这条，串口换成 COMx）：

```bash
python3 -m esptool --chip esp32s3 --port /dev/cu.usbmodemXXXX --baud 460800 --before default_reset --after hard_reset write_flash -z \
  --flash_mode dio --flash_freq 80m --flash_size 16MB \
  0x0 firmware/2026-10-27/bootloader.bin 0x8000 firmware/2026-10-27/partitions.bin \
  0xe000 firmware/2026-10-27/boot_app0.bin 0x10000 firmware/2026-10-27/firmware.bin
```

刷完板子自动重启。打开串口（115200）应看到：

```
=== iHealth KD-5819D BLE simulator === build Oct 27 2026 15:37:35
[ble] advertising as "KD-5819D"  MAC/serial 1020BA6FDAF1  authId "ESP-1020BA6FDAF1"
commands:
  help ...
```

**新板子出厂带的是厂商演示固件**（RGB 灯循环、串口只打 `50%R / 50%G / 50%B`），刷之前看到这个是正常的。
机型选择存在板子 Flash（NVS）里，重新刷固件不会丢。

看串口的工具：`screen /dev/cu.usbmodemXXXX 115200`（退出 Ctrl-A 再按 K）、`pio device monitor`、CoolTerm、Windows 用 PuTTY / 串口助手。
**注意**：打开 CH343 串口会把板子复位一次（DTR/RTS 接着 EN），所以日志总是从开机横幅开始；App 已连接时别去开关串口。

## 4. 切机型

```
model               # 看当前机型
model kn550bt       # 切到 KN-550BT，板子自动重启（约 5 秒）
```

| key | 设备 | 类型 | 内置场景数 |
|---|---|---|---|
| `5819d` | KD-5819D | 血压计（新加密流协议）| 23 |
| `723se` | KD-723SE | 血压计（新加密流协议）| 32 |
| `po3` | PO3（新版 PO3M）| 血氧仪 | 51 |
| `kn550bt` | KN-550BT | 血压计 BPAV21/22 | 47 |
| `kn550lt` | KN-550LT | 血压计 | 48 |
| `pt3sbt` | PT3SBT | 额温枪 | 47（另 3 个危险场景默认禁用）|
| `bg1s` | BG1S | 血糖仪 | 52 |
| `hs2s` | HS2S | 体脂秤 | 79 |
| `bg5s` | BG5S | 血糖仪（流协议版，iGluco 用） | 82 |

**MAC 规则**：板子用芯片自己的蓝牙地址，每个机型在末字节上加一个偏移（723SE +0x20、KN-550BT +0x30、PO3 +0x40、PT3SBT +0x50、
BG1S +0x60、HS2S +0x70、KN-550LT +0x80、BG5S +0x90，KD-5819D 不加），蓝牙控制器可能再加 1 或 2。**以切机型后开机横幅里的 `MAC/serial` 为准**，
这就是 App 里看到的设备序列号。为什么每个机型地址不同：iOS 按外设地址缓存设备名，同一地址从 KD-5819D 切成 KD-723SE 后 SDK 会拿到缓存的旧名字而扫不到。

切机型后手机侧：iOS 上如果 App 之前绑定过这块板子的别的机型，先在 App 里解绑 / 忘记设备；Android 偶尔需要关开一次蓝牙。

## 5. 串口命令

通用命令（所有机型）：

| 命令 | 作用 |
|---|---|
| `help` | 打印全部命令（含当前机型专属命令） |
| `info` | 状态、收发计数、设备时钟、全部记录 |
| `scenario list` / `scenario <名>` | 列出 / 切换场景预设；`scenario normal` 恢复默认并清掉所有故障注入 |
| `seed` / `clear` | 写一组演示数据 / 清空记录 |
| `time <epoch>` | 设设备时钟（本地时间的 epoch 秒） |
| `fw <fff> <hhh>` | 设备上报的固件 / 硬件版本（如 `fw 210 120` = 2.1.0 / 1.2.0） |
| `fault delay <ms>` / `noreply <hex>` / `badcks 0\|1` / `drop <hex> [n]` / `fe 0\|1` / `badr1 0\|1` / `fault clear` | 故障注入：回包延迟、某指令不回、校验和错、某指令后断开、认证回 FE、R1' 改坏 |
| `adv on\|off [秒]` | 开 / 关广播（关 = 设备睡眠或没按键）；`adv off 30` 表示 30 秒后自动恢复 |
| `disconnect` | 主动断开当前连接 |
| `model [key]` | 看 / 切机型 |
| `reboot` | 重启 |

机型专属命令（`help` 里有完整列表）：

- 血压计（5819d / 723se / kn550bt / kn550lt）：`add <组> <高压> <低压> <心率> [flag]`、`batt <0-100|255>`、`pkt <n>`（每包条数）、KN-550BT `proto 21|22`、KN-550LT `order newest|oldest`、`powerloss`、`color 0|1`
- PO3：`add <spo2> <pr> <pi×10>`、`finger in|out`、`charge 0|1`、`rt <spo2> <pr> <pi×10> [hz]`（实时波形）、`rtauto 0|1`
- PT3SBT：`measure <温度> [tobj tamb tex dist vbat]`、`unit c|f`、`live <秒>|off`、`rpp <n>`
- HS2S：`weigh <kg> [体脂%]`、`weigh_fail over|unstable|timeout`、`auto on|off [kg]`、`user list|add|clear`、`rec add <槽> <kg>`、`anon add <kg>`、`hr <n>`、`err <hex>`、`profile v1|v2`
- BG5S（前缀 `b5`）：`b5 strip in|out`、`b5 blood`、`b5 result <mgdl>|low|high`、`b5 run`、`b5 charge in|out`、`b5 rec add|fill|clear|list`（离线记录）、`b5 clock`、`b5 codever`、`b5 busy on|off`
- BG1S：`bg strip in|out`、`bg blood [n]`、`bg result <mgdl>|low|high`、`bg error <hex>`、`bg run [mgdl] [ms]`、`bg timing fast|normal|slow`

场景是"一条命令摆好一整套状态"（数据条数、设备版本、故障注入组合），日常测试优先用场景；单条命令用来微调。
场景名按机型不同，常见的：`normal`、`empty`、`full`、`fw_old` / `fw_new`、`auth_fail`、`slow_2s` / `slow_4s`、`bad_checksum`、
`drop_after_auth`、`drop_mid_transfer`、`badtime`、`extreme`、`lowbatt`、`clock_skew`。每个场景对应的 App 预期行为见《全流程测试说明》。

## 6. 灯的含义

板载 RGB 灯：**蓝闪** 广播中（等手机来连）→ **黄** 已连接、等认证 → **绿** 认证通过、正常收发 → **红闪** 收到校验失败的帧。
刷完固件没有蓝闪、串口也没横幅，多半是固件没刷上或线没插好。

## 7. 和手机 / App 配合时的注意事项

- 板子离手机 1 米内，不要和真机同时开着同机型（App 可能连上真机）。
- 一块板子只服务一部手机。另一部手机想测，先让第一部断开（或 `disconnect`）。
- 手机上别同时装着多个会自动连设备的测试 App（如 SDKDemo 和 MyVitals），后台那个会抢连接，表现是前台 App 扫不到或连不上。
- iOS 的蓝牙缓存：换机型或换板子后扫不到，先在 App 里忘记设备，必要时关开一次手机蓝牙。
- 串口被别的程序占着时（串口监视器、正在跑的脚本），刷固件和切场景都会失败，先关掉它。

## 8. 排错

| 现象 | 原因 / 处理 |
|---|---|
| `esptool` 报 `Failed to connect ... No serial data received` | 线没插紧、插的是标 USB 的口、或用的是充电线。换口 / 换线后重试；仍不行就按住板上 BOOT 键再按一下 RST，松开 BOOT，加 `--before no_reset` 重刷 |
| 串口打开后完全没输出 | 同上（板子没真正通电或没插好）。出厂固件会打 `50%R` 之类，连这个都没有就是硬件 / 线的问题 |
| 刷完还是厂商演示（灯循环变色） | 刷写没成功，看 esptool 输出有没有 `Hash of data verified` |
| 串口名变了 | 换了 USB 口或换了板子，CH343 序列号不同；更新脚本里的 `IH_BOARD_PORT` |
| 串口读到乱码、脚本等很久 | CH343 偶发被系统内核中止（我们的测试脚本已对此设了 5 秒超时并按环境错误重跑）。拔插板子即可恢复；反复出现就换板 |
| App 扫不到 | 灯是否蓝闪；机型是否对（`model`）；`adv on`；手机蓝牙缓存（第 7 节）；是否另一部手机已连上（灯黄 / 绿） |
| 连上就断 / 认证失败 | 先 `scenario normal` 清掉上次的故障注入；SDK 版本和固件版本是否匹配（见 manifest.json 的 validated_with） |
| 两块板子 MAC 相同 | 不会；但同一块板子不同机型 MAC 只差末字节，App 里别按前缀匹配 |

## 9. 版本

固件版本 = 开机横幅里的 build 日期，对应 `firmware/<版本>/`；版本与机型、SDK 的对应关系在 `manifest.json` 和 `CHANGELOG.md`。
刷新版本固件不会清掉机型选择。需要新机型、新场景或发现固件行为和真机不一致，找 SDK 组（固件源码不随 SDK 发布）。
