package com.virtualmind.core.network

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONObject
import javax.inject.Inject

class NetworkTerminalDataSource @Inject constructor(
    private val okHttpClient: OkHttpClient
) {
    private val API_BASE = "https://virtual-mind.onrender.com"

    fun streamTerminalChat(message: String): Flow<String> = callbackFlow {
        val requestBody = JSONObject().apply {
            put("message", message)
        }.toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("$API_BASE/api/chat/chat")
            .post(requestBody)
            .build()

        val factory = EventSources.createFactory(okHttpClient)
        val eventSourceListener = object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                try {
                    val json = JSONObject(data)
                    if (json.has("error")) {
                        trySend("\n[ERROR: ${json.getString("error")}]")
                    } else if (json.has("text")) {
                        trySend(json.getString("text"))
                    }
                } catch (e: Exception) {
                    // Ignore partial json parse errors just like the web client
                }
            }

            override fun onClosed(eventSource: EventSource) {
                close()
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                trySend("\n[ERROR: NETWORK FAILURE. BRAIN OFFLINE.]")
                close(t)
            }
        }

        val eventSource = factory.newEventSource(request, eventSourceListener)

        awaitClose {
            eventSource.cancel()
        }
    }
}
