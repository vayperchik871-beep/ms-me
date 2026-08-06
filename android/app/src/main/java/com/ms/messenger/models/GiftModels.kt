package com.ms.messenger.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Gift(
    val id: String,
    val name: String,
    val description: String = "",
    val icon: String = "🎁",
    val price: Int = 0,
    val rarity: String = "Обычный",
    val category: String = "Популярные",
    val limited: Boolean = false,
    @SerialName("totalSupply") val totalSupply: Int? = null,
    val sold: Int? = null,
    @SerialName("expiresAt") val expiresAt: Long? = null,
    val colors: List<String> = emptyList(),
    @SerialName("imageName") val imageName: String? = null,
)

@Serializable
data class GiftsResponse(val gifts: List<Gift>)

@Serializable
data class ReceivedGift(
    val id: String,
    @SerialName("giftId") val giftId: String,
    @SerialName("fromUserId") val fromUserId: String? = null,
    @SerialName("fromUserName") val fromUserName: String? = null,
    val timestamp: Long = 0,
    val message: String? = null,
)

@Serializable
data class UserGiftsResponse(val gifts: List<ReceivedGift>)

@Serializable
data class SendGiftResponse(
    val gift: SendGiftInner? = null,
    val mcoins: Int? = null,
    val error: String? = null,
)

@Serializable
data class SendGiftInner(
    val id: String? = null,
    val message: String? = null,
    @SerialName("createdAt") val createdAt: Long? = null,
)

@Serializable
data class MCoinsResponse(val mcoins: Int = 0)