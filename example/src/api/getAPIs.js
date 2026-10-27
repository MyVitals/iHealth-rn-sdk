import bt550API from './550btAPI'
import lt550API from './550ltAPI'
import bg1aAPI from './bg1aAPI'
import am6API from './am6API'
import bg5sAPI from './bg5sAPI'
import hs2sAPI from './hs2sAPI'
import hs2sProAPI from './hs2sProAPI'
import bp5sAPI from './bp5sAPI'
import bg1sAPI from './bg1sAPI'
import po3API from './po3API'
import nt13bAPI from './nt13bAPI'
import {
  BG1AModule,
  BP550BTModule,
  BP550LTModule,
  AM6Module,
  BG5SModule,
  HS2SModule,
  HS2SProModule,
  BP5SModule,
  BG1SModule,
  PO3Module,
  NT13BModule
} from '@ihealth/ihealthlibrary-react-native'

// Maps device type to its native module name (for NativeEventEmitter)
const deviceModuleNameMap = {
  'KN550':    'BP550BTModule',
  'KN550LT':  'BP550LTModule',
  'BG1A':     'BG1AModule',
  'AM6':      'AM6Module',
  'BG5S':     'BG5SModule',
  'HS2S':     'HS2SModule',
  'HS2S Pro': 'HS2SProModule',
  'BP5S':     'BP5SModule',
  'BG1S':     'BG1SModule',
  'PO3':      'PO3Module',
  'NT13B':    'NT13BModule',
};

export default {

  getDeviceModuleName: (type) => deviceModuleNameMap[type],

  getDeviceNotify: (type) => {
    switch (type) {
      case 'KN550':
        return BP550BTModule.Event_Notify

      case 'KN550LT':
        return BP550LTModule.Event_Notify

      case 'BG1A':
        return BG1AModule.Event_Notify

      case 'AM6':
        return AM6Module.Event_Notify

      case 'BG5S':
        return BG5SModule.Event_Notify

      case 'HS2S':
        return HS2SModule.Event_Notify

      case 'HS2S Pro':
        return HS2SProModule.Event_Notify

      case 'BP5S':
        return BP5SModule.Event_Notify
      case 'BG1S':
        return BG1SModule.Event_Notify

      case 'PO3':
        return PO3Module.Event_Notify

      case 'NT13B':
        return NT13BModule.Event_Notify
    }
  },

  getDeviceAPI: (type) => {
    switch (type) {
      case 'KN550':
        return bt550API

      case 'KN550LT':
        return lt550API

      case 'BG1A':
        return bg1aAPI

      case 'AM6':
        return am6API

      case 'BG5S':
        return bg5sAPI

      case 'HS2S':
        return hs2sAPI

      case 'HS2S Pro':
        return hs2sProAPI

      case 'BP5S':
        return bp5sAPI
      case 'BG1S':
        return bg1sAPI

      case 'PO3':
        return po3API

      case 'NT13B':
        return nt13bAPI
    }
  }
}
