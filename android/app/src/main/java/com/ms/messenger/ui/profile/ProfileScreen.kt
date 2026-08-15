package com.ms.messenger.ui.profile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.net.Uri
import android.view.Surface
import android.view.TextureView
import android.view.TextureView.SurfaceTextureListener
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.runtime.*
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEmotions
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.BottomSheetDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.compose.SubcomposeAsyncImage
import coil.request.CachePolicy
import coil.request.ImageRequest
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.common.MediaItem
import androidx.media3.ui.PlayerView
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy
import com.ms.messenger.backdrop.components.GlassCard
import com.ms.messenger.backdrop.components.LiquidCircleButton
import com.ms.messenger.backdrop.components.LiquidSlider
import com.ms.messenger.data.ApiClient
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.i18n.Strings
import com.ms.messenger.models.User
import com.ms.messenger.theme.AppColors
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    userId: String? = null,
    onBack: () -> Unit = {},
    onSettings: () -> Unit = {},
) {
    val colors = AppColors.current()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val isOwnProfile = userId.isNullOrBlank() || userId == PrefsHolder.session.myUserId || userId == PrefsHolder.session.myShortId

    var user by remember {
        mutableStateOf<User?>(null).also {
            if (isOwnProfile) {
                val name = PrefsHolder.session.myName
                val avatar = PrefsHolder.session.myAvatar
                val uid = PrefsHolder.session.myUserId
                val shortId = PrefsHolder.session.myShortId
                val phone = PrefsHolder.session.myPhone
                val bio = PrefsHolder.session.myBio
                if (name != null) {
                    it.value = User(id = shortId ?: uid ?: "", userId = shortId ?: uid ?: "", name = name, avatar = avatar, phone = phone, bio = bio)
                }
            } else if (userId != null) {
                val cached = com.ms.messenger.data.ChatCache.getUser(userId!!)
                if (cached != null) {
                    it.value = User(
                        id = userId!!,
                        userId = userId!!,
                        name = cached.name,
                        avatar = cached.avatar,
                        isOnline = cached.online
                    )
                }
            }
        }
    }

    LaunchedEffect(Unit) {
        if (!isOwnProfile && user == null && userId != null) {
            try {
                val resp = ApiClient.getChats()
                val chat = resp.chats.find { it.peer?.userId == userId }
                if (chat?.peer != null) {
                    user = User(
                        id = chat.peer.userId ?: "",
                        userId = chat.peer.userId ?: "",
                        name = chat.name,
                        avatar = chat.peer.avatar,
                        isOnline = chat.peer.online
                    )
                }
            } catch (_: Exception) {}
        }
    }

    var showEditDialog by remember { mutableStateOf(false) }
    var editName by remember { mutableStateOf("") }
    var editBio by remember { mutableStateOf("") }
    var muted by remember { mutableStateOf(false) }
    var receivedGifts by remember { mutableStateOf<List<com.ms.messenger.models.ReceivedGift>>(emptyList()) }
    var showGiftSheet by remember { mutableStateOf(false) }
    var giftToSend by remember { mutableStateOf<com.ms.messenger.ui.settings.GiftItem?>(null) }
    var viewedGift by remember { mutableStateOf<com.ms.messenger.models.ReceivedGift?>(null) }

    LaunchedEffect(user?.userId) {
        val target = if (isOwnProfile) {
            PrefsHolder.session.myShortId ?: PrefsHolder.session.myUserId
        } else user?.userId ?: userId
        if (target != null) {
            receivedGifts = runCatching { ApiClient.getUserGifts(target).gifts }.getOrDefault(emptyList())
        }
    }

    var mediaItems by remember { mutableStateOf<List<ProfileMedia>>(emptyList()) }
    var viewingMedia by remember { mutableStateOf<ProfileMedia?>(null) }
    var contentTab by remember { mutableStateOf("gifts") }

    LaunchedEffect(userId) {
        android.util.Log.d("MS_MEDIA", "load media, userId=$userId isOwn=$isOwnProfile")
        mediaItems = runCatching {
            val chats = ApiClient.getChats().chats
            val chatsToScan = if (isOwnProfile) {
                chats.filter { it.type == "direct" }.take(5)
            } else {
                chats.filter { it.peer?.userId == userId }
            }
            android.util.Log.d("MS_MEDIA", "chats=${chats.size} scan=${chatsToScan.size}")
            val list = mutableListOf<ProfileMedia>()
            for (c in chatsToScan) {
                if (list.size >= 30) break
                val msgs = ApiClient.getMessages(c.id).messages
                android.util.Log.d("MS_MEDIA", "chat ${c.id} msgs=${msgs.size}")
                for (m in msgs) {
                    val a = m.attachment ?: continue
                    val t = a.type ?: continue
                    val u = a.url ?: continue
                    if (t == "photo" || t == "image" || t == "video") {
                        list += ProfileMedia(u, t, m.time)
                    }
                }
            }
            android.util.Log.d("MS_MEDIA", "media=${list.size}")
            list.takeLast(30).reversed()
        }.getOrDefault(emptyList())
    }

    LaunchedEffect(Unit) {
        if (!isOwnProfile) {
            val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
            val mutedSet = prefs.getStringSet("muted_users", emptySet()) ?: emptySet()
            muted = userId in mutedSet
        }
    }
    var localPreviewUri by remember { mutableStateOf<String?>(null) }
    val displayAvatar = localPreviewUri ?: user?.avatar?.takeIf { it.isNotBlank() }

    var paletteColor by remember {
        mutableStateOf<Color?>(null).also {
            val avatarUrl = displayAvatar ?: PrefsHolder.session.myAvatar ?: return@also
            val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
            val hex = prefs.getString("palette_$avatarUrl", null)
            if (hex != null) {
                try { it.value = Color(android.graphics.Color.parseColor(hex)) } catch (_: Exception) {}
            }
        }
    }
    var showBlurSlider by remember { mutableStateOf(false) }
    var blurLevel by remember { mutableFloatStateOf(0f) }
    var tintLevel by remember { mutableFloatStateOf(1f) }


    var uploading by remember { mutableStateOf(false) }

    fun uploadAvatarBytes(bytes: ByteArray, mimeType: String = "image/jpeg") {
        scope.launch {
            uploading = true
            try {
                val url = ApiClient.uploadAvatar(bytes, mimeType)
                val isVideo = mimeType.startsWith("video/")
                val colorInt = if (!isVideo) {
                    val bmp = withContext(Dispatchers.IO) {
                        android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    }
                    if (bmp != null) {
                        val palette = androidx.palette.graphics.Palette.from(bmp).generate()
                        val sw = palette.dominantSwatch ?: palette.vibrantSwatch ?: palette.mutedSwatch
                        sw?.rgb
                    } else null
                } else {
                    val loader = coil.Coil.imageLoader(context)
                    val req = coil.request.ImageRequest.Builder(context)
                        .data(url).size(64, 64).allowHardware(false).build()
                    val result = withContext(Dispatchers.IO) { loader.execute(req) }
                    val drawable = result.drawable
                    if (drawable is android.graphics.drawable.BitmapDrawable) {
                        val palette = androidx.palette.graphics.Palette.from(drawable.bitmap).generate()
                        val sw = palette.dominantSwatch ?: palette.vibrantSwatch ?: palette.mutedSwatch
                        sw?.rgb
                    } else null
                }
                if (colorInt != null) {
                    val hex = String.format("#%06X", 0xFFFFFF and colorInt)
                    val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
                    prefs.edit().putString("palette_$url", hex).apply()
                }
                val resp = ApiClient.updateProfile(mapOf("avatar" to url))
                user = resp.user
                PrefsHolder.session.myAvatar = url
                localPreviewUri = null
            } catch (_: Exception) {
                localPreviewUri = null
            }
            uploading = false
        }
    }

    fun uploadAvatarUri(uri: Uri) {
        val mimeType = context.contentResolver.getType(uri) ?: "image/jpeg"
        scope.launch {
            val bytes = withContext(Dispatchers.IO) {
                context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
            } ?: return@launch
            val isVideo = mimeType.startsWith("video/")
            val colorInt = if (!isVideo) {
                val bmp = withContext(Dispatchers.IO) {
                    android.graphics.BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                }
                if (bmp != null) {
                    val palette = androidx.palette.graphics.Palette.from(bmp).generate()
                    val sw = palette.dominantSwatch ?: palette.vibrantSwatch ?: palette.mutedSwatch
                    sw?.rgb
                } else null
            } else {
                val loader = coil.Coil.imageLoader(context)
                val req = coil.request.ImageRequest.Builder(context)
                    .data(uri).size(64, 64).allowHardware(false).build()
                val result = withContext(Dispatchers.IO) { loader.execute(req) }
                val drawable = result.drawable
                if (drawable is android.graphics.drawable.BitmapDrawable) {
                    val palette = androidx.palette.graphics.Palette.from(drawable.bitmap).generate()
                    val sw = palette.dominantSwatch ?: palette.vibrantSwatch ?: palette.mutedSwatch
                    sw?.rgb
                } else null
            }
            if (colorInt != null) {
                val hex = String.format("#%06X", 0xFFFFFF and colorInt)
                val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
                prefs.edit().putString("palette_$uri", hex).apply()
            }
            localPreviewUri = uri.toString()
            uploadAvatarBytes(bytes, mimeType)
        }
    }

    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri ?: return@rememberLauncherForActivityResult
        uploadAvatarUri(uri)
    }

    fun formatPhone(raw: String): String {
        val d = raw.filter { it.isDigit() }
        if (d.length <= 3) return "+$d"
        if (d.length <= 6) return "+${d.substring(0, 3)} ${d.substring(3)}"
        return "+${d.substring(0, 3)} ${d.substring(3, 7)} ${d.substring(7, minOf(d.length, 11))}"
    }

    LaunchedEffect(Unit) {
        if (isOwnProfile) {
            scope.launch {
                try {
                    val resp = ApiClient.me()
                    val local = PrefsHolder.session.myAvatar
                    val server = resp.user.avatar
                    user = if (local != null && local != server) {
                        resp.user.copy(avatar = local)
                    } else {
                        resp.user
                    }
                    PrefsHolder.session.myUserId = resp.user.id
                    PrefsHolder.session.myShortId = resp.user.userId
                    PrefsHolder.session.myName = resp.user.name
                    if (local == null || local == server) {
                        PrefsHolder.session.myAvatar = resp.user.avatar
                    }
                    PrefsHolder.session.myPhone = resp.user.phone
                    PrefsHolder.session.myBio = resp.user.bio
                    editName = resp.user.name; editBio = resp.user.bio ?: ""
                } catch (_: Exception) {}
            }
        } else {
            scope.launch {
                try {
                    val resp = ApiClient.getUser(userId!!)
                    user = resp.user
                } catch (_: Exception) {}
            }
        }
    }

    val screenBackdrop = rememberLayerBackdrop()
    val isDark = colors.isDark
    val iconTint = Color.White
    val bgColorDefault = Color(0xFF1A1A2E)
    val fallbackTop = if (isDark) Color(0xFF3A3A3C) else Color(0xFFF2F2F7)
    val fallbackBottom = if (isDark) Color(0xFF232326) else Color(0xFFE5E5EA)
    val bgColorBottom = paletteColor?.let {
        val mix = 0.55f * tintLevel
        Color(it.red * mix, it.green * mix, it.blue * mix)
    } ?: fallbackBottom
    val isVideoAvatar = remember(displayAvatar) {
        displayAvatar?.let { it.endsWith(".mp4") || it.endsWith(".webm") || it.endsWith(".mov") } ?: false
    }
    var videoColor by remember {
        mutableStateOf<Color?>(null).also {
            if (!isVideoAvatar) return@also
            val avatarUrl = displayAvatar ?: return@also
            val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
            val hex = prefs.getString("palette_$avatarUrl", null)
            if (hex != null) {
                try { it.value = Color(android.graphics.Color.parseColor(hex)) } catch (_: Exception) {}
            }
        }
    }

    LaunchedEffect(displayAvatar) {
        val avatarUrl = displayAvatar ?: return@LaunchedEffect
        val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
        val cachedHex = prefs.getString("palette_$avatarUrl", null)
        val c = if (cachedHex != null) {
            try { android.graphics.Color.parseColor(cachedHex) } catch (_: Exception) { 0 }
        } else try {
            val loader = coil.Coil.imageLoader(context)
            val request = coil.request.ImageRequest.Builder(context)
                .data(avatarUrl).size(64, 64).allowHardware(false).build()
            val result = loader.execute(request)
            val drawable = result.drawable
            if (drawable is android.graphics.drawable.BitmapDrawable) {
                val bmp = drawable.bitmap
                val palette = androidx.palette.graphics.Palette.from(bmp).generate()
                val sw = palette.dominantSwatch ?: palette.vibrantSwatch ?: palette.mutedSwatch
                sw?.rgb ?: 0
            } else 0
        } catch (_: Exception) { 0 }
        if (c != 0) {
            val color = Color(android.graphics.Color.red(c) / 255f, android.graphics.Color.green(c) / 255f, android.graphics.Color.blue(c) / 255f)
            if (cachedHex == null) {
                val hex = String.format("#%06X", 0xFFFFFF and c)
                prefs.edit().putString("palette_$avatarUrl", hex).apply()
            }
            paletteColor = color
            videoColor = color
        }
    }

    val cardFallback = Color(0xFF333338)
    val bgColorCard = (videoColor ?: paletteColor)?.let {
        val mix = 0.85f * tintLevel
        Color(it.red * mix, it.green * mix, it.blue * mix)
    } ?: cardFallback
    val bgColorShade = videoColor?.let {
        Color(it.red * 0.4f, it.green * 0.4f, it.blue * 0.4f)
    } ?: fallbackTop
    val blurPx = blurLevel * 2f
    val exoPlayer = remember(displayAvatar) {
        if (isVideoAvatar && displayAvatar != null) {
            ExoPlayer.Builder(context).build().apply {
                setMediaItem(MediaItem.fromUri(displayAvatar!!))
                repeatMode = ExoPlayer.REPEAT_MODE_ALL
                playWhenReady = true
                volume = 0f
                prepare()
            }
        } else null
    }
    DisposableEffect(exoPlayer) {
        onDispose { exoPlayer?.release() }
    }


    val avatarRequest = remember(displayAvatar) {
        displayAvatar?.let {
            ImageRequest.Builder(context)
                .data(it)
                .memoryCacheKey(it)
                .diskCacheKey(it)
                .build()
        }
    }

    val effectiveBgColor = videoColor ?: bgColorBottom

    Box(modifier = Modifier.fillMaxSize()) {
        Box(modifier = Modifier.fillMaxSize().navigationBarsPadding().background(effectiveBgColor)) {
            Box(modifier = Modifier.fillMaxSize().layerBackdrop(screenBackdrop)) {
                if (isVideoAvatar && exoPlayer != null) {
                    var videoReady by remember { mutableStateOf(false) }
                    val listener = remember {
                        object : androidx.media3.common.Player.Listener {
                            override fun onRenderedFirstFrame() {
                                videoReady = true
                            }
                        }
                    }
                    DisposableEffect(exoPlayer) {
                        exoPlayer?.addListener(listener)
                        onDispose { exoPlayer?.removeListener(listener) }
                    }
                    val textureView = remember(displayAvatar) { TextureView(context) }
                    var videoSurface by remember { mutableStateOf<Surface?>(null) }
                    DisposableEffect(textureView) {
                        val listener = object : SurfaceTextureListener {
                            override fun onSurfaceTextureAvailable(s: android.graphics.SurfaceTexture, w: Int, h: Int) {
                                videoSurface = Surface(s)
                            }
                            override fun onSurfaceTextureSizeChanged(s: android.graphics.SurfaceTexture, w: Int, h: Int) {}
                            override fun onSurfaceTextureDestroyed(s: android.graphics.SurfaceTexture): Boolean {
                                videoSurface = null
                                return true
                            }
                            override fun onSurfaceTextureUpdated(s: android.graphics.SurfaceTexture) {}
                        }
                        textureView.surfaceTextureListener = listener
                        onDispose { textureView.surfaceTextureListener = null }
                    }
                    LaunchedEffect(exoPlayer, videoSurface) {
                        val p = exoPlayer ?: return@LaunchedEffect
                        val s = videoSurface ?: return@LaunchedEffect
                        p.setVideoSurface(s)
                    }
                    AndroidView(
                        factory = { textureView },
                        modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f)
                    )
                    AnimatedVisibility(
                        visible = !videoReady && avatarRequest != null,
                        exit = fadeOut(tween(400))
                    ) {
                        AsyncImage(
                            model = avatarRequest,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f)
                        )
                    }
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(9f / 16f)
                            .background(Brush.verticalGradient(
                                0f to Color.Transparent,
                                0.55f to Color.Transparent,
                                0.75f to effectiveBgColor.copy(alpha = 0.5f),
                                0.9f to effectiveBgColor.copy(alpha = 0.85f),
                                1f to effectiveBgColor
                            ))
                    )
                } else if (avatarRequest != null) {
                    SubcomposeAsyncImage(model = avatarRequest,
                        contentDescription = null, contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f),
                        error = {
                            ProfileLetterBox(
                                name = user?.name,
                                modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f)
                            )
                        },
                        loading = {
                            ProfileLetterBox(
                                name = user?.name,
                                modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f)
                            )
                        })
                } else if (!user?.name.isNullOrBlank()) {
                    ProfileLetterBox(
                        name = user?.name,
                        modifier = Modifier.fillMaxWidth().aspectRatio(9f / 16f)
                    )
                }
                Box(modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(
                    0f to Color.Transparent,
                    0.2f to Color.Transparent,
                    0.3f to bgColorShade.copy(alpha = 0.8f),
                    0.36f to effectiveBgColor,
                    1f to effectiveBgColor)))
            }

            if (!isOwnProfile) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopStart)
                        .statusBarsPadding()
                        .padding(start = 12.dp, top = 12.dp)
                        .size(56.dp)
                        .drawBackdrop(
                            backdrop = screenBackdrop,
                            shape = { CircleShape },
                            effects = {
                                vibrancy()
                                blur(2f.dp.toPx())
                                lens(12f.dp.toPx(), 24f.dp.toPx())
                            },
                            onDrawSurface = {}
                        )
                        .clickable { onBack() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Назад", tint = Color.White, modifier = Modifier.size(24.dp))
                }
            }

            Column(modifier = Modifier.fillMaxSize().statusBarsPadding().verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.height(if (isOwnProfile) 365.dp else 400.dp))
                GlassCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp), cornerRadius = 28.dp, backdrop = null, surfaceColor = bgColorCard) {
                    if (!user?.phone.isNullOrBlank()) {
                        Text("Телефон", fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f))
                        Spacer(Modifier.height(2.dp))
                        Text(formatPhone(user!!.phone!!), fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Color.White)
                        Spacer(Modifier.height(12.dp)); HorizontalDivider(color = Color.White.copy(alpha = 0.1f), thickness = 0.5.dp); Spacer(Modifier.height(12.dp))
                    }
                    Text("ID", fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f))
                    Spacer(Modifier.height(2.dp))
                    Text("@${user?.userId ?: ""}", fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Color.White)
                }
                if (!user?.bio.isNullOrBlank()) {
                    Spacer(Modifier.height(10.dp))
                    GlassCard(modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp), cornerRadius = 28.dp, backdrop = null, surfaceColor = bgColorCard) {
                        Text("О себе", fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f))
                        Spacer(Modifier.height(2.dp)); Text(user!!.bio!!, fontSize = 15.sp, color = Color.White)
                    }
                }
                if (receivedGifts.isNotEmpty() || mediaItems.isNotEmpty()) {
                    Spacer(Modifier.height(14.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (receivedGifts.isNotEmpty()) {
                            val selected = contentTab == "gifts"
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(50))
                                    .background(
                                        if (selected) colors.accent.copy(alpha = 0.25f)
                                        else if (isDark) Color.White.copy(alpha = 0.08f)
                                        else Color.Black.copy(alpha = 0.06f)
                                    )
                                    .clickable { contentTab = "gifts" }
                                    .padding(vertical = 7.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "Подарки",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }
                        if (mediaItems.isNotEmpty()) {
                            val selected = contentTab == "media"
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(50))
                                    .background(
                                        if (selected) colors.accent.copy(alpha = 0.25f)
                                        else if (isDark) Color.White.copy(alpha = 0.08f)
                                        else Color.Black.copy(alpha = 0.06f)
                                    )
                                    .clickable { contentTab = "media" }
                                    .padding(vertical = 7.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    "Медиа",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White.copy(alpha = 0.9f)
                                )
                            }
                        }
                    }
                    Spacer(Modifier.height(10.dp))
                    if (contentTab == "media") {
                        mediaItems.chunked(3).forEach { row ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                row.forEach { m ->
                                    Box(
                                        modifier = Modifier
                                            .weight(1f)
                                            .aspectRatio(1f)
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(
                                                if (isDark) Color.White.copy(alpha = 0.08f)
                                                else Color.Black.copy(alpha = 0.06f)
                                            )
                                            .clickable { viewingMedia = m }
                                    ) {
                                        AsyncImage(
                                            model = m.url,
                                            contentDescription = null,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize()
                                        )
                                        if (m.type == "video") {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxSize()
                                                    .background(Color.Black.copy(alpha = 0.3f)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Icon(
                                                    Icons.Rounded.PlayArrow,
                                                    contentDescription = null,
                                                    tint = Color.White,
                                                    modifier = Modifier.size(36.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                                if (row.size == 2) {
                                    Spacer(Modifier.weight(1f))
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                        }
                    } else {
                        receivedGifts.take(30).chunked(3).forEach { row ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                row.forEach { g ->
                                    val item = com.ms.messenger.ui.settings.giftItems.find { it.id == g.gift?.id }
                                    Column(
                                        modifier = Modifier
                                            .weight(1f)
                                            .then(if (row.size == 1) Modifier.height(96.dp) else Modifier.aspectRatio(1f))
                                            .clip(RoundedCornerShape(20.dp))
                                            .background(
                                                if (isDark) Color.White.copy(alpha = 0.08f)
                                                else Color.Black.copy(alpha = 0.06f)
                                            )
                                            .clickable { viewedGift = g }
                                            .padding(vertical = 10.dp),
                                        horizontalAlignment = Alignment.CenterHorizontally
                                    ) {
                                        if (item != null) {
                                            Image(
                                                painter = androidx.compose.ui.res.painterResource(item.resId),
                                                contentDescription = item.name,
                                                modifier = Modifier.size(48.dp),
                                                contentScale = ContentScale.Fit
                                            )
                                        } else {
                                            Text(g.gift?.emoji ?: "🎁", fontSize = 36.sp)
                                        }
                                        Spacer(Modifier.height(6.dp))
                                        Text(
                                            g.gift?.title ?: "Подарок",
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Medium,
                                            color = Color.White.copy(alpha = 0.8f),
                                            maxLines = 1,
                                            overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                                        )
                                    }
                                }
                                if (row.size == 2) {
                                    Spacer(Modifier.weight(1f))
                                }
                            }
                            Spacer(Modifier.height(10.dp))
                        }
                    }
                }
                Spacer(Modifier.height(32.dp))
            }

            Column(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .statusBarsPadding()
                    .padding(top = 205.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 24.dp)
                ) {
                    Text(
                        user?.name ?: "...",
                        fontSize = 30.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    if (user?.verified == true) {
                        Spacer(Modifier.width(2.dp))
                        Icon(
                            painter = androidx.compose.ui.res.painterResource(
                                if (user?.verifyType == "dev") com.ms.messenger.R.drawable.ic_badge_dev
                                else com.ms.messenger.R.drawable.ic_badge_verif
                            ),
                            contentDescription = "Верифицирован",
                            tint = Color.Unspecified,
                            modifier = Modifier.size(34.dp).offset(y = 4.dp)
                        )
                    }
                }
                if (!isOwnProfile) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        if (user?.isOnline == true) "online" else "не в сети",
                        fontSize = 14.sp, color = Color.White.copy(alpha = 0.6f)
                    )
                }
                Spacer(Modifier.height(if (isOwnProfile) 18.dp else 24.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                if (isOwnProfile) {
                    LiquidCircleButton(onClick = { galleryLauncher.launch("*/*") }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color.Transparent) {
                        Icon(Icons.Filled.CameraAlt, null, tint = iconTint, modifier = Modifier.size(28.dp))
                    }
                    LiquidCircleButton(onClick = { showEditDialog = true }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color.Transparent) {
                        Icon(Icons.Filled.Edit, null, tint = iconTint, modifier = Modifier.size(28.dp))
                    }
                    LiquidCircleButton(onClick = { showBlurSlider = !showBlurSlider }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color.Transparent) {
                        Icon(Icons.Filled.Settings, null, tint = iconTint, modifier = Modifier.size(28.dp))
                    }
                } else {
                    LiquidCircleButton(onClick = { }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color(0xFF2A2A2E).copy(alpha = 0.72f)) {
                        Icon(Icons.Filled.Phone, null, tint = iconTint, modifier = Modifier.size(28.dp))
                    }
                    LiquidCircleButton(onClick = {
                        muted = !muted
                        val prefs = context.getSharedPreferences("ms_session", Context.MODE_PRIVATE)
                        val mutedSet = (prefs.getStringSet("muted_users", emptySet()) ?: emptySet()).toMutableSet()
                        if (muted) mutedSet.add(userId!!) else mutedSet.remove(userId!!)
                        prefs.edit().putStringSet("muted_users", mutedSet).apply()
                    }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color(0xFF2A2A2E).copy(alpha = 0.72f)) {
                        Icon(
                            if (muted) Icons.Filled.NotificationsOff else Icons.Filled.Notifications,
                            null, tint = if (muted) Color.Red.copy(alpha = 0.8f) else iconTint,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                    LiquidCircleButton(onClick = { showGiftSheet = true }, backdrop = screenBackdrop, size = 64.dp, surfaceColor = Color(0xFF2A2A2E).copy(alpha = 0.72f)) {
                        GiftCanvasIcon(tint = iconTint, modifier = Modifier.size(28.dp))
                    }
                }
                }
            }
        }

        AnimatedVisibility(visible = showBlurSlider, enter = fadeIn(), exit = fadeOut(),
            modifier = Modifier.align(Alignment.BottomCenter).padding(horizontal = 20.dp).padding(bottom = 12.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(24.dp))
                    .background(Color.Black.copy(alpha = 0.65f))
                    .padding(horizontal = 20.dp, vertical = 16.dp)
            ) {
                Column {
                    Text("Размытие профиля", fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
                    Spacer(Modifier.height(8.dp))
                    LiquidSlider(
                        value = { blurLevel },
                        onValueChange = { blurLevel = it },
                        valueRange = 0f..10f,
                        visibilityThreshold = 0.5f,
                        backdrop = screenBackdrop,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Spacer(Modifier.height(4.dp))
                    Text("${"%.0f".format(blurLevel)} / 10", fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f))
                    if (paletteColor != null) {
                        Spacer(Modifier.height(14.dp))
                        Text("Оттенок аватара", fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
                        Spacer(Modifier.height(8.dp))
                        LiquidSlider(
                            value = { tintLevel },
                            onValueChange = { tintLevel = it },
                            valueRange = 0f..1f,
                            visibilityThreshold = 0.01f,
                            backdrop = screenBackdrop,
                            modifier = Modifier.fillMaxWidth()
                        )
                        Spacer(Modifier.height(4.dp))
                        Text("${"%.0f".format(tintLevel * 100)}%", fontSize = 12.sp, color = Color.White.copy(alpha = 0.5f))
                    }
                }
            }
        }
    }

    if (showGiftSheet) {
        ModalBottomSheet(
            onDismissRequest = { showGiftSheet = false },
            sheetState = rememberModalBottomSheetState(),
            containerColor = if (isDark) Color(0xFF1E1E1E) else Color.White,
            contentColor = colors.textPrimary,
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(bottom = 16.dp)
            ) {
                Text(
                    "Выберите подарок",
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = colors.textPrimary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                )
                val categories = listOf("Животные", "Фрукты", "Остальное")
                categories.forEach { category ->
                    val items = com.ms.messenger.ui.settings.giftItems.filter { it.category == category }
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
                                val wide = row.size == 1
                                val giftShape = if (wide) RoundedCornerShape(26.dp) else RoundedCornerShape(20.dp)
                                Box(
                                    modifier = Modifier
                                        .weight(if (wide) 3f else 1f)
                                        .clip(giftShape)
                                        .background(if (isDark) Color(0xFF2A2A2E) else Color(0xFFE5E5EA))
                                        .clickable {
                                            showGiftSheet = false
                                            giftToSend = gift
                                        }
                                        .padding(vertical = if (wide) 6.dp else 16.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Image(
                                            painter = androidx.compose.ui.res.painterResource(gift.resId),
                                            contentDescription = gift.name,
                                            modifier = Modifier.size(if (wide) 40.dp else 64.dp),
                                            contentScale = ContentScale.Fit
                                        )
                                        Spacer(Modifier.height(if (wide) 2.dp else 8.dp))
                                        Text(gift.name, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = colors.textPrimary)
                                        Spacer(Modifier.height(4.dp))
                                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                                            Image(
                                                painter = androidx.compose.ui.res.painterResource(com.ms.messenger.R.drawable.coin),
                                                contentDescription = null,
                                                modifier = Modifier.size(12.dp),
                                                contentScale = ContentScale.Crop
                                            )
                                            Text("${gift.price}", fontSize = 12.sp, color = colors.textSecondary)
                                        }
                                    }
                                }
                            }
                            if (row.size == 2) {
                                Spacer(Modifier.weight(1f))
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                    }
                    Spacer(Modifier.height(8.dp))
                }
            }
        }
    }

    giftToSend?.let { gift ->
        com.ms.messenger.ui.settings.GiftPreviewDialog(
            gift = gift,
            backdrop = screenBackdrop,
            onDismiss = { giftToSend = null },
            onSent = { msg, _ ->
                Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
            },
            fixedRecipient = (user?.userId ?: userId)?.let { it to (user?.name ?: "") }
        )
    }

    viewedGift?.let { rg ->
        androidx.compose.ui.window.Dialog(
            onDismissRequest = { viewedGift = null },
            properties = androidx.compose.ui.window.DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clickable(
                        indication = null,
                        interactionSource = remember { MutableInteractionSource() }
                    ) { viewedGift = null },
                contentAlignment = Alignment.BottomCenter
            ) {
                AnimatedVisibility(
                    visible = true,
                    enter = slideInVertically(tween(350)) { it } + fadeIn(tween(350))
                ) {
                    val item = com.ms.messenger.ui.settings.giftItems.find { it.id == rg.gift?.id }
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 19.dp)
                            .clip(RoundedCornerShape(28.dp))
                            .background(
                                Brush.verticalGradient(
                                    listOf(Color(0xFF3A3A3E), Color(0xFF2A2A2E))
                                )
                            )
                            .padding(horizontal = 24.dp, vertical = 28.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        if (item != null) {
                            Image(
                                painter = androidx.compose.ui.res.painterResource(item.resId),
                                contentDescription = item.name,
                                modifier = Modifier.size(140.dp),
                                contentScale = ContentScale.Fit
                            )
                        } else {
                            Text(rg.gift?.emoji ?: "🎁", fontSize = 96.sp)
                        }
                        Spacer(Modifier.height(14.dp))
                        Text(
                            rg.gift?.title ?: "Подарок",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Spacer(Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                "Подарок от ${rg.sender?.name ?: "Аноним"}",
                                fontSize = 15.sp,
                                color = Color.White.copy(alpha = 0.85f)
                            )
                            if (user?.verified == true && rg.sender?.userId == user?.userId) {
                                Spacer(Modifier.width(4.dp))
                                Icon(
                                    painter = androidx.compose.ui.res.painterResource(
                                        if (user?.verifyType == "dev") com.ms.messenger.R.drawable.ic_badge_dev
                                        else com.ms.messenger.R.drawable.ic_badge_verif
                                    ),
                                    contentDescription = "Верифицирован",
                                    tint = Color.Unspecified,
                                    modifier = Modifier.size(18.dp)
                                )
                            }
                        }
                        Spacer(Modifier.height(10.dp))
                        val dateText = remember(rg.createdAt) {
                            val f = java.text.SimpleDateFormat(
                                "HH:mm, d MMMM yyyy",
                                java.util.Locale("ru")
                            )
                            f.format(java.util.Date(rg.createdAt))
                        }
                        Text(
                            dateText,
                            fontSize = 13.sp,
                            color = Color.White.copy(alpha = 0.6f)
                        )
                        Spacer(Modifier.height(16.dp))
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(50))
                                .background(Color.White.copy(alpha = 0.08f))
                                .padding(horizontal = 18.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "${rg.gift?.price ?: item?.price ?: 0} MCoins",
                                fontSize = 15.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color.White.copy(alpha = 0.9f)
                            )
                        }
                        if (isOwnProfile && rg.gift?.price ?: 0 > 6) {
                            val sellable = System.currentTimeMillis() - rg.createdAt <= 3L * 24 * 60 * 60 * 1000
                            Spacer(Modifier.height(16.dp))
                            val sellPrice = (rg.gift?.price ?: item?.price ?: 0) - 6
                            if (sellable) {
                                var selling by remember(rg.id) { mutableStateOf(false) }
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(50))
                                        .background(Color(0xFF4CAF50))
                                        .clickable(enabled = !selling) {
                                            selling = true
                                            scope.launch {
                                                val resp = runCatching { ApiClient.sellGift(rg.id) }.getOrNull()
                                                if (resp != null && resp.error == null) {
                                                    resp.mcoins.takeIf { it > 0 || it == 0 }?.let { PrefsHolder.session.mcoins = it }
                                                    receivedGifts = receivedGifts.filterNot { it.id == rg.id }
                                                    viewedGift = null
                                                    Toast.makeText(context, "Подарок продан за $sellPrice MCoins", Toast.LENGTH_SHORT).show()
                                                } else {
                                                    selling = false
                                                    Toast.makeText(context, resp?.error ?: "Ошибка продажи", Toast.LENGTH_SHORT).show()
                                                }
                                            }
                                        }
                                        .padding(vertical = 14.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        if (selling) "Продажа..." else "Продать за $sellPrice MCoins",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White
                                    )
                                }
                            } else {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clip(RoundedCornerShape(50))
                                        .background(Color.White.copy(alpha = 0.08f))
                                        .padding(vertical = 14.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        "Продажа недоступна (3 дня истекли)",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color.White.copy(alpha = 0.5f)
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(20.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(50))
                                .background(colors.accent)
                                .clickable { viewedGift = null }
                                .padding(vertical = 14.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "ОК",
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isDark) Color.White else Color(0xFF000000)
                            )
                        }
                    }
                }
            }
        }
    }

    viewingMedia?.let { m ->
        androidx.compose.ui.window.Dialog(onDismissRequest = { viewingMedia = null }) {
            if (m.type == "video") {
                MediaVideoViewer(url = m.url, onClose = { viewingMedia = null })
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(Color.Black)
                        .clickable(
                            indication = null,
                            interactionSource = remember { MutableInteractionSource() }
                        ) { viewingMedia = null },
                    contentAlignment = Alignment.Center
                ) {
                    AsyncImage(
                        model = m.url,
                        contentDescription = null,
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize().padding(8.dp)
                    )
                }
            }
        }
    }

    AnimatedVisibility(
        visible = showEditDialog,
        enter = slideInVertically(tween(350)) { it } + fadeIn(tween(350)),
        exit = slideOutVertically(tween(300)) { it } + fadeOut(tween(200))
    ) {
        val inputBg = if (isDark) Color(0xFF2C2C2E) else Color(0xFFE5E5EA)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(colors.bg)
                .statusBarsPadding()
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(start = 16.dp, end = 16.dp, top = 12.dp, bottom = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(Color.Black.copy(alpha = 0.06f))
                            .clickable { showEditDialog = false }
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Назад",
                            tint = colors.textPrimary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Text(
                        "Редактировать профиль",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = colors.textPrimary,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                    Spacer(Modifier.weight(1f))
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .clickable {
                                showEditDialog = false
                                scope.launch {
                                    try {
                                        val body = mutableMapOf<String, Any?>()
                                        if (editName.isNotBlank()) body["name"] = editName.trim()
                                        body["bio"] = editBio.trim().ifBlank { null }
                                        val resp = ApiClient.updateProfile(body)
                                        user = resp.user
                                        PrefsHolder.session.myName = resp.user.name
                                    } catch (_: Exception) {}
                                }
                            }
                            .padding(10.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Filled.Check,
                            contentDescription = "Сохранить",
                            tint = colors.accent,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Spacer(Modifier.height(8.dp))

                    Box(contentAlignment = Alignment.Center) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(user?.avatar)
                                .memoryCacheKey(user?.avatar)
                                .diskCacheKey(user?.avatar)
                                .build(),
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .size(110.dp)
                                .clip(CircleShape)
                                .background(inputBg)
                        )
                    }

                    Spacer(Modifier.height(8.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            user?.name ?: "",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.Bold,
                            color = colors.textPrimary
                        )
                        if (user?.verified == true) {
                            Spacer(Modifier.width(2.dp))
                            Icon(
                                painter = androidx.compose.ui.res.painterResource(
                                    if (user?.verifyType == "dev") com.ms.messenger.R.drawable.ic_badge_dev
                                    else com.ms.messenger.R.drawable.ic_badge_verif
                                ),
                                contentDescription = "Верифицирован",
                                tint = Color.Unspecified,
                                modifier = Modifier.size(28.dp).offset(y = 3.dp)
                            )
                        }
                    }

                    Spacer(Modifier.height(24.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(colors.card)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { galleryLauncher.launch("*/*") }
                                .padding(start = 12.dp, end = 16.dp, top = 14.dp, bottom = 14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Filled.CameraAlt,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                "Изменить фото профиля",
                                fontSize = 15.sp,
                                color = colors.textPrimary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                        HorizontalDivider(color = colors.textPrimary.copy(alpha = 0.06f), thickness = 0.5.dp)
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp, vertical = 14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Filled.EmojiEmotions,
                                contentDescription = null,
                                tint = colors.textSecondary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(Modifier.width(12.dp))
                            Text(
                                "Установить эмодзи-статус",
                                fontSize = 15.sp,
                                color = colors.textPrimary,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    Spacer(Modifier.height(16.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(colors.card)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "Имя",
                            fontSize = 12.sp,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(top = 10.dp, start = 8.dp)
                        )
                        BasicTextField(
                            value = editName,
                            onValueChange = { editName = it },
                            singleLine = true,
                            textStyle = TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                            cursorBrush = SolidColor(colors.accent),
                            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 2.dp)
                        )
                        HorizontalDivider(color = colors.textPrimary.copy(alpha = 0.06f), thickness = 0.5.dp)
                        Text(
                            "О себе",
                            fontSize = 12.sp,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(top = 10.dp, start = 8.dp)
                        )
                        BasicTextField(
                            value = editBio,
                            onValueChange = { editBio = it },
                            singleLine = true,
                            textStyle = TextStyle(color = colors.textPrimary, fontSize = 16.sp),
                            cursorBrush = SolidColor(colors.accent),
                            modifier = Modifier.fillMaxWidth().padding(start = 8.dp, top = 2.dp, bottom = 10.dp)
                        )
                    }

                    Spacer(Modifier.height(16.dp))

                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(colors.card)
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Text(
                            "Телефон",
                            fontSize = 12.sp,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(top = 10.dp, start = 8.dp)
                        )
                        Text(
                            formatPhone(user?.phone ?: ""),
                            fontSize = 16.sp,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(start = 8.dp, top = 2.dp, bottom = 10.dp)
                        )
                        HorizontalDivider(color = colors.textPrimary.copy(alpha = 0.06f), thickness = 0.5.dp)
                        Text(
                            "Имя пользователя",
                            fontSize = 12.sp,
                            color = colors.textSecondary,
                            modifier = Modifier.padding(top = 10.dp, start = 8.dp)
                        )
                        Text(
                            "@${user?.userId ?: ""}",
                            fontSize = 16.sp,
                            color = colors.textPrimary,
                            modifier = Modifier.padding(start = 8.dp, top = 2.dp, bottom = 10.dp)
                        )
                    }

                    Spacer(Modifier.height(40.dp))
                }
            }
        }
    }
}

