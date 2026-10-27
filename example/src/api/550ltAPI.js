import { BP550LTModule } from '@ihealth/ihealthlibrary-react-native';

export default {
  apis: {
    getAllConnectedDevices: () => BP550LTModule.getAllConnectedDevices(),
    getFirmVersion:   (mac) => BP550LTModule.getFirmVersion(mac),
    getBattery:       (mac) => BP550LTModule.getBattery(mac),
    getFunctionInfo:  (mac) => BP550LTModule.getFunctionInfo(mac),
    getOffLineNum:    (mac) => BP550LTModule.getOffLineNum(mac),
    getOffLineData:   (mac) => BP550LTModule.getOffLineData(mac),
    getTime:          (mac) => BP550LTModule.getTime(mac),
    transferFinished: (mac) => BP550LTModule.transferFinished(mac),
    disconnect:       (mac) => BP550LTModule.disconnect(mac)
  }
}
