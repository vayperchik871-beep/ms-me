package com.ms.messenger.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    @SerialName("userId") val userId: String,
    val name: String,
    val phone: String? = null,
    val bio: String? = null,
    @SerialName("isSystem") val isSystem: Boolean = false,
    val avatar: String? = null,
    val birthday: String? = null,
    val gender: String? = null,
    @SerialName("profileColor") val profileColor: String? = null,
    val mcoins: Int = 0,
    @SerialName("isAdmin") val isAdmin: Boolean = false,
    val banned: Boolean = false,
    val premium: Boolean = false,
    @SerialName("aiModel") val aiModel: String = "lite",
    val music: MusicInfo? = null,
    val verified: Boolean = false,
    @SerialName("verifyType") val verifyType: String? = null,
    val isOnline: Boolean = false,
    @SerialName("lastSeen") val lastSeen: Long? = null,
    @SerialName("profileBanner") val profileBanner: String? = null,
    val scam: Boolean = false,
)

@Serializable
data class MusicInfo(
    val artist: String? = null,
    val title: String? = null,
    val track: String? = null,
)