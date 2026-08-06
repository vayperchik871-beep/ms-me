package com.ms.messenger.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.ms.messenger.theme.AppColors
import com.ms.messenger.theme.parseHex

@Composable
fun Avatar(
    size: Int,
    name: String?,
    avatarUrl: String?,
    profileColor: String? = null,
    modifier: Modifier = Modifier,
    fontSize: Int = 20,
) {
    val colors = AppColors.current()
    Box(
        modifier = modifier
            .size(size.dp)
            .clip(CircleShape)
            .background(
                parseHex(profileColor) ?: colors.card
            )
    ) {
        if (avatarUrl.isNullOrBlank()) {
            val letter = name?.trim()?.firstOrNull()?.uppercase() ?: "?"
            Text(
                text = letter,
                color = colors.accent,
                fontSize = fontSize.sp,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.align(Alignment.Center)
            )
        } else {
            AsyncImage(
                model = avatarUrl,
                contentDescription = null,
                contentScale = ContentScale.Crop,
                modifier = Modifier.fillMaxSize()
            )
        }
    }
}

@Composable
fun Avatar48(
    name: String?,
    avatarUrl: String?,
    profileColor: String? = null,
    modifier: Modifier = Modifier,
) {
    Avatar(48, name, avatarUrl, profileColor, modifier, fontSize = 18)
}

@Composable
fun iOSButton(
    text: String,
    onClick: () -> Unit,
    enabled: Boolean = true,
    loading: Boolean = false,
    modifier: Modifier = Modifier,
    backgroundColor: Color? = null,
    contentColor: Color? = null,
    fullWidth: Boolean = true,
) {
    val colors = AppColors.current()
    Button(
        onClick = onClick,
        enabled = enabled && !loading,
        modifier = if (fullWidth) modifier.fillMaxWidth() else modifier,
        shape = RoundedCornerShape(14.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = backgroundColor ?: if (enabled) colors.accent else colors.inputBg,
            contentColor = if (enabled) contentColor ?: colors.accentText else colors.textSecondary
        ),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(vertical = 16.dp)
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                color = contentColor ?: colors.accentText,
                strokeWidth = 2.dp
            )
        } else {
            Text(text = text, fontSize = 17.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun iOSTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    visualTransformation: VisualTransformation = VisualTransformation.None,
    monospace: Boolean = false,
    keyboardPaddingBottom: Int = 14,
) {
    val colors = AppColors.current()
    Box(
        modifier = modifier
            .fillMaxWidth()
            .background(color = colors.inputBg, shape = RoundedCornerShape(12.dp))
            .border(0.5.dp, colors.divider, RoundedCornerShape(12.dp))
            .padding(horizontal = 16.dp, vertical = keyboardPaddingBottom.dp)
    ) {
        if (value.isEmpty()) {
            Text(
                text = placeholder,
                color = colors.textSecondary,
                fontSize = 16.sp
            )
        }
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            singleLine = true,
            textStyle = androidx.compose.ui.text.TextStyle(
                color = colors.textPrimary,
                fontSize = if (monospace) 22.sp else 16.sp,
                fontFamily = if (monospace) androidx.compose.ui.text.font.FontFamily.Monospace else androidx.compose.ui.text.font.FontFamily.Default,
            ),
            cursorBrush = SolidColor(colors.accent),
            visualTransformation = visualTransformation
        )
    }
}

@Composable
fun SectionHeader(text: String, modifier: Modifier = Modifier) {
    val colors = AppColors.current()
    Text(
        text = text,
        fontSize = 17.sp,
        fontWeight = FontWeight.SemiBold,
        color = colors.textPrimary,
        modifier = modifier
    )
}