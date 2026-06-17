package com.example.virtualmind

import android.annotation.SuppressLint
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONObject
import java.util.Calendar

object PrayerAlarmScheduler {
    private const val TAG = "PrayerAlarmScheduler"
    private const val PREFS_NAME = "VirtualMindPrefs"
    private const val KEY_PRAYER_JSON = "cached_prayer_times"

    fun saveAndScheduleAlarms(context: Context, jsonString: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_PRAYER_JSON, jsonString).apply()
        scheduleAlarms(context)
    }

    fun scheduleAlarms(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val jsonString = prefs.getString(KEY_PRAYER_JSON, null)
        if (jsonString.isNullOrEmpty()) {
            Log.d(TAG, "No prayer times cached.")
            return
        }

        try {
            val json = JSONObject(jsonString)
            val timings = json.optJSONObject("timings") ?: return
            
            val fajr = timings.optString("Fajr")
            val dhuhr = timings.optString("Dhuhr")
            val asr = timings.optString("Asr")
            val maghrib = timings.optString("Maghrib")
            val isha = timings.optString("Isha")

            val prayerMap = mapOf(
                "Fajr" to fajr,
                "Dhuhr" to dhuhr,
                "Asr" to asr,
                "Maghrib" to maghrib,
                "Isha" to isha
            )

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

            // We schedule for today and the next 6 days (7 days total)
            for (dayOffset in 0..6) {
                for ((prayerName, timeStr) in prayerMap) {
                    if (timeStr.isNullOrEmpty()) continue

                    // timeStr is like "04:45"
                    // Some APIs return "04:45 (IST)", so we should split by space
                    val cleanTimeStr = timeStr.split(" ")[0]
                    val timeParts = cleanTimeStr.split(":")
                    if (timeParts.size < 2) continue
                    val hour = timeParts[0].toIntOrNull() ?: continue
                    val minute = timeParts[1].toIntOrNull() ?: continue

                    // EXACT ALARM
                    val calExact = Calendar.getInstance()
                    calExact.add(Calendar.DAY_OF_YEAR, dayOffset)
                    calExact.set(Calendar.HOUR_OF_DAY, hour)
                    calExact.set(Calendar.MINUTE, minute)
                    calExact.set(Calendar.SECOND, 0)
                    calExact.set(Calendar.MILLISECOND, 0)

                    // PRE-ADHAN ALARM (10 mins prior)
                    val calPre = calExact.clone() as Calendar
                    calPre.add(Calendar.MINUTE, -10)

                    val now = Calendar.getInstance().timeInMillis

                    // Schedule Exact
                    if (calExact.timeInMillis > now) {
                        val requestCodeExact = getRequestCode(dayOffset, prayerName, "EXACT")
                        val intentExact = Intent(context, AlarmReceiver::class.java).apply {
                            putExtra("PRAYER_NAME", prayerName)
                            putExtra("ALARM_TYPE", "EXACT")
                        }
                        val piExact = PendingIntent.getBroadcast(
                            context,
                            requestCodeExact,
                            intentExact,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )
                        scheduleExactAlarm(alarmManager, calExact.timeInMillis, piExact)
                    }

                    // Schedule Pre
                    if (calPre.timeInMillis > now) {
                        val requestCodePre = getRequestCode(dayOffset, prayerName, "PRE_ADHAN")
                        val intentPre = Intent(context, AlarmReceiver::class.java).apply {
                            putExtra("PRAYER_NAME", prayerName)
                            putExtra("ALARM_TYPE", "PRE_ADHAN")
                        }
                        val piPre = PendingIntent.getBroadcast(
                            context,
                            requestCodePre,
                            intentPre,
                            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                        )
                        scheduleExactAlarm(alarmManager, calPre.timeInMillis, piPre)
                    }
                }
            }
            Log.d(TAG, "Successfully scheduled prayer alarms for 7 days.")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse and schedule prayer alarms", e)
        }
    }

    @SuppressLint("ScheduleExactAlarm")
    private fun scheduleExactAlarm(alarmManager: AlarmManager, timeInMillis: Long, pendingIntent: PendingIntent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (alarmManager.canScheduleExactAlarms()) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
            } else {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
            }
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, timeInMillis, pendingIntent)
        }
    }

    private fun getRequestCode(dayOffset: Int, prayerName: String, type: String): Int {
        val prayerCode = when (prayerName) {
            "Fajr" -> 1
            "Dhuhr" -> 2
            "Asr" -> 3
            "Maghrib" -> 4
            "Isha" -> 5
            else -> 0
        }
        val typeCode = if (type == "EXACT") 10 else 20
        return (dayOffset * 1000) + (prayerCode * 100) + typeCode
    }
}
