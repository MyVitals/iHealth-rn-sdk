'use strict';

var { TurboModuleRegistry } = require('react-native');

var RCTModule = TurboModuleRegistry.get('iHealthDeviceManagerModule');

// In New Architecture, DeviceEventEmitter.addListener() does NOT call the
// native module's addListener(), so _listenerCount stays 0 and
// sendEventWithName: silently drops all events.
// Fix: pre-call addListener via TurboModuleRegistry (JSI path) for every
// supported event to ensure _listenerCount > 0 before any event fires.
if (RCTModule && typeof RCTModule.addListener === 'function') {
    [
        'event_scan_device',
        'event_scan_finish',
        'event_device_connected',
        'event_device_connect_failed',
        'event_device_disconnect',
        'event_authenticate_result',
        'event_notify_ts28b',
        'event_notify_bg1',
    ].forEach(function(name) { try { RCTModule.addListener(name); } catch (_) {} });
}

module.exports = {

    // Event names (hardcoded for New Architecture compatibility)
    Event_Scan_Device:           'event_scan_device',
    Event_Scan_Finish:           'event_scan_finish',
    Event_Device_Connected:      'event_device_connected',
    Event_Device_Connect_Failed: 'event_device_connect_failed',
    Event_Device_Disconnect:     'event_device_disconnect',
    Event_Authenticate_Result:   'event_authenticate_result',

    // Device type identifiers (hardcoded for New Architecture compatibility)
    AM3S:    'AM3S',
    AM4:     'AM4',
    AM5:     'AM5',
    AM6:     'AM6',
    PO3:     'PO3',
    PO3M:    'PO3',
    PO1:     'PO1',
    BP5:     'BP5',
    BP7:     'BP7',
    BP3L:    'BP3L',
    BP5S:    'BP5S',
    BP7S:    'BP7S',
    KN550:   'KN550',
    KN550LT: 'KN550LT',
    HS4S:    'HS4S',
    HS4:     'HS4',
    HS2:     'HS2',
    HS2S:    'HS2S',
    'HS2S Pro': 'HS2S Pro',
    BG1:     'BG1',
    BG1A:    'BG1A',
    BG1S:    'BG1S',
    BG5:     'BG5',
    BG5S:    'BG5S',
    ECG3:    'ECG3',
    ECG3USB: 'ECG3USB',
    BTM:     'FDIR_V3',
    NT13B:   'NT13B',
    TS28B:   'TS28B',
    PT3SBT:  'PT3SBT',

    sdkAuthWithLicense: (license) => { RCTModule?.sdkAuthWithLicense(license); },
    startDiscovery: (deviceType) => { RCTModule?.startDiscovery(deviceType); },
    stopDiscovery: () => { RCTModule?.stopDiscovery(); },
    connectDevice: (mac, type) => { RCTModule?.connectDevice(mac, type); },
    disconnectDevice: (mac, type) => { RCTModule?.disconnectDevice(mac, type); },
    getDevicesIDPS: (mac, callback) => { RCTModule?.getDevicesIDPS(mac, callback); },
    authenConfigureInfo: (userID, clientID, clientSecret) => { RCTModule?.authenConfigureInfo(userID, clientID, clientSecret); },
    authenAppSecret: (appSecret) => { RCTModule?.authenAppSecret(appSecret); },
};
