package com.agon.app.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Landscape
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.agon.app.data.ArrowSkin
import com.agon.app.data.ArrowSkins
import com.agon.app.data.BackgroundSkin
import com.agon.app.data.BackgroundSkins
import com.agon.app.data.BoardSkin
import com.agon.app.data.BoardSkins
import com.agon.app.data.PlayerProfile
import com.agon.app.ui.theme.ArrowPalette
import com.agon.app.ui.theme.BackgroundPalette
import com.agon.app.ui.theme.BoardPalette
import com.agon.app.ui.theme.arrowPalette
import com.agon.app.ui.theme.backgroundPalette
import com.agon.app.ui.theme.boardPalette

@Composable
fun SkinsScreen(
    profile: PlayerProfile,
    onArrowSkin: (ArrowSkin) -> Unit,
    onBoardSkin: (BoardSkin) -> Unit,
    onBackgroundSkin: (BackgroundSkin) -> Unit,
) {
    var tab by rememberSaveable { mutableIntStateOf(0) }
    val dark = true
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF170A38), Color(0xFF32105A), Color(0xFF101B43))))) {
        StudioParticles(Modifier.fillMaxSize())
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 18.dp, vertical = 14.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(16.dp), color = Color(0xFF7846F4), shadowElevation = 12.dp, modifier = Modifier.size(50.dp)) {
                    Icon(Icons.Default.Palette, null, tint = Color.White, modifier = Modifier.padding(12.dp))
                }
                Spacer(Modifier.width(11.dp))
                Column(Modifier.weight(1f)) {
                    Text("STYLE STUDIO", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text("BUILD YOUR PERFECT LOOK", color = Color(0xFF67E6FF), style = MaterialTheme.typography.labelMedium)
                }
                GameCoinPill(profile.coins)
            }

            AnimatedStylePreview(profile, dark, Modifier.padding(horizontal = 18.dp))
            Spacer(Modifier.height(12.dp))
            StudioTabs(tab) { tab = it }
            Spacer(Modifier.height(8.dp))

            AnimatedContent(tab, label = "studioTab") { selectedTab ->
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 8.dp, bottom = 25.dp),
                    verticalArrangement = Arrangement.spacedBy(13.dp),
                ) {
                    when (selectedTab) {
                        0 -> items(ArrowSkins, key = { it.id }) { skin ->
                            val palette = arrowPalette(skin.id, Color(0xFF268CF5), Color.White)
                            GameSkinCard(
                                title = skin.title,
                                subtitle = skin.subtitle,
                                cost = skin.coinCost,
                                unlocked = skin.id in profile.unlockedArrowSkins,
                                selected = skin.id == profile.selectedArrowSkin,
                                effect = arrowEffectName(skin.id),
                                accent = palette.tile,
                                preview = { ArrowEffectPreview(skin.id, palette) },
                                onClick = { onArrowSkin(skin) },
                            )
                        }
                        1 -> items(BoardSkins, key = { it.id }) { skin ->
                            val palette = boardPalette(skin.id, dark)
                            GameSkinCard(
                                title = skin.title,
                                subtitle = skin.subtitle,
                                cost = skin.coinCost,
                                unlocked = skin.id in profile.unlockedBoardSkins,
                                selected = skin.id == profile.selectedBoardSkin,
                                effect = boardEffectName(skin.id),
                                accent = palette.dot,
                                preview = { BoardEffectPreview(skin.id, palette) },
                                onClick = { onBoardSkin(skin) },
                            )
                        }
                        else -> items(BackgroundSkins, key = { it.id }) { skin ->
                            val palette = backgroundPalette(skin.id, dark)
                            GameSkinCard(
                                title = skin.title,
                                subtitle = skin.subtitle,
                                cost = skin.coinCost,
                                unlocked = skin.id in profile.unlockedBackgroundSkins,
                                selected = skin.id == profile.selectedBackgroundSkin,
                                effect = backgroundEffectName(skin.id),
                                accent = palette.colors.last(),
                                preview = { BackgroundEffectPreview(skin.id, palette) },
                                onClick = { onBackgroundSkin(skin) },
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StudioTabs(selected: Int, onSelected: (Int) -> Unit) {
    val tabs = listOf(Triple("ARROWS", Icons.Default.ArrowForward, Color(0xFFFF4F9A)), Triple("BOARDS", Icons.Default.Layers, Color(0xFF45D7FF)), Triple("WORLDS", Icons.Default.Landscape, Color(0xFF75E45B)))
    Row(Modifier.fillMaxWidth().padding(horizontal = 18.dp), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
        tabs.forEachIndexed { index, (label, icon, color) ->
            val active = selected == index
            val scale by animateFloatAsState(if (active) 1.04f else .96f, label = "tabScale")
            Box(Modifier.weight(1f).height(67.dp).graphicsLayer { scaleX = scale; scaleY = scale }.clickable { onSelected(index) }, contentAlignment = Alignment.TopCenter) {
                Surface(Modifier.fillMaxWidth().height(58.dp).offset(y = if (active) 7.dp else 4.dp), RoundedCornerShape(17.dp), if (active) color.copy(alpha = .52f) else Color(0xFF12072D)) {}
                Surface(Modifier.fillMaxWidth().height(58.dp), RoundedCornerShape(17.dp), if (active) Color(0xFF4B238E) else Color(0xFF28114F), shadowElevation = if (active) 10.dp else 3.dp) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                        Icon(icon, null, tint = if (active) color else Color(0xFF8E79B6), modifier = Modifier.size(23.dp))
                        Text(label, color = if (active) Color.White else Color(0xFFA395BF), style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }
    }
}

@Composable
private fun AnimatedStylePreview(profile: PlayerProfile, dark: Boolean, modifier: Modifier = Modifier) {
    val motion = rememberInfiniteTransition(label = "previewMotion")
    val bob by motion.animateFloat(-3f, 5f, infiniteRepeatable(tween(1_700), RepeatMode.Reverse), label = "previewBob")
    val glow by motion.animateFloat(.35f, .8f, infiniteRepeatable(tween(1_100), RepeatMode.Reverse), label = "previewGlow")
    val arrow = arrowPalette(profile.selectedArrowSkin, Color(0xFF268CF5), Color.White)
    val board = boardPalette(profile.selectedBoardSkin, dark)
    val background = backgroundPalette(profile.selectedBackgroundSkin, dark)
    Box(modifier.fillMaxWidth().height(188.dp).clip(RoundedCornerShape(27.dp)).background(Brush.linearGradient(background.colors)), contentAlignment = Alignment.Center) {
        Canvas(Modifier.fillMaxSize()) {
            drawCircle(arrow.tile.copy(alpha = glow * .18f), size.minDimension * .48f, Offset(size.width * .5f, size.height * .5f))
            repeat(12) { i -> drawCircle(Color.White.copy(alpha = .13f), if (i % 3 == 0) 3f else 1.5f, Offset((i * 79 % 100) / 100f * size.width, (i * 47 % 100) / 100f * size.height)) }
        }
        MiniGameBoard(arrow, board, Modifier.graphicsLayer { translationY = bob; rotationZ = bob * .18f })
        Surface(Modifier.align(Alignment.TopStart).padding(11.dp), RoundedCornerShape(12.dp), Color(0xCC160B38)) {
            Text("LIVE EFFECT PREVIEW", Modifier.padding(horizontal = 9.dp, vertical = 5.dp), color = Color(0xFF69E7FF), style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun MiniGameBoard(arrow: ArrowPalette, board: BoardPalette, modifier: Modifier = Modifier) {
    Box(modifier.size(139.dp), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxSize().offset(y = 7.dp), RoundedCornerShape(21.dp), board.edge) {}
        Surface(Modifier.fillMaxSize(), RoundedCornerShape(21.dp), board.shell, shadowElevation = 13.dp) {
            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                repeat(3) { row ->
                    Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(5.dp)) {
                        repeat(3) { column ->
                            Surface(Modifier.weight(1f).fillMaxSize(), RoundedCornerShape(8.dp), board.cell) {
                                Box(contentAlignment = Alignment.Center) {
                                    if ((row + column) % 2 == 0) {
                                        Surface(Modifier.size(27.dp), RoundedCornerShape(8.dp), arrow.tile, shadowElevation = 4.dp) {
                                            Icon(Icons.Default.ArrowForward, null, tint = arrow.ink, modifier = Modifier.padding(5.dp).rotate((row + column) * 90f))
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun GameSkinCard(title: String, subtitle: String, cost: Int, unlocked: Boolean, selected: Boolean, effect: String, accent: Color, preview: @Composable () -> Unit, onClick: () -> Unit) {
    val pulse = rememberInfiniteTransition(label = "cardPulse")
    val selectedGlow by pulse.animateFloat(.25f, .7f, infiniteRepeatable(tween(1_300), RepeatMode.Reverse), label = "selectedGlow")
    Box(Modifier.fillMaxWidth().height(112.dp).clickable(enabled = !selected, onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(101.dp).offset(y = 7.dp), RoundedCornerShape(22.dp), if (selected) accent.copy(alpha = selectedGlow) else Color(0xFF10072C)) {}
        Surface(Modifier.fillMaxWidth().height(101.dp), RoundedCornerShape(22.dp), Color(0xFF27114E), shadowElevation = if (selected) 12.dp else 6.dp) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                preview()
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(subtitle, color = Color(0xFFC0AFDA), style = MaterialTheme.typography.bodyMedium, maxLines = 1)
                    Spacer(Modifier.height(4.dp))
                    Surface(shape = CircleShape, color = accent.copy(alpha = .17f)) { Text(effect, Modifier.padding(horizontal = 8.dp, vertical = 3.dp), color = accent, style = MaterialTheme.typography.labelMedium) }
                }
                when {
                    selected -> Surface(shape = CircleShape, color = Color(0xFF38CF95), shadowElevation = 7.dp) { Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.padding(9.dp).size(19.dp)) }
                    unlocked -> Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFF6540D5), shadowElevation = 6.dp) { Text("EQUIP", Modifier.padding(horizontal = 11.dp, vertical = 8.dp), color = Color.White, style = MaterialTheme.typography.labelMedium) }
                    else -> Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFFFFA526), shadowElevation = 6.dp) {
                        Row(Modifier.padding(horizontal = 9.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.MonetizationOn, null, tint = Color.White, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(3.dp)); Text(cost.toString(), color = Color.White, style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }
        }
    }
}

@Composable private fun ArrowEffectPreview(id: String, colors: ArrowPalette) {
    val motion = rememberInfiniteTransition(label = "arrowFx")
    val spin by motion.animateFloat(if (id == "plasma") -8f else 0f, if (id == "plasma") 8f else 0f, infiniteRepeatable(tween(700), RepeatMode.Reverse), label = "spin")
    Surface(Modifier.size(70.dp), RoundedCornerShape(18.dp), colors.tile.copy(alpha = .18f)) {
        Box(contentAlignment = Alignment.Center) { Surface(Modifier.size(45.dp).rotate(spin), RoundedCornerShape(13.dp), colors.tile, shadowElevation = 8.dp) { Icon(Icons.Default.ArrowForward, null, tint = colors.ink, modifier = Modifier.padding(9.dp)) } }
    }
}

@Composable private fun BoardEffectPreview(id: String, colors: BoardPalette) {
    Box(Modifier.size(70.dp), contentAlignment = Alignment.Center) { Surface(Modifier.size(60.dp).offset(y = 5.dp), RoundedCornerShape(16.dp), colors.edge) {}; Surface(Modifier.size(60.dp), RoundedCornerShape(16.dp), colors.shell, shadowElevation = 7.dp) { Row(Modifier.padding(9.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) { repeat(2) { Surface(Modifier.weight(1f).fillMaxSize(), RoundedCornerShape(6.dp), colors.cell) {} } } } }
}

@Composable private fun BackgroundEffectPreview(id: String, colors: BackgroundPalette) {
    val motion = rememberInfiniteTransition(label = "bgFx")
    val shift by motion.animateFloat(0f, 1f, infiniteRepeatable(tween(1_400), RepeatMode.Reverse), label = "shift")
    Box(Modifier.size(70.dp).clip(RoundedCornerShape(18.dp)).background(Brush.linearGradient(colors.colors)), contentAlignment = Alignment.Center) { Canvas(Modifier.fillMaxSize()) { drawCircle(Color.White.copy(alpha = .18f + shift * .18f), 8f + shift * 5f, Offset(size.width * .67f, size.height * .32f)); drawCircle(Color.White.copy(alpha = .12f), 4f, Offset(size.width * .28f, size.height * .7f)) } }
}

@Composable private fun GameCoinPill(coins: Int) { Surface(shape = RoundedCornerShape(15.dp), color = Color(0xFF2B145D), shadowElevation = 8.dp) { Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.MonetizationOn, null, tint = Color(0xFFFFC43D), modifier = Modifier.size(18.dp)); Spacer(Modifier.width(5.dp)); Text(coins.toString(), color = Color.White, fontWeight = FontWeight.Bold) } } }
@Composable private fun StudioParticles(modifier: Modifier) { Canvas(modifier) { repeat(18) { i -> drawCircle(Color.White.copy(alpha = .035f + (i % 3) * .018f), 2f + i % 4, Offset((i * 83 % 100) / 100f * size.width, (i * 59 % 100) / 100f * size.height)) } } }
private fun arrowEffectName(id: String) = when (id) { "lava" -> "MOLTEN GLOW"; "ice" -> "FROST SHIMMER"; "rainbow" -> "COLOR SHIFT"; "plasma" -> "PULSE EFFECT"; "neon" -> "NEON GLOW"; else -> "3D FINISH" }
private fun boardEffectName(id: String) = when (id) { "lava" -> "LAVA CRACKS"; "tech" -> "CIRCUIT PULSE"; "jungle" -> "STONE GLYPHS"; "galaxy" -> "STAR GLASS"; else -> "TEXTURED" }
private fun backgroundEffectName(id: String) = when (id) { "lava" -> "EMBER FIELD"; "candy" -> "COLOR CLOUDS"; "cyber" -> "NEON LIGHTS"; "heaven" -> "GOLDEN RAYS"; else -> "LIVING GRADIENT" }
