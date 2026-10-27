//
//  SDKFlowNewOTAController.h
//  iHealthDeviceSDK
//
//  通用 OTA 升级控制器（新加密通信协议）
//
//  适用于使用 AES-CTR 加密通信协议的所有设备（KD723SE 及后续设备）。
//  协议指令集（App 为上位机 C，设备为下位机 A）：
//    D0  查询设备 OTA 信息
//    D1  申请进行 OTA
//    D2  OTA 文件传输（A 主发，C 答复固件数据）
//    D3  查询 OTA 状态（C 主发）
//    D4  OTA 状态通知（A 主发）
//    D5  OTA 控制（取消等）
//    D6  OTA terminate command (host -> device)
//
//  使用方式：
//    1. 设备的 Internal 类持有 SDKFlowNewOTAController 属性（懒加载）
//    2. Internal 类在 detectCompleteCommand 中将 0xD0-0xD5 路由给该控制器
//    3. 调用 startOTAWithFirmwareData:... 启动升级
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

// ─────────────────────────────────────────────
#pragma mark - 枚举
// ─────────────────────────────────────────────

/// OTA 状态（D3 查询答复 / D4 设备主动通知）
typedef NS_ENUM(uint8_t, SDKFlowNewOTAStatus) {
    SDKFlowNewOTAStatus_NotStarted   = 0x00,  ///< OTA 未进行
    SDKFlowNewOTAStatus_Transferring = 0x01,  ///< OTA 文件传输中
    SDKFlowNewOTAStatus_Verifying    = 0x02,  ///< OTA 文件校验中
    SDKFlowNewOTAStatus_Complete     = 0x03,  ///< OTA 成功完成
};

/// 设备拒绝 OTA 的原因（D1 答复，result = 0x00 时携带）
typedef NS_ENUM(uint8_t, SDKFlowNewOTACannotStartReason) {
    SDKFlowNewOTACannotStartReason_NoReason   = 0x00, ///< 无原因
    SDKFlowNewOTACannotStartReason_LowBattery = 0x01, ///< 电量低
    SDKFlowNewOTACannotStartReason_Busy       = 0x02, ///< 产品繁忙
    SDKFlowNewOTACannotStartReason_Other      = 0xFF, ///< 未知原因
};

/// 错误码
typedef NS_ENUM(NSInteger, SDKFlowNewOTAError) {
    SDKFlowNewOTAError_Timeout            = 2001, ///< 指令超时
    SDKFlowNewOTAError_DeviceDisconnect   = 2002, ///< 设备断开连接
    SDKFlowNewOTAError_NoFirmwareData     = 2003, ///< 固件数据为空
    SDKFlowNewOTAError_AddressOutOfBounds = 2004, ///< 设备请求地址超出固件范围
    SDKFlowNewOTAError_DeviceCancelOTA    = 2005, ///< 设备主动取消 OTA
};

// ─────────────────────────────────────────────
#pragma mark - 固件文件信息（本地解析）
// ─────────────────────────────────────────────

/// 从本地 .bin 固件文件信息区解析出的内容，可在升级前展示给用户确认
@interface SDKFlowNewOTAFirmwareInfo : NSObject

/// 产品型号（ASCII，e.g. "KD-723"）
@property (copy, nonatomic, readonly) NSString *modelNumber;

/// 适用硬件版本范围字符串（e.g. "1.0~1.7.8"）
@property (copy, nonatomic, readonly) NSString *hardwareVersionRange;

/// 固件软件版本号（e.g. "1.0.7.8"）
@property (copy, nonatomic, readonly) NSString *softwareVersion;

/// 信息区自定义字段（原始 NSData，产品自定义用途）
@property (strong, nonatomic, readonly, nullable) NSData *customData;

/// 签名区起始偏移（即固件文件中签名的字节位置）
@property (assign, nonatomic, readonly) uint32_t signatureOffset;

/// 固件数据大小（字节）
@property (assign, nonatomic, readonly) NSUInteger firmwareSize;

@end

// ─────────────────────────────────────────────
#pragma mark - 设备信息对象（D0 答复）
// ─────────────────────────────────────────────

/// D0 答复中携带的设备 OTA 信息
@interface SDKFlowNewOTADeviceInfo : NSObject

/// 产品型号（ASCII 字符串）
@property (copy, nonatomic, readonly) NSString *modelNumber;

/// 硬件版本号（ASCII 字符串）
@property (copy, nonatomic, readonly) NSString *hardwareVersion;

/// 固件总版本号（ASCII 字符串）
@property (copy, nonatomic, readonly) NSString *firmwareVersion;

@end

// ─────────────────────────────────────────────
#pragma mark - Block 类型
// ─────────────────────────────────────────────

