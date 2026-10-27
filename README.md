# iHealth React Native SDK

[![npm version](https://badge.fury.io/js/%40ihealth%2Fihealthlibrary-react-native.svg)](https://www.npmjs.com/package/@ihealth/ihealthlibrary-react-native)

Official React Native SDK for iHealth Bluetooth health devices.

**v2.0.0 fully supports React Native New Architecture (TurboModules)** while remaining backward compatible with the Old Architecture (Bridge mode).

---

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [iOS Setup](#ios-setup)
- [Android Setup](#android-setup)
- [Quick Start](#quick-start)
- [Event Listening — Important](#event-listening--important)
- [Device Management](#device-management)
- [Device API Reference](#device-api-reference)
- [Supported Devices](#supported-devices)
- [Migrating from v1.x](#migrating-from-v1x)
- [FAQ](#faq)
- [Release Notes](#release-notes)

---

## Requirements

| Platform | Minimum Version |
|----------|----------------|
| React Native | **>= 0.76.0** |
| iOS | 12.0+ |
| Android | API 24+ (Android 7.0+) |

---

## Installation

```bash
npm install @ihealth/ihealthlibrary-react-native
# or
yarn add @ihealth/ihealthlibrary-react-native
```

---

## iOS Setup

### 1. Install Pods

```bash
cd ios && pod install
```

### 2. Add Permissions (Info.plist)

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Required to connect to iHealth devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Required to connect to iHealth devices</string>
```

### 3. Enable New Architecture (optional, recommended for RN 0.76+)

Edit `ios/Podfile.properties.json`:

```json
{
  "newArchEnabled": "true"
}
```

Then run `pod install` again.

---

## Android Setup

### 1. Add Permissions (AndroidManifest.xml)

```xml
<!-- Bluetooth (Android 11 and below) -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Bluetooth (Android 12+) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

### 2. Request Runtime Permissions

```javascript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android') return true;

  const permissions = Platform.Version >= 31
    ? [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]
    : [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

  const result = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(result).every(
    v => v === PermissionsAndroid.RESULTS.GRANTED
  );
}
```

### 3. SDK License Authentication

The `.pem` license file provided by iHealth is bound to your app's bundle identifier (iOS) / package name (Android).

- **Android:** place the file in `android/app/src/main/assets/`.
- **iOS:** add the file to your app target in Xcode (Target Membership checked, so it is copied into the app bundle).

Then call the following once on app startup, before scanning:

```javascript
import { iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

iHealthDeviceManagerModule.sdkAuthWithLicense('your_license_file.pem');
```

The result arrives as `Event_Authenticate_Result` (`{ access }`).

> On iOS, scanning and connecting do nothing — no devices are found and no error is reported — until a license matching the app's bundle identifier has been validated.
>
> On Android the native SDK is initialized when the app first comes to the foreground; a call made before that reports `access: false`. If that happens, call it again shortly afterwards.

### 4. Enable New Architecture (optional, recommended for RN 0.76+)

Edit `android/gradle.properties`:

```properties
newArchEnabled=true
```

---

## Quick Start

The example below shows a complete flow — scan → connect → measure — using the BP5S blood pressure monitor:

```javascript
import React, { useEffect, useState } from 'react';
import { View, Button, Text, NativeEventEmitter, NativeModules } from 'react-native';
import {
  iHealthDeviceManagerModule,
  BP5SModule,
} from '@ihealth/ihealthlibrary-react-native';

export default function BP5SScreen() {
  const [devices, setDevices]   = useState([]);
  const [connectedMac, setMac]  = useState(null);
  const [result, setResult]     = useState('');

  // Step 1 — Listen for scan and connection events
  useEffect(() => {
    const managerEmitter = new NativeEventEmitter(
      NativeModules.iHealthDeviceManagerModule
    );

    const onScan = managerEmitter.addListener(
      iHealthDeviceManagerModule.Event_Scan_Device,
      (e) => setDevices(prev => [...prev, e])
    );
    const onConnected = managerEmitter.addListener(
      iHealthDeviceManagerModule.Event_Device_Connected,
      (e) => setMac(e.mac)
    );
    const onDisconnect = managerEmitter.addListener(
      iHealthDeviceManagerModule.Event_Device_Disconnect,
      () => setMac(null)
    );

    return () => {
      onScan.remove();
      onConnected.remove();
      onDisconnect.remove();
    };
  }, []);

  // Step 2 — Listen for device data events
  useEffect(() => {
    const bp5sEmitter = new NativeEventEmitter(NativeModules.BP5SModule);

    const onData = bp5sEmitter.addListener(
      BP5SModule.Event_Notify,
      (e) => setResult(JSON.stringify(e))
    );

    return () => onData.remove();
  }, []);

  return (
    <View>
      <Button
        title="Scan"
        onPress={() => {
          setDevices([]);
          iHealthDeviceManagerModule.startDiscovery(
            iHealthDeviceManagerModule.BP5S
          );
        }}
      />
      {devices.map(d => (
        <Button
          key={d.mac}
          title={`Connect ${d.mac}`}
          onPress={() =>
            iHealthDeviceManagerModule.connectDevice(
              d.mac,
              iHealthDeviceManagerModule.BP5S
            )
          }
        />
      ))}
      {connectedMac && (
        <Button
          title="Start Measure"
          onPress={() => BP5SModule.startMeasure(connectedMac)}
        />
      )}
      <Text>{result}</Text>
    </View>
  );
}
```

---

## Event Listening — Important

> ⚠️ **Breaking change in v2.0.0**: You must use `NativeEventEmitter` instead of `DeviceEventEmitter`.

### Correct Usage

```javascript
import { NativeEventEmitter, NativeModules } from 'react-native';
import { BP5SModule } from '@ihealth/ihealthlibrary-react-native';

useEffect(() => {
  // Pass the corresponding NativeModules instance for your device
  const emitter = new NativeEventEmitter(NativeModules.BP5SModule);

  const listener = emitter.addListener(BP5SModule.Event_Notify, (event) => {
    console.log(event);
  });

  return () => listener.remove(); // Always clean up on unmount
}, []);
```

### Incorrect Usage (events will be lost)

```javascript
// ❌ Do NOT use DeviceEventEmitter
import { DeviceEventEmitter } from 'react-native';
DeviceEventEmitter.addListener(BP5SModule.Event_Notify, handler);

// ❌ Do NOT create the emitter at module top-level (outside useEffect)
const emitter = new NativeEventEmitter(NativeModules.BP5SModule); // top-level — wrong
```

### NativeModules Name Reference

| SDK Import Name | NativeModules Key |
|----------------|-------------------|
| `iHealthDeviceManagerModule` | `NativeModules.iHealthDeviceManagerModule` |
| `BP5Module` | `NativeModules.BP5Module` |
| `BP5SModule` | `NativeModules.BP5SModule` |
| `BP550BTModule` | `NativeModules.BP550BTModule` |
| `BP550LTModule` | `NativeModules.BP550LTModule` |
| `BP3LModule` | `NativeModules.BP3LModule` |
| `BP7Module` | `NativeModules.BP7Module` |
| `BP7SModule` | `NativeModules.BP7SModule` |
| `PO3Module` | `NativeModules.PO3Module` |
| `PO1Module` | `NativeModules.PO1Module` |
| `HS2SModule` | `NativeModules.HS2SModule` |
| `HS2SProModule` | `NativeModules.HS2SProModule` |
| `HS4SModule` | `NativeModules.HS4SModule` |
| `HS6Module` | `NativeModules.HS6Module` |
| `BG5SModule` | `NativeModules.BG5SModule` |
| `BG5Module` | `NativeModules.BG5Module` |
| `BG1Module` | `NativeModules.BG1Module` |
| `BG1AModule` | `NativeModules.BG1AModule` |
| `BG1SModule` | `NativeModules.BG1SModule` |
| `AM3SModule` | `NativeModules.AM3SModule` |
| `AM4Module` | `NativeModules.AM4Module` |
| `AM5Module` | `NativeModules.AM5Module` |
| `AM6Module` | `NativeModules.AM6Module` |
| `BTMModule` | `NativeModules.BTMModule` |
| `TS28BModule` | `NativeModules.TS28BModule` |
| `NT13BModule` | `NativeModules.NT13BModule` |
| `PT3SBTModule` | `NativeModules.PT3SBTModule` |
| `ECGModule` (iOS only) | `NativeModules.ECGModule` |
| `ECGUSBModule` (iOS only) | `NativeModules.ECGUSBModule` |

---

## Device Management

### Scan for Devices

```javascript
import { iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

// Start scanning — pass the device type constant
iHealthDeviceManagerModule.startDiscovery(iHealthDeviceManagerModule.BP5S);

// Stop scanning
iHealthDeviceManagerModule.stopDiscovery();
```

**Device type constants:**

| Constant | Value | Device |
|----------|-------|--------|
| `iHealthDeviceManagerModule.BP5` | `'BP5'` | BP5 Blood Pressure Monitor |
| `iHealthDeviceManagerModule.BP5S` | `'BP5S'` | BP5S Blood Pressure Monitor |
| `iHealthDeviceManagerModule.BP7` | `'BP7'` | BP7 Blood Pressure Monitor |
| `iHealthDeviceManagerModule.BP7S` | `'BP7S'` | BP7S Blood Pressure Monitor |
| `iHealthDeviceManagerModule.BP3L` | `'BP3L'` | BP3L Blood Pressure Monitor |
| `iHealthDeviceManagerModule.KN550` | `'KN550'` | KN-550BT Blood Pressure Monitor |
| `iHealthDeviceManagerModule.KN550LT` | `'KN550LT'` | KN-550LT Blood Pressure Monitor |
| `iHealthDeviceManagerModule.PO3` | `'PO3'` | PO3 Pulse Oximeter |
| `iHealthDeviceManagerModule.PO1` | `'PO1'` | PO1 Pulse Oximeter |
| `iHealthDeviceManagerModule.HS2S` | `'HS2S'` | HS2S Body Scale |
| `iHealthDeviceManagerModule.AM6` | `'AM6'` | AM6 Activity Tracker |
| `iHealthDeviceManagerModule.BG5S` | `'BG5S'` | BG5S Blood Glucose Meter |
| `iHealthDeviceManagerModule.BG1A` | `'BG1A'` | BG1A Blood Glucose Meter |
| `iHealthDeviceManagerModule.BG1S` | `'BG1S'` | BG1S Blood Glucose Meter |
| `iHealthDeviceManagerModule.BTM` | `'FDIR_V3'` | BTM Thermometer |
| `iHealthDeviceManagerModule.NT13B` | `'NT13B'` | NT13B Thermometer |
| `iHealthDeviceManagerModule.TS28B` | `'TS28B'` | TS28B Thermometer |
| `iHealthDeviceManagerModule.PT3SBT` | `'PT3SBT'` | PT3SBT Thermometer |
| `iHealthDeviceManagerModule.AM3S` | `'AM3S'` | AM3S Activity Monitor |
| `iHealthDeviceManagerModule.AM4` | `'AM4'` | AM4 Activity Monitor |
| `iHealthDeviceManagerModule.AM5` | `'AM5'` | AM5 Activity Monitor |
| `iHealthDeviceManagerModule.ECG3` | `'ECG3'` | ECG3 (iOS only) |
| `iHealthDeviceManagerModule.ECG3USB` | `'ECG3USB'` | ECG3USB (iOS only) |

### Connect / Disconnect

```javascript
// Connect — mac comes from the scan event (event.mac)
iHealthDeviceManagerModule.connectDevice(mac, iHealthDeviceManagerModule.BP5S);

// Disconnect
iHealthDeviceManagerModule.disconnectDevice(mac, iHealthDeviceManagerModule.BP5S);
```

### Device Manager Events

```javascript
const managerEmitter = new NativeEventEmitter(
  NativeModules.iHealthDeviceManagerModule
);

// Device discovered during scan
// Payload: { mac: string, type: string, rssi?: number }
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Scan_Device, handler
);

// Scan finished
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Scan_Finish, handler
);

// Device connected successfully
// Payload: { mac: string, type: string }
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Device_Connected, handler
);

// Device connection failed
// Payload: { mac: string, type: string }
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Device_Connect_Failed, handler
);

// Device disconnected
// Payload: { mac: string, type: string }
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Device_Disconnect, handler
);

// SDK license authentication result
// Payload: { access: boolean } (iOS reports 1 / 0)
managerEmitter.addListener(
  iHealthDeviceManagerModule.Event_Authenticate_Result, handler
);
```

---

## Device API Reference

### Blood Pressure Monitor — BP5 / BP5S / BP3L / BP7

```javascript
import { BP5SModule, BPProfileModule } from '@ihealth/ihealthlibrary-react-native';
import { NativeEventEmitter, NativeModules } from 'react-native';

const emitter = new NativeEventEmitter(NativeModules.BP5SModule);

emitter.addListener(BP5SModule.Event_Notify, (event) => {
  switch (event.action) {
    case BPProfileModule.ACTION_ONLINE_REAL_TIME_MEASUREMENT:
      // Real-time data: event.sys, event.dia, event.heartRate, event.pulse
      break;
    case BPProfileModule.ACTION_ONLINE_RESULT:
      // Final measurement result
      break;
    case BPProfileModule.ACTION_BATTERY_BP:
      // Battery level: event.battery (0–100)
      break;
    case BPProfileModule.ACTION_ERROR_BP:
      // Error: event.error
      break;
  }
});

// Measurement
BP5SModule.startMeasure(mac);
BP5SModule.stopMeasure(mac);

// Offline data
BP5SModule.enbleOffline(mac, 1);     // Enable offline mode
BP5SModule.enbleOffline(mac, 0);     // Disable offline mode
BP5SModule.getOffLineNum(mac);       // Get number of offline records
BP5SModule.getOffLineData(mac);      // Download offline data
BP5SModule.deleteData(mac);          // Delete downloaded offline data

// Device info
BP5SModule.getBattery(mac);
BP5SModule.getFunctionInfo(mac);
BP5SModule.getHardwareVersion(mac);

BP5SModule.disconnect(mac);
```

---

### Blood Pressure Monitor — KN-550BT (BP550BTModule)

```javascript
import { BP550BTModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.BP550BTModule);
emitter.addListener(BP550BTModule.Event_Notify, (event) => {
  console.log(event);
});

BP550BTModule.getBattery(mac);
BP550BTModule.getFirmVersion(mac);
BP550BTModule.getFunctionInfo(mac);
BP550BTModule.getOffLineNum(mac);
BP550BTModule.getOffLineData(mac);
BP550BTModule.getTime(mac);
BP550BTModule.getDisplayConfig(mac);
BP550BTModule.setDisplayConfig(mac, showSystolic, showDiastolic);
BP550BTModule.transferFinished(mac);
BP550BTModule.disconnect(mac);
```

---

### Blood Pressure Monitor — KN-550LT (BP550LTModule)

KN-550LT has no online measurement; results are read back from the device memory.

```javascript
import { BP550LTModule, iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

iHealthDeviceManagerModule.startDiscovery(iHealthDeviceManagerModule.KN550LT);
iHealthDeviceManagerModule.connectDevice(mac, iHealthDeviceManagerModule.KN550LT);

const emitter = new NativeEventEmitter(NativeModules.BP550LTModule);
emitter.addListener(BP550LTModule.Event_Notify, (event) => {
  console.log(event);
});

BP550LTModule.getAllConnectedDevices(); // { action: 'action_get_all_connected_devices', devices: [...] }
BP550LTModule.getFirmVersion(mac);      // { action: 'action_get_firmwareVersion', firmwareVersion, hardwareVersion }
BP550LTModule.getBattery(mac);          // { action: 'battery_bp', battery }
BP550LTModule.getFunctionInfo(mac);     // { action: 'function_info_bp', haveOffline, haveShowUnitSetting, showUnit, ... }
                                        //   memoryGroup / maxMemoryCapacity only when the native SDK reports them
                                        //   (the iOS SDK does not)
BP550LTModule.getOffLineNum(mac);       // { action: 'offlinenum', offlinenum }
BP550LTModule.getOffLineData(mac);      // { action: 'historicaldata_bp', data: [{ time, sys, dia, heartRate,
                                        //   arrhythmia, body_movement, cuff_loose, time_calibration, dataID }] }
BP550LTModule.getTime(mac);             // { action: 'action_get_time', date }
BP550LTModule.transferFinished(mac);    // deletes the device memory -> { action: 'get_historical_over_bp' }
BP550LTModule.disconnect(mac);
// Errors (iOS): { action: 'error_bp', error, description }; Android: see the differences table below
```

Wait for the reply to a call before sending the same call again: on iOS two identical calls in flight are answered
only once. `connectDevice` may not report `Event_Device_Connect_Failed` when the device is out of range, so keep your
own timeout for connections.

#### KN-550LT: iOS and Android differences

The normal flow (scan, connect, every call above, delete, disconnect) behaves the same on both platforms. Error and
timeout handling differs:

| Situation | iOS | Android |
|---|---|---|
| Call before connecting, with an unknown MAC, or after disconnecting | `Event_Notify` `{ action: 'error_bp', description: 'device is disconnected.' }` | Separate event `'Error'` with `{ errorid: 400 }`; nothing on `Event_Notify`. Listen with `emitter.addListener('Error', …)` |
| Device does not answer a call | `error_bp` with `error: 404` after 3 s | No error event. The SDK disconnects about 30 s later (`Event_Device_Disconnect`) |
| Device answers slowly (over 3 s) | `error_bp` with `error: 404`; the late answer is dropped | The SDK resends the command; every late answer is delivered, so the same reply can arrive more than once |
| Device rejects authentication or does not answer it | `Event_Device_Connect_Failed` | No event |
| `stopDiscovery()` | `Event_Scan_Finish` | No event (`Event_Scan_Finish` only when the scan ends by itself) |
| `getFunctionInfo` | No `memoryGroup` / `maxMemoryCapacity`; `showUnit` is 0 or 1 | Includes `memoryGroup` / `maxMemoryCapacity`; `showUnit` is the raw device value (e.g. 32 for kPa) |
| Scan result | `{ mac, type }` | `{ mac, type, rssi }` |
| Same call sent twice without waiting | Answered once | Answered twice |

On Android, run your own timeout for each call and for `connectDevice`, treat `Event_Device_Disconnect` as the end of
any pending call, and ignore duplicate replies.

---

### Pulse Oximeter — PO3 / PO1

```javascript
import { PO3Module } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.PO3Module);
emitter.addListener(PO3Module.Event_Notify, (event) => {
  // event: { action, spo2, pr, pi, waveformData, ... }
  console.log(event);
});

PO3Module.startMeasure(mac);      // Start real-time measurement
PO3Module.getBattery(mac);
PO3Module.getHistoryData(mac);    // Download history records
PO3Module.disconnect(mac);
```

---

### Body Scale — HS2S / HS2S Pro

```javascript
import { HS2SModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.HS2SModule);
emitter.addListener(HS2SModule.Event_Notify, (event) => {
  console.log(event);
});

// Unit: 1 = kg, 2 = jin (Chinese unit), 3 = lb
HS2SModule.setUnit(mac, 1);

// User management — userID must be a 16-character string
const userID = '1234567890123456';
HS2SModule.updateUserInfo(
  mac, userID, createTimestamp,
  weight,       // kg
  age,          // years
  height,       // cm
  sex,          // 0 = female, 1 = male
  impedanceMark,
  fitnessMark
);
HS2SModule.getUserInfo(mac);
HS2SModule.deleteUser(mac, userID);

// Measurement (userType: 1 = registered user, 0 = guest)
HS2SModule.measure(
  mac, 1, userID, createTimestamp,
  weight, age, height, sex, impedanceMark, fitnessMark
);

// History data
HS2SModule.getMemoryDataCount(mac, userID);
HS2SModule.getMemoryData(mac, userID);
HS2SModule.deleteMemoryData(mac, userID);
HS2SModule.getAnonymousMemoryDataCount(mac);
HS2SModule.getAnonymousMemoryData(mac);
HS2SModule.deleteAnonymousMemoryData(mac);

// Heart rate measurement mode (HS2S Pro)
HS2SProModule.enterHS2SProHeartRateMeasurementMode(mac);
HS2SProModule.exitHS2SProHeartRateMeasurementMode(mac);

HS2SModule.disconnect(mac);
```

---

### Blood Glucose Meter — BG5S

```javascript
import { BG5SModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.BG5SModule);
emitter.addListener(BG5SModule.Event_Notify, (event) => {
  console.log(event);
});

BG5SModule.getStatusInfo(mac);

// Sync time: date string + timezone offset (hours)
BG5SModule.setTime(mac, '2025-01-01 12:00:00', 8);

// Unit: 1 = mmol/L, 2 = mg/dL
BG5SModule.setUnit(mac, 1);

// Start measurement: testType 1 = blood, 2 = urine
BG5SModule.startMeasure(mac, 1);

// Offline data
BG5SModule.setOfflineModel(mac, true);
BG5SModule.getOfflineData(mac);
BG5SModule.deleteOfflineData(mac);
BG5SModule.deleteUsedStrip(mac);

// Note: both spellings are accepted
BG5SModule.disconnect(mac);   // recommended
BG5SModule.disConnect(mac);   // also valid
```

---

### Blood Glucose Meter — BG1A

```javascript
import { BG1AModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.BG1AModule);
emitter.addListener(BG1AModule.Event_Notify, (event) => {
  console.log(event);
});

BG1AModule.getDeviceInfo(mac);
BG1AModule.setMeasureMode(mac, 1);   // 1 = blood, 2 = urine
BG1AModule.setDeviceTime(mac);       // Sync phone time to device
BG1AModule.getHistoryData(mac);
BG1AModule.deleteHistoryData(mac);
BG1AModule.disconnect(mac);
```

---

### Blood Glucose Meter — BG1S

```javascript
import { BG1SModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.BG1SModule);
emitter.addListener(BG1SModule.Event_Notify, (event) => {
  console.log(event);
});

BG1SModule.getFunction(mac);         // Get device function info
BG1SModule.measure(mac, testType);   // testType: 1 = blood
BG1SModule.disconnect(mac);
```

---

### Activity Tracker — AM6

```javascript
import { AM6Module } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.AM6Module);
emitter.addListener(AM6Module.Event_Notify, (event) => {
  console.log(event);
});

// Initialization
AM6Module.getDeviceInfoAndSyncTime(mac, true);
AM6Module.setUserInfo(mac, userID, gender, age, height, weight);
AM6Module.setPhonePlatform(mac);

// Sync health data
AM6Module.readySyncData(mac);
AM6Module.getDailyData(mac);
AM6Module.getStepData(mac);
AM6Module.getSleepData(mac);
AM6Module.getHeartRateData(mac);
AM6Module.getBloodOxygenData(mac);
AM6Module.getActivityData(mac);
AM6Module.deleteData(mac, dataType);

// Reminders
AM6Module.setTargetRemind(mac, enable, stepTarget, calorieTarget);
AM6Module.setTargetRemind(mac, true, 8000, 300);   // example
AM6Module.getTargetRemind(mac);
AM6Module.setSedentaryRemind(mac, enable, startTime, endTime);
AM6Module.setRaiseToLightRemind(mac, enable, startTime, endTime);
AM6Module.setDoNotDisturbMode(mac, enable, startTime, endTime);

// Alarm clock — format: "repeat:days:time;..." e.g. "1:1-1-1-1-1-1-1:480"
AM6Module.setAlarmClockList(mac, alarmString);
AM6Module.getAlarmClockList(mac);

// Display & wear settings
AM6Module.setWearHand(mac, 1);     // 0 = left, 1 = right
AM6Module.getWearHand(mac);

// Notifications
AM6Module.notifyMessage(mac, timestamp, enable, type, title, content);

// Bind / unbind user
AM6Module.startBind(mac);
AM6Module.bindUserSuccess(mac, userID);
AM6Module.bindUserFail(mac);
AM6Module.unBindUser(mac, userID);

AM6Module.findDevice(mac, 1);   // Vibrate to locate the device
AM6Module.rebootDevice(mac);
AM6Module.disconnect(mac);
```

---

### Thermometer — BTM / NT13B / TS28B / PT3SBT

```javascript
import { BTMModule } from '@ihealth/ihealthlibrary-react-native';

const emitter = new NativeEventEmitter(NativeModules.BTMModule);
emitter.addListener(BTMModule.Event_Notify, (event) => {
  // event: { action, temperature, unit, ... }
  console.log(event);
});

BTMModule.getBattery(mac);
BTMModule.startMeasure(mac);
BTMModule.stopMeasure(mac);
BTMModule.disconnect(mac);
```

---

## Supported Devices

| Category | Model | Module | Platform |
|----------|-------|--------|----------|
| Blood Pressure | BP5 | `BP5Module` | iOS & Android |
| Blood Pressure | BP5S | `BP5SModule` | iOS & Android |
| Blood Pressure | BP3L | `BP3LModule` | iOS & Android |
| Blood Pressure | BP7 | `BP7Module` | iOS & Android |
| Blood Pressure | BP7S | `BP7SModule` | iOS & Android |
| Blood Pressure | KN-550BT | `BP550BTModule` | iOS & Android |
| Blood Pressure | KN-550LT | `BP550LTModule` | iOS & Android |
| Pulse Oximeter | PO3 | `PO3Module` | iOS & Android |
| Pulse Oximeter | PO1 | `PO1Module` | iOS & Android |
| Body Scale | HS2S | `HS2SModule` | iOS & Android |
| Body Scale | HS2S Pro | `HS2SProModule` | iOS & Android |
| Body Scale | HS4S | `HS4SModule` | iOS & Android |
| Body Scale | HS6 | `HS6Module` | iOS & Android |
| Blood Glucose | BG5S | `BG5SModule` | iOS & Android |
| Blood Glucose | BG5 | `BG5Module` | iOS & Android |
| Blood Glucose | BG1 | `BG1Module` | iOS & Android |
| Blood Glucose | BG1A | `BG1AModule` | iOS & Android |
| Blood Glucose | BG1S | `BG1SModule` | iOS & Android |
| Activity Tracker | AM3S | `AM3SModule` | iOS & Android |
| Activity Tracker | AM4 | `AM4Module` | iOS & Android |
| Activity Tracker | AM5 | `AM5Module` | iOS & Android |
| Activity Tracker | AM6 | `AM6Module` | iOS & Android |
| Thermometer | BTM | `BTMModule` | iOS & Android |
| Thermometer | TS28B | `TS28BModule` | iOS & Android |
| Thermometer | NT13B | `NT13BModule` | iOS & Android |
| Thermometer | PT3SBT | `PT3SBTModule` | iOS & Android |
| ECG | ECG3 | `ECGModule` | **iOS only** |
| ECG | ECG3USB | `ECGUSBModule` | **iOS only** |

---

## Migrating from v1.x

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for a full guide.

**The only code change required** is replacing `DeviceEventEmitter` with `NativeEventEmitter`:

```javascript
// Before (v1.x) ❌
import { DeviceEventEmitter } from 'react-native';
DeviceEventEmitter.addListener(BP5SModule.Event_Notify, handler);

// After (v2.0+) ✅
import { NativeEventEmitter, NativeModules } from 'react-native';
const emitter = new NativeEventEmitter(NativeModules.BP5SModule);
emitter.addListener(BP5SModule.Event_Notify, handler);
```

---

## FAQ

**Q: I can scan and connect to a device, but never receive measurement data.**  
A: Make sure you are creating `NativeEventEmitter` inside `useEffect`, not at the module top-level or component function body. The emitter must be created after React Native has fully initialized the native modules.

**Q: iOS `pod install` fails with a linker error about a missing static library.**  
A: Delete the `ios/Pods` directory and run `cd ios && pod install` again.

**Q: Android method calls have no effect.**  
A: Confirm that the `.pem` license file is present in `android/app/src/main/assets/` and that `sdkAuthWithLicense()` was called at app startup.

**Q: iOS scanning never finds a device (and reports no error).**  
A: Add the `.pem` license file to the app target, call `sdkAuthWithLicense()` before scanning and check that `Event_Authenticate_Result` reports `access: 1`. The license must match the app's bundle identifier.

**Q: `NativeModules.XXXModule` is `null`.**  
A: ECG3 and ECG3USB are iOS-only. They will be `null` on Android. Use `Platform.OS === 'ios'` before accessing these modules.

**Q: What is the correct method name for HS2S heart rate mode?**  
A: Both spellings are supported and equivalent:
```javascript
HS2SModule.enterHS2SHeartRateMeasurementMode(mac);      // v1.x name, still works
HS2SModule.enterHS2SProHeartRateMeasurementMode(mac);   // native method name
```

**Q: How do I disconnect the BG5S?**  
A: Both of the following work identically:
```javascript
BG5SModule.disconnect(mac);    // recommended
BG5SModule.disConnect(mac);    // also valid (legacy spelling)
```

**Q: I'm upgrading from an older RN version — do I need to change anything else?**  
A: If you are upgrading to React Native >= 0.76 and enabling the New Architecture, the event listener change above is the only SDK-level change. Your device API calls (methods on `BP5SModule`, `AM6Module`, etc.) remain unchanged.

---

## Release Notes

### v2.1.0
- **New device: KN-550LT blood pressure monitor** (`BP550LTModule`, device type `iHealthDeviceManagerModule.KN550LT`) on iOS and Android
- Native SDKs upgraded: iOS `libiHealthSDK2.15.0.a`, Android `iHealthSDK_2.16.0.jar`
- iOS: added `BPProfileModule sendErrorToEmitter:` so BP error events are delivered in RN 0.81+
- iOS: `BP550LTModule` runs on the main queue so the native 3 s command timeouts fire (`error_bp` 404 instead of no reply)
- Android: declares the SQLCipher dependencies required by `iHealthSDK_2.16.0.jar` (`net.zetetic:sqlcipher-android`, `androidx.sqlite:sqlite`)
- KN-550LT: iOS / Android differences in error and timeout handling are listed in the KN-550LT section

### v2.0.1
- Hardened SDK module initialization: `RCTModule.addListener()` calls are now wrapped in `typeof` checks and `try/catch` to prevent rare crashes during React Native bootstrap on the Old Architecture
- All native method calls use optional chaining (`RCTModule?.method?.()`) so JS modules degrade gracefully when a method is unavailable on a given platform (forward/backward compatibility)
- Aligned Android / iOS event names in JS modules so cross-platform code can subscribe to a single `Event_Notify` constant
- Added a static module validation script — run with `npm test` (162 checks across all 49 modules)
- No public API changes vs. v2.0.0 — fully drop-in upgrade

### v2.0.0
- **Full support for React Native New Architecture (TurboModules / Fabric)**
- Minimum React Native version bumped to **>= 0.76.0**
- iOS: all modules use `initWithDisabledObservation` to guarantee event dispatch in TurboModule mode
- iOS: 29 `+TurboModule.mm` category files added for C++ JSI bridge
- Android: `@ReactModule` annotations added to all modules for interop layer compatibility
- 29 TypeScript spec files added (`src/Native*.ts`) for Codegen support
- Event name constants are now hardcoded in JavaScript — no longer depend on `constantsToExport`
- **Breaking change**: event listeners must use `NativeEventEmitter` (see [Migrating from v1.x](#migrating-from-v1x))

### v1.9.1
- Support Android 16KB page size
- Bug fixes

### v1.9.0
- Adapt to Android 15
- Code optimization and bug fixes

### v1.8.0
- Support new version of BP5S (hardware version > 2.0.0) with offline data time correction
- Code optimization
