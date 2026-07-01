package com.example.virtualmind.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.annotation.RequiresApi
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationChannelManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val notificationManager: NotificationManager by lazy {
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    }

    fun setupChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            createChannels()
        }
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createChannels() {
        val channels = listOf(
            createChannel(
                id = CHANNEL_ALERTS_ID,
                name = "Critical Alerts",
                description = "Important system alerts and errors",
                importance = NotificationManager.IMPORTANCE_HIGH
            ),
            createChannel(
                id = CHANNEL_MESSAGES_ID,
                name = "Messages",
                description = "Direct messages from users",
                importance = NotificationManager.IMPORTANCE_DEFAULT
            ),
            createChannel(
                id = CHANNEL_PROMOTIONS_ID,
                name = "Promotions",
                description = "Offers and marketing updates",
                importance = NotificationManager.IMPORTANCE_LOW
            )
        )
        notificationManager.createNotificationChannels(channels)
    }

    @RequiresApi(Build.VERSION_CODES.O)
    private fun createChannel(
        id: String,
        name: String,
        description: String,
        importance: Int
    ): NotificationChannel {
        return NotificationChannel(id, name, importance).apply {
            this.description = description
            if (importance >= NotificationManager.IMPORTANCE_DEFAULT) {
                enableVibration(true)
            }
        }
    }

    companion object {
        const val CHANNEL_ALERTS_ID = "channel_alerts"
        const val CHANNEL_MESSAGES_ID = "channel_messages"
        const val CHANNEL_PROMOTIONS_ID = "channel_promotions"
    }
}
