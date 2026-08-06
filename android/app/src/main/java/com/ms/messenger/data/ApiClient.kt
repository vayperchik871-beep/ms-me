package com.ms.messenger.data

import com.ms.messenger.models.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ApiException(val code: Int, message: String) : Exception(message)

object ApiClient {
    private const val BASE_URL = "https://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run/api"
    const val BASE_HOST = "https://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run"
    const val WS_URL = "wss://5uuk9t0100hk-production-z7gr0677.us-central1.suga.run/ws"

    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .build()

    var token: String? = null

    private fun buildRequest(
        path: String,
        method: String = "GET",
        body: Any? = null,
        query: Map<String, String>? = null,
    ): Request {
        val url = BASE_URL + path
        val builder = Request.Builder()
        val requestUrl = url.trim().toHttpUrl().newBuilder()
        query?.forEach { (k, v) -> requestUrl.addQueryParameter(k, v) }
        builder.url(requestUrl.build())
        if (body != null) {
            val jsonStr = body.toJsonString()
            builder.method(method, jsonStr.toRequestBody("application/json".toMediaType()))
        } else {
            builder.method(method, null)
        }
        token?.let { builder.header("Authorization", "Bearer $it") }
        return builder.build()
    }

    private fun Any.toJsonString(): String {
        val obj = kotlinx.serialization.json.buildJsonObject {
            for ((k, v) in (this@toJsonString as Map<*, *>)) {
                put(k.toString(), v.toJsonElement())
            }
        }
        return json.encodeToString(kotlinx.serialization.json.JsonObject.serializer(), obj)
    }

    private fun Any?.toJsonElement(): kotlinx.serialization.json.JsonElement = when (this) {
        null -> kotlinx.serialization.json.JsonNull
        is String -> kotlinx.serialization.json.JsonPrimitive(this)
        is Number -> kotlinx.serialization.json.JsonPrimitive(this)
        is Boolean -> kotlinx.serialization.json.JsonPrimitive(this)
        is Map<*, *> -> {
            kotlinx.serialization.json.buildJsonObject {
                for ((k, v) in this@toJsonElement) {
                    put(k.toString(), v.toJsonElement())
                }
            }
        }
        is List<*> -> kotlinx.serialization.json.buildJsonArray {
            for (item in this@toJsonElement) add(item.toJsonElement())
        }
        else -> kotlinx.serialization.json.JsonPrimitive(this.toString())
    }

    private suspend fun <T> execute(request: Request, serializer: kotlinx.serialization.KSerializer<T>): T =
        withContext(Dispatchers.IO) {
            client.newCall(request).execute().use { resp ->
                val bodyStr = resp.body?.string().orEmpty()
                if (!resp.isSuccessful) {
                    val err = try {
                        json.decodeFromString(ErrorResponse.serializer(), bodyStr).error
                    } catch (e: Exception) { null }
                    throw ApiException(resp.code, err ?: "Ошибка ${resp.code}")
                }
                if (bodyStr.isBlank()) {
                    throw ApiException(resp.code, "Пустой ответ")
                }
                try {
                    json.decodeFromString(serializer, bodyStr)
                } catch (e: Exception) {
                    throw ApiException(resp.code, "Ошибка данных: ${e.message}")
                }
            }
        }

    // ─── Auth ───

    suspend fun register(
        userId: String, name: String, password: String, deviceId: String,
        phone: String? = null, bio: String? = null,
    ): AuthResponse {
        val body = mapOf(
            "userId" to userId,
            "name" to name,
            "password" to password,
            "deviceId" to deviceId,
            "platform" to "android",
        ).let { m ->
            mutableMapOf<String, Any>().apply {
                putAll(m)
                phone?.let { put("phone", it) }
                bio?.let { put("bio", it) }
            }
        }
        return execute(buildRequest("/auth/register", "POST", body), AuthResponse.serializer())
    }

