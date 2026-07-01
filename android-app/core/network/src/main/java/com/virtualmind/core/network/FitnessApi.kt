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
    suspend fun getTodayWorkout(@Query("local_date") localDate: String? = null): TodayWorkoutResponse

    @GET("/api/workout/history")
    suspend fun getHistory(@Query("limit") limit: Int = 10, @Query("local_date") localDate: String? = null): List<HistoryWorkoutResponse>

    @GET("/api/workout/heatmap")
    suspend fun getHeatmap(@Query("days") days: Int = 7, @Query("local_date") localDate: String? = null): HeatmapResponse

    @GET("/api/workout/graph")
    suspend fun getGraphData(@Query("days") days: Int = 14, @Query("local_date") localDate: String? = null): GraphDataResponse

    @POST("/api/workout/session/start")
    suspend fun startSession(@Query("target_date") targetDate: String? = null): SessionStartResponse

    @GET("/api/workout/home-protocol/today")
    suspend fun getHomeProtocolsToday(@Query("local_date") localDate: String? = null): Map<String, Any>

    @POST("/api/workout/home-protocol/increment")
    suspend fun incrementProtocol(@Body request: ProtocolCountRequest)

    @POST("/api/workout/home-protocol/decrement")
    suspend fun decrementProtocol(@Body request: ProtocolCountRequest)

    @POST("/api/workout/home-protocol/reorder")
    suspend fun reorderProtocols(@Body order: List<String>)

    @POST("/api/workout/home-protocol/rename")
    suspend fun renameProtocol(@Body request: RenameProtocolRequest)

    @POST("/api/workout/home-protocol/delete")
    suspend fun deleteProtocol(@Body request: DeleteProtocolRequest)
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

data class DeleteProtocolRequest(
    @SerializedName("id") val id: String
)

data class SessionStartResponse(
    @SerializedName("status") val status: String,
    @SerializedName("start_time") val startTime: Long
)

data class GraphDataResponse(
    @SerializedName("dates") val dates: List<String>,
    @SerializedName("volumes") val volumes: List<Int>,
    @SerializedName("workouts") val workouts: List<WorkoutInfo>
)

data class WorkoutInfo(
    @SerializedName("date") val date: String,
    @SerializedName("duration_minutes") val durationMinutes: Int,
    @SerializedName("exercises") val exercises: Int
)

data class HistoryWorkoutResponse(
    @SerializedName("duration_minutes") val durationMinutes: Int?
)

data class HeatmapResponse(
    @SerializedName("activation") val activation: Map<String, Any>,
    @SerializedName("armor") val armor: Map<String, Any>
)
