package com.example.virtualmind.data.worker

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.example.virtualmind.data.local.AppDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class SyncWorker(
    context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val dao = AppDatabase.getDatabase(applicationContext).dailyLogDao()
            val unsyncedLogs = dao.getUnsyncedLogs()

            if (unsyncedLogs.isEmpty()) {
                return@withContext Result.success()
            }

            // In production, base URL comes from build config or constants
            val apiUrl = "http://10.0.2.2:8000/api/logs/log"

            for (log in unsyncedLogs) {
                // Construct JSON payload matching the backend DailyLog model
                val payload = JSONObject().apply {
                    put("date", log.date)
                    put("timestamp", log.timestamp)
                    put("text", log.text)
                    // Simplified parsing for illustration
                    // In real app, we use Gson or kotlinx.serialization
                    // to properly reconstruct the lists and objects
                }

                val url = URL(apiUrl)
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "POST"
                connection.setRequestProperty("Content-Type", "application/json; utf-8")
                connection.setRequestProperty("Accept", "application/json")
                connection.doOutput = true

                OutputStreamWriter(connection.outputStream).use { os ->
                    os.write(payload.toString())
                    os.flush()
                }

                val responseCode = connection.responseCode
                if (responseCode in 200..299) {
                    dao.markAsSynced(log.date)
                }
            }
            Result.success()
        } catch (e: Exception) {
            e.printStackTrace()
            Result.retry()
        }
    }
}
