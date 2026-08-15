package com.ms.messenger.backdrop.components

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.foundation.shape.RoundedCornerShape
import com.kyant.backdrop.Backdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.backdrop.LocalBackdrop
import com.ms.messenger.backdrop.LocalLiteMode

@Composable
fun GlassCard(
    modifier: Modifier = Modifier,
    backdrop: Backdrop? = LocalBackdrop.current,
    cornerRadius: Dp = 28.dp,
    blurRadius: Float = 2f * 4f,
    surfaceColor: Color = Color.Unspecified,
    surfaceBrush: Brush? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val isDark = isSystemInDarkTheme()
    val shape = RoundedCornerShape(cornerRadius)

    val isLiteMode = LocalLiteMode.current
    val drawModifier = if (backdrop != null && !isLiteMode) {
        Modifier.drawBackdrop(
            backdrop = backdrop,
            shape = { shape },
            effects = {
                vibrancy()
                blur(blurRadius)
                lens(12f.dp.toPx(), 24f.dp.toPx())
            },
            onDrawSurface = {
                if (surfaceBrush != null) {
                    drawRect(surfaceBrush)
                } else if (surfaceColor != Color.Unspecified) {
                    drawRect(surfaceColor)
                } else {
                    drawRect(Color.Black.copy(alpha = if (isDark) 0.15f else 0.08f))
                }
            }
        )
    } else {
        val bg = if (surfaceBrush != null) null
        else if (surfaceColor != Color.Unspecified) surfaceColor
        else if (isDark) Color(0xFF2A2A2E).copy(alpha = 0.72f)
        else Color.White.copy(alpha = 0.78f)
        Modifier
            .clip(shape)
            .drawBehind {
                if (bg != null) drawRect(bg)
                else surfaceBrush?.let { drawRect(it) }
            }
    }

    Column(
        modifier = modifier
            .then(drawModifier)
            .padding(horizontal = 18.dp, vertical = 14.dp),
        content = content
    )
}
