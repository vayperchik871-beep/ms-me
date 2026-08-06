package com.ms.messenger.data

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.mutableIntStateOf

class SessionStore(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)

    val navVersion = mutableIntStateOf(0)

    var token: String?
        get() = prefs.getString("token", null)
        set(value) {
            prefs.edit().putString("token", value).apply()
            ApiClient.token = value
        }

    var userId: String?
        get() = prefs.getString("userId", null)
        set(value) = prefs.edit().putString("userId", value).apply()

    var myUserId: String?
        get() = prefs.getString("myUserId", null)
        set(value) = prefs.edit().putString("myUserId", value).apply()

    var themeMode: String
        get() = prefs.getString("theme_mode", "dark") ?: "dark"
        set(value) = prefs.edit().putString("theme_mode", value).apply()

    var accentHex: String
        get() = prefs.getString("accent_hex", "") ?: ""
        set(value) = prefs.edit().putString("accent_hex", value).apply()

    var myAvatar: String?
        get() = prefs.getString("my_avatar", null)
        set(value) = prefs.edit().putString("my_avatar", value).apply()

    var myName: String?
        get() = prefs.getString("my_name", null)
        set(value) = prefs.edit().putString("my_name", value).apply()

    var deviceId: String
        get() = prefs.getString("device_id", null) ?: generateDeviceId().also { deviceId = it }
        set(value) = prefs.edit().putString("device_id", value).apply()

    var navChats: Boolean
        get() = prefs.getBoolean("nav_chats", true)
        set(value) {
            prefs.edit().putBoolean("nav_chats", value).apply()
            navVersion.intValue++
        }

    var navContacts: Boolean
        get() = prefs.getBoolean("nav_contacts", true)
        set(value) {
            prefs.edit().putBoolean("nav_contacts", value).apply()
            navVersion.intValue++
        }

    var navSettings: Boolean
        get() = true
        set(value) = prefs.edit().putBoolean("nav_settings", value).apply()

    fun logout() {
        prefs.edit().clear().apply()
        ApiClient.token = null
        WebSocketService.disconnect()
    }

    fun loadThemeIntoManager() {
        ThemeManagerStore.themeMode = themeMode
        ThemeManagerStore.accentHex = accentHex
        com.ms.messenger.theme.ThemeManager.themeMode = themeMode
        com.ms.messenger.theme.ThemeManager.accentHex = accentHex
    }

    private fun generateDeviceId(): String {
        val chars = "abcdef0123456789"
        val sb = StringBuilder()
        repeat(32) { sb.append(chars.random()) }
        return sb.toString()
    }
}

object ThemeManagerStore {
    var themeMode: String = "dark"
    var accentHex: String = ""
}

object PrefsHolder {
    lateinit var session: SessionStore
}
