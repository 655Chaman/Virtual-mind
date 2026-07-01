package com.example.virtualmind.notifications

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltWorker
class NotificationWorker @AssistedInject constructor(
    @Assisted private val appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val notificationDispatcher: NotificationDispatcher,
    private val notificationRepository: NotificationRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        return@withContext try {
            val title = inputData.getString(KEY_TITLE) ?: "Default Title"
            val message = inputData.getString(KEY_MESSAGE) ?: "Default Message"
            val channelId = inputData.getString(KEY_CHANNEL_ID) ?: NotificationChannelManager.CHANNEL_MESSAGES_ID
            val payloadData = inputData.getString(KEY_PAYLOAD_DATA)

            if (payloadData != null) {
                notificationRepository.insertNotification(
                    NotificationEntity(title = title, message = message, data = payloadData)
                )
            }

            notificationDispatcher.showNotification(
                id = System.currentTimeMillis().toInt(),
                title = title,
                message = message,
                channelId = channelId
            )

            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }

    companion object {
        const val KEY_TITLE = "key_title"
        const val KEY_MESSAGE = "key_message"
        const val KEY_CHANNEL_ID = "key_channel_id"
        const val KEY_PAYLOAD_DATA = "key_payload_data"
    }
}
