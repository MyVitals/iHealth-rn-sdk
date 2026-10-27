# Migration Guide — v1.x → v2.0.0

This guide covers everything you need to know when upgrading `@ihealth/ihealthlibrary-react-native` from v1.x to v2.0.0.

---

## What Changed

| Area | v1.x | v2.0.0 |
|------|------|--------|
| Minimum React Native | < 0.76 | **>= 0.76.0** |
| New Architecture support | ❌ | ✅ TurboModules |
| Event listening API | `DeviceEventEmitter` | **`NativeEventEmitter`** |
| Event name constants | From `NativeModules.XXX.EVENT` | **Hardcoded in JS module** |
| TypeScript specs | None | **29 `src/Native*.ts` files** |
| Android annotations | None | **`@ReactModule` on all modules** |
| iOS event dispatch | Relied on `_listenerCount` | **`initWithDisabledObservation` — always dispatches** |

---

## Step 1 — Update the package

```bash
npm install @ihealth/ihealthlibrary-react-native@^2.0.0
# then
cd ios && pod install
```

---

## Step 2 — Replace all event listeners

This is the **only required code change** for most apps.

Find every place you call `DeviceEventEmitter.addListener` with an iHealth event and replace it as shown below.

### Device Manager events (scan, connect, disconnect)

```javascript
// Before ❌
import { DeviceEventEmitter } from 'react-native';
import { iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

useEffect(() => {
  const sub = DeviceEventEmitter.addListener(
    iHealthDeviceManagerModule.Event_Scan_Device,
    (event) => { /* ... */ }
  );
  return () => sub.remove();
}, []);


// After ✅
import { NativeEventEmitter, NativeModules } from 'react-native';
import { iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

useEffect(() => {
  const emitter = new NativeEventEmitter(
    NativeModules.iHealthDeviceManagerModule
  );
  const sub = emitter.addListener(
    iHealthDeviceManagerModule.Event_Scan_Device,
    (event) => { /* ... */ }
  );
  return () => sub.remove();
}, []);
```

### Device data events (measurement results)

```javascript
// Before ❌
import { DeviceEventEmitter } from 'react-native';
import { BP5SModule } from '@ihealth/ihealthlibrary-react-native';

useEffect(() => {
  const sub = DeviceEventEmitter.addListener(
    BP5SModule.Event_Notify,
    (event) => { /* ... */ }
  );
  return () => sub.remove();
}, []);


// After ✅
import { NativeEventEmitter, NativeModules } from 'react-native';
import { BP5SModule } from '@ihealth/ihealthlibrary-react-native';

useEffect(() => {
  const emitter = new NativeEventEmitter(NativeModules.BP5SModule);
  const sub = emitter.addListener(
    BP5SModule.Event_Notify,
    (event) => { /* ... */ }
  );
  return () => sub.remove();
}, []);
```

### Rules to follow

| Rule | Reason |
|------|--------|
| Create `NativeEventEmitter` **inside** `useEffect` | In New Architecture, native modules are lazily initialized. Creating the emitter at module top-level may run before the native side is ready, resulting in a `null` module. |
| Pass the **matching** `NativeModules` instance | Each device module has its own native listener counter. Passing the wrong module means `addListener` increments the wrong counter and events are lost. |
| Always call `listener.remove()` in the cleanup | Prevents memory leaks and duplicate event callbacks after re-renders. |

---

## Step 3 — Remove direct access to `NativeModules.XXX.CONSTANT`

In v1.x, some apps read event names or constants directly from the native module:

```javascript
// Before ❌ — constantsToExport values are not available via TurboModuleRegistry
const eventName = NativeModules.BP5SModule.Event_Notify;
```

In v2.0.0, all event names and device type identifiers are hardcoded in the JS module and are always available:

