package com.ms.messenger.ui.music

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ms.messenger.theme.AppColors

@Composable
fun MusicScreen() {
    val colors = AppColors.current()
    Column(
        Modifier.fillMaxSize().background(colors.bg).padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))
        Text("Музыка", fontSize = 17.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold, color = colors.textPrimary, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(60.dp))
        Icon(Icons.Filled.MusicNote, contentDescription = null, tint = colors.textSecondary.copy(alpha = 0.5f), modifier = Modifier.size(48.dp))
        Spacer(Modifier.height(12.dp))
        Text("Раздел пока пуст", fontSize = 17.sp, color = colors.textSecondary)
    }
}