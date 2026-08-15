package com.ms.messenger.ui.settings

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Image
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.gestures.waitForUpOrCancellation
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.AddCircle
import androidx.compose.material.icons.rounded.CardGiftcard
import androidx.compose.material.icons.rounded.Check
import androidx.compose.material.icons.rounded.ChevronLeft
import androidx.compose.material.icons.rounded.ChevronRight
import androidx.compose.material.icons.rounded.Close
import androidx.compose.material.icons.rounded.LocalOffer
import androidx.compose.material.icons.rounded.Send
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kyant.backdrop.Backdrop
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.R
import com.ms.messenger.backdrop.LocalBackdrop
import com.ms.messenger.backdrop.LocalLiteMode
import com.ms.messenger.backdrop.components.GlassCard
import com.ms.messenger.backdrop.components.LiquidBottomTab
import com.ms.messenger.backdrop.components.LiquidBottomTabs
import com.ms.messenger.backdrop.components.LiquidToggle
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.ApiException
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import com.ms.messenger.theme.AppThemeColors
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

private val packages = listOf(45, 90, 120, 150, 200)

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun MCoinsButton(
    onClick: () -> Unit,
    backdrop: Backdrop?,
    modifier: Modifier = Modifier,
    height: Dp = 54.dp,
    cornerRadius: Dp = 30.dp,
    icon: ImageVector? = null,
    iconColor: Color = Color.White,
    surfaceColor: Color = Color.Unspecified,
    glassy: Boolean = false,
    label: String,
    labelFontSize: androidx.compose.ui.unit.TextUnit = 16.sp
) {
    val isDark = isSystemInDarkTheme()
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        if (isPressed) 0.90f else 1f,
        animationSpec = spring(dampingRatio = 0.4f, stiffness = 600f),
        label = "scale"
    )
    val btnShape = RoundedCornerShape(cornerRadius)
    val labelColor = if (isDark) Color.White else Color.Black

    val drawModifier = if (backdrop != null) {
        Modifier.drawBackdrop(
            backdrop = backdrop,
            shape = { btnShape },
            effects = {
                vibrancy()
                blur(2f.dp.toPx())
                lens(12f.dp.toPx(), 24f.dp.toPx())
            },
            onDrawSurface = {
                drawRect(
                    if (surfaceColor != Color.Unspecified) surfaceColor.copy(alpha = 0.85f)
                    else Color.Black.copy(alpha = 0.35f)
                )
            }
        )
    } else if (glassy) {
        Modifier
            .clip(btnShape)
            .drawBehind {
                drawRect(
                    brush = Brush.verticalGradient(
                        listOf(Color.White.copy(alpha = 0.30f), Color.White.copy(alpha = 0.12f))
                    )
                )
                drawRoundRect(
                    color = Color.White.copy(alpha = 0.40f),
                    style = Stroke(width = 1.2f.dp.toPx()),
                    cornerRadius = CornerRadius(cornerRadius.value, cornerRadius.value)
                )
            }
            .shadow(6.dp, btnShape, ambientColor = Color.Black.copy(alpha = 0.25f), spotColor = Color.Black.copy(alpha = 0.15f))
    } else {
        Modifier
            .clip(btnShape)
            .drawBehind {
                drawRect(
                    if (surfaceColor != Color.Unspecified) surfaceColor
                    else if (isDark) Color(0xFF1C1C1E).copy(alpha = 0.85f)
                    else Color(0xFFE5E5EA).copy(alpha = 0.85f)
                )
            }
            .shadow(4.dp, btnShape, ambientColor = Color.Black.copy(alpha = 0.15f))
    }

    Row(
        modifier
            .graphicsLayer {
                scaleX = scale
                scaleY = scale
            }
            .then(drawModifier)
            .clickable(interactionSource = interactionSource, indication = null, onClick = onClick)
            .height(height)
            .padding(horizontal = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (icon != null) {
            Icon(icon, contentDescription = null, tint = iconColor, modifier = Modifier.size(20.dp))
        }
        Text(label, fontSize = labelFontSize, fontWeight = FontWeight.SemiBold, color = labelColor, maxLines = 1)
    }
}