```javascript
// After ✅ — import the JS module directly
import { BP5SModule, iHealthDeviceManagerModule } from '@ihealth/ihealthlibrary-react-native';

const eventName   = BP5SModule.Event_Notify;                      // 'BP5S.MODULE.NOTIFY'
const deviceType  = iHealthDeviceManagerModule.BP5S;              // 'BP5S'
const scanEvent   = iHealthDeviceManagerModule.Event_Scan_Device; // 'event_scan_device'
```

### Event name reference

#### `iHealthDeviceManagerModule` events

| Constant | Value |
|----------|-------|
| `Event_Scan_Device` | `'event_scan_device'` |
| `Event_Scan_Finish` | `'event_scan_finish'` |
| `Event_Device_Connected` | `'event_device_connected'` |
| `Event_Device_Connect_Failed` | `'event_device_connect_failed'` |
| `Event_Device_Disconnect` | `'event_device_disconnect'` |
| `Event_Authenticate_Result` | `'event_authenticate_result'` |

#### Device module `Event_Notify` values

Always use `Module.Event_Notify` — **never hard-code the event string**. The SDK resolves the correct value for the current platform automatically; your code requires no `Platform.OS` check.

```javascript
// ✅ correct — works on both iOS and Android
emitter.addListener(BP5Module.Event_Notify, handler);

// ❌ wrong — hard-coded string breaks on one platform
emitter.addListener('BP5.MODULE.NOTIFY', handler);
```

| Module | JS constant to use |
|--------|--------------------|
| `BP5Module` | `BP5Module.Event_Notify` |
| `BP5SModule` | `BP5SModule.Event_Notify` |
| `BP3LModule` | `BP3LModule.Event_Notify` |
| `BP7Module` | `BP7Module.Event_Notify` |
| `BP7SModule` | `BP7SModule.Event_Notify` |
| `BP550BTModule` | `BP550BTModule.Event_Notify` |
| `BP550LTModule` | `BP550LTModule.Event_Notify` |
| `PO3Module` | `PO3Module.Event_Notify` |
| `PO1Module` | `PO1Module.Event_Notify` |
| `HS2Module` | `HS2Module.Event_Notify` |
| `HS2SModule` | `HS2SModule.Event_Notify` |
| `HS2SProModule` | `HS2SProModule.Event_Notify` |
| `HS4SModule` | `HS4SModule.Event_Notify` |
| `HS6Module` | `HS6Module.Event_Notify` |
| `BG5SModule` | `BG5SModule.Event_Notify` |
| `BG5Module` | `BG5Module.Event_Notify` |
| `BG1Module` | `BG1Module.Event_Notify` |
| `BG1AModule` | `BG1AModule.Event_Notify` |
| `BG1SModule` | `BG1SModule.Event_Notify` |
| `AM3SModule` | `AM3SModule.Event_Notify` |
| `AM4Module` | `AM4Module.Event_Notify` |
| `AM5Module` | `AM5Module.Event_Notify` |
| `AM6Module` | `AM6Module.Event_Notify` |
| `BTMModule` | `BTMModule.Event_Notify` |
| `TS28BModule` | `TS28BModule.Event_Notify` |
| `NT13BModule` | `NT13BModule.Event_Notify` |
| `PT3SBTModule` | `PT3SBTModule.Event_Notify` |

> **Note for SDK maintainers:** Some modules (BP3L/BP5/BP5S/BP7/BP7S/HS2/HS2S/HS2SPro/HS4S/HS6) expose different underlying event name strings on iOS vs Android due to legacy native implementations. The JS layer resolves the correct value via `Platform.OS` at load time, so callers never need to handle this difference.

---

## Step 4 — Enable New Architecture (optional)

New Architecture is **optional** — the SDK works in both modes. Enable it if your project targets RN 0.76+.

**iOS** — edit `ios/Podfile.properties.json`:
```json
{ "newArchEnabled": "true" }
```
Then run `cd ios && pod install`.

**Android** — edit `android/gradle.properties`:
```properties
newArchEnabled=true
```

---

## Compatibility Notes

### HS2S — heart rate measurement method names

