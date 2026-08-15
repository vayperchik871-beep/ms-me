package com.ms.messenger.ui.emoji

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val iOSEmojiCategories = mapOf(
    "Smileys" to listOf(
        "\uD83D\uDE00", "\uD83D\uDE02", "\uD83D\uDE03", "\uD83D\uDE05", "\uD83D\uDE06",
        "\uD83D\uDE09", "\uD83D\uDE0A", "\uD83D\uDE0B", "\uD83D\uDE0C", "\uD83D\uDE0D",
        "\uD83E\uDD23", "\uD83D\uDE10", "\uD83D\uDE11", "\uD83D\uDE14", "\uD83D\uDE16",
        "\uD83D\uDE18", "\uD83D\uDE1C", "\uD83D\uDE1D", "\uD83E\uDD24", "\uD83D\uDE1E",
        "\uD83D\uDE20", "\uD83D\uDE21", "\uD83D\uDE22", "\uD83D\uDE23", "\uD83D\uDE24",
        "\uD83D\uDE25", "\uD83D\uDE28", "\uD83D\uDE29", "\uD83E\uDD25", "\uD83D\uDE2C",
        "\uD83D\uDE30", "\uD83D\uDE31", "\uD83D\uDE33", "\uD83D\uDE35", "\uD83D\uDE37",
        "\uD83D\uDE44", "\uD83D\uDE45", "\uD83D\uDE46", "\uD83D\uDE47", "\uD83D\uDE48",
        "\uD83D\uDE49", "\uD83D\uDE4A", "\uD83D\uDE4B", "\uD83D\uDE4C", "\uD83D\uDE4D",
        "\uD83D\uDE4E", "\uD83D\uDE4F", "\uD83E\uDD11", "\uD83E\uDD13", "\uD83E\uDD17",
        "\uD83E\uDD2D", "\uD83E\uDD2F", "\uD83E\uDD73", "\uD83E\uDD78"
    ),
    "Gestures" to listOf(
        "\uD83D\uDC4D", "\uD83D\uDC4E", "\uD83D\uDC4B", "\uD83D\uDC4F", "\uD83D\uDC50",
        "\uD83D\uDC46", "\uD83D\uDC47", "\uD83D\uDC48", "\uD83D\uDC49", "\u270A",
        "\uD83E\uDD1C", "\uD83E\uDD1B", "\uD83E\uDD1E", "\uD83E\uDD1F", "\uD83E\uDD18",
        "\uD83E\uDD19", "\uD83E\uDD1A", "\uD83E\uDD1D", "\u270B", "\uD83E\uDD33",
        "\u270C", "\uD83E\uDD14", "\u2764", "\uD83E\uDDE1", "\uD83D\uDC9B",
        "\uD83D\uDC9A", "\uD83D\uDC99", "\uD83D\uDC8C", "\uD83E\uDD32", "\uD83D\uDC4C",
        "\u270D", "\uD83E\uDD37", "\uD83E\uDD38", "\uD83E\uDD39", "\uD83E\uDD3E",
        "\uD83E\uDD3C", "\uD83E\uDD3D"
    ),
    "Hearts" to listOf(
        "\u2764", "\uD83E\uDDE1", "\uD83D\uDC9B", "\uD83D\uDC9A", "\uD83D\uDC99",
        "\uD83D\uDC9C", "\uD83D\uDDA4", "\uD83D\uDC94", "\uD83E\uDDE3", "\uD83D\uDC95",
        "\uD83D\uDC9E", "\uD83D\uDC9F", "\uD83E\uDD0E", "\uD83E\uDD0F", "\uD83D\uDC93",
        "\uD83E\uDD7D", "\uD83E\uDD7E"
    ),
    "Animals" to listOf(
        "\uD83D\uDC36", "\uD83D\uDC31", "\uD83D\uDC2D", "\uD83D\uDC39", "\uD83D\uDC30",
        "\uD83D\uDC3B", "\uD83D\uDC3C", "\uD83D\uDC28", "\uD83D\uDC2F", "\uD83D\uDC3E",
        "\uD83D\uDC37", "\uD83D\uDC38", "\uD83D\uDC25", "\uD83D\uDC26", "\uD83E\uDD85",
        "\uD83E\uDD86", "\uD83E\uDD87", "\uD83E\uDD8A", "\uD83E\uDD8D", "\uD83E\uDD8E",
        "\uD83D\uDC0D", "\uD83D\uDC22", "\uD83D\uDC40", "\uD83E\uDD09", "\uD83D\uDC7B",
        "\uD83E\uDD21", "\uD83E\uDDDB", "\uD83E\uDDDC"
    ),
    "Food" to listOf(
        "\uD83C\uDF4E", "\uD83C\uDF4A", "\uD83C\uDF4B", "\uD83C\uDF4C", "\uD83C\uDF49",
        "\uD83C\uDF47", "\uD83C\uDF53", "\uD83C\uDF52", "\uD83C\uDF51", "\uD83C\uDF50",
        "\uD83C\uDF6D", "\uD83C\uDF6E", "\uD83C\uDF6F", "\uD83C\uDF70", "\uD83C\uDF7C",
        "\u2615", "\uD83C\uDF75", "\uD83E\uDDC3", "\uD83E\uDDC4", "\uD83E\uDDC6",
        "\uD83C\uDF2E", "\uD83C\uDF2F", "\uD83C\uDF5D", "\uD83C\uDF54", "\uD83C\uDF55",
        "\uD83C\uDF56", "\uD83C\uDF57", "\uD83C\uDF59", "\uD83C\uDF5A", "\uD83C\uDF5B",
        "\uD83C\uDF5C", "\uD83C\uDF60", "\uD83C\uDF63", "\uD83C\uDF66", "\uD83C\uDF7A",
        "\uD83C\uDF7B", "\uD83E\uDD42"
    ),
    "Objects" to listOf(
        "\u2B50", "\uD83C\uDF1F", "\uD83C\uDF08", "\u2600", "\u2601",
        "\uD83D\uDCA1", "\uD83D\uDCAC", "\uD83D\uDCE2", "\uD83D\uDCE3", "\uD83D\uDD14",
        "\uD83D\uDD25", "\u2728", "\uD83C\uDF81", "\uD83C\uDF82", "\uD83C\uDF86",
        "\uD83C\uDF87", "\uD83C\uDF88", "\uD83C\uDF89", "\uD83C\uDF8A", "\uD83C\uDF8C",
        "\uD83D\uDE80", "\uD83D\uDE83", "\u2708", "\uD83D\uDE8C", "\uD83D\uDE97",
        "\uD83D\uDE99", "\uD83D\uDE9B", "\uD83D\uDE9C", "\uD83C\uDFE8", "\uD83C\uDFEB"
    ),
    "Symbols" to listOf(
        "\u2764", "\uD83D\uDD25", "\u2714", "\u2716", "\u2611",
        "\u2714\uFE0F", "\u26A0", "\u2757", "\u2755", "\u2753",
        "\u203C", "\u2049", "\u267E", "\u274C", "\u274E",
        "\u2611\uFE0F", "\uD83D\uDD34", "\uD83D\uDFE3", "\uD83D\uDFE1", "\uD83D\uDFE2",
        "\uD83D\uDD35", "\u26AB", "\uD83D\uDFE0", "\uD83D\uDFE4", "\u2B55",
        "\uD83D\uDCAF", "\uD83D\uDD27", "\uD83D\uDD28", "\uD83D\uDD29", "\u2699"
    )
)

@Composable
fun EmojiPicker(
    onEmojiClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val allEmojis = iOSEmojiCategories.values.flatten()

    LazyVerticalGrid(
        columns = GridCells.Fixed(8),
        modifier = modifier
            .fillMaxWidth()
            .height(280.dp)
            .background(Color(0xFF1C1C1E))
            .padding(horizontal = 8.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp)
    ) {
        items(allEmojis, key = { it }) { emoji ->
            Box(
                modifier = Modifier
                    .aspectRatio(1f)
                    .clip(RoundedCornerShape(8.dp))
                    .clickable { onEmojiClick(emoji) },
                contentAlignment = Alignment.Center
            ) {
                Text(
                    emoji,
                    fontSize = 28.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