    suspend fun login(userId: String, password: String, deviceId: String): AuthResponse {
        val body = mapOf("userId" to userId, "password" to password, "deviceId" to deviceId, "platform" to "android")
        return execute(buildRequest("/auth/login", "POST", body), AuthResponse.serializer())
    }

    suspend fun verifyDevice(code: String, deviceId: String): AuthResponse {
        val body = mapOf("code" to code, "deviceId" to deviceId)
        return execute(buildRequest("/auth/verify-device", "POST", body), AuthResponse.serializer())
    }

    suspend fun me(): UserResponse =
        execute(buildRequest("/auth/me"), UserResponse.serializer())

    // ─── Chats ───

    suspend fun getChats(): ChatListResponse =
        execute(buildRequest("/chats"), ChatListResponse.serializer())

    suspend fun getMessages(chatId: String): MessagesResponse =
        execute(buildRequest("/chats/$chatId/messages"), MessagesResponse.serializer())

    suspend fun sendMessage(chatId: String, text: String, replyTo: String? = null): Message {
        val body = mutableMapOf<String, Any>("text" to text)
        replyTo?.let { body["replyTo"] = it }
        val resp = execute(buildRequest("/chats/$chatId/messages", "POST", body), SendMessageResponse.serializer())
        return resp.message ?: throw ApiException(500, "Нет сообщения в ответе")
    }

    suspend fun editMessage(id: String, text: String) {
        execute(buildRequest("/messages/$id", "PATCH", mapOf("text" to text)), EmptyResponse.serializer())
    }

    suspend fun deleteMessage(id: String) {
        execute(buildRequest("/messages/$id", "DELETE"), EmptyResponse.serializer())
    }

    suspend fun reactMessage(id: String, emoji: String) {
        execute(buildRequest("/messages/$id/react", "POST", mapOf("emoji" to emoji)), EmptyResponse.serializer())
    }

    suspend fun readChat(chatId: String) {
        execute(buildRequest("/chats/$chatId/read", "POST"), EmptyResponse.serializer())
    }

    suspend fun createGroup(name: String, about: String? = null): String {
        val resp = execute(
            buildRequest("/groups", "POST", mapOf("name" to name, "about" to about)),
            CreateChatResponse.serializer()
        )
        return resp.id ?: throw ApiException(500, "Нет id в ответе")
    }

    suspend fun createChannel(name: String, about: String? = null, settings: Map<String, Any?>? = null): String {
        val body = mutableMapOf<String, Any?>("name" to name, "about" to about)
        if (settings != null) body["settings"] = settings
        val resp = execute(
            buildRequest("/channels", "POST", body),
            CreateChatResponse.serializer()
        )
        return resp.id ?: throw ApiException(500, "Нет id в ответе")
    }

    suspend fun getUserGroups(): List<UserGroup> {
        val resp = execute(
            buildRequest("/user/groups"),
            UserGroupsResponse.serializer()
        )
        return resp.groups
    }

    suspend fun linkChannelGroup(channelId: String, groupId: String?) {
        execute(
            buildRequest("/channels/$channelId/link-group", "PATCH", mapOf("groupId" to groupId)),
            EmptyResponse.serializer()
        )
    }

    suspend fun toggleFavorite(id: String) {
        execute(buildRequest("/messages/$id/favorite", "POST"), EmptyResponse.serializer())
    }

    // ─── Users / Contacts ───

    suspend fun getContacts(): UsersResponse =
        execute(buildRequest("/contacts"), UsersResponse.serializer())

    suspend fun addContact(userId: String): AddContactResponse =
        execute(buildRequest("/contacts", "POST", mapOf("userId" to userId)), AddContactResponse.serializer())

    suspend fun searchUsers(query: String): UsersResponse =
        execute(buildRequest("/users/search", query = mapOf("q" to query)), UsersResponse.serializer())

