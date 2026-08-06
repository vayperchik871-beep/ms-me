package com.ms.messenger.backdrop.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun LiquidBackButton(
    onClick: () -> Unit,
    backdrop: com.kyant.backdrop.Backdrop,
    modifier: Modifier = Modifier,
    tint: Color = Color.Unspecified,
    isDark: Boolean = false,
    size: Dp = 44.dp,
) {
    Box(
        modifier = modifier
            .size(size)
            .shadow(2.dp, CircleShape, ambientColor = Color.Black.copy(alpha = 0.08f))
            .clip(CircleShape)
            .background(if (isDark) Color(0xFF3A3A3C) else Color.White)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick
            ),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowLeft,
            contentDescription = "Назад",
            tint = if (isDark) Color.White else Color(0xFF34C759),
            modifier = Modifier.size(24.dp)
        )
    }
}
