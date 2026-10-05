package com.agon.app.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
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
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Redeem
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.agon.app.ads.RewardedAdState
import com.agon.app.data.PlayerProfile

@Composable
fun GameRewardsScreen(
    profile: PlayerProfile,
    giftAvailable: Boolean,
    adState: RewardedAdState,
    onClaimGift: () -> Unit,
    onWatchCoins: () -> Unit,
    onWatchGems: () -> Unit,
    onBuyHints: (Int, Int) -> Unit,
    onPremium: () -> Unit,
) {
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF1D0B42), Color(0xFF47125C), Color(0xFF101A42))))) {
        RewardParticles(Modifier.fillMaxSize())
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 18.dp, end = 18.dp, top = 14.dp, bottom = 28.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(16.dp), color = Color(0xFFFFA525), shadowElevation = 11.dp, modifier = Modifier.size(50.dp)) { Icon(Icons.Default.EmojiEvents, null, tint = Color.White, modifier = Modifier.padding(11.dp)) }
                    Spacer(Modifier.width(11.dp))
                    Column(Modifier.weight(1f)) { Text("REWARD VAULT", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black); Text("FREE LOOT & POWER-UPS", color = Color(0xFFFFD84A), style = MaterialTheme.typography.labelMedium) }
                    RewardCurrency(Icons.Default.MonetizationOn, profile.coins, Color(0xFFFFC43D)); Spacer(Modifier.width(6.dp)); RewardCurrency(Icons.Default.Diamond, profile.gems, Color(0xFF62DFFF))
                }
            }
            item { DailyChestCard(giftAvailable, onClaimGift) }
            item { GameSectionTitle("WATCH & EARN", "Every completed ad gives the full reward") }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(11.dp)) {
                    VideoRewardButton(Modifier.weight(1f), "+250", "COINS", Color(0xFFFF9D22), adState, onWatchCoins)
                    VideoRewardButton(Modifier.weight(1f), "+5", "GEMS", Color(0xFF704EFF), adState, onWatchGems)
                }
            }
            item { GameSectionTitle("POWER-UPS", "Spend coins earned by clearing levels") }
            item { PowerUpCard(Icons.Default.Lightbulb, "QUICK HINTS", "3 safe-arrow reveals", "120", Color(0xFFFFB327)) { onBuyHints(3, 120) } }
            item { PowerUpCard(Icons.Default.Stars, "EXPLORER PACK", "8 hints for harder boards", "280", Color(0xFF31D4B5)) { onBuyHints(8, 280) } }
            item { FounderCard(profile.premium, onPremium) }
            item { AchievementStrip(profile) }
        }
    }
}

