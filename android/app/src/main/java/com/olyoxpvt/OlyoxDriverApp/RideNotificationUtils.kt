package com.olyoxpvt.OlyoxDriverApp

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import androidx.core.app.NotificationCompat
import org.json.JSONObject
import android.net.Uri
import android.media.AudioAttributes


object RideNotificationUtils {
    private const val CHANNEL_ID = "ride_channel"

    fun showForegroundNotification(context: Context) {
        createChannel(context)
        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setContentTitle("Searching for rides")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()

        (context as Service).startForeground(1, notification)
    }

    fun showRideNotification(context: Context, ride: JSONObject) {
        createChannel(context)
        val acceptIntent = Intent(context, RideActionReceiver::class.java).apply {
            action = "ACTION_ACCEPT"
            putExtra("rideId", ride.optString("_id"))
        }

        val rejectIntent = Intent(context, RideActionReceiver::class.java).apply {
            action = "ACTION_REJECT"
            putExtra("rideId", ride.optString("_id"))
        }

        val acceptPendingIntent = PendingIntent.getBroadcast(context, 0, acceptIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val rejectPendingIntent = PendingIntent.getBroadcast(context, 1, rejectIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)

        val sound = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
            val soundUri = Uri.parse("android.resource://${context.packageName}/raw/sound")

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("New Ride Available")
            .setContentText(ride.optJSONObject("pickup_address")?.optString("formatted_address"))
            .setSound(soundUri)
            .addAction(0, "Accept", acceptPendingIntent)
            .addAction(0, "Reject", rejectPendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(2, notification)
    }

    private fun createChannel(context: Context) {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            val channel = NotificationChannel(CHANNEL_ID, "Ride Notifications", NotificationManager.IMPORTANCE_HIGH)
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(channel)
        }
    }
}
