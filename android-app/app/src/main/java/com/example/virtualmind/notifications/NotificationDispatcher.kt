package com.example.virtualmind.notifications

import android.Manifest
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationDispatcher @Inject constructor(
    @ApplicationContext private val context: Context,
    private val channelManager: NotificationChannelManager
) {

    fun showNotification(
        id: Int,
        title: String,
        message: String,
        channelId: String = NotificationChannelManager.CHANNEL_MESSAGES_ID,
        intentUri: String? = null
    ) {
        channelManager.setupChannels()

        val builder = NotificationCompat.Builder(context, channelId)
            // .setSmallIcon(R.mipmap.ic_launcher) // Using default launcher icon for now
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(getPriorityForChannel(channelId))
            .setAutoCancel(true)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))

        intentUri?.let { uriString ->
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uriString)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.setContentIntent(pendingIntent)
        }

        with(NotificationManagerCompat.from(context)) {
            if (ActivityCompat.checkSelfPermission(
                    context,
                    Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED
            ) {
                return
            }
            // Use 1 if R.mipmap.ic_launcher fails
            notify(id, builder.build())
        }
    }

    private fun getPriorityForChannel(channelId: String): Int {
        return when (channelId) {
            NotificationChannelManager.CHANNEL_ALERTS_ID -> NotificationCompat.PRIORITY_HIGH
            NotificationChannelManager.CHANNEL_PROMOTIONS_ID -> NotificationCompat.PRIORITY_LOW
            else -> NotificationCompat.PRIORITY_DEFAULT
        }
    }
}
