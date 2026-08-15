package com.ms.messenger

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.theme.AppTheme
import com.ms.messenger.ui.AppRoot

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            var sessionValid by remember { mutableStateOf(PrefsHolder.session.token != null) }
            AppTheme {
                AppRoot(
                    sessionValid = sessionValid,
                    onSessionChanged = { sessionValid = it }
                )
            }
        }
    }
}
