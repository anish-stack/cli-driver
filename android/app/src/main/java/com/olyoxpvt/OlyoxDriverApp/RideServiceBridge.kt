package com.olyoxpvt.OlyoxDriverApp

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RideServiceBridge(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "RideServiceBridge"

    @ReactMethod
    fun startRideService(riderId: String) {
        val intent = Intent(reactApplicationContext, RidePollingService::class.java)
        intent.putExtra("riderId", riderId)
        reactApplicationContext.startService(intent)
    }

    @ReactMethod
    fun stopRideService() {
        val intent = Intent(reactApplicationContext, RidePollingService::class.java)
        reactApplicationContext.stopService(intent)
    }
}