@Composable
private fun ProfileLetterBox(name: String?, modifier: Modifier = Modifier) {
    val safeName = name?.trim()
    if (safeName.isNullOrBlank()) return
    val isDark = AppColors.current().isDark
    val letterBg = remember(safeName, isDark) {
        if (isDark) {
            Brush.linearGradient(listOf(Color(0xFF3A3A3C), Color(0xFF232326)))
        } else {
            Brush.linearGradient(listOf(Color.White, Color(0xFFE5E5EA)))
        }
    }
    Box(
        modifier = modifier.background(letterBg),
        contentAlignment = Alignment.TopCenter
    ) {
        Text(
            safeName.first().uppercase(),
            fontSize = 80.sp,
            fontWeight = FontWeight.Bold,
            color = if (isDark) Color.White.copy(alpha = 0.85f) else Color.Black.copy(alpha = 0.45f),
            modifier = Modifier.padding(top = 160.dp)
        )
    }
}

@Composable
private fun GiftCanvasIcon(tint: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.17f, h * 0.43f),
            size = Size(w * 0.66f, h * 0.46f),
            cornerRadius = CornerRadius(w * 0.05f, w * 0.05f)
        )
        drawRoundRect(
            color = tint,
            topLeft = Offset(w * 0.08f, h * 0.26f),
            size = Size(w * 0.84f, h * 0.22f),
            cornerRadius = CornerRadius(w * 0.05f, w * 0.05f)
        )
        drawRect(
            color = tint,
            topLeft = Offset(w * 0.44f, h * 0.26f),
            size = Size(w * 0.12f, h * 0.63f)
        )
        drawCircle(color = tint, radius = w * 0.13f, center = Offset(w * 0.34f, h * 0.21f))
        drawCircle(color = tint, radius = w * 0.13f, center = Offset(w * 0.66f, h * 0.21f))
        drawCircle(color = Color.White, radius = w * 0.07f, center = Offset(w * 0.50f, h * 0.21f))
    }
}

