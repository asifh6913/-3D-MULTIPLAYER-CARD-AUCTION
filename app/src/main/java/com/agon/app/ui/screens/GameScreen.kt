package com.agon.app.ui.screens

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.scaleIn
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animate
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.Replay
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material.icons.filled.Undo
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.luminance
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.agon.app.data.ArrowDirection
import com.agon.app.data.GameMode
import com.agon.app.data.GameSession
import com.agon.app.data.GameStatus
import com.agon.app.data.PlayerProfile
import com.agon.app.ui.theme.BoardPalette
import com.agon.app.ui.theme.arrowPalette
import com.agon.app.ui.theme.backgroundPalette
import com.agon.app.ui.theme.boardPalette
import kotlinx.coroutines.launch
import kotlin.math.sin

@Composable
fun GameScreen(
    session: GameSession,
    profile: PlayerProfile,
    adLoading: Boolean,
    onBack: () -> Unit,
    onTap: (Int) -> Unit,
    onHint: () -> Unit,
    onUndo: () -> Unit,
    onRetry: () -> Unit,
    onContinueWithAd: () -> Unit,
    onNext: () -> Unit,
    onHome: () -> Unit,
    onDoubleCoins: () -> Unit,
) {
    val haptic = LocalHapticFeedback.current
    val dark = MaterialTheme.colorScheme.background.luminance() < .5f
    val gameBackground = backgroundPalette(profile.selectedBackgroundSkin, dark)
    val ambientMotion = rememberInfiniteTransition(label = "ambientBackground")
    val ambientPhase by ambientMotion.animateFloat(0f, 1f, infiniteRepeatable(tween(3_600), RepeatMode.Reverse), label = "ambientPhase")
    LaunchedEffect(session.invalidNonce) {
        if (session.invalidNonce > 0 && profile.hapticsEnabled) haptic.performHapticFeedback(HapticFeedbackType.LongPress)
    }
    LaunchedEffect(session.removedIds.size) {
        if (session.removedIds.isNotEmpty() && profile.hapticsEnabled) haptic.performHapticFeedback(HapticFeedbackType.TextHandleMove)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(gameBackground.colors))
            .drawBehind {
                val accent = when (profile.selectedBackgroundSkin) {
                    "lava" -> Color(0xFFFF5A22)
                    "cyber" -> Color(0xFF24DFFF)
                    "candy" -> Color(0xFFFF62C8)
                    "forest" -> Color(0xFF55D885)
                    "heaven" -> Color(0xFFFFD46A)
                    else -> Color(0xFF8C61FF)
                }
                repeat(12) { i ->
                    val x = ((i * 73) % 100) / 100f * size.width
                    val baseY = ((i * 41) % 100) / 100f
                    val y = ((baseY + ambientPhase * .12f * if (i % 2 == 0) 1f else -1f + 1f) % 1f) * size.height
                    drawCircle(accent.copy(alpha = .035f + (i % 3) * .018f), 7f + i % 5 * 4f, Offset(x, y))
                }
            }
            .padding(horizontal = 18.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, shadowElevation = 8.dp) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "Back") }
            }
            Column(Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(session.mode.title(session.level), style = MaterialTheme.typography.titleMedium)
                Text(session.mode.subtitle(session), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant, shadowElevation = 7.dp) {
                Row(Modifier.padding(horizontal = 10.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                    if (session.mode == GameMode.RUSH) {
                        Icon(Icons.Default.Timer, null, tint = if (session.seconds <= 15) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(4.dp))
                        AnimatedContent(session.seconds, label = "timer") { Text("${it}s", style = MaterialTheme.typography.labelLarge) }
                    } else {
                        Text(String.format("%02d:%02d", session.seconds / 60, session.seconds % 60), style = MaterialTheme.typography.labelLarge)
                    }
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            if (session.mode == GameMode.JOURNEY || session.mode == GameMode.DAILY) {
                Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                    repeat(3) { index ->
                        Icon(
                            if (index < session.hearts) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                            null,
                            tint = if (index < session.hearts) Color(0xFFFF5E6C) else MaterialTheme.colorScheme.outline,
                            modifier = Modifier.size(21.dp),
                        )
                    }
                }
            } else {
                Text(if (session.mode == GameMode.ZEN) "∞ LIVES" else "${session.boardsCleared} BOARDS", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.secondary)
            }
            Spacer(Modifier.weight(1f))
            Text("${session.remainingIds.size} LEFT", style = MaterialTheme.typography.labelLarge)
            Spacer(Modifier.width(10.dp))
            Text("${session.moves} MOVES", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Spacer(Modifier.height(9.dp))
        LinearProgressIndicator(
            progress = { session.progress },
            modifier = Modifier.fillMaxWidth().height(7.dp),
            color = MaterialTheme.colorScheme.secondary,
            trackColor = MaterialTheme.colorScheme.surfaceVariant,
        )
        Spacer(Modifier.weight(.35f))
        Interactive3DBoard(
            session = session,
            profile = profile,
            onTap = onTap,
            modifier = Modifier.fillMaxWidth().aspectRatio(session.puzzle.columns.toFloat() / session.puzzle.rows),
        )
        Spacer(Modifier.height(14.dp))
        Text(
            when {
                session.hintTileId != null -> "The glowing arrow has a clear path"
                session.puzzle.rows >= 7 -> "Pinch to zoom • drag to pan • tap arrows"
                else -> "Tap arrows • drag the board to tilt it in 3D"
            },
            style = MaterialTheme.typography.bodyMedium,
            color = if (session.hintTileId != null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Spacer(Modifier.weight(.65f))
        Row(horizontalArrangement = Arrangement.spacedBy(18.dp), verticalAlignment = Alignment.CenterVertically) {
            GameToolButton(Icons.Default.Undo, "Undo", enabled = session.removedIds.isNotEmpty() && !session.inputLocked, onClick = onUndo)
            Hint3DButton(profile.hints, onHint)
            GameToolButton(Icons.Default.Replay, "Restart", enabled = !session.inputLocked, onClick = onRetry)
        }
        Spacer(Modifier.height(22.dp))
    }

    if (session.status == GameStatus.FAILED) {
        GameOverDialog(
            session = session,
            adLoading = adLoading,
            onContinueWithAd = onContinueWithAd,
            onRetry = onRetry,
            onHome = onHome,
        )
    }

    if (session.status == GameStatus.COMPLETE) {
        WinDialog(
            session = session,
            adLoading = adLoading || session.adRewardPending,
            onNext = onNext,
            onHome = onHome,
            onDoubleCoins = onDoubleCoins,
        )
    }
}

@Composable
private fun GameToolButton(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, enabled: Boolean, onClick: () -> Unit) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Box(Modifier.size(width = 54.dp, height = 59.dp), contentAlignment = Alignment.TopCenter) {
            Surface(Modifier.size(50.dp).offset(y = 5.dp), CircleShape, MaterialTheme.colorScheme.outline) {}
            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surfaceVariant, shadowElevation = 8.dp) {
                IconButton(onClick = onClick, enabled = enabled, modifier = Modifier.size(50.dp)) { Icon(icon, label) }
            }
        }
        Text(label.uppercase(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun Hint3DButton(hints: Int, onClick: () -> Unit) {
    Box(Modifier.size(width = 70.dp, height = 72.dp), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.size(64.dp).offset(y = 7.dp), CircleShape, Color(0xFF8A3C05)) {}
        Surface(onClick = onClick, shape = CircleShape, color = Color(0xFFFFA726), shadowElevation = 12.dp, modifier = Modifier.size(64.dp)) {
            Column(Modifier.padding(top = 9.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.Lightbulb, "Hint", tint = Color.White)
                Text(hints.toString(), color = Color.White, style = MaterialTheme.typography.labelLarge)
            }
        }
    }
}

@Composable
private fun WinDialog(
    session: GameSession,
    adLoading: Boolean,
    onNext: () -> Unit,
    onHome: () -> Unit,
    onDoubleCoins: () -> Unit,
) {
    val isRush = session.mode == GameMode.RUSH
    val isZen = session.mode == GameMode.ZEN
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    Dialog(onDismissRequest = {}) {
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(320)) + scaleIn(tween(430), initialScale = .62f)) {
            Box(Modifier.fillMaxWidth().height(520.dp), contentAlignment = Alignment.TopCenter) {
                CompletionConfetti(Modifier.fillMaxSize())
                Surface(Modifier.fillMaxWidth().height(455.dp).offset(y = 27.dp), RoundedCornerShape(32.dp), Color(0xFF13072F)) {}
                Surface(Modifier.fillMaxWidth().height(455.dp).offset(y = 18.dp), RoundedCornerShape(32.dp), Color.Transparent, shadowElevation = 24.dp) {
                    Column(
                        modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF59249B), Color(0xFF321566), Color(0xFF21104A)))).padding(horizontal = 22.dp, vertical = 34.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Spacer(Modifier.height(36.dp))
                        Text(if (isRush) "TIME'S UP!" else "LEVEL CLEARED!", color = Color.White, style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
                        Text(if (isRush) "AMAZING RUN" else "PERFECT LOGIC", color = Color(0xFF70E9FF), style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.height(13.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                            repeat(3) { index ->
                                val earned = isRush || index < session.earnedStars.coerceAtLeast(1)
                                Surface(shape = CircleShape, color = if (earned) Color(0xFFFFB92E) else Color(0xFF25134D), shadowElevation = if (earned) 9.dp else 2.dp, modifier = Modifier.size(52.dp)) {
                                    Box(contentAlignment = Alignment.Center) { Text(if (earned) "★" else "☆", color = if (earned) Color.White else Color(0xFF776496), style = MaterialTheme.typography.headlineMedium) }
                                }
                            }
                        }
                        Spacer(Modifier.height(15.dp))
                        Text(if (isRush) "${session.boardsCleared} BOARDS  •  ${session.score} POINTS" else "${session.moves} MOVES  •  ${formatTime(session.seconds)}", color = Color.White.copy(alpha = .72f), style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.height(14.dp))
                        Surface(shape = RoundedCornerShape(17.dp), color = Color(0xFF1A0C3B), shadowElevation = 7.dp) {
                            Row(Modifier.padding(horizontal = 17.dp, vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.MonetizationOn, null, tint = Color(0xFFFFC33B)); Spacer(Modifier.width(5.dp)); Text(if (isRush) "+${(session.score / 30).coerceAtLeast(15)}" else "+${session.rewardCoins}", color = Color.White, fontWeight = FontWeight.Black)
                                if (session.rewardGems > 0) { Spacer(Modifier.width(17.dp)); Icon(Icons.Default.Diamond, null, tint = Color(0xFF62DFFF), modifier = Modifier.size(19.dp)); Spacer(Modifier.width(4.dp)); Text("+${session.rewardGems}", color = Color.White, fontWeight = FontWeight.Black) }
                            }
                        }
                        Spacer(Modifier.weight(1f))
                        Completion3DButton(if (isRush) "PLAY AGAIN" else if (isZen) "NEW BOARD" else "NEXT LEVEL", Color(0xFF68D80B), onNext)
                        Spacer(Modifier.height(9.dp))
                        if (!isRush && session.rewardCoins > 0 && !session.coinsDoubled) {
                            Completion3DButton(
                                text = if (adLoading) "LOADING AD..." else "2X COINS",
                                color = Color(0xFFFFA726),
                                onClick = { if (!adLoading) onDoubleCoins() },
                            )
                            Spacer(Modifier.height(9.dp))
                        }
                        Surface(onClick = onHome, shape = RoundedCornerShape(14.dp), color = Color(0xFF4A2887), shadowElevation = 6.dp) {
                            Text("HOME", Modifier.padding(horizontal = 22.dp, vertical = 10.dp), color = Color.White, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
                Surface(shape = CircleShape, color = Color(0xFFFFA925), shadowElevation = 18.dp, modifier = Modifier.size(102.dp)) {
                    Box(contentAlignment = Alignment.Center) { Text(if (isRush) "⚡" else "✓", color = Color.White, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Black) }
                }
            }
        }
    }
}

@Composable
private fun GameOverDialog(
    session: GameSession,
    adLoading: Boolean,
    onContinueWithAd: () -> Unit,
    onRetry: () -> Unit,
    onHome: () -> Unit,
) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) { visible = true }
    Dialog(onDismissRequest = {}) {
        AnimatedVisibility(visible = visible, enter = fadeIn(tween(320)) + scaleIn(tween(430), initialScale = .62f)) {
            Box(Modifier.fillMaxWidth().height(480.dp), contentAlignment = Alignment.TopCenter) {
                Surface(Modifier.fillMaxWidth().height(420.dp).offset(y = 27.dp), RoundedCornerShape(32.dp), Color(0xFF1A0510)) {}
                Surface(Modifier.fillMaxWidth().height(420.dp).offset(y = 18.dp), RoundedCornerShape(32.dp), Color.Transparent, shadowElevation = 24.dp) {
                    Column(
                        modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF6B1A2A), Color(0xFF3A1230), Color(0xFF1A0A20)))).padding(horizontal = 22.dp, vertical = 34.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                    ) {
                        Spacer(Modifier.height(36.dp))
                        Text("GAME OVER", color = Color(0xFFFF6B7A), style = MaterialTheme.typography.headlineLarge, fontWeight = FontWeight.Black)
                        Text("OUT OF LIVES", color = Color.White.copy(alpha = .72f), style = MaterialTheme.typography.labelLarge)
                        Spacer(Modifier.height(16.dp))
                        Text("The puzzle is still solvable.\nWatch an ad to continue, or try again.", color = Color.White.copy(alpha = .65f), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium)
                        Spacer(Modifier.weight(1f))
                        if (!session.continueUsed) {
                            Completion3DButton(
                                text = if (adLoading) "LOADING AD..." else "CONTINUE WITH 1 AD",
                                color = Color(0xFF704EFF),
                                onClick = { if (!adLoading) onContinueWithAd() },
                            )
                            Spacer(Modifier.height(9.dp))
                        }
                        Completion3DButton("TRY AGAIN", Color(0xFFFF9F2A), onRetry)
                        Spacer(Modifier.height(9.dp))
                        Surface(onClick = onHome, shape = RoundedCornerShape(14.dp), color = Color(0xFF4A2887), shadowElevation = 6.dp) {
                            Text("BACK TO HOME", Modifier.padding(horizontal = 22.dp, vertical = 10.dp), color = Color.White, style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }
                Surface(shape = CircleShape, color = Color(0xFFFF527D), shadowElevation = 18.dp, modifier = Modifier.size(102.dp)) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.FavoriteBorder, null, tint = Color.White, modifier = Modifier.size(44.dp))
                    }
                }
            }
        }
    }
}

