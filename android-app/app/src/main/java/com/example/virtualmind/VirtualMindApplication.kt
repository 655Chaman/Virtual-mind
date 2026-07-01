package com.example.virtualmind

import android.app.Application
import android.util.Log
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.example.virtualmind.notifications.WeeklySummaryWorker
import dagger.hilt.android.HiltAndroidApp
import java.time.DayOfWeek
import java.time.LocalDateTime
import java.time.temporal.TemporalAdjusters
import java.util.concurrent.TimeUnit
import javax.inject.Inject

@HiltAndroidApp
class VirtualMindApplication : Application(), Configuration.Provider {

    @Inject
    lateinit var workerFactory: HiltWorkerFactory

    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .build()

    override fun onCreate() {
        super.onCreate()
        scheduleWeeklySummary()
    }

    private fun scheduleWeeklySummary() {
        // Calculate delay until next Sunday at midnight (00:00)
        val now = LocalDateTime.now()
        var nextSunday = now
            .with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY))
            .withHour(0)
            .withMinute(0)
            .withSecond(0)
            .withNano(0)

        // If it's already past Sunday midnight, push to the next Sunday
        if (!nextSunday.isAfter(now)) {
            nextSunday = nextSunday.plusWeeks(1)
        }

        val initialDelaySeconds = java.time.Duration.between(now, nextSunday).seconds
        Log.d("VirtualMindApp", "Weekly summary scheduled in ${initialDelaySeconds / 3600}h")

        val weeklyRequest = PeriodicWorkRequestBuilder<WeeklySummaryWorker>(
            repeatInterval = 7,
            repeatIntervalTimeUnit = TimeUnit.DAYS
        )
            .setInitialDelay(initialDelaySeconds, TimeUnit.SECONDS)
            .build()

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "weekly_summary_worker",
            ExistingPeriodicWorkPolicy.KEEP, // Don't reschedule if already queued
            weeklyRequest
        )
    }
}
