package com.olyoxpvt.OlyoxDriverApp

import android.app.Service
import android.content.Intent
import android.os.IBinder
import kotlinx.coroutines.*
import okhttp3.*
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class RidePollingService : Service() {
    private val coroutineScope = CoroutineScope(Dispatchers.IO + Job())
    private var isRunning = true
    private lateinit var riderId: String

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        riderId = intent?.getStringExtra("riderId") ?: return START_NOT_STICKY
        RideNotificationUtils.showForegroundNotification(this)
        startPolling()
        return START_STICKY
    }

    private fun startPolling() {
        coroutineScope.launch {
            while (isRunning) {
                checkNewRides()
                delay(10_00)
            }
        }
    }

    private fun checkNewRides() {
        val url = "https://www.appv2.olyox.com/api/v1/new/pooling-rides-for-rider/$riderId"
        val client = OkHttpClient()
        val request = Request.Builder().url(url).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: java.io.IOException) {
                e.printStackTrace()
            }

            override fun onResponse(call: Call, response: Response) {
                response.body?.string()?.let { body ->
                    val data = JSONObject(body).optJSONArray("data")
                    if (data != null && data.length() > 0) {
                        val ride = data.getJSONObject(0)
                        RideNotificationUtils.showRideNotification(this@RidePollingService, ride)
                    }
                }
            }
        })
    }

    override fun onDestroy() {
        isRunning = false
        coroutineScope.cancel()
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
