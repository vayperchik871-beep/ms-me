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
data class GiftLite(
    val id: String,
    val emoji: String = "🎁",
    val title: String = "Подарок",
    val price: Int = 0,
)

@Serializable
data class GiftSender(
    @SerialName("userId") val userId: String? = null,
    val name: String? = null,
)

@Serializable
data class ReceivedGift(
    val id: String,
    val gift: GiftLite? = null,
    val sender: GiftSender? = null,
    val message: String? = null,
    @SerialName("createdAt") val createdAt: Long = 0,
)

@Serializable
data class UserGiftsResponse(val gifts: List<ReceivedGift>)

@Serializable
data class SendGiftResponse(
    val gift: SendGiftInner? = null,
    @SerialName("chatMessage") val chatMessage: Message? = null,
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

@Serializable
data class PromoCodeResponse(val earned: Int = 0, val mcoins: Int = 0, val error: String? = null)

@Serializable
data class SellGiftResponse(
    val refunded: Int = 0,
    val mcoins: Int = 0,
    val error: String? = null,
)