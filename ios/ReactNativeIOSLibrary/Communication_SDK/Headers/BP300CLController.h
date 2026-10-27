//
//  BP300CLController.h
//
//  Created by dai on 24-02-27.
//  Copyright (c) 2024年 my. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "BP300CL.h"
#import "BP300CLController.h"
@class BP300CL;


@interface BP300CLController : NSObject
/**
 * Initialize BP300CL controller class
 */
+(BP300CLController *_Nullable)shareIHBP300CLController;

/**
 * Get all BP300CL instance,use hsInstance to call BP related communication methods.
 */
-(NSArray *_Nullable)getAllCurrentBP300CLInstace;

/// Get BP300CL Instance
/// @param mac mac or serial number
/// Suggestion: Use weak when defining the object of BP300CL. Using strong may cause the object to not be cleaned up when disconnected.
- (nullable BP300CL *)getInstanceWithMac:(NSString*_Nullable)mac;

@end
