'use strict';

var Component = {
    // Device manager
    iHealthDeviceManagerModule: require('./module/iHealthDeviceManagerModule'),

    // Blood Pressure
    BP5Module: require('./module/BP5Module'),
    BP5SModule: require('./module/BP5SModule'),
    BP3LModule: require('./module/BP3LModule'),
    BP550BTModule: require('./module/BP550BTModule'),
    BP550LTModule: require('./module/BP550LTModule'),
    BP7Module: require('./module/BP7Module'),
    BP7SModule: require('./module/BP7SModule'),
    BPProfileModule: require('./module/BPProfileModule'),

    // Activity Monitor
    AM3SModule: require('./module/AM3SModule'),
    AM4Module: require('./module/AM4Module'),
    AM5Module: require('./module/AM5Module'),
    AM6Module: require('./module/AM6Module'),
    AMProfileModule: require('./module/AMProfileModule'),
    AM5ProfileModule: require('./module/AM5ProfileModule'),
    AM6ProfileModule: require('./module/AM6ProfileModule'),

    // Pulse Oximeter
    PO1Module: require('./module/PO1Module'),
    PO1ProfileModule: require('./module/PO1ProfileModule'),
    PO3Module: require('./module/PO3Module'),
    POProfileModule: require('./module/POProfileModule'),

    // Body Scale
    HS2Module: require('./module/HS2Module'),
    HS2SModule: require('./module/HS2SModule'),
    HS2SProModule: require('./module/HS2SProModule'),
    HS4SModule: require('./module/HS4SModule'),
    HS6Module: require('./module/HS6Module'),
    HSProfileModule: require('./module/HSProfileModule'),
    HS2SProfileModule: require('./module/HS2SProfileModule'),
    HS6ProfileModule: require('./module/HS6ProfileModule'),
    HS2SProProfileModule: require('./module/HS2SProProfileModule'),

    // Blood Glucose
    BG1Module: require('./module/BG1Module'),
    BG1AModule: require('./module/BG1AModule'),
    BG1SModule: require('./module/BG1SModule'),
    BG5Module: require('./module/BG5Module'),
    BG5SModule: require('./module/BG5SModule'),
    BG1ProfileModule: require('./module/BG1ProfileModule'),
    BG1AProfileModule: require('./module/BG1AProfileModule'),
    BG1SProfileModule: require('./module/BG1SProfileModule'),
    BG5SProfileModule: require('./module/BG5SProfileModule'),
    BGProfileModule: require('./module/BGProfileModule'),

    // ECG (iOS only)
    ECGModule: require('./module/ECGModule'),
    ECGUSBModule: require('./module/ECGUSBModule'),
    ECGProfileModule: require('./module/ECGProfileModule'),

    // Thermometer / Others
    BTMModule: require('./module/BTMModule'),
    BTMProfileModule: require('./module/BTMProfileModule'),
    TS28BModule: require('./module/TS28BModule'),
    TS28BProfileModule: require('./module/TS28BProfileModule'),
    NT13BModule: require('./module/NT13BModule'),
    NT13BProfileModule: require('./module/NT13BProfileModule'),
    PT3SBTModule: require('./module/PT3SBTModule'),
    PT3SBTProfileModule: require('./module/PT3SBTProfileModule'),
}

module.exports = Component;
