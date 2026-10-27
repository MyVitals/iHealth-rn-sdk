//
//  BPProfileModule.h
//  ReactNativeIOSLibrary
//
//  Created by daiqingquan on 2016/11/23.
//  Copyright © 2016年 daiqingquan. All rights reserved.
//

#import <Foundation/Foundation.h>
#if __has_include(<React/RCTAssert.h>)
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#else
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#endif

@class RCTEventEmitter;

@interface BPProfileModule : NSObject<RCTBridgeModule>

#define kACTION_ERROR_BP @"error_bp"
#define kERROR_DESCRIPTION_BP @"description"
#define kACTION_BATTERY_BP @"battery_bp"
#define kACTION_ZOREING_BP @"zoreing_bp"
#define kACTION_ZOREOVER_BP @"zoreover_bp"
#define kACTION_ONLINE_PRESSURE_BP @"online_pressure_bp"
#define kACTION_ONLINE_PULSEWAVE_BP @"online_pulsewave_bp"
#define kACTION_ONLINE_RESULT_BP @"online_result_bp"
#define kACTION_HISTORICAL_NUM_BP @"offlinenum"
#define kACTION_HISTORICAL_DATA_BP @"historicaldata_bp"
#define kACTION_HISTORICAL_OVER_BP @"get_historical_over_bp"
#define kACTION_FUNCTION_INFORMATION_BP @"function_info_bp"
#define kACTION_SET_UNIT_SUCCESS_BP @"set_unit_success"
#define kACTION_SET_ANGLE_SUCCESS_BP @"set_angle_success"
#define kACTION_INTERRUPTED_BP @"interrupted_bp"
#define kACTION_Delete_BP @"delete_bp"


#define kACTION_ENABLE_OFFLINE_BP @"enable_offline_bp"
#define kACTION_DISENABLE_OFFLINE_BP @"disenable_offline_bp"
#define kACTION_IS_ENABLE_OFFLINE @"offlinestatus"

#define kACTION_GETTIME_BP @"action_get_time"

#define kACTION_GETHISTORY_OVER_BP @"get_historical_over_bp"

#define kACTION_GET_FIRMWARE_VERSION @"action_get_firmwareVersion"
#define kFIRMWARE_VERSION @"firmwareVersion"

#define kMessage @"Message"
#define kIDPS @"idps"
#define kACTION @"action"
#define kERROR_NUM_BP @"error"
#define kBATTERY_BP @"battery"
#define kBLOOD_PRESSURE_BP @"pressure"
#define kFLAG_HEARTBEAT_BP @"heartbeat"
#define kPULSEWAVE_BP @"wave"
#define kHIGH_BLOOD_PRESSURE_BP @"sys"
#define kLOW_BLOOD_PRESSURE_BP @"dia"
#define kPULSE_BP @"heartRate"
#define kMEASUREMENT_DATE_BP @"date"
#define kMEASUREMENT_TIME_BP @"time"
#define kMEASUREMENT_AHR_BP @"arrhythmia"
#define kMEASUREMENT_HSD_BP @"hsd"
#define kMEASUREMENT_STRAT_ANGLE_BP @"startAngle"
#define kMEASUREMENT_ANGLE_CHANGE_BP @"measureAngleChange"
#define kMEASUREMENT_HAND_BP @"chooseHand"
#define kDATAID @"dataID"
#define kHISTORICAL_NUM_BP @"offlinenum"
#define kHISTORICAL_DATA_BP @"data"
#define kIS_ENABLE_OFFLINE @"offlinestatus"

#define kFUNCTION_IS_UPAIR_MEASURE @"upAirMeasureFlg"
#define kFUNCTION_IS_ARM_MEASURE @"armMeasureFlg"
#define kFUNCTION_HAVE_ANGLE_SENSOR @"haveAngleSensor"
#define kFUNCTION_HAVE_OFFLINE @"haveOffline"
#define kFUNCTION_HAVE_ANGLE_SETTING @"haveAngleSet"
#define kFUNCTION_IS_MULTI_UPLOAD @"mutableUpload"
#define kFUNCTION_HAVE_SELF_UPDATE @"selfUpdate"
#define kFUNCTION_HAVE_HSD @"haveHSD"


#define kFUNCTION_DEVICE_TIME @"deviceTime"
#define kFUNCTION_DEVICE_SYSTIME @"deviceSysTime"

#define kANGLE_BP @"angle"

#define kWHICH_ARM @"which_arm"

#define kACTION_ANGLE_BP @"angle_bp"

#define kTIME_CALIBRATION_BP @"time_calibration"

#define kACTION_SET_STATUS_DISPLAY_BP @"action_set_status_display_success"

#define kACTION_SHOW_CONFIG_BP @"action_show_config"

#define kBACKLIGHT_ON_BP @"is_backLight_on_bp"

#define kCLOCK_ON_BP @"is_clock_on_bp"

#define kHARDWARE_VERSION @"hardwareVersion"

#define kACTION_GET_HARDWARE_VERSION @"action_get_hardwareVersion"

#define kTIME_Right @"isRightTime"



#define kMAC @"mac"
#define kType @"type"

#define kMEASUREMENT_HSD_BP5S @"flag_hsd_status"

#define kMEASUREMENT_IHB_BP5S @"flag_have_ihb"

#define kACTION_DELETE_ALL_MEMORY_SUCCESS @"action_delete_all_memory_success"

#define kACTION_SET_MODE @"action_set_mode"



+ (void)sendErrorToBridge:(RCTBridge *)bridge eventNotify:(NSString*)eventNotify WithCode:(NSInteger)errorCode;
+ (void)sendEventToBridge:(RCTBridge *)bridge eventNotify:(NSString*)eventNotify WithDict:(NSDictionary*)dict;
+ (void)sendEventToEmitter:(RCTEventEmitter *)emitter eventNotify:(NSString*)eventNotify WithDict:(NSDictionary*)dict;


+ (void)sendErrorToBridge:(RCTBridge *)bridge eventNotify:(NSString*)eventNotify WithCode:(NSInteger)errorCode mac:(NSString*)mac type:(NSString*)type;

// Same payload as sendErrorToBridge:...mac:type:, but delivered through the emitter so it also works in RN 0.81+.
+ (void)sendErrorToEmitter:(RCTEventEmitter *)emitter eventNotify:(NSString*)eventNotify WithCode:(NSInteger)errorCode mac:(NSString*)mac type:(NSString*)type;

@end
