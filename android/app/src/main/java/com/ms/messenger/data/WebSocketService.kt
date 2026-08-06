package com.ms.messenger.data

import com.ms.messenger.models.Message
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import java.util.concurrent.TimeUnit

sealed class WsEvent {
    data class NewMessage(val chatId: String, val message: Message) : WsEvent()
    data class Typing(val chatId: String, val userId: String, val isTyping: Boolean) : WsEvent()
    data class UserOnline(val userId: String, val online: Boolean) : WsEvent()
    data class Connected(val data: String) : WsEvent()
}

object WebSocketService {
    private val scope = CoroutineScope(Dispatchers.Default)
    private var webSocket: WebSocket? = null
    private var reconnectAttempts = 0
    private var reconnectJob: Job? = null
    private var currentToken = ""

    val listeners = mutableListOf<(WsEvent) -> Unit>()
    var isConnected = false
        private set

    private val client = OkHttpClient.Builder()
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    fun addListener(listener: (WsEvent) -> Unit) {
        listeners.add(listener)
    }

    fun removeListener(listener: (WsEvent) -> Unit) {
        listeners.remove(listener)
    }

    private fun emit(event: WsEvent) {
        listeners.toList().forEach { it(event) }
    }

    fun connect(token: String) {
        currentToken = token
        reconnectAttempts = 0
        reconnectJob?.cancel()
        open()
    }

    private fun open() {
        disconnect()
        if (currentToken.isEmpty()) return
        val request = Request.Builder()
            .url("${ApiClient.WS_URL}?token=$currentToken")
            .build()
        webSocket = client.newWebSocket(request, listener)
    }

    fun disconnect() {
        webSocket?.close(1000, "bye")
        webSocket = null
        isConnected = false
    }

    private val listener = object : WebSocketListener() {
        override fun onOpen(webSocket: WebSocket, response: Response) {
            isConnected = true
            reconnectAttempts = 0
        }

        override fun onMessage(webSocket: WebSocket, text: String) {
            try {
                val root = Json { ignoreUnknownKeys = true }
                    .parseToJsonElement(text).jsonObject
                val type = root["type"]?.toString()?.trim('"') ?: return
                when (type) {
                    "new_message" -> {
                        val message = try {
                            ApiClient.json.decodeFromString(
                                Message.serializer(),
                                root["message"].toString()
                            )
                        } catch (e: Exception) { return }
                        emit(WsEvent.NewMessage(root["chatId"]?.toString()?.trim('"') ?: message.chatId, message))
                    }
                    "typing" -> emit(
                        WsEvent.Typing(
                            root["chatId"]?.toString()?.trim('"') ?: "",
                            root["userId"]?.toString()?.trim('"') ?: "",
                            root["isTyping"]?.toString()?.toBooleanStrictOrNull() ?: false
                        )
                    )
                    "user_online" -> emit(WsEvent.UserOnline(root["userId"]?.toString()?.trim('"') ?: "", true))
                    "user_offline" -> emit(WsEvent.UserOnline(root["userId"]?.toString()?.trim('"') ?: "", false))
                    else -> emit(WsEvent.Connected(text))
                }
            } catch (e: Exception) { }
        }

        override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
            webSocket.close(1000, "failed")
            isConnected = false
            scheduleReconnect()
        }

        override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
            isConnected = false
            scheduleReconnect()
        }
    }

    private fun scheduleReconnect() {
        if (currentToken.isEmpty()) return
        reconnectJob?.cancel()
        val delayMs = minOf(1000L * (1L shl reconnectAttempts), 30_000L)
        reconnectAttempts++
        reconnectJob = scope.launch {
            delay(delayMs)
            if (currentToken.isNotEmpty()) open()
        }
    }

    fun sendTyping(chatId: String, isTyping: Boolean) {
        val payload = """{"type":"typing","chatId":"$chatId","isTyping":$isTyping}"""
        webSocket?.send(payload)
    }
}
