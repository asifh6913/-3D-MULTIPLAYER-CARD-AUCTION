package com.agon.app.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import com.agon.app.data.PlayerProfile

@Composable
fun GameProfileScreen(profile: PlayerProfile, onSound: (Boolean) -> Unit, onHaptics: (Boolean) -> Unit, onDarkTheme: (Boolean) -> Unit) {
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF0E1740), Color(0xFF271052), Color(0xFF091C35))))) {
        ProfileParticles(Modifier.fillMaxSize())
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(18.dp, 14.dp, 18.dp, 28.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item { ProfileHero(profile) }
            item {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    ProfileStat(profile.totalPuzzles.toString(), "PUZZLES", Color(0xFF7653F3), Modifier.weight(1f))
                    ProfileStat(profile.completedLevel.toString(), "LEVEL", Color(0xFFFF9F2A), Modifier.weight(1f))
                    ProfileStat(profile.bestRushScore.toString(), "RUSH", Color(0xFFFF527D), Modifier.weight(1f))
                }
            }
            item { ProfileSectionTitle("GAME SETTINGS") }
            item { GameSettingCard(Icons.Default.GraphicEq, "SOUND EFFECTS", "Launches, hits and rewards", Color(0xFF734DF0), profile.soundEnabled, onSound) }
            item { GameSettingCard(Icons.Default.TouchApp, "HAPTIC POWER", "Feel every move and mistake", Color(0xFFFF9D2C), profile.hapticsEnabled, onHaptics) }
            item { GameSettingCard(Icons.Default.DarkMode, "DARK WORLD", "Deep purple game atmosphere", Color(0xFF2DCDB3), profile.darkTheme, onDarkTheme) }
            item { ProfileSectionTitle("PLAYER MILESTONES") }
            item { MilestoneCard(Icons.Default.EmojiEvents, "PUZZLE HUNTER", profile.totalPuzzles, 100, Color(0xFFFFA527)) }
            item { MilestoneCard(Icons.Default.Shield, "LOGIC LEGEND", profile.completedLevel, 1_000, Color(0xFF6C55EE)) }
        }
    }
}

@Composable private fun ProfileHero(profile: PlayerProfile) {
    val motion = rememberInfiniteTransition(label = "avatar")
    val bob by motion.animateFloat(-3f, 5f, infiniteRepeatable(tween(1_500), RepeatMode.Reverse), label = "avatarBob")
    val glow by motion.animateFloat(.3f, .8f, infiniteRepeatable(tween(1_000), RepeatMode.Reverse), label = "avatarGlow")
    Box(Modifier.fillMaxWidth().height(230.dp), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(216.dp).offset(y = 9.dp), RoundedCornerShape(28.dp), Color(0xFF12072D)) {}
        Surface(Modifier.fillMaxWidth().height(216.dp), RoundedCornerShape(28.dp), Color.Transparent, shadowElevation = 15.dp) {
            Box(Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Color(0xFF442089), Color(0xFF243273), Color(0xFF1A124B)))).padding(18.dp)) {
                Canvas(Modifier.fillMaxSize()) { drawCircle(Color(0xFF69DFFF).copy(alpha = glow * .13f), size.minDimension * .48f, Offset(size.width * .78f, size.height * .34f)) }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(92.dp).graphicsLayer { translationY = bob }, contentAlignment = Alignment.Center) {
                        Surface(shape = CircleShape, color = Color(0xFF17103A), modifier = Modifier.size(92.dp)) {}
                        Surface(shape = CircleShape, color = Color(0xFF764DF2), shadowElevation = 13.dp, modifier = Modifier.size(72.dp)) { Box(contentAlignment = Alignment.Center) { Text(profile.rank.toString(), color = Color.White, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black) } }
                    }
                    Spacer(Modifier.width(14.dp)); Column(Modifier.weight(1f)) { Text("PATHFINDER", color = Color(0xFF6EE7FF), style = MaterialTheme.typography.labelLarge); Text("PLAYER PROFILE", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black); Text("Rank ${profile.rank}  •  ${profile.xp} XP", color = Color.White.copy(alpha = .68f)) }
                    if (profile.premium) Icon(Icons.Default.WorkspacePremium, null, tint = Color(0xFFFFD23E), modifier = Modifier.size(34.dp))
                }
                Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth()) { Row { Text("NEXT RANK", color = Color.White.copy(alpha = .65f), style = MaterialTheme.typography.labelMedium); Spacer(Modifier.weight(1f)); Text("${profile.xp % 300}/300 XP", color = Color(0xFF76EAFF), style = MaterialTheme.typography.labelMedium) }; Spacer(Modifier.height(7.dp)); LinearProgressIndicator(progress = { profile.rankProgress }, modifier = Modifier.fillMaxWidth().height(11.dp), color = Color(0xFF70DFFF), trackColor = Color(0xFF130A31)) }
            }
        }
    }
}

