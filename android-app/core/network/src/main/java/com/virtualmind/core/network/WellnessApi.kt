package com.virtualmind.core.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface WellnessApi {

    // ── Sleep ────────────────────────────────────────────────────────────────
    @POST("/api/wellness/sleep/start")
    suspend fun startSleep(): GenericStatusResponse

    @POST("/api/wellness/sleep/stop")
    suspend fun stopSleep(@Body body: ClientTimestampBody = ClientTimestampBody()): SleepSessionResponse

    @GET("/api/wellness/sleep/today")
    suspend fun getSleepToday(): SleepTodayResponse

    @GET("/api/wellness/sleep/history")
    suspend fun getSleepHistory(@Query("days") days: Int = 7): List<SleepHistoryEntry>

    // ── Fasting ──────────────────────────────────────────────────────────────
    @POST("/api/wellness/fast/start")
    suspend fun startFast(): GenericStatusResponse

    @POST("/api/wellness/fast/stop")
    suspend fun stopFast(@Body body: ClientTimestampBody = ClientTimestampBody()): FastStopResponse

    @GET("/api/wellness/fast/today")
    suspend fun getFastToday(): FastTodayResponse

    // ── Hydration ────────────────────────────────────────────────────────────
    @POST("/api/wellness/hydration/add")
    suspend fun addHydration(@Body data: HydrationInput): HydrationAddResponse

    @GET("/api/wellness/hydration/today")
    suspend fun getHydrationToday(): HydrationTodayResponse

    // ── Readiness ────────────────────────────────────────────────────────────
    @POST("/api/wellness/readiness")
    suspend fun logReadiness(@Body data: ReadinessInput): ReadinessResponse

    @GET("/api/wellness/readiness/today")
    suspend fun getReadinessToday(): ReadinessTodayResponse
}

// ── Request Bodies ─────────────────────────────────────────────────────────────

data class ClientTimestampBody(
    @SerializedName("client_timestamp") val clientTimestamp: String? = null
)

data class HydrationInput(
    @SerializedName("amount_ml") val amountMl: Int = 250
)

data class ReadinessInput(
    @SerializedName("energy") val energy: Int,
    @SerializedName("clarity") val clarity: Int,
    @SerializedName("mood") val mood: Int
)

// ── Response Data Classes ─────────────────────────────────────────────────────

data class GenericStatusResponse(
    @SerializedName("status") val status: String,
    @SerializedName("start_time") val startTime: String? = null
)

data class SleepSessionResponse(
    @SerializedName("status") val status: String,
    @SerializedName("duration_minutes") val durationMinutes: Double?,
    @SerializedName("duration_hours") val durationHours: Double?
)

data class SleepTodayResponse(
    @SerializedName("is_sleeping") val isSleeping: Boolean,
    @SerializedName("sleep_start_time") val sleepStartTime: String?,
    @SerializedName("last_sleep_hours") val lastSleepHours: Double?,
    @SerializedName("last_sleep_start") val lastSleepStart: String?,
    @SerializedName("last_sleep_end") val lastSleepEnd: String?
)

data class SleepHistoryEntry(
    @SerializedName("start_time") val startTime: String,
    @SerializedName("end_time") val endTime: String,
    @SerializedName("duration_hours") val durationHours: Double
)

data class FastTodayResponse(
    @SerializedName("is_fasting") val isFasting: Boolean,
    @SerializedName("fast_start_time") val fastStartTime: String?,
    @SerializedName("elapsed_minutes") val elapsedMinutes: Double?,
    @SerializedName("elapsed_hours") val elapsedHours: Double?,
    @SerializedName("fast_phase") val fastPhase: String?,
    @SerializedName("last_fast_hours") val lastFastHours: Double?
)

data class FastStopResponse(
    @SerializedName("status") val status: String,
    @SerializedName("duration_hours") val durationHours: Double?
)

data class HydrationAddResponse(
    @SerializedName("status") val status: String,
    @SerializedName("today_total_ml") val todayTotalMl: Int,
    @SerializedName("today_total_L") val todayTotalL: Double
)

data class HydrationTodayResponse(
    @SerializedName("date") val date: String?,
    @SerializedName("total_ml") val totalMl: Int?,
    @SerializedName("total_L") val totalL: Double?,
    @SerializedName("goal_ml") val goalMl: Int?,
    @SerializedName("progress_pct") val progressPct: Double?,
    @SerializedName("entries") val entries: List<Any>?
)

data class ReadinessResponse(
    @SerializedName("status") val status: String,
    @SerializedName("score") val score: Int,
    @SerializedName("max") val max: Int
)

data class ReadinessTodayResponse(
    @SerializedName("logged") val logged: Boolean,
    @SerializedName("score") val score: Int?,
    @SerializedName("energy") val energy: Int?,
    @SerializedName("clarity") val clarity: Int?,
    @SerializedName("mood") val mood: Int?,
    @SerializedName("label") val label: String?
)
