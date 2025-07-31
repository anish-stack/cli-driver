package com.olyoxpvt.OlyoxDriverApp

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast
import okhttp3.*
import java.io.IOException

class RideActionReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val rideId = intent.getStringExtra("rideId") ?: return
        val action = intent.action

        val client = OkHttpClient()
        val url = when (action) {
            "ACTION_ACCEPT" -> "https://www.appv2.olyox.com/api/v1/new/accept-ride/$rideId"
            "ACTION_REJECT" -> "https://www.appv2.olyox.com/api/v1/new/reject-ride/$rideId"
            else -> return
        }

        val request = Request.Builder().url(url).post(RequestBody.create(null, "")).build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                Toast.makeText(context, "Failed", Toast.LENGTH_SHORT).show()
            }

            override fun onResponse(call: Call, response: Response) {
                Toast.makeText(context, "Action completed", Toast.LENGTH_SHORT).show()
                if (action == "ACTION_ACCEPT") {
                    val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                    launchIntent?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                }
            }
        })
    }
}
