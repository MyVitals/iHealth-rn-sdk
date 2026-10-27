import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  getAllConnectedDevices(): void;
  getFirmVersion(mac: string): void;
  getFunctionInfo(mac: string): void;
  getBattery(mac: string): void;
  getOffLineNum(mac: string): void;
  getOffLineData(mac: string): void;
  getTime(mac: string): void;
  transferFinished(mac: string): void;
  disconnect(mac: string): void;
}

export default TurboModuleRegistry.get<Spec>('BP550LTModule');
