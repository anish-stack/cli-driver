package com.olyoxpvt.OlyoxDriverApp

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.widget.Toast
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class FloatingWidgetModule(private val reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "FloatingWidget"
    }

    @ReactMethod
    fun startWidget() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
            Toast.makeText(
                reactContext,
                "Please grant 'Draw over apps' permission",
                Toast.LENGTH_LONG
            ).show()

            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + reactContext.packageName)
            )
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startActivity(intent)
        } else {
            val intent = Intent(reactContext, FloatingWidgetService::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            reactContext.startService(intent)
        }
    }

    @ReactMethod
    fun stopWidget() {
        val intent = Intent(reactContext, FloatingWidgetService::class.java)
        reactContext.stopService(intent)
    }
}