@Composable
private fun Completion3DButton(text: String, color: Color, onClick: () -> Unit) {
    Box(Modifier.fillMaxWidth().height(58.dp).clickable(onClick = onClick), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(50.dp).offset(y = 6.dp), RoundedCornerShape(16.dp), Color(0xFF246F00)) {}
        Surface(Modifier.fillMaxWidth().height(50.dp), RoundedCornerShape(16.dp), color, shadowElevation = 10.dp) { Box(contentAlignment = Alignment.Center) { Text(text, color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black) } }
    }
}

@Composable
private fun CompletionConfetti(modifier: Modifier) {
    val motion = rememberInfiniteTransition(label = "confetti")
    val progress by motion.animateFloat(0f, 1f, infiniteRepeatable(tween(2_100)), label = "confettiFall")
    Canvas(modifier) {
        val colors = listOf(Color(0xFFFFC12F), Color(0xFF54DBFF), Color(0xFFFF4F91), Color(0xFF77E557))
        repeat(24) { i ->
            val x = ((i * 43) % 100) / 100f * size.width
            val y = (((i * 19) % 100) / 100f + progress) % 1f * size.height
            drawCircle(colors[i % colors.size].copy(alpha = .85f), 3f + i % 4, Offset(x, y))
        }
    }
}

