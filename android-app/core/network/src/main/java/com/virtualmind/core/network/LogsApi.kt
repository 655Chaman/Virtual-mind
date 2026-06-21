package com.virtualmind.core.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.POST

interface LogsApi {
    @POST("/api/logs")
    suspend fun saveLog(@Body request: SaveLogRequest)
}

data class SaveLogRequest(
    @SerializedName("date") val date: String,
    @SerializedName("timestamp") val timestamp: String,
    @SerializedName("text") val text: String,
    @SerializedName("pillars") val pillars: List<String>,
    @SerializedName("non_negotiables") val nonNegotiables: Map<String, Boolean>
)
