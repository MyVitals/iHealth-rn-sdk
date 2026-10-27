//
//  BP300CL.h
//
//  Created by dai on 24-02-27.
//  Copyright (c) 2024年 my. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "UIKit/UIKit.h"
#import "BPDevice.h"


@class BP300CLInternal;


typedef NS_ENUM(uint8_t,BP300CLMemoryDataGroupNumber) {
    BP300CLMemoryDataGroupNumber_Group1             = 0x01,
    BP300CLMemoryDataGroupNumber_Group2             = 0x02,
    BP300CLMemoryDataGroupNumber_All                = 0xFF,
};

 /**
 
  BP300CL device class
 
 */
@interface BP300CL : BPDevice

/// An internal instance, not available for SDK users
@property (strong, nonatomic) BP300CLInternal *internalDevice;

/**
 * Get IDPS info
 * @param idpsInfo  A block to refer ‘idpsInfo’.
 * @param error   A block to return the error.
 */
-(void)commandGetIDPSInfo:(BlockDeviceIDPS)idpsInfo errorBlock:(BlockError)error;

/**
 * Query battery remaining energy.
 * @param energyValue  A block to return the device battery remaining energy percentage, ‘80’ stands for 80%.
 * @param energyState 0:Not charging 1:charging 
 * @param error  A block to return the error in ‘Establish measurement connection’
 */
-(void)commandEnergy:(BlockEnergyValue)energyValue energyState:(BlockEnergyState)energyState errorBlock:(BlockError)error;

/**
 *
 * What the function returns:
 {
 voiceSetting = 0;
 currentUser = 2;
 upAirMeasureFlg = 0;
 deviceSysTime = 2025-06-27 06:18:04 +0000;
 haveOffline = 1;
 deviceTime = 2025-01-01 07:46:21 +0000;
 haveCuffLooseFlg = 0;
 haveBodyMovementFlg = 0;
 showUnit = 0;
 selfUpdate = 0;
 haveMarking = 1;
 haveAngleSet = 0;
 armMeasureFlg = 1;
 haveShowUnitSetting = 0;
 mutableUpload = 0;
 haveBackLightSetting = 0;
 haveClockShowSetting = 0;
 haveAngleSensor = 0;
 memoryGroup = 2;
 haveRepeatedlyMeasure = 0;
 haveHSD = 0;
 }
 * @param function  A block to return the function and states that the device supports.
 * @param error   A block to return the error.
 */
-(void)commandFunction:(BlockDeviceFunction)function errorBlock:(BlockError)error;


-(void)commandGetLatestMemoryDataGroup1:(BlockMeasureResult)result1Dic group2:(BlockMeasureResult)result2Dic errorBlock:(BlockError)error;

/**
 * Upload offline data total Count.
 *  Import parameter:
 * @param groupID    MemoryDataGroupNumber。
 *
 * return
 * @param  totalCount item quantity of total data count
 * @param error  A block to return the error.
 */
-(void)commandGetMemoryCountWithGroupID:(BP300CLMemoryDataGroupNumber)groupID count:(BlockBachCount)totalCount errorBlock:(BlockError)error;

/**
 * Upload offline data（Please call the API for obtaining the number of historical data before calling this API, otherwise the data cannot be obtained.）
 *
 * Import parameter:
 * @param groupID   MemoryDataGroupNumber。
 *
 * @param uploadDataArray item quantity of total data.
 * @param error  A block to return the error.
 */
-(void)commandTransferMemoryDataWithGroupID:(BP300CLMemoryDataGroupNumber)groupID data:(BlockBachArray)uploadDataArray errorBlock:(BlockError)error;
 
/**
 * Delete offline data.
 *
 * * Import parameter:
 * @param groupID  MemoryDataGroupNumber
 * 
 * @param success   A block to refer ‘set success’.
 * @param error    A block to return the error.
 */
-(void)commandDeleteMemoryDataWithGroupID:(BP300CLMemoryDataGroupNumber)groupID success:(BlockSuccess)success errorBlock:(BlockError)error;

/**
 * Disconnect current device
 */
-(void)commandDisconnectDevice;

@end
