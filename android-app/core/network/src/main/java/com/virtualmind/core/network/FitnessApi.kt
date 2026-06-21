package com.virtualmind.core.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface FitnessApi {
    @GET("/api/workout/today")
    suspend fun getTodayWorkout(): TodayWorkoutResponse

    @GET("/api/workout/history")
    suspend fun getHistory(@Query("limit") limit: Int = 10): List<HistoryWorkoutResponse>

    @GET("/api/workout/heatmap")
    suspend fun getHeatmap(@Query("days") days: Int = 7): HeatmapResponse

    @GET("/api/workout/home/today")
    suspend fun getHomeProtocolsToday(): Map<String, Any>

    @POST("/api/workout/home/increment")
    suspend fun incrementProtocol(@Body request: ProtocolCountRequest)

    @POST("/api/workout/home/decrement")
    suspend fun decrementProtocol(@Body request: ProtocolCountRequest)

    @POST("/api/workout/home/reorder")
    suspend fun reorderProtocols(@Body order: List<String>)

    @POST("/api/workout/home/rename")
    suspend fun renameProtocol(@Body request: RenameProtocolRequest)

    @DELETE("/api/workout/home/{id}")
    suspend fun deleteProtocol(@Path("id") id: String)
}

data class ProtocolCountRequest(
    @SerializedName("id") val id: String,
    @SerializedName("amount") val amount: Int
)

data class RenameProtocolRequest(
    @SerializedName("old_id") val oldId: String,
    @SerializedName("new_id") val newId: String
)

data class TodayWorkoutResponse(
    @SerializedName("logged") val logged: Boolean,
    @SerializedName("workout") val workout: WorkoutDetails?
)

data class WorkoutDetails(
    @SerializedName("is_rest_day") val isRestDay: Boolean
)

data class HistoryWorkoutResponse(
    @SerializedName("duration_minutes") val durationMinutes: Int?
)

data class HeatmapResponse(
    @SerializedName("activation") val activation: Map<String, Any>,
    @SerializedName("armor") val armor: Map<String, Any>
)