@Composable
private fun CoinBadge(backdrop: Backdrop?, modifier: Modifier = Modifier) {
    val shape = RoundedCornerShape(20.dp)
    val mcoins = PrefsHolder.session.mcoins
    val badgeModifier = if (backdrop != null) {
        modifier
            .clip(shape)
            .drawBackdrop(
                backdrop = backdrop,
                shape = { shape },
                effects = {
                    vibrancy()
                    blur(2f.dp.toPx())
                },
                onDrawSurface = {
                    drawRect(Color.Black.copy(alpha = 0.35f))
                }
            )
    } else {
        modifier
            .clip(shape)
            .background(
                Brush.linearGradient(
                    0f to Color(0xFF3A3A3C),
                    1f to Color(0xFF2C2C2E)
                )
            )
            .border(1.dp, Color.White.copy(alpha = 0.15f), shape)
    }

    Box(
        modifier = badgeModifier
            .padding(horizontal = 10.dp, vertical = 6.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(R.drawable.coin),
                contentDescription = null,
                modifier = Modifier
                    .size(16.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
            Spacer(Modifier.width(6.dp))
            Text("$mcoins", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
        }
    }
}

@Composable
private fun BuyScreen(
    onBack: () -> Unit,
    backdrop: Backdrop?
) {
    val colors = AppColors.current()
    var selected by remember { mutableIntStateOf(0) }
    var entered by remember { mutableStateOf(false) }
    val alpha by animateFloatAsState(if (entered) 1f else 0f, animationSpec = tween(350), label = "alpha")
    val offset by animateFloatAsState(if (entered) 0f else 80f, animationSpec = tween(350), label = "offset")

    LaunchedEffect(Unit) { entered = true }

    val buyItems = listOf(
        Triple(45, R.drawable.coin, "45 MCoins"),
        Triple(90, R.drawable.coin, "90 MCoins"),
        Triple(120, R.drawable.coin, "120 MCoins"),
        Triple(150, R.drawable.coin, "150 MCoins"),
        Triple(200, R.drawable.coin, "200 MCoins"),
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer { translationX = offset; this.alpha = alpha }
            .background(colors.bg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(bottom = 80.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .then(
                        if (backdrop != null) {
                            Modifier.drawBackdrop(
                                backdrop = backdrop,
                                shape = { CircleShape },
                                effects = {
                                    vibrancy()
                                    blur(2f.dp.toPx())
                                    lens(12f.dp.toPx(), 12f.dp.toPx())
                                },
                                onDrawSurface = {
                                    drawRect(Color.Black.copy(alpha = 0.35f))
                                }
                            )
                        } else {
                            Modifier.background(colors.card)
                        }
                    )
                    .clickable { onBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.ChevronLeft, contentDescription = "Назад", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.weight(1f))
            Text("Купить", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Spacer(Modifier.weight(1f))
            CoinBadge(backdrop = backdrop)
        }

        Spacer(Modifier.height(16.dp))

        Text("${buyItems[selected].first} MCoins", fontSize = 28.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)

        Spacer(Modifier.height(12.dp))

        MCoinsButton(
            onClick = {},
            backdrop = backdrop,
            cornerRadius = 20.dp,
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
            icon = Icons.Rounded.AddCircle,
            iconColor = Color.White,
            label = "Приобрести"
        )

        Spacer(Modifier.height(20.dp))

        val chunked = buyItems.chunked(3)
        chunked.forEach { row ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                row.forEach { (price, resId, name) ->
                    val itemIndex = buyItems.indexOfFirst { it.first == price }
                    val isSelected = itemIndex == selected
                    val itemShape = RoundedCornerShape(20.dp)
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .clip(itemShape)
                            .then(
                                if (isSelected) Modifier.border(2.dp, Color.White.copy(alpha = 0.5f), itemShape)
                                else Modifier
                            )
                            .background(
                                if (isSelected) Color.White.copy(alpha = 0.12f)
                                else colors.card
                            )
                            .clickable { selected = itemIndex }
                            .padding(vertical = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Image(
                                painter = painterResource(resId),
                                contentDescription = name,
                                modifier = Modifier
                                    .size(64.dp)
                                    .clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(Modifier.height(8.dp))
                            Text(name, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                            Spacer(Modifier.height(4.dp))
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                Image(
                                    painter = painterResource(R.drawable.coin),
                                    contentDescription = null,
                                    modifier = Modifier.size(12.dp),
                                    contentScale = ContentScale.Crop
                                )
                                Text("$price", fontSize = 12.sp, color = colors.textSecondary)
                            }
                        }
                    }
                }
                repeat(3 - row.size) {
                    Spacer(Modifier.weight(1f))
                }
            }
            Spacer(Modifier.height(10.dp))
        }

        Spacer(Modifier.height(24.dp))
    }
}

data class GiftItem(
    val id: String,
    val name: String,
    val price: Int,
    val resId: Int,
    val category: String,
    val gradient: List<Long>?
)

val giftItems = listOf(
    GiftItem("mango", "Манго", 50, R.drawable.mango_1f96d, "Фрукты", null),
    GiftItem("parrot", "Попугай", 65, R.drawable.parrot_1f99c, "Животные", null),
    GiftItem("rainbow_flag", "Радуга", 35, R.drawable.rainbow_flag, "Остальное", listOf(0xFFE53935, 0xFFFB8C00, 0xFFFDD835, 0xFF43A047, 0xFF1E88E5, 0xFF8E24AA)),
    GiftItem("moai", "Моаи", 25, R.drawable.moai, "Остальное", listOf(0xFF90A4AE, 0xFF37474F)),
    GiftItem("distorted_face", "Морда", 67, R.drawable.distorted_face, "Остальное", null)
)

@Composable
fun GiftScreen(
    onBack: () -> Unit,
    backdrop: Backdrop?,
    onSent: (String, com.ms.messenger.models.Message?) -> Unit = { _, _ -> },
    fixedRecipient: Pair<String, String>? = null,
) {
    val colors = AppColors.current()
    var entered by remember { mutableStateOf(false) }
    var selectedGift by remember { mutableStateOf<GiftItem?>(null) }
    val alpha by animateFloatAsState(if (entered) 1f else 0f, animationSpec = tween(350), label = "alpha")
    val offset by animateFloatAsState(if (entered) 0f else 80f, animationSpec = tween(350), label = "offset")

    LaunchedEffect(Unit) { entered = true }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .graphicsLayer { translationX = offset; this.alpha = alpha }
            .background(colors.bg)
            .statusBarsPadding()
            .navigationBarsPadding()
            .padding(bottom = 80.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .then(
                        if (backdrop != null) {
                            Modifier.drawBackdrop(
                                backdrop = backdrop,
                                shape = { CircleShape },
                                effects = {
                                    vibrancy()
                                    blur(2f.dp.toPx())
                                    lens(12f.dp.toPx(), 12f.dp.toPx())
                                },
                                onDrawSurface = {
                                    drawRect(Color.Black.copy(alpha = 0.35f))
                                }
                            )
                        } else {
                            Modifier.background(colors.card)
                        }
                    )
                    .clickable { onBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.ChevronLeft, contentDescription = "Назад", tint = colors.textPrimary, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.weight(1f))
            Text("Подарить", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Spacer(Modifier.weight(1f))
            CoinBadge(backdrop = backdrop)
        }

        Spacer(Modifier.height(8.dp))

        val categories = listOf("Животные", "Фрукты", "Остальное")
        categories.forEach { category ->
            val items = giftItems.filter { it.category == category }
            if (items.isEmpty()) return@forEach
            Text(
                category,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = colors.textPrimary,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp)
            )
            Spacer(Modifier.height(8.dp))
            items.chunked(3).forEach { row ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    row.forEach { gift ->
                        val giftShape = RoundedCornerShape(20.dp)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(giftShape)
                                .then(
                                    if (backdrop != null) {
                                        Modifier.drawBackdrop(
                                            backdrop = backdrop,
                                            shape = { giftShape },
                                            effects = {
                                                vibrancy()
                                                blur(2f.dp.toPx())
                                            },
                                            onDrawSurface = {
                                                drawRect(Color.Black.copy(alpha = 0.35f))
                                            }
                                        )
                                    } else {
                                        Modifier.background(colors.card)
                                    }
                                )
                                .clickable { selectedGift = gift }
                                .padding(vertical = 16.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Image(
                                    painter = painterResource(gift.resId),
                                    contentDescription = gift.name,
                                    modifier = Modifier.size(64.dp),
                                    contentScale = ContentScale.Fit
                                )
                                Spacer(Modifier.height(8.dp))
                                Text(gift.name, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                Spacer(Modifier.height(4.dp))
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                    Image(
                                        painter = painterResource(R.drawable.coin),
                                        contentDescription = null,
                                        modifier = Modifier.size(12.dp),
                                        contentScale = ContentScale.Crop
                                    )
                                    Text("${gift.price}", fontSize = 12.sp, color = colors.textSecondary)
                                }
                            }
                        }
                    }
                    repeat(3 - row.size) {
                        Spacer(Modifier.weight(1f))
                    }
                }
                Spacer(Modifier.height(10.dp))
            }
            Spacer(Modifier.height(16.dp))
        }

        Spacer(Modifier.height(24.dp))
    }

    selectedGift?.let { gift ->
        GiftPreviewDialog(
            gift = gift,
            backdrop = backdrop,
            onDismiss = { selectedGift = null },
            onSent = onSent,
            fixedRecipient = fixedRecipient
        )
    }
}

