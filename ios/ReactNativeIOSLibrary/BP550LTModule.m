//
//  BP550LTModule.m
//  ReactNativeIOSLibrary
//
//  KN-550LT blood pressure monitor. Offline-only device: no online measurement,
//  results are read back from the device memory.
//
//  Event payloads use the same action names and keys as the Android bridge
//  (BP550LTModule.java), so JS code does not need platform branches.
//

#import "BP550LTModule.h"
#import "KN550LT.h"
#import "KN550LTController.h"
#import "BPProfileModule.h"

#define EVENT_NOTIFY @"event_notify_bp550lt"

#define Device_Type @"KN550LT"

#define kMEASUREMENT_BODY_MOVEMENT_BP @"body_movement"
#define kMEASUREMENT_CUFF_LOOSE_BP @"cuff_loose"

@implementation BP550LTModule

RCT_EXPORT_MODULE()

- (NSArray<NSString *> *)supportedEvents {
    return @[EVENT_NOTIFY];
}

- (NSDictionary *)constantsToExport
{
    return @{
        @"Event_Notify":EVENT_NOTIFY,
    };
}

+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

// The SDK arms its 3 s command timeouts with NSTimer on the calling thread. RN's default module queue is a GCD
// queue without a run loop, so those timers never fire and a device that does not answer leaves JS waiting forever.
- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

#pragma mark - Init

-(id)init
{
    if (self=[super initWithDisabledObservation])
    {
        [KN550LTController shareIHKN550LTController];
    }
    return self;
}

-(KN550LT*)getDeviceWithMac:(NSString*)mac{
    return [[KN550LTController shareIHKN550LTController] getInstanceWithMac:mac];
}

-(void)sendError:(NSInteger)errorCode mac:(NSString*)mac{
    [BPProfileModule sendErrorToEmitter:self eventNotify:EVENT_NOTIFY WithCode:errorCode mac:mac type:Device_Type];
}

-(void)sendAction:(NSString*)action mac:(NSString*)mac values:(NSDictionary*)values{
    NSMutableDictionary *response = [NSMutableDictionary dictionaryWithDictionary:values ?: @{}];
    response[kACTION] = action;
    response[kType] = Device_Type;
    response[kMAC] = mac;
    [BPProfileModule sendEventToEmitter:self eventNotify:EVENT_NOTIFY WithDict:response];
}

#pragma mark - Data conversion

// The SDK returns NSDate and 0/1 NSNumbers; RN events need JSON-safe values.
-(NSDictionary*)functionInfoFromDict:(NSDictionary*)dic{
    NSArray *flagKeys = @[
        kFUNCTION_IS_UPAIR_MEASURE,
        kFUNCTION_IS_ARM_MEASURE,
        kFUNCTION_HAVE_ANGLE_SENSOR,
        kFUNCTION_HAVE_OFFLINE,
        kFUNCTION_HAVE_HSD,
        kFUNCTION_HAVE_ANGLE_SETTING,
        kFUNCTION_IS_MULTI_UPLOAD,
        kFUNCTION_HAVE_SELF_UPDATE,
        @"haveRepeatedlyMeasure",
        @"haveShowUnitSetting",
        @"haveBackLightSetting",
        @"haveClockShowSetting",
    ];
    NSArray *numberKeys = @[@"memoryGroup", @"maxMemoryCapacity", @"showUnit"];

    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    for (NSString *key in flagKeys) {
        id value = dic[key];
        if ([value isKindOfClass:[NSNumber class]]) {
            result[key] = @([value boolValue]);
        }
    }
    for (NSString *key in numberKeys) {
        id value = dic[key];
        if ([value isKindOfClass:[NSNumber class]]) {
            result[key] = value;
        }
    }
    // KN-550LT on iOS reports the unit setting as hasUnitSetting / unitKPa; use the Android key names.
    if ([dic[kFunctionBPSupportUnitSetting] isKindOfClass:[NSNumber class]]) {
        result[@"haveShowUnitSetting"] = @([dic[kFunctionBPSupportUnitSetting] boolValue]);
    }
    if ([dic[kFunctionBPCurrentUnitIsKPa] isKindOfClass:[NSNumber class]]) {
        result[@"showUnit"] = @([dic[kFunctionBPCurrentUnitIsKPa] boolValue] ? 1 : 0);
    }
    return result;
}

