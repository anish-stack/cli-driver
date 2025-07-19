package com.olyoxpvt.OlyoxDriverApp

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.olyoxpvt.OlyoxDriverApp.FloatingWidgetPackage
import com.olyoxpvt.OlyoxDriverApp.LocationPackage
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
import com.mustansirzia.fused.FusedLocationPackage;

class MainApplication : Application(), ReactApplication {

  override val reactNativeHost: ReactNativeHost =
    object : DefaultReactNativeHost(this) {
      override fun getPackages(): List<ReactPackage> {
        val packages = PackageList(this).packages.toMutableList()
        
        // ✅ Add your custom package correctly (NO `new`)
        packages.add(FloatingWidgetPackage())
        packages.add(ReactNativeFirebaseMessagingPackage())
        packages.add(FusedLocationPackage())
        packages.add(LocationPackage())

        return packages
      }

      override fun getJSMainModuleName(): String = "index"
      override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG
      override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
      override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
    }

  override val reactHost: ReactHost
    get() = getDefaultReactHost(applicationContext, reactNativeHost)

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
