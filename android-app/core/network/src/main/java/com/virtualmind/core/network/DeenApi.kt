package com.virtualmind.core.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

interface DeenApi {
    @GET("/api/deen/prayer-times")
    suspend fun getPrayerTimes(
        @Query("latitude") lat: Double? = null,
        @Query("longitude") lng: Double? = null
    ): PrayerTimesResponse

    @POST("/api/deen/prayers/log")
    suspend fun logPrayers(@Body request: Map<String, Boolean>)

    @GET("/api/deen/prayers/history")
    suspend fun getPrayerHistory(@Query("days") days: Int = 14): List<PrayerHistoryResponse>

    @POST("/api/deen/tasbih")
    suspend fun logTasbih(@Body request: TasbihLogRequest)

    @GET("/api/deen/tasbih")
    suspend fun getTasbihHistory(): TasbihHistoryResponse?
}

data class PrayerTimesResponse(
    @SerializedName("fajr") val fajr: String,
    @SerializedName("dhuhr") val dhuhr: String,
    @SerializedName("asr") val asr: String,
    @SerializedName("maghrib") val maghrib: String,
    @SerializedName("isha") val isha: String
)

data class PrayerHistoryResponse(
    @SerializedName("date") val date: String,
    @SerializedName("fajr") val fajr: Boolean,
    @SerializedName("dhuhr") val dhuhr: Boolean,
    @SerializedName("asr") val asr: Boolean,
    @SerializedName("maghrib") val maghrib: Boolean,
    @SerializedName("isha") val isha: Boolean
)

data class TasbihLogRequest(
    @SerializedName("total") val total: Int
)

data class TasbihHistoryResponse(
    @SerializedName("total") val total: Int
)
