package com.agon.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.agon.app.data.GameMode
import com.agon.app.data.PuzzleDifficulty
import com.agon.app.data.rushTimerFor

@Composable
fun DifficultySelectionScreen(
    mode: GameMode,
    onBack: () -> Unit,
    onSelect: (PuzzleDifficulty) -> Unit,
) {
    val title = when (mode) {
        GameMode.DAILY -> "Daily Puzzle"
        GameMode.ZEN -> "Zen Mode"
        GameMode.RUSH -> "Rush Mode"
        else -> "Select Difficulty"
    }
    val subtitle = when (mode) {
        GameMode.DAILY -> "Choose your challenge for today"
        GameMode.ZEN -> "Relaxed solving — no timer pressure"
        GameMode.RUSH -> "Beat the clock at your chosen level"
        else -> "Pick a difficulty"
    }
    val icon = when (mode) {
        GameMode.DAILY -> Icons.Default.Bolt
        GameMode.ZEN -> Icons.Default.Spa
        GameMode.RUSH -> Icons.Default.Timer
        else -> Icons.Default.Bolt
    }

    Box(
        Modifier.fillMaxSize().background(
            Brush.verticalGradient(listOf(Color(0xFF0E1740), Color(0xFF271052), Color(0xFF091C35))),
        ),
    ) {
        Column(Modifier.fillMaxSize().padding(18.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(14.dp), color = Color(0xFF2A1B69)) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back", tint = Color.White)
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(title.uppercase(), color = Color(0xFF6EE7FF), style = MaterialTheme.typography.labelLarge)
                    Text(subtitle, color = Color.White.copy(alpha = .7f), style = MaterialTheme.typography.bodyMedium)
                }
            }
            Spacer(Modifier.height(28.dp))
            Surface(
                shape = RoundedCornerShape(24.dp),
                color = Color(0xFF25134D),
                shadowElevation = 12.dp,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = RoundedCornerShape(16.dp), color = Color(0xFF7447F5), modifier = Modifier.size(56.dp)) {
                        Icon(icon, null, tint = Color.White, modifier = Modifier.padding(14.dp))
                    }
                    Spacer(Modifier.width(14.dp))
                    Text(
                        "Select difficulty before starting",
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                    )
                }
            }
            Spacer(Modifier.height(24.dp))
            PuzzleDifficulty.entries.forEach { difficulty ->
                DifficultyCard(
                    difficulty = difficulty,
                    mode = mode,
                    onClick = { onSelect(difficulty) },
                )
                Spacer(Modifier.height(12.dp))
            }
        }
    }
}

@Composable
private fun DifficultyCard(difficulty: PuzzleDifficulty, mode: GameMode, onClick: () -> Unit) {
    val (color, description) = when (difficulty) {
        PuzzleDifficulty.EASY -> Color(0xFF69D900) to "Small board • Few arrows • Beginner-friendly"
        PuzzleDifficulty.MEDIUM -> Color(0xFF57D9FF) to "Moderate size • More blocking • Balanced challenge"
        PuzzleDifficulty.HARD -> Color(0xFFFF9F2A) to "Large board • Complex dependencies • Requires planning"
        PuzzleDifficulty.EXTREME -> Color(0xFFFF527D) to "Maximum complexity • Deep chains • Expert only"
    }
    val timerNote = if (mode == GameMode.RUSH) " • ${rushTimerFor(difficulty)}s+ timer" else ""
    Box(
        Modifier.fillMaxWidth().height(88.dp).clickable(onClick = onClick),
        contentAlignment = Alignment.TopCenter,
    ) {
        Surface(
            Modifier.fillMaxWidth().height(80.dp).offset(y = 6.dp),
            RoundedCornerShape(20.dp),
            color.copy(alpha = .35f),
        ) {}
        Surface(
            Modifier.fillMaxWidth().height(80.dp),
            RoundedCornerShape(20.dp),
            Color(0xFF2A1B69),
            shadowElevation = 10.dp,
        ) {
            Row(
                Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(shape = RoundedCornerShape(14.dp), color = color, modifier = Modifier.size(44.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            difficulty.tier.toString(),
                            color = Color.White,
                            fontWeight = FontWeight.Black,
                            style = MaterialTheme.typography.titleLarge,
                        )
                    }
                }
                Spacer(Modifier.width(14.dp))
                Column(Modifier.weight(1f)) {
                    Text(
                        difficulty.label.uppercase(),
                        color = Color.White,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Black,
                    )
                    Text(
                        description + timerNote,
                        color = Color.White.copy(alpha = .65f),
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                Text("▶", color = color, style = MaterialTheme.typography.titleLarge)
            }
        }
    }
}
