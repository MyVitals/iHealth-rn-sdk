package com.ihealth.ihealthlibrary;

import android.util.Log;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

/**
 * Created by Jeepend on 21/11/2016.
 * Base class for iHealth Modules, provide sendEvent method for you.
 * Updated for React Native 0.81+ compatibility.
 */
@ReactModule(name = "iHealthBaseModule")
public abstract class iHealthBaseModule extends ReactContextBaseJavaModule {

    private final String TAG;
    public static final String ACTION_GET_ALL_CONNECTED_DEVICES = "action_get_all_connected_devices";
    private static ReactApplicationContext sReactContext;

    public iHealthBaseModule(String tag, ReactApplicationContext reactContext) {
        super(reactContext);
        iHealthBaseModule.sReactContext = reactContext;
        TAG = tag;
    }

    /**
     * Flag arguments declared as number in the TypeScript specs (and as NSNumber on iOS) may arrive as a JS
     * number or a JS boolean. Declaring them boolean in Java crashes the app when a number is passed
     * (ClassCastException: Double cannot be cast to Boolean), so take a Dynamic and accept both.
     */
    static boolean asBoolean(Dynamic value) {
        if (value == null || value.isNull()) {
            return false;
        }
        if (value.getType() == ReadableType.Boolean) {
            return value.asBoolean();
        }
        if (value.getType() == ReadableType.Number) {
            return value.asDouble() != 0;
        }
        return false;
    }

    void sendEvent(String eventName, WritableMap data) {
        ReactContext reactContext = getReactApplicationContext();
        if (reactContext != null) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
        } else {
            Log.e(TAG, "ReactContext is null, can't send event: " + eventName);
        }
    }

    public abstract void handleNotify(String mac, String deviceType, String action, String message);
}