The native method is `enterHS2SProHeartRateMeasurementMode`. The SDK JS wrapper maps both names so existing code continues to work:

```javascript
HS2SModule.enterHS2SHeartRateMeasurementMode(mac);      // ✅ v1.x name — still works
HS2SModule.enterHS2SProHeartRateMeasurementMode(mac);   // ✅ native name — also works
```

### BG5S — disconnect method name

The native method is `disConnect` (capital C). The SDK JS wrapper accepts both:

```javascript
BG5SModule.disconnect(mac);   // ✅ recommended
BG5SModule.disConnect(mac);   // ✅ also valid
```

### ECG modules — iOS only

`ECGModule` and `ECGUSBModule` are only available on iOS. Always guard with:

```javascript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  ECGModule.startMeasure(mac);
}
```

### New and renamed methods per module

All v1.x method names remain valid — existing code needs no changes. The following modules gained new native methods in v2.0.0; use them for new integrations.

| Module | New / recommended methods | Notes |
|--------|--------------------------|-------|
| `HS6Module` | `init`, `setWifi`, `bindDeviceHS6`, `unBindDeviceHS6`, `getToken`, `getCloudData` | Wi-Fi scale — no BLE connect/disconnect |
| `BG1Module` | `sendCode(QR, codeType, testType)`, `getBottleInfoFromQR(QR)` | Scan-to-measure flow |
| `BG5Module` | `holdLink`, `setTime`, `setUnit`, `getBottleId`, `getOfflineData`, `deleteOfflineData`, `setBottleMessageWithInfo`, `getBottleMessage`, `setBottleId`, `getBottleInfoFromQR` | `getHistoryData` is kept as alias for `getOfflineData` |
| `HS2Module` | `measureOnline(mac, unit, userId)`, `getOfflineData` | `startMeasure` calls `measureOnline`; `getHistoryData` is kept as alias for `getOfflineData` |
| `HS4SModule` | `measureOnline(mac, unit, userId)`, `getOfflineData` | `startMeasure` calls `measureOnline` |
| `BTMModule` | `getMemoryData`, `setStandbyTime`, `setTemperatureUnit`, `setMeasuringTarget`, `setOfflineTarget` | — |
| `NT13BModule` | `measure(mac)` | `startMeasure` calls `measure` |
| `TS28BModule` | `measure(mac)` | `startMeasure` calls `measure` |
| `PT3SBTModule` | `setTime`, `setUnit`, `getUnit`, `getHistoryCount`, `getHistoryData`, `deleteHistory` | `deleteHistoryData` is kept as alias for `deleteHistory` |
| `AM5Module` | `unBindDevice`, `getBasicInfo`, `setTime`, `setUnit`, `setHandWearMode`, `getLiveData`, `syncHealthData`, `stopSyncHealthData`, `reboot` | — |

### AM5 — `setUserInfo` signature change

`AM5Module.setUserInfo` now matches the native iOS signature exactly:

```javascript
// Before ❌ (v1.x)
AM5Module.setUserInfo(mac, age, height, weight, male);

// After ✅ (v2.0.1+)
AM5Module.setUserInfo(mac, year, month, day, weight, height, gender);
```

---

## Troubleshooting

**Events are not received after upgrading.**  
→ Check that `NativeEventEmitter` is created inside `useEffect`, not at module top-level.  
→ Ensure the correct `NativeModules` instance is passed (e.g. `NativeModules.BP5SModule`, not `NativeModules.iHealthDeviceManagerModule`).

**iOS build fails after upgrading.**  
→ Delete `ios/Pods` and `ios/Podfile.lock`, then run `pod install`.

**Android: methods have no effect.**  
→ Verify the license `.pem` file is in `android/app/src/main/assets/` and `sdkAuthWithLicense()` has been called.

**`NativeModules.XXXModule` returns `null` at app startup.**  
→ You may be accessing it before React Native finishes initializing. Access it inside `useEffect` only.

---

*Migration Guide · @ihealth/ihealthlibrary-react-native v2.0.0*
