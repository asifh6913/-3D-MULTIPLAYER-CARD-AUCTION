package com.agon.app.ui.screens

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.agon.app.data.PlayerProfile

@Composable
fun GameLevelsScreen(profile: PlayerProfile, onBack: () -> Unit, onLevel: (Int) -> Unit) {
    var world by rememberSaveable { mutableIntStateOf((profile.completedLevel / 100).coerceIn(0, 9)) }
    val motion = rememberInfiniteTransition(label = "levelPulse")
    val nextLevelPulse by motion.animateFloat(.96f, 1.05f, infiniteRepeatable(tween(850), RepeatMode.Reverse), label = "nextLevelPulse")
    Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF142D72), Color(0xFF23165E), Color(0xFF35165C))))) {
        Column(Modifier.fillMaxSize()) {
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 10.dp), verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = CircleShape, color = Color(0xFF2A1B6B), shadowElevation = 9.dp) {
                    IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White) }
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text("SELECT LEVEL", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                    Text("WORLD ${world + 1} • LEVELS ${world * 100 + 1}-${world * 100 + 100}", color = Color(0xFF78E6FF), style = MaterialTheme.typography.labelMedium)
                }
                Surface(shape = RoundedCornerShape(14.dp), color = Color(0xFF281B63), shadowElevation = 7.dp) {
                    Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.MonetizationOn, null, tint = Color(0xFFFFC83D), modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(5.dp))
                        Text(profile.coins.toString(), color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Surface(
                modifier = Modifier.padding(horizontal = 18.dp).fillMaxWidth(),
                shape = RoundedCornerShape(22.dp),
                color = Color(0xFF32247B),
                shadowElevation = 12.dp,
            ) {
                Column(Modifier.padding(15.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(shape = RoundedCornerShape(14.dp), color = Color(0xFFFFA52C), shadowElevation = 6.dp, modifier = Modifier.size(47.dp)) {
                            Box(contentAlignment = Alignment.Center) { Text("${world + 1}", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black) }
                        }
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(worldName(world), color = Color.White, style = MaterialTheme.typography.titleLarge)
                            Text("Every level adds a tougher path", color = Color.White.copy(alpha = .66f), style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                    Spacer(Modifier.height(11.dp))
                    LinearProgressIndicator(
                        progress = { ((profile.completedLevel - world * 100).coerceIn(0, 100)) / 100f },
                        modifier = Modifier.fillMaxWidth().height(8.dp),
                        color = Color(0xFFFFD341),
                        trackColor = Color.White.copy(alpha = .14f),
                    )
                }
            }

            Spacer(Modifier.height(12.dp))
            LazyRow(contentPadding = PaddingValues(horizontal = 18.dp), horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                items((0 until 10).toList()) { index ->
                    val selected = world == index
                    val reached = index * 100 <= profile.completedLevel
                    Surface(
                        modifier = Modifier.clickable { world = index },
                        shape = RoundedCornerShape(15.dp),
                        color = if (selected) Color(0xFFFFA52C) else Color(0xFF2C206A),
                        shadowElevation = if (selected) 9.dp else 4.dp,
                    ) {
                        Column(Modifier.padding(horizontal = 15.dp, vertical = 9.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("WORLD", color = Color.White.copy(alpha = .7f), style = MaterialTheme.typography.labelMedium)
                            Text("${index + 1}", color = Color.White, style = MaterialTheme.typography.titleMedium)
                            if (!reached) Icon(Icons.Default.Lock, null, tint = Color.White.copy(alpha = .55f), modifier = Modifier.size(12.dp))
                        }
                    }
                }
            }

            Spacer(Modifier.height(10.dp))
            LazyVerticalGrid(
                columns = GridCells.Fixed(4),
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 4.dp, bottom = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(11.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                items(((world * 100 + 1)..(world * 100 + 100)).toList()) { level ->
                    val completed = level <= profile.completedLevel
                    val unlocked = level <= profile.completedLevel + 1
                    GameLevelButton(
                        level = level,
                        stars = profile.levelStars[level] ?: if (completed) 1 else 0,
                        completed = completed,
                        unlocked = unlocked,
                        pulse = if (unlocked && !completed) nextLevelPulse else 1f,
                        onClick = { onLevel(level) },
                    )
                }
            }
        }
    }
}

@Composable
private fun GameLevelButton(level: Int, stars: Int, completed: Boolean, unlocked: Boolean, pulse: Float, onClick: () -> Unit) {
    val topColor = when {
        completed -> Color(0xFF5A43D9)
        unlocked -> Color(0xFFFF9F25)
        else -> Color(0xFF2B2857)
    }
    val edgeColor = when {
        completed -> Color(0xFF2D1E8D)
        unlocked -> Color(0xFF9A3E0A)
        else -> Color(0xFF171631)
    }
    Box(Modifier.height(84.dp).graphicsLayer { scaleX = pulse; scaleY = pulse }.clickable(enabled = unlocked, onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(75.dp).offset(y = 6.dp), RoundedCornerShape(17.dp), edgeColor) {}
        Surface(Modifier.fillMaxWidth().height(75.dp), RoundedCornerShape(17.dp), topColor, shadowElevation = if (unlocked) 8.dp else 2.dp) {
            Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                if (!unlocked) {
                    Icon(Icons.Default.Lock, "Locked", tint = Color.White.copy(alpha = .42f), modifier = Modifier.size(22.dp))
                } else {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        if (!completed) Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(18.dp))
                        Text(level.toString(), color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                        Row(horizontalArrangement = Arrangement.spacedBy(1.dp)) {
                            repeat(3) { index ->
                                Text(if (index < stars) "★" else "☆", color = if (index < stars) Color(0xFFFFD43B) else Color.White.copy(alpha = .42f), style = MaterialTheme.typography.labelMedium)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun worldName(world: Int): String = listOf(
    "First Flight", "Twisted Trails", "Neon Crossings", "Crystal Maze", "Arrow Storm",
    "Shadow Grid", "Master Lines", "Logic Forge", "Expert Orbit", "Final Frontier",
)[world.coerceIn(0, 9)]
