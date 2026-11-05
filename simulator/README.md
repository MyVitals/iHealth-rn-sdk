# iHealth 设备模拟板（simulator/）

没有真机也能联调 SDK：把一块 ESP32-S3 开发板刷成"iHealth 设备"，手机上的 App / SDK 能扫到、连上、
通过加密认证、收发全部业务指令。一份固件包含 9 个机型，串口一条命令切换，还内置几十个故障 / 数据场景。

这个目录随 SDK 一起发布，里面只有**固件二进制 + 清单 + 刷写脚本**，不含固件源码。

```
simulator/
  manifest.json                 机型 ↔ 固件版本对应记录（哪个版本支持哪些机型、校验和、验证过的 SDK 版本）
  flash.sh                      一键刷固件（macOS / Linux；Windows 见脚本注释）
  firmware/<版本>/*.bin         固件镜像（bootloader / partitions / boot_app0 / firmware）
  CHANGELOG.md                  固件版本记录
  docs/模拟板测试指南.md          买板、刷固件、切机型、用你的 App 连接、串口造数据/造故障、建议的测试流程、排错
```

## 三步开始

1. 买板：微雪 **ESP32-S3-DEV-KIT-N16R8**（淘宝 / 微雪官网，带两个 USB-C 口的那款）。一根 USB-C 数据线。
2. 刷固件：
   ```bash
   python3 -m pip install esptool
   ./flash.sh                       # 线插在标 UART 的口；多块板子时 ./flash.sh /dev/cu.usbmodemXXXX
   ```
3. 切到你要测的机型，然后用 App 扫描连接：
   ```bash
   screen /dev/cu.usbmodemXXXX 115200     # 进串口；退出 Ctrl-A 再按 K
   model kn550bt                          # 板子重启成 KN-550BT；scenario list 看可用场景
   ```

机型 key：`5819d` `723se` `po3` `kn550bt` `kn550lt` `pt3sbt` `bg1s` `hs2s` `bg5s`（iGluco 用的 BG5S，11-05 加）。详细见 `docs/模拟板测试指南.md`。

## 哪个固件配哪个 SDK

看 `manifest.json`：`latest` 是当前推荐版本，每个版本下面列了支持的机型、场景数和验证过的 SDK 版本。
SDK 升级若改了协议（新机型、认证、帧格式），固件会出新版本并在 CHANGELOG 里写明，老版本保留在 `firmware/` 下。

## 原则

- 固件源码（协议实现）不随 SDK 发布，只发二进制。需要新机型 / 新场景找 SDK 组。
- 模拟板用的是芯片自己的蓝牙地址，每块板、每个机型地址都不同（见指南第 3 节），App 里不要写死设备序列号。
