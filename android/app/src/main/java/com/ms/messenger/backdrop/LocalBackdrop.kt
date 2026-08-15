package com.ms.messenger.backdrop

import androidx.compose.runtime.staticCompositionLocalOf
import com.kyant.backdrop.Backdrop

val LocalBackdrop = staticCompositionLocalOf<Backdrop?> { null }
val LocalLiteMode = staticCompositionLocalOf<Boolean> { false }
