package com.ms.messenger.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Peer(
    val id: String,
    @SerialName("userId") val userId: String,
    val name: String,
    @SerialName("isSystem") val isSystem: Boolean = false,
    val avatar: String? = null,
    @SerialName("profileColor") val profileColor: String? = null,
    val online: Boolean = false,
    @SerialName("lastSeen") val lastSeen: Long? = null,
)

@Serializable
data class Chat(
    val id: String,
    val type: String = "direct", // direct | group | channel
    val name: String,
    val peer: Peer? = null,
    @SerialName("lastMessage") val lastMessage: String = "",
    @SerialName("lastTime") val lastTime: String = "",
    val unread: Int = 0,
)

@Serializable
data class ChatListResponse(val chats: List<Chat>)

@Serializable
data class CreateChatResponse(
    val id: String? = null,
    val name: String? = null,
    val type: String? = null,
)

@Serializable
data class UserGroup(
    val id: String,
    val name: String,
    val about: String? = null,
    val avatar: String? = null,
    @SerialName("createdBy") val createdBy: String? = null,
    val isLinked: Boolean = false,
)

@Serializable
data class UserGroupsResponse(val groups: List<UserGroup>)

@Serializable
data class ReplyInfo(
    val id: String,
    @SerialName("senderName") val senderName: String? = "",
    val text: String? = null,
    val attachment: Attachment? = null,
)

@Serializable
data class Attachment(
    val url: String? = null,
    val type: String? = null,
    val name: String? = null,
    val size: Long? = null,
    val duration: Int? = null,
)

@Serializable
data class Reaction(
    val emoji: String,
    @SerialName("user_id") val userId: String? = null,
)

@Serializable
data class Message(
    val id: String,
    @SerialName("chatId") val chatId: String,
    @SerialName("senderId") val senderId: String,
    @SerialName("senderUserId") val senderUserId: String? = null,
    @SerialName("senderName") val senderName: String? = null,
    val text: String = "",
    @SerialName("replyTo") val replyToId: String? = null,
    val reply: ReplyInfo? = null,
    val pinned: Boolean = false,
    val edited: Boolean = false,
    val time: String = "",
    @SerialName("createdAt") val createdAt: Long = 0,
    val reactions: List<Reaction> = emptyList(),
    val attachment: Attachment? = null,
    val read: Boolean = false,
)

@Serializable
data class MessagesResponse(val messages: List<Message>)

@Serializable
data class SendMessageResponse(val message: Message? = null)

@Serializable
data class UserResponse(val user: User)

@Serializable
data class UsersResponse(val users: List<User>)

@Serializable
data class AddContactResponse(val ok: Boolean = true, val userId: String? = null)

@Serializable
data class ErrorResponse(val error: String = "")

@Serializable
data class AuthResponse(
    val ok: Boolean = true,
    val token: String? = null,
    val user: User? = null,
    val userId: String? = null,
    @SerialName("needsSetup") val needsSetup: Boolean = false,
    val message: String? = null,
)