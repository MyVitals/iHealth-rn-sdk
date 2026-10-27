//
//  KD723SEController.h
//
//  Created by dai on 24-02-27.
//  Copyright (c) 2024年 my. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "KD723SE.h"
#import "KD723SEController.h"
@class KD723SE;


@interface KD723SEController : NSObject
/**
 * Initialize KD723 controller class
 */
+(KD723SEController *_Nullable)shareIHKD723SEController;

/**
 * Get all KD723 instance,use hsInstance to call BP related communication methods.
 */
-(NSArray *_Nullable)getAllCurrentKD723SEInstace;

/// Get KD723 Instance
/// @param mac mac or serial number
/// Suggestion: Use weak when defining the object of KD723. Using strong may cause the object to not be cleaned up when disconnected.
- (nullable KD723SE *)getInstanceWithMac:(NSString*_Nullable)mac;

@end