    suspend fun getUser(userId: String): UserResponse =
        execute(buildRequest("/users/$userId"), UserResponse.serializer())

    suspend fun updateProfile(body: Map<String, Any?>): UserResponse =
        execute(buildRequest("/user/profile", "PATCH", body), UserResponse.serializer())

    suspend fun checkUserId(id: String): CheckIdResponse =
        execute(buildRequest("/users/check-id/$id"), CheckIdResponse.serializer())

    // ─── Gifts ───

    suspend fun getGifts(): GiftsResponse =
        execute(buildRequest("/gifts"), GiftsResponse.serializer())

    suspend fun sendGift(userId: String, giftId: String, message: String? = null, anonymous: Boolean = false): SendGiftResponse {
        val body = mutableMapOf<String, Any>("userId" to userId, "giftId" to giftId)
        message?.let { body["message"] = it }
        if (anonymous) body["anonymous"] = true
        return execute(buildRequest("/gifts/send", "POST", body), SendGiftResponse.serializer())
    }

    suspend fun getUserGifts(userId: String): UserGiftsResponse =
        execute(buildRequest("/users/$userId/gifts"), UserGiftsResponse.serializer())

    suspend fun getMCoins(): MCoinsResponse =
        execute(buildRequest("/user/mcoins"), MCoinsResponse.serializer())

    // ─── Uploads ───

    suspend fun uploadAvatar(imageData: ByteArray): String = withContext(Dispatchers.IO) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("avatar", "avatar.jpg", imageData.toRequestBody("image/jpeg".toMediaType()))
            .build()
        val request = Request.Builder()
            .url("$BASE_URL/upload/avatar")
            .post(body)
            .apply { token?.let { header("Authorization", "Bearer $it") } }
            .build()
        client.newCall(request).execute().use { resp ->
            val bodyStr = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                val err = try { json.decodeFromString(ErrorResponse.serializer(), bodyStr).error } catch (e: Exception) { null }
                throw ApiException(resp.code, err ?: "Ошибка ${resp.code}")
            }
            try { json.decodeFromString(AvatarResponse.serializer(), bodyStr).avatar }
            catch (e: Exception) { throw ApiException(500, "Ошибка данных") }
        }
    }

    suspend fun uploadChatAvatar(chatId: String, imageData: ByteArray): String = withContext(Dispatchers.IO) {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("avatar", "avatar.jpg", imageData.toRequestBody("image/jpeg".toMediaType()))
            .build()
        val request = Request.Builder()
            .url("$BASE_URL/chats/$chatId/avatar")
            .post(body)
            .apply { token?.let { header("Authorization", "Bearer $it") } }
            .build()
        client.newCall(request).execute().use { resp ->
            val bodyStr = resp.body?.string().orEmpty()
            if (!resp.isSuccessful) {
                val err = try { json.decodeFromString(ErrorResponse.serializer(), bodyStr).error } catch (e: Exception) { null }
                throw ApiException(resp.code, err ?: "Ошибка ${resp.code}")
            }
            try { json.decodeFromString(AvatarResponse.serializer(), bodyStr).avatar }
            catch (e: Exception) { throw ApiException(500, "Ошибка данных") }
        }
    }

    // ─── Admin ───

    suspend fun adminCommand(command: String): AdminCommandResponse =
        execute(buildRequest("/admin/command", "POST", mapOf("command" to command)), AdminCommandResponse.serializer())
}

@kotlinx.serialization.Serializable
data class EmptyResponse(val ok: Boolean? = null)

@kotlinx.serialization.Serializable
data class CheckIdResponse(
    val available: Boolean = false,
    @kotlinx.serialization.SerialName("userId") val userId: String? = null,
)

@kotlinx.serialization.Serializable
data class AvatarResponse(val avatar: String = "")

@kotlinx.serialization.Serializable
data class AdminCommandResponse(
    val ok: Boolean? = null,
    val output: String? = null,
    val error: String? = null,
)