package com.example.virtualmind

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import kotlin.random.Random

class AlarmReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "AlarmReceiver"
        private const val CHANNEL_PRAYER = "virtual_mind_prayer"

        private val AUTHENTIC_REMINDERS = listOf(
            "\"Indeed, prayer prohibits immorality and wrongdoing.\" (Quran 29:45)",
            "\"O you who have believed, seek help through patience and prayer. Indeed, Allah is with the patient.\" (Quran 2:153)",
            "\"And establish prayer... Indeed, good deeds do away with misdeeds.\" (Quran 11:114)",
            "\"So remember Me; I will remember you.\" (Quran 2:152)",
            "\"Indeed, I am Allah... worship Me and establish prayer for My remembrance.\" (Quran 20:14)",
            "\"Guard strictly your prayers and stand before Allah, devoutly obedient.\" (Quran 2:238)",
            "\"And seek help through patience and prayer, and indeed, it is difficult except for the humbly submissive.\" (Quran 2:45)",
            "\"The first of his deeds for which a servant will be called to account on the Day of Resurrection will be his prayers. If it is found to be perfect, he will be safe and successful.\" (Sunan at-Tirmidhi, Sahih)",
            "\"Between a man and shirk (polytheism) and kufr (disbelief) is the abandonment of prayer.\" (Sahih Muslim)",
            "\"Whoever performs the Fajr prayer is under the protection of Allah.\" (Sahih Muslim)",
            "\"Perform prayer, for you will not prostrate to Allah with even one prostration except that He raises you in status and erases a sin.\" (Sahih Muslim)"
        )
    }

    override fun onReceive(context: Context, intent: Intent) {
        val prayerName = intent.getStringExtra("PRAYER_NAME") ?: "Prayer"
        val alarmType = intent.getStringExtra("ALARM_TYPE") ?: "EXACT"

        Log.d(TAG, "Alarm triggered for $prayerName - Type: $alarmType")

        val title = if (alarmType == "PRE_ADHAN") {
            "Reminder: 10 mins to $prayerName"
        } else {
            "Adhan: Time for $prayerName"
        }

        val reminderText = AUTHENTIC_REMINDERS[Random.nextInt(AUTHENTIC_REMINDERS.size)]
        val message = "It is time to turn to Allah.\n\n$reminderText"

        showNotification(context, title, message)
    }

    private fun showNotification(context: Context, title: String, message: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(CHANNEL_PRAYER) == null) {
                val prayerChannel = NotificationChannel(
                    CHANNEL_PRAYER,
                    "Salah Prayer Times",
                    NotificationManager.IMPORTANCE_HIGH
                ).apply {
                    description = "Adhan / prayer time alerts"
                    enableVibration(true)
                    vibrationPattern = longArrayOf(0, 300, 100, 300, 100, 300)
                }
                manager.createNotificationChannel(prayerChannel)
            }
        }

        val tapIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pendingIntent = if (tapIntent != null) {
            PendingIntent.getActivity(
                context,
                0,
                tapIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        } else null

        val notification = NotificationCompat.Builder(context, CHANNEL_PRAYER)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setVibrate(longArrayOf(0, 300, 100, 300, 100, 300))
            .apply { if (pendingIntent != null) setContentIntent(pendingIntent) }
            .build()

        manager.notify((System.currentTimeMillis() / 1000).toInt(), notification)
    }
}
