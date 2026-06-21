package com.virtualmind.core.network

import com.google.gson.annotations.SerializedName
import retrofit2.http.Body
import retrofit2.http.POST

interface OracleApi {
    @POST("/api/oracle/process-sync")
    suspend fun processSync(@Body request: OracleSyncRequest): OracleSyncResponse
}

data class OracleSyncRequest(
    @SerializedName("answers") val answers: String
)

data class OracleSyncResponse(
    @SerializedName("tomorrow_theme") val tomorrowTheme: String,
    @SerializedName("adjusted_tasks") val adjustedTasks: List<OracleAdjustedTask>,
    @SerializedName("leniency_adjustments") val leniencyAdjustments: String
)

data class OracleAdjustedTask(
    @SerializedName("task_name") val taskName: String,
    @SerializedName("reason") val reason: String
)
