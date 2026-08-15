package com.ms.messenger.data

object ChatCache {
    private val cache = mutableMapOf<String, PeerInfo>()

    data class PeerInfo(
        val name: String,
        val avatar: String? = null,
        val online: Boolean = false
    )

    fun put(chatId: String, info: PeerInfo) {
        cache[chatId] = info
    }

    fun get(chatId: String): PeerInfo? = cache[chatId]

    fun putUser(userId: String, info: PeerInfo) {
        cache["user_$userId"] = info
    }

    fun getUser(userId: String): PeerInfo? = cache["user_$userId"]
}
