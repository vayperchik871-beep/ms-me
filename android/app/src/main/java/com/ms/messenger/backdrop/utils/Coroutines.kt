package com.ms.messenger.backdrop.utils

suspend fun awaitFrame() {
    kotlinx.coroutines.android.awaitFrame()
}
