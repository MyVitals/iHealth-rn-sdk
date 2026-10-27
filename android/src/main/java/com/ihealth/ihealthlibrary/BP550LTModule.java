package com.ihealth.ihealthlibrary;

import android.text.TextUtils;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.ihealth.communication.control.Kn550LtControl;
import com.ihealth.communication.manager.iHealthDevicesManager;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * KN-550LT blood pressure monitor. Offline-only device: no online measurement,
 * results are read back from the device memory.
 *
 * The native SDK reports KN-550LT specific action names and keys; they are
 * converted here to the same payloads the iOS bridge (BP550LTModule.m) sends.
 */
@ReactModule(name = BP550LTModule.MODULE_NAME)
public class BP550LTModule extends iHealthBaseModule {
    public static final String MODULE_NAME = "BP550LTModule";

    private static final String TAG = "BP550LTModule";

    private static final String EVENT_NOTIFY = "event_notify_bp550lt";

    private static final String RN_TYPE = "KN550LT";

    // Actions reported by Kn550LtControl
    private static final String SDK_ACTION_IDPS = "action_idps_kn550";
    private static final String SDK_ACTION_MEMORY_COUNT = "action_get_memory_count";
    private static final String SDK_ACTION_MEMORY_DATA = "action_get_memory_data";
    private static final String SDK_ACTION_DELETE_MEMORY = "action_delete_memory_data";
    private static final String SDK_ACTION_GET_TIME = "action_get_time";
    private static final String SDK_ACTION_ERROR = "error_bp";
    private static final String SDK_ACTION_TIMEOUT = "action_communication_timeout";

    // Actions sent to JS, shared with the other BP modules
    private static final String ACTION_GET_FIRMWARE_VERSION = "action_get_firmwareVersion";
    private static final String ACTION_HISTORICAL_NUM_BP = "offlinenum";
    private static final String ACTION_HISTORICAL_DATA_BP = "historicaldata_bp";
    private static final String ACTION_HISTORICAL_OVER_BP = "get_historical_over_bp";
    private static final String ACTION_GETTIME_BP = "action_get_time";

    // getOffLineData reads the memory count first; macs waiting for the data step
    private final Set<String> pendingOfflineData = new HashSet<>();

    public BP550LTModule(ReactApplicationContext reactContext) {
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

    private Kn550LtControl getControl(String mac) {
        Kn550LtControl control = iHealthDevicesManager.getInstance().getKn550LtControl(mac);
        if (control == null) {
            WritableMap params = Arguments.createMap();
            params.putInt("errorid", 400);
            sendEvent("Error", params);
        }
        return control;
    }

    @ReactMethod
    public void getAllConnectedDevices() {
        List<String> devices = iHealthDevicesManager.getInstance().getKn550LtDevices();
        WritableMap params = Arguments.createMap();
        WritableArray array = Arguments.createArray();
        if (devices != null) {
            for (String device : devices) {
                array.pushString(device);
            }
        }
        params.putArray("devices", array);
        params.putString("action", ACTION_GET_ALL_CONNECTED_DEVICES);
        sendEvent(EVENT_NOTIFY, params);
    }

    @ReactMethod
    public void getFirmVersion(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.getIdps();
        }
    }

