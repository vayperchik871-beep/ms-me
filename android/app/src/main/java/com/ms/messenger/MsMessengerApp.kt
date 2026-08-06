package com.ms.messenger

import android.app.Application
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.data.SessionStore
import com.ms.messenger.data.ApiClient

class MsMessengerApp : Application() {
    override fun onCreate() {
        super.onCreate()
        val session = SessionStore(this)
        PrefsHolder.session = session
        session.loadThemeIntoManager()
        ApiClient.token = session.token
    }
}
