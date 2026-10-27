package com.ihealth.ihealthlibrary;

import android.text.TextUtils;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.ihealth.communication.control.Bp550BTControl;
import com.ihealth.communication.control.BpProfile;
import com.ihealth.communication.manager.iHealthDevicesManager;
import com.ihealth.communication.manager.iHealthDevicesIDPS;

import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by zhangxu on 16/11/20.
 */
@ReactModule(name = BP550BTModule.MODULE_NAME)
public class BP550BTModule extends iHealthBaseModule {
    public static final String MODULE_NAME = "BP550BTModule";

    private static final String modelName = "BP550BTModule";
    private static final String TAG = "BP550BTModule";

    private static final String EVENT_NOTIFY = "event_notify_bp550bt";

    public BP550BTModule(ReactApplicationContext reactContext) {
        super(TAG, reactContext);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @Override
    public Map<String, Object> getConstants() {
        Map<String, Object> map = new HashMap<>();
        map.put("Event_Notify", EVENT_NOTIFY);
        return map;
    }

    @ReactMethod
    public void getFirmVersion(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);

        if (bp550BTControl != null) {

     try {
               
             String idps = bp550BTControl.getIdps();
            JSONObject jsonObj = new JSONObject(idps);
            String firmwareVersion = jsonObj.getString(iHealthDevicesIDPS.FIRMWAREVERSION);
            WritableMap params = Arguments.createMap();
            params.putString("action","action_get_firmwareVersion");
            params.putString("mac", mac);
            params.putString("type", "KN550");
            params.putString("firmwareVersion",firmwareVersion);
            
            sendEvent(EVENT_NOTIFY, params);

            } catch (JSONException e) {
                e.printStackTrace();
            }
           
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }
    @ReactMethod
    public void getBattery(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);

        if (bp550BTControl != null) {
            bp550BTControl.getBattery();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void getOffLineNum(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.getOfflineNum();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void getOffLineData(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        ;
        if (bp550BTControl != null) {
            bp550BTControl.getOfflineData();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void getFunctionInfo(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.getFunctionInfo();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void getDisplayConfig(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.getStatusOfDisplay();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void setDisplayConfig(String mac, Dynamic lightOn, Dynamic timeOn) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.setStatusOfDisplay(asBoolean(lightOn), asBoolean(timeOn));
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void getTime(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.getTime();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void transferFinished(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.transferFinished();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @ReactMethod
    public void disconnect(String mac) {
        Bp550BTControl bp550BTControl = iHealthDevicesManager.getInstance().getBp550BTControl(mac);
        if (bp550BTControl != null) {
            bp550BTControl.disconnect();
        } else {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
    }

    @Override
    public void handleNotify(String mac, String deviceType, String action, String message) {
        switch (action) {
            case BpProfile.ACTION_BATTERY_BP:

                break;
            case BpProfile.ACTION_ZOREING_BP:

                break;
            case BpProfile.ACTION_ZOREOVER_BP:

                break;
            case BpProfile.ACTION_ONLINE_PRESSURE_BP:

                break;
            case BpProfile.ACTION_ONLINE_PULSEWAVE_BP:

                break;
            case BpProfile.ACTION_ONLINE_RESULT_BP:

                break;
            default:
                break;
        }
        WritableMap params = Arguments.createMap();
        params.putString("action", action);
        params.putString("mac", mac);
        if (deviceType.equals("KN-550BT")) {
            params.putString("type", "KN550");
        } else {
            params.putString("type", deviceType);
        }
        if (!TextUtils.isEmpty(message)) {
            Utils.jsonToMap(message, params);
        }
        sendEvent(EVENT_NOTIFY, params);
    }

    @ReactMethod
    public void getAllConnectedDevices() {
        List<String> devices = iHealthDevicesManager.getInstance().getBp550BTDevices();
        WritableMap params = Arguments.createMap();
        if (devices.size() > 0) {
            WritableArray array = Arguments.createArray();
            for (String device : devices) {
                array.pushString(device);
            }
            params.putArray("devices", array);
            params.putString("action", ACTION_GET_ALL_CONNECTED_DEVICES);
        }
        sendEvent(EVENT_NOTIFY, params);
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(double count) {}
}
