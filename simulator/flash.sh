#!/bin/sh
# 给 ESP32-S3 开发板刷 iHealth 设备模拟固件。只要 Python 3 + esptool，不需要 PlatformIO，也不需要固件源码。
#
# 用法:  ./flash.sh [串口] [版本]
#   串口   不给就自动找：/dev/cu.usbmodem* / /dev/cu.wchusbserial*（macOS）、/dev/ttyACM* / /dev/ttyUSB*（Linux）；
#          插着多块板子时必须指定，例如 ./flash.sh /dev/cu.usbmodem5D280877791
#   版本   默认 manifest.json 里的 latest，也可以指定 firmware/ 下的某个目录名
#
# 第一次用：  python3 -m pip install esptool
# Windows：   用 PowerShell 跑 `python -m esptool ...`（把下面那条 esptool 命令里的串口换成 COMx）
#
# 刷完板子自动重启，串口 115200 会打印 "=== iHealth KD-5819D BLE simulator === build ..."；
# 机型用串口命令 `model <key>` 切换，保存在板子 Flash 里，重新刷固件不会丢。
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
PORT="$1"
VER="${2:-$(sed -n 's/.*"latest": *"\([^"]*\)".*/\1/p' "$HERE/manifest.json")}"
FW="$HERE/firmware/$VER"
[ -d "$FW" ] || { echo "没有固件目录 $FW（manifest.json 的 versions 里有哪些版本就只能选哪些）"; exit 2; }

if [ -z "$PORT" ]; then
  set -- $(ls /dev/cu.usbmodem* /dev/cu.wchusbserial* /dev/ttyACM* /dev/ttyUSB* 2>/dev/null)
  case $# in
    0) echo "没找到板子串口：请把线插在标 UART/COM 的 USB-C 口上（macOS 不需要装驱动）"; exit 2;;
    1) PORT="$1";;
    *) echo "找到多个串口，请指定一个："; for p in "$@"; do echo "  $p"; done; exit 2;;
  esac
fi

ESPTOOL="esptool.py"
command -v esptool.py >/dev/null 2>&1 || ESPTOOL="python3 -m esptool"

echo "flash $VER -> $PORT"
$ESPTOOL --chip esp32s3 --port "$PORT" --baud 460800 --before default_reset --after hard_reset write_flash -z \
  --flash_mode dio --flash_freq 80m --flash_size 16MB \
  0x0 "$FW/bootloader.bin" 0x8000 "$FW/partitions.bin" 0xe000 "$FW/boot_app0.bin" 0x10000 "$FW/firmware.bin"

echo
echo "刷好了。看开机日志：  screen $PORT 115200   （退出：Ctrl-A 然后 K）"
echo "切机型：在串口里输入  model kn550bt   （可选 5819d 723se po3 kn550bt kn550lt pt3sbt bg1s hs2s）"
