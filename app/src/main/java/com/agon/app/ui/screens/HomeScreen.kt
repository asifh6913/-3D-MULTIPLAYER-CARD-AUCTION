package com.agon.app.ui.screens

import androidx.compose.animation.AnimatedVisibility
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
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Spa
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Shadow
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.agon.app.data.ArrowUiState
import com.agon.app.data.GameMode

@Composable
fun HomeScreen(
    state: ArrowUiState,
    onPlay: () -> Unit,
    onContinue: () -> Unit,
    onDaily: () -> Unit,
    onZen: () -> Unit,
    onRush: () -> Unit,
    onRewards: () -> Unit,
    onSkins: () -> Unit,
    onSettings: () -> Unit,
) {
    val profile = state.profile
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFF102566), Color(0xFF1A3D92), Color(0xFF26175E)))),
    ) {
        GamePattern(Modifier.fillMaxSize())
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp, vertical = 14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                GameCurrency(Icons.Default.MonetizationOn, profile.coins.toString(), Color(0xFFFFC83D))
                Spacer(Modifier.width(8.dp))
                GameCurrency(Icons.Default.Diamond, profile.gems.toString(), Color(0xFF63DEFF))
                Spacer(Modifier.weight(1f))
                RoundMenuButton(Icons.Default.Palette, "Skins", Color(0xFFFF5EA8), onSkins)
                Spacer(Modifier.width(9.dp))
                RoundMenuButton(Icons.Default.Settings, "Settings", Color(0xFF57D9C4), onSettings)
            }

            Spacer(Modifier.height(10.dp))
            CodedGameLogo()

            Spacer(Modifier.height(10.dp))
            AnimatedVisibility(visible = state.session != null && state.session.status != com.agon.app.data.GameStatus.COMPLETE) {
                ContinueGameButton(
                    label = "CONTINUE ${state.session?.mode?.friendlyName()?.uppercase()}",
                    progress = state.session?.progress ?: 0f,
                    onClick = onContinue,
                )
            }
            if (state.session != null && state.session.status != com.agon.app.data.GameStatus.COMPLETE) Spacer(Modifier.height(12.dp))

            Play3DButton(
                level = (profile.completedLevel + 1).coerceAtMost(1_000),
                onClick = onPlay,
            )
            Spacer(Modifier.height(10.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("${profile.completedLevel} / 1,000 LEVELS", color = Color.White.copy(alpha = .76f), style = MaterialTheme.typography.labelMedium)
                Spacer(Modifier.width(9.dp))
                LinearProgressIndicator(
                    progress = { profile.completedLevel / 1_000f },
                    modifier = Modifier.width(105.dp).height(7.dp),
                    color = Color(0xFFFFD54A),
                    trackColor = Color.White.copy(alpha = .18f),
                )
            }

            Spacer(Modifier.height(23.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                HomeActionButton(Icons.Default.Palette, "SKINS", Color(0xFFFF5EA8), Modifier.weight(1f), onSkins)
                HomeActionButton(Icons.Default.EmojiEvents, "REWARDS", Color(0xFFFFA72F), Modifier.weight(1f), onRewards)
                HomeActionButton(Icons.Default.Settings, "SETTINGS", Color(0xFF40D0B5), Modifier.weight(1f), onSettings)
            }

            Spacer(Modifier.height(25.dp))
            Text("GAME MODES", color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text("Pick a challenge", color = Color.White.copy(alpha = .62f), style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(13.dp))
            DailyChallengeCard(onDaily)
            Spacer(Modifier.height(11.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                Mode3DCard(Icons.Default.Spa, "ZEN", "NO CLOCK", Color(0xFF27D5BE), Modifier.weight(1f), onZen)
                Mode3DCard(Icons.Default.Bolt, "RUSH", "90 SEC", Color(0xFF6C8CFF), Modifier.weight(1f), onRush)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun CodedGameLogo() {
    val motion = rememberInfiniteTransition(label = "logoMotion")
    val floatY by motion.animateFloat(-4f, 5f, infiniteRepeatable(tween(1_600), RepeatMode.Reverse), label = "logoFloat")
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.graphicsLayer { translationY = floatY }) {
        Box(Modifier.size(86.dp), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                drawCircle(Color(0xFF28D7FF).copy(alpha = .18f), size.minDimension * .5f)
                drawCircle(Color(0xFF934BFF).copy(alpha = .34f), size.minDimension * .39f)
            }
            Surface(shape = RoundedCornerShape(21.dp), color = Color(0xFF6E43EE), shadowElevation = 15.dp, modifier = Modifier.size(57.dp)) {
                ArrowLogo(Modifier.padding(13.dp), Color.White)
            }
        }
        Text(
            "ARROW LOGIC",
            color = Color.White,
            style = MaterialTheme.typography.displaySmall.copy(
                fontWeight = FontWeight.Black,
                shadow = Shadow(Color(0xFF12052F), Offset(0f, 7f), 9f),
            ),
        )
        Text("CLEAR THE PATH", color = Color(0xFF70E8FF), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
    }
}

@Composable
private fun FloatingWorldArt(modifier: Modifier = Modifier) {
    val motion = rememberInfiniteTransition(label = "worldMotion")
    val floatY by motion.animateFloat(-5f, 7f, infiniteRepeatable(tween(1_900), RepeatMode.Reverse), label = "worldFloat")
    Canvas(modifier.graphicsLayer { translationY = floatY }) {
        val cx = size.width * .53f
        val cy = size.height * .48f
        drawOval(Color(0xFF120A38).copy(alpha = .55f), Offset(size.width * .12f, size.height * .76f), androidx.compose.ui.geometry.Size(size.width * .78f, size.height * .13f))
        drawOval(Color(0xFF65412C), Offset(size.width * .15f, size.height * .53f), androidx.compose.ui.geometry.Size(size.width * .72f, size.height * .32f))
        drawOval(Color(0xFF35B73F), Offset(size.width * .10f, size.height * .40f), androidx.compose.ui.geometry.Size(size.width * .80f, size.height * .31f))
        drawOval(Color(0xFF74E358), Offset(size.width * .14f, size.height * .39f), androidx.compose.ui.geometry.Size(size.width * .70f, size.height * .22f))
        drawCircle(Color(0xFF8553F5), size.minDimension * .16f, Offset(cx, cy - size.height * .10f))
        drawCircle(Color.White.copy(alpha = .22f), size.minDimension * .11f, Offset(cx - size.width * .03f, cy - size.height * .14f))
        drawLine(Color.White, Offset(cx - 11f, cy), Offset(cx + 13f, cy - 22f), 7f, StrokeCap.Round)
        drawLine(Color.White, Offset(cx + 13f, cy - 22f), Offset(cx + 13f, cy - 6f), 7f, StrokeCap.Round)
        drawLine(Color.White, Offset(cx + 13f, cy - 22f), Offset(cx - 3f, cy - 22f), 7f, StrokeCap.Round)
        repeat(4) { index ->
            val x = size.width * (.23f + index * .16f)
            drawCircle(Color(0xFF1C8232), 8f, Offset(x, size.height * (.44f + (index % 2) * .11f)))
            drawRect(Color(0xFF7A4A25), Offset(x - 2f, size.height * (.48f + (index % 2) * .11f)), androidx.compose.ui.geometry.Size(4f, 14f))
        }
    }
}

@Composable
private fun Play3DButton(level: Int, onClick: () -> Unit) {
    Box(modifier = Modifier.fillMaxWidth().height(258.dp).clickable(onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(
            modifier = Modifier.fillMaxWidth().height(244.dp).offset(y = 10.dp),
            shape = RoundedCornerShape(28.dp),
            color = Color(0xFF2B0E4F),
        ) {}
        Surface(
            modifier = Modifier.fillMaxWidth().height(244.dp),
            shape = RoundedCornerShape(28.dp),
            color = Color.Transparent,
            shadowElevation = 18.dp,
        ) {
            Box(Modifier.fillMaxSize().background(Brush.linearGradient(listOf(Color(0xFF3A176C), Color(0xFF7E23A2), Color(0xFF21115A)))).padding(20.dp)) {
                Column(Modifier.align(Alignment.TopStart)) {
                    Text("LEVEL ADVENTURE", color = Color(0xFFFFD33D), style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Black)
                    Text("World ${(level - 1) / 100 + 1}", color = Color.White, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
                    Spacer(Modifier.height(9.dp))
                    Text("Level $level of 1,000", color = Color.White.copy(alpha = .86f), style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { ((level - 1) % 100) / 100f },
                        modifier = Modifier.width(150.dp).height(10.dp),
                        color = Color(0xFF7BE900),
                        trackColor = Color(0xFF1B103D),
                    )
                }
                FloatingWorldArt(Modifier.align(Alignment.CenterEnd).size(168.dp))
                Box(Modifier.align(Alignment.BottomStart).width(170.dp).height(62.dp), contentAlignment = Alignment.TopCenter) {
                    Surface(Modifier.fillMaxWidth().height(55.dp).offset(y = 6.dp), RoundedCornerShape(16.dp), Color(0xFF247000)) {}
                    Surface(Modifier.fillMaxWidth().height(55.dp), RoundedCornerShape(16.dp), Color(0xFF69D900), shadowElevation = 10.dp) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.Center, modifier = Modifier.fillMaxSize()) {
                            Text("PLAY", color = Color.White, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                            Spacer(Modifier.width(8.dp))
                            Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(30.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ContinueGameButton(label: String, progress: Float, onClick: () -> Unit) {
    Surface(onClick = onClick, shape = RoundedCornerShape(18.dp), color = Color(0xFF312273), shadowElevation = 10.dp, modifier = Modifier.fillMaxWidth(.88f)) {
        Row(Modifier.padding(horizontal = 15.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.ArrowForward, null, tint = Color(0xFF72E9FF))
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(label, color = Color.White, style = MaterialTheme.typography.labelLarge)
                LinearProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxWidth().height(5.dp), color = Color(0xFF72E9FF), trackColor = Color.White.copy(alpha = .15f))
            }
        }
    }
}

@Composable
private fun DailyChallengeCard(onClick: () -> Unit) {
    Box(Modifier.fillMaxWidth().height(105.dp).clickable(onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(94.dp).offset(y = 7.dp), RoundedCornerShape(22.dp), Color(0xFF31105B)) {}
        Surface(Modifier.fillMaxWidth().height(94.dp), RoundedCornerShape(22.dp), Color.Transparent, shadowElevation = 11.dp) {
            Row(
                modifier = Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Color(0xFF5B1C86), Color(0xFF301564)))).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(shape = RoundedCornerShape(15.dp), color = Color(0xFFFFB32D), modifier = Modifier.size(62.dp), shadowElevation = 7.dp) {
                    Icon(Icons.Default.CalendarMonth, null, tint = Color.White, modifier = Modifier.padding(13.dp))
                }
                Spacer(Modifier.width(13.dp))
                Column(Modifier.weight(1f)) {
                    Text("TODAY'S CHALLENGE", color = Color(0xFFFFD43B), style = MaterialTheme.typography.labelMedium)
                    Text("Daily Puzzle", color = Color.White, style = MaterialTheme.typography.titleLarge)
                    Text("Hard  •  +250 coins  •  +5 gems", color = Color.White.copy(alpha = .72f), style = MaterialTheme.typography.bodyMedium)
                }
                Icon(Icons.Default.Bolt, null, tint = Color(0xFFFFC227), modifier = Modifier.size(31.dp))
            }
        }
    }
}

@Composable
private fun Mode3DCard(icon: ImageVector, title: String, subtitle: String, color: Color, modifier: Modifier, onClick: () -> Unit) {
    Box(modifier = modifier.height(112.dp).clickable(onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(99.dp).offset(y = 7.dp), RoundedCornerShape(20.dp), color.copy(alpha = .38f)) {}
        Surface(Modifier.fillMaxWidth().height(99.dp), RoundedCornerShape(20.dp), Color(0xFF24195B), shadowElevation = 12.dp) {
            Column(Modifier.padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Surface(shape = RoundedCornerShape(13.dp), color = color, modifier = Modifier.size(43.dp), shadowElevation = 6.dp) {
                    Icon(icon, null, tint = Color.White, modifier = Modifier.padding(9.dp))
                }
                Spacer(Modifier.height(7.dp))
                Text(title, color = Color.White, style = MaterialTheme.typography.labelLarge)
                Text(subtitle, color = color, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun HomeActionButton(icon: ImageVector, label: String, color: Color, modifier: Modifier, onClick: () -> Unit) {
    Surface(onClick = onClick, modifier = modifier, shape = RoundedCornerShape(17.dp), color = Color(0xFF2C1E69), shadowElevation = 9.dp) {
        Column(Modifier.padding(vertical = 12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(icon, null, tint = color, modifier = Modifier.size(25.dp))
            Spacer(Modifier.height(5.dp))
            Text(label, color = Color.White, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
private fun RoundMenuButton(icon: ImageVector, description: String, color: Color, onClick: () -> Unit) {
    Surface(onClick = onClick, shape = CircleShape, color = Color(0xFF2D1F68), shadowElevation = 9.dp, modifier = Modifier.size(43.dp)) {
        Icon(icon, description, tint = color, modifier = Modifier.padding(10.dp))
    }
}

@Composable
private fun GameCurrency(icon: ImageVector, value: String, tint: Color) {
    Surface(shape = RoundedCornerShape(15.dp), color = Color(0xFF251A5A), shadowElevation = 8.dp) {
        Row(Modifier.padding(horizontal = 10.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(5.dp))
            Text(value, color = Color.White, style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
private fun GamePattern(modifier: Modifier = Modifier) {
    Canvas(modifier) {
        drawCircle(Color(0xFF8B4DFF).copy(alpha = .18f), size.minDimension * .46f, Offset(size.width * .05f, size.height * .22f))
        drawCircle(Color(0xFF16D9FF).copy(alpha = .12f), size.minDimension * .38f, Offset(size.width * .98f, size.height * .67f))
        repeat(8) { i ->
            val y = size.height * (.1f + i * .13f)
            drawLine(Color.White.copy(alpha = .035f), Offset(0f, y), Offset(size.width, y - size.height * .08f), 3f)
        }
    }
}

@Composable
fun SectionTitle(title: String, subtitle: String? = null) {
    Column {
        Text(title, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
        if (subtitle != null) Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun CurrencyPill(icon: ImageVector, text: String, tint: Color) {
    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant, shadowElevation = 4.dp) {
        Row(Modifier.padding(horizontal = 8.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = tint, modifier = Modifier.size(16.dp))
            Spacer(Modifier.width(4.dp))
            Text(text, style = MaterialTheme.typography.labelMedium)
        }
    }
}

@Composable
fun ArrowLogo(modifier: Modifier = Modifier, color: Color = MaterialTheme.colorScheme.primary) {
    Canvas(modifier) {
        val stroke = size.minDimension * .16f
        drawLine(color, Offset(size.width * .12f, size.height * .85f), Offset(size.width * .78f, size.height * .2f), stroke, StrokeCap.Round)
        drawLine(color, Offset(size.width * .45f, size.height * .2f), Offset(size.width * .78f, size.height * .2f), stroke, StrokeCap.Round)
        drawLine(color, Offset(size.width * .78f, size.height * .2f), Offset(size.width * .78f, size.height * .53f), stroke, StrokeCap.Round)
        drawCircle(color, stroke * .48f, Offset(size.width * .12f, size.height * .85f))
    }
}

private fun GameMode.friendlyName(): String = when (this) {
    GameMode.JOURNEY -> "Level"
    GameMode.DAILY -> "Daily"
    GameMode.ZEN -> "Zen"
    GameMode.RUSH -> "Rush"
}
