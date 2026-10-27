//
//  KD723SE.h
//
//  Created by dai on 24-02-27.
//  Copyright (c) 2024年 my. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "UIKit/UIKit.h"
#import "BPDevice.h"
#import "SDKFlowNewOTAController.h"

@class KD723SEInternal;

typedef NS_ENUM(uint8_t,KD723SEMemoryDataGroupNumber) {
    KD723SEMemoryDataGroupNumber_Group1             = 0x00, ///< User 1
    KD723SEMemoryDataGroupNumber_Group2             = 0x01, ///< User 2
    KD723SEMemoryDataGroupNumber_All                = 0xFF, ///< For commandDeleteMemoryDataWithGroupID only: delete all offline memory
};

 /**
 
  KD723SE device class
 
 */
@interface KD723SE : BPDevice

/// An internal instance, not available for SDK users
@property (strong, nonatomic) KD723SEInternal *internalDevice;

/**
 * synchronize time
 * @param success  A block to refer ‘set success’.
 * @param error   A block to return the error.
 */
-(void)commandSynchronizeTime:(BlockSuccess)success errorBlock:(BlockError)error;

/**
 *
 * What the function returns:
 
 {
     upAirMeasureFlg = 1;
     haveOffline = 1;
     deviceTime = "2026-2-9 22:12:38";
     showUnit = 0;
     is24Hour = 1;
     selfUpdate = 0;
     firmwareVersion = "1.0.0";
     haveAngleSet = 0;
     modelNumber = "KD-723SE 11070";
     armMeasureFlg = 0;
     haveShowUnitSetting = 0;
     protocol = "com.jiuan.BPV31";
     mutableUpload = 1;
     manufacture = "iHealth";
     haveBackLightSetting = 0;
     haveClockShowSetting = 0;
     hardwareVersion = "1.0.0";
     haveAngleSensor = 0;
     memoryGroup = 2;
     lastOperatingState = 85;
     maxMemoryCapacity = 199;
     accessoryName = "KD723SE";
     serialNumber = "383B2672681B";
     haveRepeatedlyMeasure = 0;
     haveHSD = 1;
 }
 * @param function  A block to return the function and states that the device supports.
 * @param error   A block to return the error.
 */
-(void)commandFunction:(BlockDeviceFunction)function errorBlock:(BlockError)error;


-(void)commandGetLatestMemoryDataGroup1:(BlockMeasureResult)result1Dic group2:(BlockMeasureResult)result2Dic errorBlock:(BlockError)error;


/**
 * Upload offline data total Count.
 * @param groupID User 1 or User 2 only (do not pass KD723SEMemoryDataGroupNumber_All).
 */
-(void)commandGetMemoryCountWithGroupID:(KD723SEMemoryDataGroupNumber)groupID count:(BlockBachCount)totalCount errorBlock:(BlockError)error;

/**
 * Upload offline data（Please call the API for obtaining the number of historical data before calling this API, otherwise the data cannot be obtained.）
 * @param groupID User 1 or User 2 only (do not pass KD723SEMemoryDataGroupNumber_All).
 */
-(void)commandTransferMemoryDataWithGroupID:(KD723SEMemoryDataGroupNumber)groupID data:(BlockBachArray)uploadDataArray errorBlock:(BlockError)error;
 
/**
 * Delete offline data.
 * @param groupID User 1, User 2, or KD723SEMemoryDataGroupNumber_All (0xFF) to delete all offline data (second command byte 0xFF).
 */
-(void)commandDeleteMemoryDataWithGroupID:(KD723SEMemoryDataGroupNumber)groupID success:(BlockSuccess)success errorBlock:(BlockError)error;

/**
 * Disconnect current device
 */
-(void)commandDisconnectDevice;

/**
 * OTA upgrade controller (new encrypted transport). Use SDKFlowNewOTAController APIs for firmware update.
 * Devices that support the new protocol expose the same OTA surface through this property.
 */
@property (strong, nonatomic, readonly) SDKFlowNewOTAController *newOTAController;

@end