@Composable private fun ProfileStat(value: String, label: String, color: Color, modifier: Modifier) { Box(modifier.height(100.dp), contentAlignment = Alignment.TopCenter) { Surface(Modifier.fillMaxWidth().height(90.dp).offset(y = 6.dp), RoundedCornerShape(19.dp), color.copy(alpha = .38f)) {}; Surface(Modifier.fillMaxWidth().height(90.dp), RoundedCornerShape(19.dp), Color(0xFF25134E), shadowElevation = 8.dp) { Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) { Text(value, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, maxLines = 1); Text(label, color = color, style = MaterialTheme.typography.labelMedium) } } } }
@Composable private fun GameSettingCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, color: Color, checked: Boolean, onChecked: (Boolean) -> Unit) { Box(Modifier.fillMaxWidth().height(92.dp), contentAlignment = Alignment.TopCenter) { Surface(Modifier.fillMaxWidth().height(83.dp).offset(y = 6.dp), RoundedCornerShape(20.dp), Color(0xFF10082B)) {}; Surface(Modifier.fillMaxWidth().height(83.dp), RoundedCornerShape(20.dp), Color(0xFF25134D), shadowElevation = 7.dp) { Row(Modifier.padding(13.dp), verticalAlignment = Alignment.CenterVertically) { Surface(Modifier.size(50.dp), RoundedCornerShape(15.dp), color, shadowElevation = 7.dp) { Icon(icon, null, tint = Color.White, modifier = Modifier.padding(12.dp)) }; Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium); Text(subtitle, color = Color(0xFFB6A7CC), style = MaterialTheme.typography.bodyMedium) }; Switch(checked, onChecked) } } } }
@Composable private fun MilestoneCard(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, value: Int, target: Int, color: Color) { Surface(shape = RoundedCornerShape(20.dp), color = Color(0xFF25134D), shadowElevation = 7.dp) { Row(Modifier.padding(14.dp), verticalAlignment = Alignment.CenterVertically) { Surface(shape = CircleShape, color = color, modifier = Modifier.size(48.dp), shadowElevation = 7.dp) { Icon(icon, null, tint = Color.White, modifier = Modifier.padding(11.dp)) }; Spacer(Modifier.width(12.dp)); Column(Modifier.weight(1f)) { Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium); Spacer(Modifier.height(5.dp)); LinearProgressIndicator(progress = { (value.toFloat() / target).coerceIn(0f, 1f) }, modifier = Modifier.fillMaxWidth().height(7.dp), color = color, trackColor = Color(0xFF10072B)) }; Spacer(Modifier.width(10.dp)); Text("${value.coerceAtMost(target)}/$target", color = color, fontWeight = FontWeight.Bold) } } }
@Composable private fun ProfileSectionTitle(text: String) { Text(text, color = Color(0xFF6FE5FF), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black) }
@Composable private fun ProfileParticles(modifier: Modifier) { Canvas(modifier) { repeat(17) { i -> drawCircle(Color.White.copy(alpha = .04f + (i % 3) * .015f), 2f + i % 4, Offset((i * 71 % 100) / 100f * size.width, (i * 53 % 100) / 100f * size.height)) } } }