@Composable
private fun DailyChestCard(available: Boolean, onClick: () -> Unit) {
    val motion = rememberInfiniteTransition(label = "chest")
    val bob by motion.animateFloat(-4f, 6f, infiniteRepeatable(tween(1_400), RepeatMode.Reverse), label = "chestBob")
    val glow by motion.animateFloat(.3f, .8f, infiniteRepeatable(tween(900), RepeatMode.Reverse), label = "chestGlow")
    Box(Modifier.fillMaxWidth().height(205.dp), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(193.dp).offset(y = 9.dp), RoundedCornerShape(28.dp), Color(0xFF35105B)) {}
        Surface(Modifier.fillMaxWidth().height(193.dp), RoundedCornerShape(28.dp), Color.Transparent, shadowElevation = 16.dp) {
            Box(Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Color(0xFF7A23A0), Color(0xFF3E176E), Color(0xFF1F1755)))).padding(18.dp)) {
                Canvas(Modifier.fillMaxSize()) { drawCircle(Color(0xFFFFD847).copy(alpha = glow * .18f), size.minDimension * .43f, Offset(size.width * .76f, size.height * .46f)); repeat(12) { i -> drawCircle(Color.White.copy(alpha = .16f), 2f + i % 3, Offset((i * 67 % 100) / 100f * size.width, (i * 37 % 100) / 100f * size.height)) } }
                Column(Modifier.align(Alignment.CenterStart).fillMaxWidth(.6f)) {
                    Text(if (available) "DAILY TREASURE" else "TREASURE OPENED", color = Color(0xFFFFD94A), style = MaterialTheme.typography.labelLarge)
                    Text(if (available) "Free Gift!" else "Come back tomorrow", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text(if (available) "+75 coins  •  +1 hint" else "Your next chest is being prepared", color = Color.White.copy(alpha = .72f))
                    Spacer(Modifier.height(15.dp))
                    Game3DAction(if (available) "OPEN NOW" else "COLLECTED", Color(0xFF67D70B), available, onClick)
                }
                Box(Modifier.align(Alignment.CenterEnd).size(112.dp).graphicsLayer { translationY = bob }, contentAlignment = Alignment.Center) {
                    Canvas(Modifier.fillMaxSize()) { drawCircle(Color(0xFFFFD53D).copy(alpha = glow * .25f), size.minDimension * .49f) }
                    Surface(shape = RoundedCornerShape(24.dp), color = Color(0xFFFFA620), shadowElevation = 13.dp, modifier = Modifier.size(78.dp)) { Icon(Icons.Default.Redeem, null, tint = Color.White, modifier = Modifier.padding(16.dp)) }
                }
            }
        }
    }
}

@Composable
private fun VideoRewardButton(modifier: Modifier, amount: String, label: String, color: Color, state: RewardedAdState, onClick: () -> Unit) {
    val ready = state == RewardedAdState.READY
    Box(modifier.height(139.dp).clickable(enabled = state != RewardedAdState.SHOWING, onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(127.dp).offset(y = 8.dp), RoundedCornerShape(22.dp), color.copy(alpha = .43f)) {}
        Surface(Modifier.fillMaxWidth().height(127.dp), RoundedCornerShape(22.dp), Color(0xFF281253), shadowElevation = 10.dp) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Surface(shape = CircleShape, color = color, shadowElevation = 8.dp, modifier = Modifier.size(43.dp)) { Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.padding(9.dp)) }
                Spacer(Modifier.height(5.dp)); Text(amount, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black); Text(label, color = color, style = MaterialTheme.typography.labelLarge); Text(if (ready) "WATCH AD" else if (state == RewardedAdState.ERROR) "TAP TO RETRY" else "LOADING...", color = Color.White.copy(alpha = .55f), style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable private fun PowerUpCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, price: String, color: Color, onClick: () -> Unit) {
    Box(Modifier.fillMaxWidth().height(96.dp).clickable(onClick = onClick), contentAlignment = Alignment.TopCenter) { Surface(Modifier.fillMaxWidth().height(86.dp).offset(y = 6.dp), RoundedCornerShape(20.dp), Color(0xFF10082A)) {}; Surface(Modifier.fillMaxWidth().height(86.dp), RoundedCornerShape(20.dp), Color(0xFF281451), shadowElevation = 7.dp) { Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) { Surface(Modifier.size(52.dp), RoundedCornerShape(15.dp), color, shadowElevation = 7.dp) { Icon(icon, null, tint = Color.White, modifier = Modifier.padding(12.dp)) }; Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium); Text(subtitle, color = Color(0xFFB7A6CE), style = MaterialTheme.typography.bodyMedium) }; Surface(shape = RoundedCornerShape(12.dp), color = Color(0xFFFF9F22), shadowElevation = 5.dp) { Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Default.MonetizationOn, null, tint = Color.White, modifier = Modifier.size(15.dp)); Spacer(Modifier.width(3.dp)); Text(price, color = Color.White, fontWeight = FontWeight.Bold) } } } } }
}