private fun formatTime(seconds: Int): String = String.format("%02d:%02d", seconds / 60, seconds % 60)
@Composable
private fun Interactive3DBoard(
    session: GameSession,
    profile: PlayerProfile,
    onTap: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val dark = MaterialTheme.colorScheme.background.luminance() < .5f
    val board = boardPalette(profile.selectedBoardSkin, dark)
    var rotationX by remember(session.puzzle.seed) { mutableFloatStateOf(0f) }
    var rotationY by remember(session.puzzle.seed) { mutableFloatStateOf(0f) }
    var panX by remember(session.puzzle.seed) { mutableFloatStateOf(0f) }
    var panY by remember(session.puzzle.seed) { mutableFloatStateOf(0f) }
    var zoom by remember(session.puzzle.seed) { mutableFloatStateOf(1f) }

    Box(
        modifier = modifier
            .clip(RoundedCornerShape(34.dp))
            .pointerInput(session.puzzle.seed) {
                detectTransformGestures { _, pan, zoomChange, _ ->
                    val nextZoom = (zoom * zoomChange).coerceIn(1f, 3f)
                    zoom = nextZoom
                    if (nextZoom > 1.03f) {
                        rotationX = 0f
                        rotationY = 0f
                        val maxPanX = size.width * (nextZoom - 1f) * .48f
                        val maxPanY = size.height * (nextZoom - 1f) * .48f
                        panX = (panX + pan.x).coerceIn(-maxPanX, maxPanX)
                        panY = (panY + pan.y).coerceIn(-maxPanY, maxPanY)
                    } else {
                        zoom = 1f
                        panX = 0f
                        panY = 0f
                        rotationY = (rotationY + pan.x / 16f).coerceIn(-12f, 12f)
                        rotationX = (rotationX - pan.y / 16f).coerceIn(-12f, 12f)
                    }
                }
            },
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer {
                    this.rotationX = rotationX
                    this.rotationY = rotationY
                    scaleX = zoom
                    scaleY = zoom
                    translationX = panX
                    translationY = panY
                    cameraDistance = 18f * density
                    shadowElevation = 18f
                },
        ) {
            Surface(
                modifier = Modifier.fillMaxSize().offset(y = 10.dp).padding(horizontal = 5.dp),
                shape = RoundedCornerShape(29.dp),
                color = board.edge,
                shadowElevation = 12.dp,
            ) {}
            Surface(
                modifier = Modifier.fillMaxSize().offset(y = 5.dp).padding(horizontal = 2.dp),
                shape = RoundedCornerShape(29.dp),
                color = board.edge.copy(alpha = .92f),
            ) {}
            Surface(
                modifier = Modifier.fillMaxSize(),
                shape = RoundedCornerShape(28.dp),
                color = board.shell,
                shadowElevation = 8.dp,
            ) {
                ArrowBoard(
                    session = session,
                    skinId = profile.selectedArrowSkin,
                    board = board,
                    boardSkinId = profile.selectedBoardSkin,
                    onTap = onTap,
                    modifier = Modifier.padding(12.dp).fillMaxSize(),
                )
            }
        }
        if (zoom > 1.03f || kotlin.math.abs(rotationX) > .8f || kotlin.math.abs(rotationY) > .8f) {
            Surface(
                onClick = { zoom = 1f; panX = 0f; panY = 0f; rotationX = 0f; rotationY = 0f },
                modifier = Modifier.align(Alignment.TopEnd).padding(10.dp),
                shape = CircleShape,
                color = Color(0xE62A1B69),
                shadowElevation = 7.dp,
            ) {
                Text(if (zoom > 1.03f) "${String.format("%.1f", zoom)}×  RESET" else "RESET VIEW", modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp), color = Color.White, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

@Composable
private fun ArrowBoard(session: GameSession, skinId: String, board: BoardPalette, boardSkinId: String, onTap: (Int) -> Unit, modifier: Modifier = Modifier) {
    val arrowColors = arrowPalette(skinId, MaterialTheme.colorScheme.primary, MaterialTheme.colorScheme.onPrimary)
    val primary = arrowColors.tile
    val skinInk = arrowColors.ink
    val secondary = MaterialTheme.colorScheme.secondary
    val onSecondary = MaterialTheme.colorScheme.onSecondary
    val surface = board.cell
    val outline = board.dot.copy(alpha = .48f)
    val error = MaterialTheme.colorScheme.error
    val exitProgress by animateFloatAsState(
        targetValue = if (session.exitingTileId != null) 1f else 0f,
        animationSpec = tween(250, easing = FastOutSlowInEasing),
        label = "arrowLaunch",
    )
    val shake = remember { Animatable(0f) }
    LaunchedEffect(session.invalidNonce) {
        if (session.invalidNonce > 0) {
            shake.snapTo(0f)
            listOf(-1f, 1f, -.75f, .75f, 0f).forEach { shake.animateTo(it, tween(45)) }
        }
    }
    val infinite = rememberInfiniteTransition(label = "hintPulse")
    val pulse by infinite.animateFloat(
        initialValue = .65f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(700), RepeatMode.Reverse),
        label = "pulse",
    )
    // A slow, staggered-per-tile phase so idle arrows have a subtle living glow.
    val glowPhase by infinite.animateFloat(
        initialValue = 0f,
        targetValue = (2 * Math.PI).toFloat(),
        animationSpec = infiniteRepeatable(tween(5_200, easing = LinearEasing)),
        label = "glowPhase",
    )
    // Instant tap-down feedback, decoupled from whether the move ends up valid.
    var pressedTileId by remember { mutableStateOf(-1) }
    var pressNonce by remember { mutableStateOf(0) }
    val pressScale = remember { Animatable(1f) }
    val pressRipple = remember { Animatable(1f) }
    LaunchedEffect(pressNonce) {
        if (pressNonce == 0) return@LaunchedEffect
        pressScale.snapTo(1f)
        pressRipple.snapTo(0f)
        launch {
            pressScale.animateTo(.84f, tween(65, easing = FastOutSlowInEasing))
            pressScale.animateTo(1f, spring(dampingRatio = .42f, stiffness = 380f))
        }
        pressRipple.animateTo(1f, tween(320, easing = FastOutSlowInEasing))
    }

    Canvas(
        modifier = modifier.pointerInput(session.puzzle.seed, session.remainingIds, session.inputLocked) {
            detectTapGestures(
                onPress = { offset ->
                    if (!session.inputLocked && session.status == GameStatus.PLAYING) {
                        val cellWidth = size.width / session.puzzle.columns
                        val cellHeight = size.height / session.puzzle.rows
                        val column = (offset.x / cellWidth).toInt().coerceIn(0, session.puzzle.columns - 1)
                        val row = (offset.y / cellHeight).toInt().coerceIn(0, session.puzzle.rows - 1)
                        session.remainingTiles.firstOrNull { it.row == row && it.col == column }?.let {
                            pressedTileId = it.id
                            pressNonce++
                        }
                    }
                },
                onTap = { offset ->
                    if (!session.inputLocked && session.status == GameStatus.PLAYING) {
                        val cellWidth = size.width / session.puzzle.columns
                        val cellHeight = size.height / session.puzzle.rows
                        val column = (offset.x / cellWidth).toInt().coerceIn(0, session.puzzle.columns - 1)
                        val row = (offset.y / cellHeight).toInt().coerceIn(0, session.puzzle.rows - 1)
                        session.remainingTiles.firstOrNull { it.row == row && it.col == column }?.let { onTap(it.id) }
                    }
                },
            )
        },
    ) {
        drawBoardTexture(boardSkinId, board)
        val cw = size.width / session.puzzle.columns
        val ch = size.height / session.puzzle.rows
        val cell = minOf(cw, ch)
        val inset = cell * .09f

        for (row in 0 until session.puzzle.rows) for (column in 0 until session.puzzle.columns) {
            drawRoundRect(
                color = surface.copy(alpha = .65f),
                topLeft = Offset(column * cw + inset, row * ch + inset),
                size = Size(cw - inset * 2, ch - inset * 2),
                cornerRadius = CornerRadius(cell * .2f),
            )
            drawCircle(outline, cell * .025f, Offset(column * cw + cw / 2, row * ch + ch / 2))
        }

        session.remainingTiles.forEach { tile ->
            val isExiting = tile.id == session.exitingTileId
            val isInvalid = tile.id == session.invalidTileId
            val isHint = tile.id == session.hintTileId
            val isPressed = tile.id == pressedTileId && pressRipple.value < 1f
            val center = Offset(tile.col * cw + cw / 2, tile.row * ch + ch / 2)
            val flightDistance = when (tile.direction) {
                ArrowDirection.UP -> Offset(0f, -(tile.row + 2) * ch)
                ArrowDirection.DOWN -> Offset(0f, (session.puzzle.rows - tile.row + 1) * ch)
                ArrowDirection.LEFT -> Offset(-(tile.col + 2) * cw, 0f)
                ArrowDirection.RIGHT -> Offset((session.puzzle.columns - tile.col + 1) * cw, 0f)
            }
            val shakeOffset = if (isInvalid) Offset(shake.value * cell * .08f, 0f) else Offset.Zero
            val c = center + (if (isExiting) flightDistance * exitProgress else Offset.Zero) + shakeOffset
            val pressBounce = if (isPressed) 1f - (1f - pressScale.value) * (1f - pressRipple.value) else 1f
            val scale = (if (isHint) .86f + pulse * .12f else .92f) * pressBounce
            val tileSize = cell * .74f * scale
            val tileColor = when {
                isInvalid -> error
                isHint -> secondary
                skinId == "classic" || skinId == "rainbow" -> when (tile.direction) {
                    ArrowDirection.UP -> Color(0xFF268CF5)
                    ArrowDirection.DOWN -> Color(0xFFA23DEB)
                    ArrowDirection.LEFT -> Color(0xFFFF4D3D)
                    ArrowDirection.RIGHT -> Color(0xFF62C91B)
                }
                skinId == "plasma" -> androidx.compose.ui.graphics.lerp(Color(0xFF743CFF), Color(0xFFFF43C8), pulse)
                skinId == "lava" -> androidx.compose.ui.graphics.lerp(Color(0xFFDB2A0A), Color(0xFFFF852D), pulse)
                else -> primary
            }

            // Comet-style trail while a cleared arrow flies off the board.
            if (isExiting) {
                listOf(.22f, .14f, .07f).forEachIndexed { index, lag ->
                    val echoProgress = (exitProgress - lag).coerceAtLeast(0f)
                    if (echoProgress > 0f) {
                        val echoCenter = center + flightDistance * echoProgress
                        drawRoundRect(
                            color = tileColor.copy(alpha = (.20f - index * .06f) * (1f - exitProgress)),
                            topLeft = Offset(echoCenter.x - tileSize / 2, echoCenter.y - tileSize / 2),
                            size = Size(tileSize, tileSize),
                            cornerRadius = CornerRadius(cell * .21f),
                        )
                    }
                }
            }

            // Soft ambient glow, staggered per tile, so idle arrows feel alive.
            val ambient = sin(glowPhase + tile.id * .9f) * .5f + .5f
            drawCircle(tileColor.copy(alpha = .05f + ambient * .06f), tileSize * .74f, c)

            if (skinId == "neon" || skinId == "plasma" || skinId == "lava" || skinId == "ice") {
                drawCircle(tileColor.copy(alpha = .13f + pulse * .12f), tileSize * (.62f + pulse * .08f), c)
            }
            drawRoundRect(
                color = Color.Black.copy(alpha = .10f),
                topLeft = Offset(c.x - tileSize / 2 + cell * .035f, c.y - tileSize / 2 + cell * .05f),
                size = Size(tileSize, tileSize),
                cornerRadius = CornerRadius(cell * .21f),
            )
            drawRoundRect(
                color = tileColor,
                topLeft = Offset(c.x - tileSize / 2, c.y - tileSize / 2),
                size = Size(tileSize, tileSize),
                cornerRadius = CornerRadius(cell * .21f),
            )
            drawRoundRect(
                color = Color.White.copy(alpha = .24f),
                topLeft = Offset(c.x - tileSize / 2 + cell * .025f, c.y - tileSize / 2 + cell * .025f),
                size = Size(tileSize - cell * .05f, tileSize - cell * .05f),
                cornerRadius = CornerRadius(cell * .18f),
                style = Stroke(width = cell * .025f),
            )
            if (isHint) {
                drawCircle(secondary.copy(alpha = .18f * pulse), cell * .47f * pulse, c)
            }
            // Expanding ripple ring: instant tap-down feedback before the move resolves.
            if (isPressed) {
                drawCircle(
                    color = tileColor.copy(alpha = (1f - pressRipple.value) * .55f),
                    radius = tileSize * (.55f + pressRipple.value * .55f),
                    center = c,
                    style = Stroke(width = cell * .03f),
                )
            }
            val arrowInk = when {
                isInvalid -> Color.White
                isHint -> onSecondary
                else -> skinInk
            }
            drawArrow(c, tile.direction, cell * .25f, arrowInk, cell * .075f)
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawBoardTexture(id: String, board: BoardPalette) {
    when (id) {
        "wood" -> repeat(9) { index ->
            val y = size.height * (index + 1) / 10f
            drawLine(board.dot.copy(alpha = .16f), Offset(0f, y), Offset(size.width, y + (index % 3 - 1) * 4f), 2f)
        }
        "carbon" -> {
            var x = -size.height
            while (x < size.width) {
                drawLine(board.dot.copy(alpha = .12f), Offset(x, 0f), Offset(x + size.height, size.height), 2f)
                x += 22f
            }
        }
        "ice" -> repeat(18) { index ->
            val x = ((index * 47) % 97) / 97f * size.width
            val y = ((index * 71) % 101) / 101f * size.height
            drawCircle(board.dot.copy(alpha = .20f), if (index % 3 == 0) 3.5f else 2f, Offset(x, y))
        }
        "candy" -> repeat(12) { index ->
            val x = ((index * 37) % 89) / 89f * size.width
            val y = ((index * 53) % 83) / 83f * size.height
            drawCircle(board.dot.copy(alpha = .10f), 10f + index % 3 * 3f, Offset(x, y), style = Stroke(2f))
        }
        "royal" -> repeat(8) { index ->
            val y = size.height * (index + 1) / 9f
            drawLine(board.dot.copy(alpha = .12f), Offset(0f, y), Offset(size.width, y), 2f)
        }
        "lava" -> repeat(7) { index ->
            val y = size.height * (index + 1) / 8f
            drawLine(board.dot.copy(alpha = .28f), Offset((index % 2) * size.width * .18f, y), Offset(size.width * (.72f + (index % 3) * .12f), y + 18f), 4f)
        }
        "tech" -> {
            repeat(7) { index ->
                val x = size.width * (index + 1) / 8f
                drawLine(board.dot.copy(alpha = .20f), Offset(x, 0f), Offset(x, size.height), 2f)
            }
            repeat(12) { i -> drawCircle(board.dot.copy(alpha = .35f), 3f, Offset((i * 47 % 100) / 100f * size.width, (i * 73 % 100) / 100f * size.height)) }
        }
        "jungle" -> repeat(14) { i ->
            drawCircle(board.dot.copy(alpha = .14f), 7f + i % 4, Offset((i * 61 % 100) / 100f * size.width, (i * 39 % 100) / 100f * size.height), style = Stroke(2f))
        }
        "galaxy" -> repeat(24) { i ->
            drawCircle(Color.White.copy(alpha = .12f + (i % 3) * .06f), 1.5f + i % 3, Offset((i * 67 % 100) / 100f * size.width, (i * 43 % 100) / 100f * size.height))
        }
    }
}

private fun androidx.compose.ui.graphics.drawscope.DrawScope.drawArrow(
    center: Offset,
    direction: ArrowDirection,
    length: Float,
    color: Color,
    stroke: Float,
) {
    val vector = when (direction) {
        ArrowDirection.UP -> Offset(0f, -1f)
        ArrowDirection.DOWN -> Offset(0f, 1f)
        ArrowDirection.LEFT -> Offset(-1f, 0f)
        ArrowDirection.RIGHT -> Offset(1f, 0f)
    }
    val perpendicular = Offset(-vector.y, vector.x)
    val tail = center - vector * length * .7f
    val tip = center + vector * length
    val headBase = tip - vector * length * .58f

    // Soft light under the tip gives the arrowhead a lit, forward-pointing feel.
    drawCircle(color.copy(alpha = .25f), stroke * 2.4f, tip - vector * length * .16f)

    drawLine(color, tail, headBase, stroke, StrokeCap.Round)

    val head = Path().apply {
        moveTo(tip.x, tip.y)
        lineTo(headBase.x + perpendicular.x * length * .46f, headBase.y + perpendicular.y * length * .46f)
        lineTo(headBase.x - perpendicular.x * length * .46f, headBase.y - perpendicular.y * length * .46f)
        close()
    }
    drawPath(head, color)
    drawPath(head, Color.White.copy(alpha = .28f), style = Stroke(width = stroke * .3f))
    drawCircle(color, stroke * .48f, tail)
}

private fun GameMode.title(level: Int): String = when (this) {
    GameMode.JOURNEY -> "LEVEL $level"
    GameMode.DAILY -> "DAILY PUZZLE"
    GameMode.ZEN -> "ZEN BOARD $level"
    GameMode.RUSH -> "RUSH"
}

private fun GameMode.subtitle(session: GameSession): String = when (this) {
    GameMode.JOURNEY -> "DIFFICULTY ${session.puzzle.difficulty}"
    GameMode.DAILY -> "TODAY • ${session.puzzleDifficulty.label.uppercase()}"
    GameMode.ZEN -> "${session.puzzleDifficulty.label.uppercase()} • TAKE YOUR TIME"
    GameMode.RUSH -> "${session.puzzleDifficulty.label.uppercase()} • ${session.score} POINTS"
}