@Composable
fun GiftPreviewDialog(
    gift: GiftItem,
    backdrop: Backdrop?,
    onDismiss: () -> Unit,
    onSent: (String, com.ms.messenger.models.Message?) -> Unit,
    fixedRecipient: Pair<String, String>? = null
) {
    val context = androidx.compose.ui.platform.LocalContext.current
    val scope = rememberCoroutineScope()
    val dialogBackdrop = rememberLayerBackdrop()
    var gradColors by remember { mutableStateOf<List<Color>?>(null) }
    var contacts by remember { mutableStateOf<List<User>>(emptyList()) }
    var recipientId by remember { mutableStateOf(fixedRecipient?.first) }
    var recipientName by remember { mutableStateOf(fixedRecipient?.second) }
    var caption by remember { mutableStateOf("") }
    var anonymous by remember { mutableStateOf(false) }
    var sending by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(gift.resId) {
        if (gift.gradient != null) return@LaunchedEffect
        gradColors = withContext(kotlinx.coroutines.Dispatchers.IO) {
            try {
                val bmp = android.graphics.Bitmap.createBitmap(96, 96, android.graphics.Bitmap.Config.ARGB_8888)
                val canvas = android.graphics.Canvas(bmp)
                context.getDrawable(gift.resId)?.apply {
                    setBounds(0, 0, 96, 96)
                    draw(canvas)
                }
                val palette = androidx.palette.graphics.Palette.from(bmp).generate()
                val c1 = palette.vibrantSwatch?.rgb
                val c2 = palette.darkVibrantSwatch?.rgb
                if (c1 != null || c2 != null) {
                    listOf(Color(c1 ?: c2!!), Color(c2 ?: c1!!))
                } else null
            } catch (_: Exception) { null }
        }
    }

    LaunchedEffect(Unit) {
        if (fixedRecipient == null) {
            contacts = runCatching { ApiClient.getContacts().users }.getOrDefault(emptyList())
        }
    }

    val bgGradient = gradColors?.let { Brush.verticalGradient(it) }
        ?: gift.gradient?.let { Brush.verticalGradient(it.map { c -> Color(c) }) }
        ?: Brush.verticalGradient(listOf(Color(0xFF5A5A6E), Color(0xFF2C2C2E)))

    fun doSend() {
        val targetId = recipientId
        if (targetId == null) {
            error = "Выберите получателя"
            return
        }
        if (sending) return
        sending = true
        error = null
        scope.launch {
            try {
                val resp = ApiClient.sendGift(targetId, gift.id, caption.trim().ifEmpty { null }, anonymous)
                if (resp.error != null) {
                    error = resp.error
                } else {
                    resp.mcoins?.let { PrefsHolder.session.mcoins = it }
                    onSent("Подарок отправлен! 🎁", resp.chatMessage)
                    onDismiss()
                }
            } catch (e: Exception) {
                error = e.message ?: "Ошибка сети"
            }
            sending = false
        }
    }

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onDismiss,
        properties = androidx.compose.ui.window.DialogProperties(
            usePlatformDefaultWidth = false,
            decorFitsSystemWindows = false
        )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(bgGradient)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .statusBarsPadding()
                    .navigationBarsPadding()
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.Start
                ) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .then(
                                if (dialogBackdrop != null) {
                                    Modifier.drawBackdrop(
                                        backdrop = dialogBackdrop,
                                        shape = { CircleShape },
                                        effects = {
                                            vibrancy()
                                            blur(2f.dp.toPx())
                                            lens(12f.dp.toPx(), 12f.dp.toPx())
                                        },
                                        onDrawSurface = {
                                            drawRect(Color.Black.copy(alpha = 0.35f))
                                        }
                                    )
                                } else {
                                    Modifier.background(Color.White.copy(alpha = 0.16f))
                                }
                            )
                            .clickable(onClick = onDismiss),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Rounded.Close, contentDescription = "Закрыть", tint = Color.White, modifier = Modifier.size(22.dp))
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth().padding(top = 2.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Image(
                        painter = painterResource(gift.resId),
                        contentDescription = gift.name,
                        modifier = Modifier.size(104.dp),
                        contentScale = ContentScale.Fit
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        gift.name,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(5.dp)
                    ) {
                        Image(
                            painter = painterResource(R.drawable.coin),
                            contentDescription = null,
                            modifier = Modifier
                                .size(16.dp)
                                .clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Text(
                            "${gift.price}",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                    }
                    Spacer(Modifier.height(16.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp)
                            .heightIn(min = 44.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .background(Color.White.copy(alpha = 0.12f))
                            .padding(horizontal = 16.dp, vertical = 10.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        BasicTextField(
                            value = caption,
                            onValueChange = { if (it.length <= 200) caption = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(fontSize = 15.sp, color = Color.White),
                            cursorBrush = SolidColor(Color.White),
                            maxLines = 2
                        )
                        if (caption.isEmpty()) {
                            Text(
                                "Подпись (необязательно)",
                                fontSize = 15.sp,
                                color = Color.White.copy(alpha = 0.5f)
                            )
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Отправить анонимно",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White,
                            modifier = Modifier.weight(1f)
                        )
                        LiquidToggle(
                            selected = { anonymous },
                            onSelect = { anonymous = it },
                            backdrop = backdrop
                        )
                    }
                }

                Spacer(Modifier.weight(1f))

                Column(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    Column {
                        if (fixedRecipient != null) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(Color.White.copy(alpha = 0.12f))
                                    .padding(horizontal = 16.dp, vertical = 12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    "Для: ${fixedRecipient.second}",
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White,
                                    modifier = Modifier.weight(1f)
                                )
                                Icon(
                                    Icons.Rounded.CardGiftcard,
                                    contentDescription = null,
                                    tint = Color.White,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                        if (fixedRecipient == null && contacts.isNotEmpty()) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(14.dp))
                                    .then(
                                        if (dialogBackdrop != null) {
                                            Modifier.drawBackdrop(
                                                backdrop = dialogBackdrop,
                                                shape = { RoundedCornerShape(14.dp) },
                                                effects = {
                                                    vibrancy()
                                                    blur(2f.dp.toPx())
                                                },
                                                onDrawSurface = {
                                                    drawRect(Color.Black.copy(alpha = 0.35f))
                                                }
                                            )
                                        } else {
                                            Modifier.background(Color.White.copy(alpha = 0.12f))
                                        }
                                    )
                                    .padding(vertical = 4.dp)
                            ) {
                                Column {
                                    contacts.forEach { c ->
                                        Row(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .clickable {
                                                    recipientId = c.userId
                                                    recipientName = c.name
                                                }
                                                .padding(horizontal = 14.dp, vertical = 12.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Text(
                                                c.name,
                                                fontSize = 15.sp,
                                                color = Color.White,
                                                modifier = Modifier.weight(1f)
                                            )
                                            if (recipientId == c.userId) {
                                                Icon(
                                                    Icons.Rounded.Check,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(18.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (error != null) {
                        Text(
                            error!!,
                            fontSize = 13.sp,
                            color = Color(0xFFFF6B6B),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    MCoinsButton(
                        onClick = { doSend() },
                        backdrop = dialogBackdrop,
                        modifier = Modifier.fillMaxWidth(),
                        height = 56.dp,
                        cornerRadius = 20.dp,
                        icon = null,
                        label = if (sending) "Отправка..." else "Подарить"
                    )
                }
            }
        }
    }
}

@Composable
private fun PromoSheet(
    visible: Boolean,
    backdrop: Backdrop?,
    onDismiss: () -> Unit,
    onResult: (String) -> Unit
) {
    val promoBackdrop = rememberLayerBackdrop()
    var inputText by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }

    if (!visible) return

    androidx.compose.ui.window.Dialog(
        onDismissRequest = onDismiss
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black.copy(alpha = 0.5f))
                .clickable(
                    indication = null,
                    interactionSource = remember { MutableInteractionSource() }
                ) { onDismiss() }
                .statusBarsPadding()
                .navigationBarsPadding(),
            contentAlignment = Alignment.BottomCenter
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(
                        indication = null,
                        interactionSource = remember { MutableInteractionSource() }
                    ) {}
            ) {
                GlassCard(
                    modifier = Modifier.fillMaxWidth(),
                    cornerRadius = 36.dp,
                    backdrop = null,
                    blurRadius = 0f,
                    surfaceColor = Color(0xFF1C1C1E)
                ) {
                    Spacer(Modifier.height(10.dp))
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "Введите промокод",
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Medium,
                            color = Color.White.copy(alpha = 0.7f)
                        )
                        Box(
                            modifier = Modifier
                                .align(Alignment.CenterEnd)
                                .clip(RoundedCornerShape(50))
                                .background(Color(0xFF2C2C2E))
                                .clickable {
                                    if (inputText.isNotBlank() && !loading) {
                                        loading = true
                                        error = null
                                    }
                                }
                                .padding(horizontal = 18.dp, vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                if (loading) "..." else "Готово",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color.White
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 4.dp)
                            .clip(RoundedCornerShape(50))
                            .background(Color(0xFF2C2C2E))
                            .padding(horizontal = 18.dp, vertical = 14.dp)
                    ) {
                        if (inputText.isEmpty()) {
                            Text(
                                "Промокод",
                                fontSize = 15.sp,
                                color = Color.White.copy(alpha = 0.35f),
                                modifier = Modifier.align(Alignment.CenterStart)
                            )
                        }
                        BasicTextField(
                            value = inputText,
                            onValueChange = { inputText = it.uppercase(); error = null },
                            modifier = Modifier.fillMaxWidth().align(Alignment.Center),
                            textStyle = TextStyle(
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Medium,
                                color = Color.White
                            ),
                            cursorBrush = SolidColor(Color(0xFF2DA9E3)),
                            maxLines = 1
                        )
                    }

                    Spacer(Modifier.height(10.dp))

                    if (error != null) {
                        Text(
                            error!!,
                            fontSize = 13.sp,
                            color = Color(0xFFFF6B6B),
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 18.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                    }

                    Spacer(Modifier.height(6.dp))
                }
            }
        }
    }

    LaunchedEffect(loading) {
        if (loading && inputText.isNotBlank()) {
            try {
                val resp = ApiClient.redeemPromoCode(inputText.trim())
                if (resp.error != null) {
                    error = resp.error
                } else {
                    PrefsHolder.session.mcoins = resp.mcoins
                    onResult("Активировано +${resp.earned} MCoins!")
                }
            } catch (e: ApiException) {
                error = e.message ?: "Ошибка сети"
            } catch (e: Exception) {
                error = "Ошибка сети"
            }
            loading = false
            inputText = ""
        }
    }
}

@Composable
fun MCoinsScreen(onBack: () -> Unit) {
    val colors = AppColors.current()
    val backdrop = LocalBackdrop.current
    val isLiteMode = LocalLiteMode.current
    var screen by remember { mutableStateOf("main") }
    var showPromo by remember { mutableStateOf(false) }
    var toastMsg by remember { mutableStateOf<String?>(null) }
    val effectiveBackdrop = if (isLiteMode) null else backdrop

    LaunchedEffect(Unit) {
        try {
            val resp = ApiClient.getMCoins()
            if (resp != null) PrefsHolder.session.mcoins = resp.mcoins
        } catch (_: Exception) {}
    }

    Box(modifier = Modifier.fillMaxSize().background(colors.bg)) {
        when (screen) {
            "buy" -> BuyScreen(onBack = { screen = "main" }, backdrop = effectiveBackdrop)
            "gift" -> GiftScreen(
                onBack = { screen = "main" },
                backdrop = effectiveBackdrop,
                onSent = { msg, _ -> toastMsg = msg }
            )
            else -> MCoinsMainTab(
                onBack = onBack,
                onOpenBuy = { screen = "buy" },
                onOpenGift = { screen = "gift" },
                backdrop = effectiveBackdrop,
                colors = colors,
                onShowPromo = { showPromo = true }
            )
        }

        if (toastMsg != null) {
            Box(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 100.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF1C1C1E).copy(alpha = 0.92f))
                    .padding(horizontal = 24.dp, vertical = 14.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(toastMsg!!, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Color.White)
            }
            LaunchedEffect(toastMsg) {
                kotlinx.coroutines.delay(2500)
                toastMsg = null
            }
        }

        PromoSheet(
            visible = showPromo,
            backdrop = effectiveBackdrop,
            onDismiss = { showPromo = false },
            onResult = { msg -> showPromo = false; toastMsg = msg }
        )

    }
}

@Composable
private fun MCoinsMainTab(
    onBack: () -> Unit,
    onOpenBuy: () -> Unit,
    onOpenGift: () -> Unit,
    backdrop: Backdrop?,
    colors: AppThemeColors,
    onShowPromo: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .padding(bottom = 24.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(12.dp))
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .then(
                        if (backdrop != null) {
                            Modifier.drawBackdrop(
                                backdrop = backdrop,
                                shape = { CircleShape },
                                effects = {
                                    vibrancy()
                                    blur(2f.dp.toPx())
                                    lens(12f.dp.toPx(), 12f.dp.toPx())
                                },
                                onDrawSurface = {
                                    drawRect(Color.Black.copy(alpha = 0.35f))
                                }
                            )
                        } else {
                            Modifier.background(colors.card)
                        }
                    )
                    .clickable { onBack() },
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Rounded.ChevronLeft, contentDescription = "Назад", tint = colors.textPrimary, modifier = Modifier.size(26.dp))
            }
            Spacer(Modifier.weight(1f))
            Text("MCoins", fontSize = 17.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
            Spacer(Modifier.weight(1f))
            CoinBadge(backdrop = backdrop)
        }

        Spacer(Modifier.height(24.dp))

        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(140.dp)) {
            Image(
                painter = painterResource(R.drawable.coin),
                contentDescription = "MCoins",
                modifier = Modifier
                    .size(140.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        }

        Spacer(Modifier.height(12.dp))
        Text("MCoins", fontSize = 20.sp, fontWeight = FontWeight.SemiBold, color = colors.textPrimary)
        Spacer(Modifier.height(20.dp))

        GlassCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp), cornerRadius = 28.dp, backdrop = null, surfaceColor = colors.card) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 20.dp)) {
                Text("${PrefsHolder.session.mcoins}", fontSize = 38.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Spacer(Modifier.height(4.dp))
                Text("Ваш баланс", fontSize = 14.sp, color = colors.textSecondary)
                Spacer(Modifier.height(16.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    MCoinsButton(
                        onClick = onOpenBuy,
                        backdrop = backdrop,
                        modifier = Modifier.weight(1f),
                        height = 56.dp,
                        cornerRadius = 26.dp,
                        icon = Icons.Rounded.AddCircle,
                        iconColor = Color.White,
                        label = "Купить"
                    )
                    MCoinsButton(
                        onClick = onOpenGift,
                        backdrop = backdrop,
                        modifier = Modifier.weight(1.15f),
                        height = 56.dp,
                        cornerRadius = 26.dp,
                        icon = Icons.Rounded.CardGiftcard,
                        iconColor = Color.White,
                        label = "Подарить"
                    )
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        GlassCard(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            cornerRadius = 28.dp,
            backdrop = null,
            surfaceColor = colors.card
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(80.dp)
                        .clip(CircleShape)
                        .then(
                            if (backdrop != null) {
                                Modifier.drawBackdrop(
                                    backdrop = backdrop,
                                    shape = { CircleShape },
                                    effects = {
                                        vibrancy()
                                        blur(6f.dp.toPx())
                                        lens(20f.dp.toPx(), 20f.dp.toPx())
                                    },
                                    onDrawSurface = {
                                        drawRect(Color.Black.copy(alpha = 0.25f))
                                    }
                                )
                            } else {
                                Modifier.background(Color.White.copy(alpha = 0.12f))
                            }
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Rounded.LocalOffer,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(36.dp)
                    )
                }
                Spacer(Modifier.height(14.dp))
                Text("Промокод", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Spacer(Modifier.height(4.dp))
                Text(
                    "Введите промокод и получите\nmCoins на свой баланс",
                    fontSize = 13.sp,
                    color = colors.textSecondary,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
                Spacer(Modifier.height(16.dp))
                MCoinsButton(
                    onClick = onShowPromo,
                    backdrop = backdrop,
                    modifier = Modifier.fillMaxWidth(),
                    height = 48.dp,
                    cornerRadius = 20.dp,
                    icon = Icons.Rounded.LocalOffer,
                    iconColor = Color.White,
                    label = "Активировать промокод",
                    labelFontSize = 14.sp
                )
            }
        }

        Spacer(Modifier.height(20.dp))

        GlassCard(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            cornerRadius = 28.dp,
            backdrop = null,
            surfaceColor = colors.card
        ) {
            Column(
                modifier = Modifier.fillMaxWidth().padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("О MCoins", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = colors.textPrimary)
                Spacer(Modifier.height(8.dp))
                Text(
                    "MCoins — внутренняя валюта приложения. Вы можете покупать их, дарить другим пользователям и использовать для покупок внутри приложения.",
                    fontSize = 13.sp,
                    color = colors.textSecondary,
                    textAlign = TextAlign.Center,
                    lineHeight = 18.sp
                )
            }
        }

        Spacer(Modifier.height(40.dp))
    }
}
