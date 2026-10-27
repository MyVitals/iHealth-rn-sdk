'use strict';
var { TurboModuleRegistry } = require('react-native');
var RCTModule = TurboModuleRegistry.get('BP550LTModule');
// Pre-call addListener via TurboModule JSI to ensure _listenerCount > 0.
// Without this, sendEventWithName: silently drops all events in New Architecture.
if (RCTModule && typeof RCTModule.addListener === 'function') {
  try { RCTModule.addListener('event_notify_bp550lt'); } catch (_) {}
}

module.exports = {
  Event_Notify: 'event_notify_bp550lt',
  getAllConnectedDevices: () => { RCTModule?.getAllConnectedDevices(); },
  getBattery: (mac) => { RCTModule?.getBattery(mac); },
  getFirmVersion: (mac) => { RCTModule?.getFirmVersion(mac); },
  getFunctionInfo: (mac) => { RCTModule?.getFunctionInfo(mac); },
  getOffLineNum: (mac) => { RCTModule?.getOffLineNum(mac); },
  getOffLineData: (mac) => { RCTModule?.getOffLineData(mac); },
  getTime: (mac) => { RCTModule?.getTime(mac); },
  transferFinished: (mac) => { RCTModule?.transferFinished(mac); },
  disconnect: (mac) => { RCTModule?.disconnect(mac); },
};