typedef void(^SDKFlowNewOTADeviceInfoBlock)(SDKFlowNewOTADeviceInfo *info);
typedef void(^SDKFlowNewOTACannotStartBlock)(SDKFlowNewOTACannotStartReason reason);
typedef void(^SDKFlowNewOTAProgressBlock)(NSInteger progress);          ///< 0-100
typedef void(^SDKFlowNewOTAStatusNotifyBlock)(SDKFlowNewOTAStatus status);
typedef void(^SDKFlowNewOTASuccessBlock)(void);
typedef void(^SDKFlowNewOTAErrorBlock)(SDKFlowNewOTAError errorCode);

// ─────────────────────────────────────────────
#pragma mark - 控制器
// ─────────────────────────────────────────────

@class SDKFlowDevice;

@interface SDKFlowNewOTAController : NSObject

/**
 初始化通用 OTA 控制器

 @param device      设备的 Internal 实例（SDKFlowDevice 子类），weak 持有
 @param productType 设备的产品类型字节，用于组包（如 0xA1）
 @param mac         设备 MAC 地址，用于 AES-CTR 密钥查找
 */
- (instancetype)initWithDevice:(SDKFlowDevice *)device
                   productType:(uint8_t)productType
                           mac:(NSString *)mac;

/**
 查询设备 OTA 信息（发送 D0）

 @param success  成功回调，携带 SDKFlowNewOTADeviceInfo
 @param error    失败回调
 */
- (void)queryDeviceInfoWithSuccess:(SDKFlowNewOTADeviceInfoBlock)success
                        errorBlock:(SDKFlowNewOTAErrorBlock)error;

/**
 启动 OTA 升级（D0 → D1 → 等待设备 D2 请求数据 → D4 完成通知）

 @param firmwareData     完整固件二进制数据（.bin 文件全部内容，含嵌入的签名区域）
 @param cannotUpgrade    设备拒绝升级时的回调（附带原因）
 @param progress         固件传输进度（0-100）
 @param statusNotify     设备主动上报 OTA 状态变化时的回调
 @param success          OTA 成功完成回调
 @param error            错误回调
 */
- (void)startOTAWithFirmwareData:(NSData *)firmwareData
              cannotUpgradeBlock:(SDKFlowNewOTACannotStartBlock)cannotUpgrade
                   progressBlock:(SDKFlowNewOTAProgressBlock)progress
               statusNotifyBlock:(SDKFlowNewOTAStatusNotifyBlock)statusNotify
                    successBlock:(SDKFlowNewOTASuccessBlock)success
                      errorBlock:(SDKFlowNewOTAErrorBlock)error;

// ─────────────────────────────────────────────
#pragma mark - 固件文件解析工具
// ─────────────────────────────────────────────

/**
 解析 OTA 固件文件的信息区，用于升级前展示给用户确认

 固件文件格式（自描述二进制）：
   [0x00] 4B  信息区起始地址（uint32，小端）
   [0x04] 4B  数据区起始地址（uint32，小端）
   [0x08] 4B  签名区起始地址（uint32，小端）
   信息区：产品型号 / 适用硬件版本范围 / 软件版本 / 自定义，各字段均为 4B长度前缀 + ASCII内容（含\0结束符）
   数据区：实际固件二进制
   签名区：64B Ed-25519 签名（覆盖除签名区外的全部内容）

 @param firmwareData  完整固件 NSData
 @return              解析成功返回 SDKFlowNewOTAFirmwareInfo，格式不符返回 nil
 */
+ (nullable SDKFlowNewOTAFirmwareInfo *)parseFirmwareInfo:(NSData *)firmwareData;

/**
 主动查询当前 OTA 状态（发送 D3）

 @param success  成功回调，携带当前 SDKFlowNewOTAStatus
 @param error    失败回调
 */
- (void)queryOTAStatusWithSuccess:(void(^)(SDKFlowNewOTAStatus status))success
                       errorBlock:(SDKFlowNewOTAErrorBlock)error;

/**
 主动取消 OTA（发送 D5，command=Cancel）
 */
- (void)cancelOTA;

/**
 Actively terminate OTA (send D6)
 This host-initiated command is sent to the device to terminate the upgrade immediately.
 */
- (void)terminateOTA;

/**
 由设备 Internal 类调用，将收到的 0xD0-0xD5 指令转发给本控制器处理

 @param data 经 SDKFlowNewDecoder 解密后的完整数据包
            格式：[0xA0][LEN_L][LEN_H][IDENTIFIER][commandID][params...][CRC32(4字节)]
 */
- (void)receiveOTACommand:(NSData *)data;

@end

NS_ASSUME_NONNULL_END
