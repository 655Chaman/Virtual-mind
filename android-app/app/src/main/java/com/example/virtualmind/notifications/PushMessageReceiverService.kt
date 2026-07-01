package com.example.virtualmind.notifications

import android.util.Log
import androidx.work.Data
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class PushMessageReceiverService : FirebaseMessagingService() {

    @Inject
    lateinit var notificationDispatcher: NotificationDispatcher

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        
        Log.d(TAG, "From: ${remoteMessage.from}")

        if (remoteMessage.data.isNotEmpty()) {
            Log.d(TAG, "Message data payload: ${remoteMessage.data}")
            scheduleNotificationWork(remoteMessage.data)
        }

        remoteMessage.notification?.let {
            Log.d(TAG, "Message Notification Body: ${it.body}")
            notificationDispatcher.showNotification(
                id = System.currentTimeMillis().toInt(),
                title = it.title ?: "Notification",
                message = it.body ?: ""
            )
        }
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        Log.d(TAG, "Refreshed token: $token")
    }

    private fun scheduleNotificationWork(data: Map<String, String>) {
        val workData = Data.Builder()
            .putString(NotificationWorker.KEY_TITLE, data["title"])
            .putString(NotificationWorker.KEY_MESSAGE, data["message"])
            .putString(NotificationWorker.KEY_CHANNEL_ID, data["channelId"])
            .putString(NotificationWorker.KEY_PAYLOAD_DATA, data["custom_payload"])
            .build()

        val notificationWorkRequest = OneTimeWorkRequestBuilder<NotificationWorker>()
            .setInputData(workData)
            .build()

        WorkManager.getInstance(this).enqueue(notificationWorkRequest)
    }

    companion object {
        private const val TAG = "PushMsgReceiver"
    }
}