private data class ProfileMedia(val url: String, val type: String, val time: String)

@Composable
private fun MediaVideoViewer(url: String, onClose: () -> Unit) {
    val context = LocalContext.current
    val exoPlayer = remember(url) {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(url))
            repeatMode = ExoPlayer.REPEAT_MODE_ALL
            playWhenReady = true
            prepare()
        }
    }
    DisposableEffect(exoPlayer) {
        onDispose { exoPlayer.release() }
    }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .clickable(
                indication = null,
                interactionSource = remember { MutableInteractionSource() }
            ) { onClose() }
    ) {
        val textureView = remember(url) { TextureView(context) }
        var videoSurface by remember { mutableStateOf<android.view.Surface?>(null) }
        DisposableEffect(textureView) {
            val listener = object : SurfaceTextureListener {
                override fun onSurfaceTextureAvailable(s: android.graphics.SurfaceTexture, w: Int, h: Int) {
                    videoSurface = android.view.Surface(s)
                }
                override fun onSurfaceTextureSizeChanged(s: android.graphics.SurfaceTexture, w: Int, h: Int) {}
                override fun onSurfaceTextureDestroyed(s: android.graphics.SurfaceTexture): Boolean {
                    videoSurface = null
                    return true
                }
                override fun onSurfaceTextureUpdated(s: android.graphics.SurfaceTexture) {}
            }
            textureView.surfaceTextureListener = listener
            onDispose { textureView.surfaceTextureListener = null }
        }
        LaunchedEffect(exoPlayer, videoSurface) {
            exoPlayer.setVideoSurface(videoSurface)
        }
        AndroidView(
            factory = { textureView },
            modifier = Modifier.fillMaxSize()
        )
    }
}
