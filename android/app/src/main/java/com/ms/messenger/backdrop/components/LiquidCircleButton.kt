package com.ms.messenger.backdrop.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kyant.backdrop.Backdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.backdrop.LocalBackdrop
import com.ms.messenger.backdrop.LocalLiteMode
import com.ms.messenger.backdrop.utils.InteractiveHighlight

@Composable
fun LiquidCircleButton(
    onClick: () -> Unit,
    backdrop: Backdrop? = LocalBackdrop.current,
    modifier: Modifier = Modifier,
    size: Dp = 60.dp,
    surfaceColor: Color = Color.Unspecified,
    content: @Composable () -> Unit
) {
    val animationScope = rememberCoroutineScope()

    val interactiveHighlight = remember(animationScope) {
        InteractiveHighlight(animationScope = animationScope)
    }

    val isLiteMode = LocalLiteMode.current
    val drawModifier = if (backdrop != null && !isLiteMode) {
        Modifier.drawBackdrop(
            backdrop = backdrop,
            shape = { CircleShape },
            effects = {
                vibrancy()
                blur(2f.dp.toPx())
                lens(12f.dp.toPx(), 24f.dp.toPx())
            },
            layerBlock = {
                val progress = interactiveHighlight.pressProgress
                val scale = 1f + 0.04f * progress
                scaleX = scale
                scaleY = scale

                val offset = interactiveHighlight.offset
                translationX = offset.x * 0.3f
                translationY = offset.y * 0.3f
            },
            onDrawSurface = {
                if (surfaceColor != Color.Unspecified) {
                    drawRect(surfaceColor)
                }
            }
        )
    } else {
        val isDark = isSystemInDarkTheme()
        Modifier
            .clip(CircleShape)
            .drawBehind {
                val bg = if (surfaceColor != Color.Unspecified) surfaceColor
                else if (isDark) Color(0xFF2A2A2E).copy(alpha = 0.72f)
                else Color.White.copy(alpha = 0.78f)
                drawCircle(bg)
                drawCircle(
                    brush = Brush.radialGradient(
                        listOf(Color.White.copy(alpha = if (isDark) 0.14f else 0.6f), Color.Transparent),
                        center = Offset(this.size.width * 0.35f, this.size.height * 0.25f),
                        radius = this.size.minDimension * 0.85f
                    )
                )
                drawCircle(
                    color = Color.White.copy(alpha = if (isDark) 0.16f else 0.65f),
                    radius = this.size.minDimension / 2f - 0.7f.dp.toPx(),
                    style = Stroke(width = 0.8f.dp.toPx())
                )
            }
            .shadow(
                6.dp,
                CircleShape,
                ambientColor = Color.Black.copy(alpha = 0.2f),
                spotColor = Color.Black.copy(alpha = 0.12f)
            )
    }

    Box(
        modifier = modifier
            .size(size)
            .then(drawModifier)
            .clickable(
                interactionSource = null,
                indication = null,
                onClick = onClick
            )
            .then(interactiveHighlight.modifier)
            .then(interactiveHighlight.gestureModifier),
        contentAlignment = Alignment.Center
    ) {
        content()
    }
}