@Composable private fun FounderCard(owned: Boolean, onClick: () -> Unit) { Surface(onClick = onClick, enabled = !owned, shape = RoundedCornerShape(22.dp), color = Color(0xFF4A2B13), shadowElevation = 9.dp, modifier = Modifier.fillMaxWidth()) { Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) { Icon(if (owned) Icons.Default.Check else Icons.Default.WorkspacePremium, null, tint = Color(0xFFFFD04A), modifier = Modifier.size(35.dp)); Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(if (owned) "FOUNDER PASS ACTIVE" else "FOUNDER PASS", color = Color.White, style = MaterialTheme.typography.titleMedium); Text(if (owned) "Permanent premium unlocked" else "Exclusive badge and premium status", color = Color(0xFFD5B881)) }; Text(if (owned) "OWNED" else "500 ♦", color = Color(0xFFFFD04A), fontWeight = FontWeight.Black) } } }
@Composable private fun AchievementStrip(p: PlayerProfile) { Surface(shape = RoundedCornerShape(22.dp), color = Color(0xFF25124B), shadowElevation = 7.dp) { Column(Modifier.padding(16.dp)) { GameSectionTitle("ACHIEVEMENTS", "Keep clearing the path"); Spacer(Modifier.height(10.dp)); Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) { AchievementOrb("${p.totalPuzzles}", "PUZZLES", Color(0xFF7854F7)); AchievementOrb("${p.bestRushScore}", "RUSH", Color(0xFFFF5A85)); AchievementOrb("${p.completedLevel}", "LEVEL", Color(0xFF36CDA8)) } } } }
@Composable private fun AchievementOrb(value: String, label: String, color: Color) { Column(horizontalAlignment = Alignment.CenterHorizontally) { Surface(shape = CircleShape, color = color, shadowElevation = 7.dp, modifier = Modifier.size(55.dp)) { Box(contentAlignment = Alignment.Center) { Text(value, color = Color.White, fontWeight = FontWeight.Black, maxLines = 1) } }; Spacer(Modifier.height(4.dp)); Text(label, color = Color(0xFFBBAED0), style = MaterialTheme.typography.labelMedium) } }
@Composable private fun RewardCurrency(icon: androidx.compose.ui.graphics.vector.ImageVector, value: Int, color: Color) { Surface(shape = RoundedCornerShape(13.dp), color = Color(0xFF271151), shadowElevation = 7.dp) { Row(Modifier.padding(horizontal = 8.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = color, modifier = Modifier.size(16.dp)); Spacer(Modifier.width(3.dp)); Text(value.toString(), color = Color.White, style = MaterialTheme.typography.labelMedium) } } }
@Composable private fun Game3DAction(text: String, color: Color, enabled: Boolean, onClick: () -> Unit) { Box(Modifier.width(148.dp).height(50.dp).clickable(enabled = enabled, onClick = onClick), contentAlignment = Alignment.TopCenter) { Surface(Modifier.fillMaxWidth().height(43.dp).offset(y = 5.dp), RoundedCornerShape(13.dp), color.copy(alpha = .42f)) {}; Surface(Modifier.fillMaxWidth().height(43.dp), RoundedCornerShape(13.dp), color, shadowElevation = 8.dp) { Box(contentAlignment = Alignment.Center) { Text(text, color = Color.White, fontWeight = FontWeight.Black) } } } }
@Composable private fun GameSectionTitle(title: String, subtitle: String) { Column { Text(title, color = Color(0xFFFFD64A), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black); Text(subtitle, color = Color(0xFFBBAAD1), style = MaterialTheme.typography.bodyMedium) } }
@Composable private fun RewardParticles(modifier: Modifier) { Canvas(modifier) { repeat(20) { i -> drawCircle(if (i % 2 == 0) Color(0xFFFFCF45).copy(alpha = .05f) else Color(0xFF8B5AFF).copy(alpha = .07f), 3f + i % 5, Offset((i * 73 % 100) / 100f * size.width, (i * 41 % 100) / 100f * size.height)) } } }
