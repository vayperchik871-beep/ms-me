package com.ms.messenger.ui.settings

import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.R
import com.ms.messenger.backdrop.components.GlassCard
import com.ms.messenger.backdrop.components.LiquidBottomTab
import com.ms.messenger.backdrop.components.LiquidBottomTabs
import com.ms.messenger.backdrop.components.LiquidCircleButton

@Composable
fun VerificationScreen(onBack: () -> Unit) {
    var selectedTab by remember { mutableIntStateOf(0) }
    val backdrop = rememberLayerBackdrop()
    var showSubmitSheet by remember { mutableStateOf(false) }

    val isBlue = selectedTab == 0

    val bgColorTop = if (isBlue) Color(0xFF1568A0) else Color(0xFF2A2A2A)
    val bgColorBottom = if (isBlue) Color(0xFF0C4F7A) else Color(0xFF151515)
    val accentColor = if (isBlue) Color(0xFF2DA9E3) else Color(0xFF444444)
    val badgeDrawable = if (isBlue) R.drawable.ic_badge_verif else R.drawable.ic_badge_dev
    val textColor = Color.White
    val subtitleColor = Color.White.copy(alpha = 0.75f)

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(bgColorTop, bgColorBottom)))
    ) {
        Box(modifier = Modifier.fillMaxSize().layerBackdrop(backdrop)) {}

        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 160.dp)
        ) {
            Spacer(Modifier.height(60.dp))

            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    painterResource(badgeDrawable),
                    contentDescription = null,
                    modifier = Modifier.size(130.dp),
                    tint = Color.Unspecified
                )
            }

            Spacer(Modifier.height(20.dp))

            Text(
                if (isBlue) "MSMVerif" else "VerifiDev",
                fontSize = 30.sp,
                fontWeight = FontWeight.Bold,
                color = textColor,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(8.dp))

            Text(
                if (isBlue) "Больше возможностей и эксклюзивные функции с подпиской MSMVerif."
                else "Расширенные возможности для разработчиков и технических специалистов.",
                fontSize = 15.sp,
                color = subtitleColor,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(Modifier.height(32.dp))

            Text(
                "Преимущества",
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = textColor
            )

            Spacer(Modifier.height(14.dp))

            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 20.dp,
                backdrop = backdrop,
                blurRadius = 6f
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp, horizontal = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Пользователи начнут\nвам доверять",
                        fontSize = 15.sp,
                        color = Color.White,
                        modifier = Modifier.weight(1f),
                        lineHeight = 19.sp
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 20.dp,
                backdrop = backdrop,
                blurRadius = 6f
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp, horizontal = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Статус и престиж\nв мессенджере",
                        fontSize = 15.sp,
                        color = Color.White,
                        modifier = Modifier.weight(1f),
                        lineHeight = 19.sp
                    )
                }
            }

            Spacer(Modifier.height(10.dp))

            GlassCard(
                modifier = Modifier.fillMaxWidth(),
                cornerRadius = 20.dp,
                backdrop = backdrop,
                blurRadius = 6f
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp, horizontal = 14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Защита от мошенников\nи фейков",
                        fontSize = 15.sp,
                        color = Color.White,
                        modifier = Modifier.weight(1f),
                        lineHeight = 19.sp
                    )
                }
            }
        }

        LiquidCircleButton(
            onClick = { onBack() },
            backdrop = backdrop,
            size = 48.dp,
            surfaceColor = Color.White.copy(alpha = 0.18f),
            modifier = Modifier
                .align(Alignment.TopStart)
                .statusBarsPadding()
                .padding(start = 16.dp, top = 8.dp)
        ) {
            Icon(
                Icons.Filled.Close,
                null,
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
        }

        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .navigationBarsPadding()
                .padding(start = 20.dp, end = 20.dp, bottom = 88.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(accentColor)
                .clickable { showSubmitSheet = true }
                .padding(vertical = 16.dp),
            contentAlignment = Alignment.Center
        ) {
            Text(
                "Подать заявку",
                fontSize = 17.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White
            )
        }

        LiquidBottomTabs(
            selectedTabIndex = { selectedTab },
            onTabSelected = { selectedTab = it },
            backdrop = backdrop,
            tabsCount = 2,
            accentColor = if (isBlue) Color(0xFF2DA9E3) else Color.White,
            containerColor = if (isBlue) Color(0xFF1A5A80).copy(alpha = 0.65f) else Color(0xFF111111).copy(alpha = 0.7f),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(start = 24.dp, end = 24.dp, bottom = 20.dp)
                .fillMaxWidth()
                .height(64.dp)
        ) {
            LiquidBottomTab(onClick = { selectedTab = 0 }) {
                Icon(
                    painterResource(R.drawable.ic_badge_verif),
                    contentDescription = "MSMVerif",
                    Modifier.size(24.dp),
                    tint = Color.Unspecified
                )
                Text(
                    "MSMVerif",
                    fontSize = 10.sp,
                    color = if (isBlue) Color.White else Color.White.copy(alpha = 0.5f)
                )
            }
            LiquidBottomTab(onClick = { selectedTab = 1 }) {
                Icon(
                    painterResource(R.drawable.ic_badge_dev),
                    contentDescription = "VerifiDev",
                    Modifier.size(24.dp),
                    tint = Color.Unspecified
                )
                Text(
                    "VerifiDev",
                    fontSize = 10.sp,
                    color = if (!isBlue) Color.White else Color.White.copy(alpha = 0.5f)
                )
            }
        }

        // --- Submit Sheet ---
        val sheetVisible = showSubmitSheet
        AnimatedVisibility(
            visible = sheetVisible,
            enter = slideInVertically(tween(300)) { it } + fadeIn(tween(300)),
            exit = slideOutVertically(tween(250)) { it } + fadeOut(tween(250))
        ) {
            var inputText by remember { mutableStateOf("") }
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = if (sheetVisible) 0.35f else 0f))
                    .clickable(
                        indication = null,
                        interactionSource = remember { MutableInteractionSource() }
                    ) { showSubmitSheet = false }
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.BottomCenter)
                        .navigationBarsPadding()
                        .padding(start = 16.dp, end = 16.dp, bottom = 8.dp)
                        .clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() }
                        ) {}
                ) {
                    GlassCard(
                        modifier = Modifier.fillMaxWidth(),
                        cornerRadius = 36.dp,
                        backdrop = backdrop,
                        blurRadius = 16f,
                        surfaceColor = Color.White.copy(alpha = 0.92f)
                    ) {
                        Spacer(Modifier.height(10.dp))
                        Box(
                            modifier = Modifier.fillMaxWidth(),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "Подать заявку",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color.Black.copy(alpha = 0.8f)
                            )
                            Box(
                                modifier = Modifier
                                    .align(Alignment.CenterEnd)
                                    .clip(RoundedCornerShape(50))
                                    .drawBackdrop(
                                        backdrop = backdrop,
                                        shape = { RoundedCornerShape(50) },
                                        effects = {
                                            vibrancy()
                                            blur(10f.dp.toPx())
                                            lens(12f.dp.toPx(), 12f.dp.toPx())
                                        },
                                        onDrawSurface = {
                                            drawRect(Color.Black.copy(alpha = 0.06f))
                                        }
                                    )
                                    .clickable { showSubmitSheet = false }
                                    .padding(horizontal = 18.dp, vertical = 10.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "Готово",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color.Black
                                )
                            }
                        }

                        Spacer(Modifier.height(14.dp))

                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 4.dp)
                                .clip(RoundedCornerShape(50))
                                .drawBackdrop(
                                    backdrop = backdrop,
                                    shape = { RoundedCornerShape(50) },
                                    effects = {
                                        vibrancy()
                                        blur(12f.dp.toPx())
                                        lens(16f.dp.toPx(), 16f.dp.toPx())
                                    },
                                    onDrawSurface = {
                                        drawRect(Color.Black.copy(alpha = 0.05f))
                                    }
                                )
                                .padding(horizontal = 18.dp, vertical = 14.dp)
                        ) {
                            if (inputText.isEmpty()) {
                                Text(
                                    "Название канала",
                                    fontSize = 15.sp,
                                    color = Color.Black.copy(alpha = 0.4f),
                                    modifier = Modifier.align(Alignment.CenterStart)
                                )
                            }
                            BasicTextField(
                                value = inputText,
                                onValueChange = { inputText = it },
                                modifier = Modifier.fillMaxWidth().align(Alignment.Center),
                                textStyle = TextStyle(
                                    fontSize = 15.sp,
                                    color = Color.Black
                                ),
                                cursorBrush = SolidColor(Color(0xFF2DA9E3)),
                                maxLines = 1
                            )
                        }

                        Spacer(Modifier.height(16.dp))
                    }
                }
            }
        }
    }
}
