package com.ms.messenger.backdrop.components

import androidx.compose.foundation.layout.size
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@Composable
fun LiquidBackButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    tint: Color = Color.Unspecified,
    isDark: Boolean = false,
) {
    LiquidCircleButton(
        onClick = onClick,
        modifier = modifier,
        size = 44.dp,
        surfaceColor = if (isDark) Color(0xFF3A3A3C).copy(alpha = 0.5f) else Color.White.copy(alpha = 0.5f),
    ) {
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowLeft,
            contentDescription = "Назад",
            tint = if (isDark) Color.White else Color(0xFF34C759),
            modifier = Modifier.size(24.dp)
        )
    }
}
