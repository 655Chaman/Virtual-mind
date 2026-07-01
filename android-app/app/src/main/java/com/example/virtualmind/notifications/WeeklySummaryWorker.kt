package com.example.virtualmind.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import android.Manifest
import android.content.pm.PackageManager
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.virtualmind.core.network.DeenApi
import com.virtualmind.core.network.FitnessApi
import com.virtualmind.core.network.GraphDataResponse
import com.virtualmind.core.network.PrayerHistoryResponse
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.delay
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters

@HiltWorker
class WeeklySummaryWorker @AssistedInject constructor(
    @Assisted private val appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val fitnessApi: FitnessApi,
    private val deenApi: DeenApi
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        val today = LocalDate.now()
        val weekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
        val weekEnd = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
        val displayFmt = DateTimeFormatter.ofPattern("MMM d")
        val weekStartStr = weekStart.format(displayFmt)
        val weekEndStr = weekEnd.format(displayFmt)

        Log.d(TAG, "WeeklySummaryWorker starting for $weekStartStr - $weekEndStr")

        // --- DEEN: 3 attempts with exponential backoff ---
        val prayerHistory = retryWithBackoff(
            tag = "DeenApi.getPrayerHistory",
            maxAttempts = MAX_ATTEMPTS
        ) {
            deenApi.getPrayerHistory(days = 7)
        }

        // --- FITNESS: 3 attempts with exponential backoff ---
        val graphData = retryWithBackoff(
            tag = "FitnessApi.getGraphData",
            maxAttempts = MAX_ATTEMPTS
        ) {
            fitnessApi.getGraphData(days = 7)
        }

        // Fire Deen notification — real data OR guaranteed fallback
        showDeenSummary(prayerHistory, weekStartStr, weekEndStr)

        // Fire Fitness notification — real data OR guaranteed fallback
        showFitnessSummary(graphData, weekStartStr, weekEndStr)

        // If BOTH network calls failed completely, tell WorkManager to retry the whole job
        return if (prayerHistory == null && graphData == null) {
            Log.w(TAG, "All network calls failed after $MAX_ATTEMPTS attempts. WorkManager will retry.")
            Result.retry()
        } else {
            Log.d(TAG, "WeeklySummaryWorker completed successfully.")
            Result.success()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORE RETRY UTILITY
    // Tries block() up to maxAttempts times with exponential backoff.
    // Attempt 1 → immediate
    // Attempt 2 → wait 1s
    // Attempt 3 → wait 2s
    // Returns null if all attempts fail (never throws).
    // ─────────────────────────────────────────────────────────────────────────
    private suspend fun <T> retryWithBackoff(
        tag: String,
        maxAttempts: Int = MAX_ATTEMPTS,
        block: suspend () -> T
    ): T? {
        var lastError: Exception? = null
        for (attempt in 1..maxAttempts) {
            try {
                val result = block()
                Log.d(TAG, "[$tag] ✅ Success on attempt $attempt/$maxAttempts")
                return result
            } catch (e: Exception) {
                lastError = e
                val delayMs = if (attempt < maxAttempts) {
                    BACKOFF_BASE_MS * (1L shl (attempt - 1)) // 1s, 2s
                } else 0L
                Log.w(
                    TAG,
                    "[$tag] ❌ Attempt $attempt/$maxAttempts failed: ${e.message}. " +
                            if (delayMs > 0) "Retrying in ${delayMs}ms..." else "No more retries."
                )
                if (delayMs > 0) delay(delayMs)
            }
        }
        Log.e(TAG, "[$tag] 🚫 ALL $maxAttempts attempts failed. Last: ${lastError?.message}")
        return null
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DEEN SUMMARY — always sends a notification (real or fallback)
    // ─────────────────────────────────────────────────────────────────────────
    private fun showDeenSummary(
        history: List<PrayerHistoryResponse>?,
        weekStart: String,
        weekEnd: String
    ) {
        val title = "📿 Your Deen Report  ($weekStart – $weekEnd)"

        val body = if (!history.isNullOrEmpty()) {
            var prayed = 0
            var total = 0
            history.forEach { day ->
                if (day.fajr) prayed++
                if (day.dhuhr) prayed++
                if (day.asr) prayed++
                if (day.maghrib) prayed++
                if (day.isha) prayed++
                total += 5
            }
            val percentage = if (total > 0) (prayed * 100) / total else 0
            val (emoji, msg) = when {
                percentage >= 90 -> "🌟" to "MashaAllah! An incredible week of devotion."
                percentage >= 70 -> "✅" to "Alhamdulillah! You stayed consistent."
                percentage >= 50 -> "📈" to "Good effort — keep building the habit!"
                else             -> "💪" to "Every prayer is a step closer. Keep going."
            }
            "You prayed $prayed of $total prayers ($percentage%) $emoji\n$msg"
        } else {
            // GUARANTEED FALLBACK — network failed 3 times, still send something meaningful
            Log.w(TAG, "Deen data unavailable after $MAX_ATTEMPTS retries. Sending fallback.")
            "Open the app to review your weekly prayer summary. Keep up your Salah — consistency is everything. 🤲"
        }

        sendNotification(
            notifId = NOTIF_ID_DEEN,
            title = title,
            body = body,
            channelId = CHANNEL_WEEKLY_DEEN,
            channelName = "Weekly Deen Summary",
            channelDesc = "Weekly prayer & spiritual habit reports",
            route = "native_deen"
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FITNESS SUMMARY — always sends a notification (real or fallback)
    // ─────────────────────────────────────────────────────────────────────────
    private fun showFitnessSummary(
        graphData: GraphDataResponse?,
        weekStart: String,
        weekEnd: String
    ) {
        val title = "💪 Your Fitness Report  ($weekStart – $weekEnd)"

        val body = if (graphData != null) {
            val workoutsCount = graphData.workouts.size
            val totalDuration = graphData.workouts.sumOf { it.durationMinutes }
            val avgDuration = if (workoutsCount > 0) totalDuration / workoutsCount else 0
            val totalVolume = graphData.volumes.takeLast(7).sum()
            val (emoji, msg) = when {
                workoutsCount >= 5 -> "🔥" to "Incredible week — you're unstoppable!"
                workoutsCount >= 3 -> "💪" to "Solid consistency. Keep pushing!"
                workoutsCount >= 1 -> "📈" to "Good start. Let's level up next week."
                else               -> "😴" to "Rest is part of the plan — come back stronger!"
            }
            "$workoutsCount workout${if (workoutsCount != 1) "s" else ""} $emoji | " +
                    "${totalDuration}min total | Avg ${avgDuration}min/session | Vol: $totalVolume\n$msg"
        } else {
            // GUARANTEED FALLBACK
            Log.w(TAG, "Fitness data unavailable after $MAX_ATTEMPTS retries. Sending fallback.")
            "Open the app to check your fitness graph. Every rep counts — tap to see your weekly progress. 🏋️"
        }

        sendNotification(
            notifId = NOTIF_ID_FITNESS,
            title = title,
            body = body,
            channelId = CHANNEL_WEEKLY_FITNESS,
            channelName = "Weekly Fitness Summary",
            channelDesc = "Weekly workout reports and progress graphs",
            route = "native_fitness"
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATION SENDER — shared utility
    // ─────────────────────────────────────────────────────────────────────────
    private fun sendNotification(
        notifId: Int,
        title: String,
        body: String,
        channelId: String,
        channelName: String,
        channelDesc: String,
        route: String
    ) {
        val manager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (manager.getNotificationChannel(channelId) == null) {
                val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_DEFAULT).apply {
                    description = channelDesc
                    enableVibration(true)
                }
                manager.createNotificationChannel(channel)
            }
        }

        val launchIntent = appContext.packageManager
            .getLaunchIntentForPackage(appContext.packageName)
            ?.apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra(EXTRA_NAVIGATE_ROUTE, route)
            }

        val pendingIntent = launchIntent?.let {
            PendingIntent.getActivity(
                appContext, notifId, it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }

        val notification = NotificationCompat.Builder(appContext, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .apply { pendingIntent?.let { setContentIntent(it) } }
            .build()

        if (ActivityCompat.checkSelfPermission(appContext, Manifest.permission.POST_NOTIFICATIONS)
            == PackageManager.PERMISSION_GRANTED
        ) {
            NotificationManagerCompat.from(appContext).notify(notifId, notification)
            Log.d(TAG, "✅ Notification sent [id=$notifId]: $title")
        } else {
            Log.w(TAG, "⚠️ POST_NOTIFICATIONS permission not granted — notification suppressed.")
        }
    }

    companion object {
        private const val TAG = "WeeklySummaryWorker"
        private const val MAX_ATTEMPTS = 3                // Try 3 times before giving up
        private const val BACKOFF_BASE_MS = 1_000L        // 1s base → delays: 1s, 2s

        const val NOTIF_ID_DEEN = 7001
        const val NOTIF_ID_FITNESS = 7002
        const val CHANNEL_WEEKLY_DEEN = "channel_weekly_deen"
        const val CHANNEL_WEEKLY_FITNESS = "channel_weekly_fitness"
        const val EXTRA_NAVIGATE_ROUTE = "navigate_route"
    }
}