    @ReactMethod
    public void getBattery(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.getBattery();
        }
    }

    @ReactMethod
    public void getFunctionInfo(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.getFunctionInfo();
        }
    }

    @ReactMethod
    public void getOffLineNum(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.getMemoryCount();
        }
    }

    @ReactMethod
    public void getOffLineData(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            synchronized (pendingOfflineData) {
                pendingOfflineData.add(mac);
            }
            control.getMemoryCount();
        }
    }

    @ReactMethod
    public void getTime(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.getTime();
        }
    }

    /** Deletes the device memory; call after the offline data has been saved. */
    @ReactMethod
    public void transferFinished(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.deleteMemoryData();
        }
    }

    @ReactMethod
    public void disconnect(String mac) {
        Kn550LtControl control = getControl(mac);
        if (control != null) {
            control.disconnect();
        }
    }

    private boolean takePendingOfflineData(String mac) {
        synchronized (pendingOfflineData) {
            return pendingOfflineData.remove(mac);
        }
    }

    @Override
    public void handleNotify(String mac, String deviceType, String action, String message) {
        JSONObject in = new JSONObject();
        if (!TextUtils.isEmpty(message)) {
            try {
                in = new JSONObject(message);
            } catch (JSONException e) {
                Log.w(TAG, "handleNotify: invalid message for " + action, e);
            }
        }

        String outAction = action;
        JSONObject out = in;
        try {
            switch (action) {
                case SDK_ACTION_IDPS:
                    outAction = ACTION_GET_FIRMWARE_VERSION;
                    out = new JSONObject();
                    out.put("firmwareVersion", in.optString("firmwareversion"));
                    out.put("hardwareVersion", in.optString("hardwareversion"));
                    break;

                case SDK_ACTION_MEMORY_COUNT: {
                    int count = in.optInt("memoryCount", 0);
                    if (takePendingOfflineData(mac)) {
                        if (count > 0) {
                            Kn550LtControl control = iHealthDevicesManager.getInstance().getKn550LtControl(mac);
                            if (control != null) {
                                synchronized (pendingOfflineData) {
                                    pendingOfflineData.add(mac);
                                }
                                control.getMemoryData();
                                return;
                            }
                        }
                        outAction = ACTION_HISTORICAL_DATA_BP;
                        out = new JSONObject();
                        out.put("data", new JSONArray());
                    } else {
                        outAction = ACTION_HISTORICAL_NUM_BP;
                        out = new JSONObject();
                        out.put("offlinenum", count);
                    }
                    break;
                }

                case SDK_ACTION_MEMORY_DATA: {
                    takePendingOfflineData(mac);
                    outAction = ACTION_HISTORICAL_DATA_BP;
                    JSONArray data = new JSONArray();
                    JSONArray memoryData = in.optJSONArray("memoryData");
                    if (memoryData != null) {
                        for (int i = 0; i < memoryData.length(); i++) {
                            JSONObject item = memoryData.optJSONObject(i);
                            if (item == null) {
                                continue;
                            }
                            JSONObject record = new JSONObject();
                            record.put("time", item.optString("time"));
                            record.put("sys", item.optInt("sys"));
                            record.put("dia", item.optInt("dia"));
                            record.put("heartRate", item.optInt("heartRate"));
                            record.put("arrhythmia", item.optBoolean("isHaveIHB"));
                            record.put("body_movement", item.optBoolean("bodyMovement"));
                            record.put("cuff_loose", item.optBoolean("cuffLoose"));
                            record.put("time_calibration", item.optInt("timeFlag"));
                            record.put("dataID", item.optString("dataID"));
                            data.put(record);
                        }
                    }
                    out = new JSONObject();
                    out.put("data", data);
                    break;
                }

                case SDK_ACTION_DELETE_MEMORY:
                    outAction = ACTION_HISTORICAL_OVER_BP;
                    out = new JSONObject();
                    break;

                case SDK_ACTION_GET_TIME:
                    outAction = ACTION_GETTIME_BP;
                    out = new JSONObject();
                    out.put("date", in.optString("deviceTime"));
                    break;

                case SDK_ACTION_ERROR:
                case SDK_ACTION_TIMEOUT:
                    takePendingOfflineData(mac);
                    break;

                default:
                    break;
            }
        } catch (JSONException e) {
            Log.w(TAG, "handleNotify: failed to convert " + action, e);
        }

        WritableMap params = Arguments.createMap();
        Utils.jsonToMap(out.toString(), params);
        params.putString("action", outAction);
        params.putString("mac", mac);
        params.putString("type", RN_TYPE);
        sendEvent(EVENT_NOTIFY, params);
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(double count) {}
}