-(NSArray*)historyArrayFromSDKArray:(NSArray*)array{
    NSDateFormatter *formatter = [[NSDateFormatter alloc] init];
    [formatter setLocale:[NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"]];
    [formatter setDateFormat:@"yyyy-MM-dd HH:mm:ss"];

    NSMutableArray *result = [NSMutableArray array];
    for (NSDictionary *history in array) {
        NSMutableDictionary *item = [NSMutableDictionary dictionary];
        id date = history[@"time"];
        if ([date isKindOfClass:[NSDate class]]) {
            item[kMEASUREMENT_TIME_BP] = [formatter stringFromDate:date];
        }
        item[kHIGH_BLOOD_PRESSURE_BP] = history[@"sys"] ?: @0;
        item[kLOW_BLOOD_PRESSURE_BP] = history[@"dia"] ?: @0;
        item[kPULSE_BP] = history[@"heartRate"] ?: @0;
        item[kMEASUREMENT_AHR_BP] = @([history[@"irregular"] boolValue]);
        item[kMEASUREMENT_BODY_MOVEMENT_BP] = @([history[@"bodyMovement"] boolValue]);
        item[kMEASUREMENT_CUFF_LOOSE_BP] = @([history[@"cuffLoose"] boolValue]);
        if (history[@"isRightTime"] != nil) {
            item[kTIME_CALIBRATION_BP] = history[@"isRightTime"];
        }
        if (history[@"dataID"] != nil) {
            item[kDATAID] = history[@"dataID"];
        }
        [result addObject:item];
    }
    return result;
}

#pragma mark - Connected devices

RCT_EXPORT_METHOD(getAllConnectedDevices){
    NSMutableArray *deviceMacArray = [NSMutableArray array];
    for (KN550LT *device in [[KN550LTController shareIHKN550LTController] getAllCurrentKN550LTInstace]) {
        if (device.serialNumber) {
            [deviceMacArray addObject:device.serialNumber];
        }
    }
    NSDictionary* deviceInfo = @{kACTION:@"action_get_all_connected_devices",@"devices":deviceMacArray};
    [self sendEventWithName:EVENT_NOTIFY body:deviceInfo];
}

#pragma mark - Method

RCT_EXPORT_METHOD(getFirmVersion:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    [self sendAction:kACTION_GET_FIRMWARE_VERSION mac:mac values:@{
        kFIRMWARE_VERSION: device.firmwareVersion ?: @"",
        kHARDWARE_VERSION: device.hardwareVersion ?: @"",
    }];
}

RCT_EXPORT_METHOD(getBattery:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    [device commandEnergy:^(NSNumber *energyValue) {
        [weakSelf sendAction:kACTION_BATTERY_BP mac:mac values:@{kBATTERY_BP: energyValue ?: @0}];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

RCT_EXPORT_METHOD(getFunctionInfo:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    [device commandFunction:^(NSDictionary *functionDict) {
        __strong __typeof__(weakSelf) strongSelf = weakSelf;
        [strongSelf sendAction:kACTION_FUNCTION_INFORMATION_BP mac:mac values:[strongSelf functionInfoFromDict:functionDict]];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

RCT_EXPORT_METHOD(getOffLineNum:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    [device commandTransferMemoryCount:^(NSNumber *count) {
        [weakSelf sendAction:kACTION_HISTORICAL_NUM_BP mac:mac values:@{kHISTORICAL_NUM_BP: count ?: @0}];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

// The SDK requires the memory count to be read before the memory data.
RCT_EXPORT_METHOD(getOffLineData:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    __weak KN550LT *weakDevice = device;
    [device commandTransferMemoryCount:^(NSNumber *count) {
        if ([count integerValue] == 0) {
            [weakSelf sendAction:kACTION_HISTORICAL_DATA_BP mac:mac values:@{kHISTORICAL_DATA_BP: @[]}];
            return;
        }
        [weakDevice commandTransferMemoryData:^(NSArray *array) {
            __strong __typeof__(weakSelf) strongSelf = weakSelf;
            [strongSelf sendAction:kACTION_HISTORICAL_DATA_BP mac:mac values:@{kHISTORICAL_DATA_BP: [strongSelf historyArrayFromSDKArray:array]}];
        } errorBlock:^(BPDeviceError error) {
            [weakSelf sendError:error mac:mac];
        }];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

RCT_EXPORT_METHOD(getTime:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    [device commandGetDeviceDate:^(NSString *date) {
        [weakSelf sendAction:kACTION_GETTIME_BP mac:mac values:@{kMEASUREMENT_DATE_BP: date ?: @""}];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

// Deletes the device memory; call after the offline data has been saved.
RCT_EXPORT_METHOD(transferFinished:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    __weak __typeof__(self) weakSelf = self;
    [device commandDeleteMemoryDataResult:^{
        [weakSelf sendAction:kACTION_GETHISTORY_OVER_BP mac:mac values:nil];
    } errorBlock:^(BPDeviceError error) {
        [weakSelf sendError:error mac:mac];
    }];
}

RCT_EXPORT_METHOD(disconnect:(nonnull NSString *)mac){
    KN550LT *device = [self getDeviceWithMac:mac];
    if (device == nil) {
        [self sendError:BPDidDisconnect mac:mac];
        return;
    }
    [device commandDisconnectDevice];
}

@end
