package com.agon.app.ui.screens

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.DarkMode
import androidx.compose.material.icons.filled.Diamond
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MonetizationOn
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material.icons.filled.WorkspacePremium
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.ListItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.agon.app.R
import com.agon.app.ads.RewardedAdState
import com.agon.app.data.ArrowSkin
import com.agon.app.data.ArrowSkins
import com.agon.app.data.PlayerProfile

@Composable
fun LevelsScreen(profile: PlayerProfile, onLevel: (Int) -> Unit) {
    var world by rememberSaveable { mutableIntStateOf((profile.completedLevel / 100).coerceIn(0, 9)) }
    Column(Modifier.fillMaxSize()) {
        Column(Modifier.padding(horizontal = 20.dp, vertical = 18.dp)) {
            Text("Levels", style = MaterialTheme.typography.headlineLarge)
            Text("1,000 levels • difficulty rises every 5 levels", style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(Modifier.height(16.dp))
            Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(48.dp)) {
                        Box(contentAlignment = Alignment.Center) { Text("${profile.rank}", color = MaterialTheme.colorScheme.onPrimary, fontWeight = FontWeight.Black) }
                    }
                    Spacer(Modifier.width(14.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Pathfinder rank ${profile.rank}", style = MaterialTheme.typography.titleMedium)
                        Spacer(Modifier.height(6.dp))
                        LinearProgressIndicator(progress = { profile.rankProgress }, modifier = Modifier.fillMaxWidth().height(7.dp))
                        Spacer(Modifier.height(4.dp))
                        Text("${profile.xp % 300} / 300 XP", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
        }
        LazyRow(
            contentPadding = PaddingValues(horizontal = 20.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items((0 until 10).toList()) { index ->
                FilterChip(
                    selected = world == index,
                    onClick = { world = index },
                    label = { Text("World ${index + 1}") },
                    leadingIcon = if (world == index) ({ Icon(Icons.Default.Check, null, modifier = Modifier.size(16.dp)) }) else null,
                )
            }
        }
        Spacer(Modifier.height(8.dp))
        LazyVerticalGrid(
            columns = GridCells.Fixed(4),
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 6.dp, bottom = 110.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            items(((world * 100 + 1)..(world * 100 + 100)).toList()) { level ->
                val complete = level <= profile.completedLevel
                val unlocked = level <= profile.completedLevel + 1
                Card(
                    onClick = { if (unlocked) onLevel(level) },
                    enabled = unlocked,
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = when {
                            complete -> MaterialTheme.colorScheme.secondaryContainer
                            unlocked -> MaterialTheme.colorScheme.primary
                            else -> MaterialTheme.colorScheme.surfaceVariant
                        },
                        disabledContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                    ),
                    modifier = Modifier.height(78.dp),
                ) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            when {
                                complete -> Icon(Icons.Default.Check, null, tint = MaterialTheme.colorScheme.secondary, modifier = Modifier.size(21.dp))
                                unlocked -> Text(level.toString(), color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.titleLarge)
                                else -> Icon(Icons.Default.Lock, null, tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = .55f), modifier = Modifier.size(18.dp))
                            }
                            if (complete) Text(level.toString(), style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSecondaryContainer)
                            Text(
                                "T${(level - 1) / 5 + 1}",
                                style = MaterialTheme.typography.labelMedium,
                                color = if (unlocked && !complete) MaterialTheme.colorScheme.onPrimary.copy(alpha = .72f) else MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun RewardsScreen(
    profile: PlayerProfile,
    giftAvailable: Boolean,
    onClaimGift: () -> Unit,
    onBuyHints: (Int, Int) -> Unit,
    adState: RewardedAdState,
    onWatchCoins: () -> Unit,
    onWatchGems: () -> Unit,
    onPremium: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 18.dp, bottom = 110.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text("Rewards", style = MaterialTheme.typography.headlineLarge)
                    Text("Boosters, gifts and milestones", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                CurrencyPill(Icons.Default.MonetizationOn, profile.coins.toString(), Color(0xFFFFB627))
                Spacer(Modifier.width(8.dp))
                CurrencyPill(Icons.Default.Diamond, profile.gems.toString(), Color(0xFF6EA8FF))
            }
        }
        item {
            Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.Transparent)) {
                Column(
                    Modifier
                        .background(Brush.linearGradient(listOf(Color(0xFF6A4CDB), Color(0xFF3B7BEE))))
                        .padding(22.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.daily_gift_reference),
                            contentDescription = "Daily gift",
                            modifier = Modifier.width(112.dp).height(78.dp).clip(RoundedCornerShape(16.dp)),
                            contentScale = ContentScale.Crop,
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(if (giftAvailable) "Your daily gift" else "Gift collected", color = Color.White, style = MaterialTheme.typography.titleLarge)
                            Text(if (giftAvailable) "+75 coins  •  +1 hint" else "Come back tomorrow", color = Color.White.copy(.8f))
                        }
                    }
                    Spacer(Modifier.height(18.dp))
                    Button(onClick = onClaimGift, enabled = giftAvailable, modifier = Modifier.fillMaxWidth()) {
                        Text(if (giftAvailable) "OPEN GIFT" else "COLLECTED")
                    }
                }
            }
        }

        item { SectionTitle("WATCH & EARN", "Watch a short rewarded ad and collect instantly.") }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AdRewardCard(
                    modifier = Modifier.weight(1f),
                    title = "+250 COINS",
                    color = Color(0xFFFFA726),
                    ready = adState == RewardedAdState.READY,
                    loading = adState == RewardedAdState.LOADING || adState == RewardedAdState.SHOWING,
                    onClick = onWatchCoins,
                )
                AdRewardCard(
                    modifier = Modifier.weight(1f),
                    title = "+5 GEMS",
                    color = Color(0xFF7A63F2),
                    ready = adState == RewardedAdState.READY,
                    loading = adState == RewardedAdState.LOADING || adState == RewardedAdState.SHOWING,
                    onClick = onWatchGems,
                )
            }
        }

        item { SectionTitle("BOOSTERS", "Spend coins earned by solving puzzles.") }
        item { BoosterCard(Icons.Default.Lightbulb, "Hint pack", "Reveal a safe arrow", "3 HINTS", 120) { onBuyHints(3, 120) } }
        item { BoosterCard(Icons.Default.Stars, "Explorer pack", "Stock up for harder chapters", "8 HINTS", 280) { onBuyHints(8, 280) } }

        item { SectionTitle("FOUNDER PASS", "A permanent premium upgrade.") }
        item {
            Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF0C8))) {
                Column(Modifier.padding(20.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.WorkspacePremium, null, tint = Color(0xFF9C6500), modifier = Modifier.size(34.dp))
                        Spacer(Modifier.width(12.dp))
                        Column(Modifier.weight(1f)) {
                            Text(if (profile.premium) "Founder Pass active" else "Unlock Founder Pass", color = Color(0xFF4A3210), style = MaterialTheme.typography.titleLarge)
                            Text("Premium badge • bonus palette • support development", color = Color(0xFF765A2A), style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                    Spacer(Modifier.height(14.dp))
                    OutlinedButton(onClick = onPremium, enabled = !profile.premium, modifier = Modifier.fillMaxWidth()) {
                        Icon(if (profile.premium) Icons.Default.Check else Icons.Default.Diamond, null)
                        Spacer(Modifier.width(8.dp))
                        Text(if (profile.premium) "OWNED" else "500 GEMS • PERMANENT")
                    }
                }
            }
        }

        item { SectionTitle("ACHIEVEMENTS") }
        item {
            AchievementRow(Icons.Default.EmojiEvents, "First steps", "Solve 1 puzzle", profile.totalPuzzles, 1)
            Spacer(Modifier.height(10.dp))
            AchievementRow(Icons.Default.Bolt, "Quick thinker", "Score 2,000 in Rush", profile.bestRushScore, 2_000)
            Spacer(Modifier.height(10.dp))
            AchievementRow(Icons.Default.Shield, "Logic legend", "Clear all 1,000 levels", profile.completedLevel, 1_000)
        }
    }
}

@Composable
private fun AdRewardCard(
    modifier: Modifier,
    title: String,
    color: Color,
    ready: Boolean,
    loading: Boolean,
    onClick: () -> Unit,
) {
    Box(modifier = modifier.height(142.dp), contentAlignment = Alignment.TopCenter) {
        Surface(Modifier.fillMaxWidth().height(130.dp).padding(top = 7.dp), RoundedCornerShape(22.dp), color.copy(alpha = .5f)) {}
        Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.fillMaxWidth().height(130.dp)) {
            Column(
                Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(color, color.copy(alpha = .72f)))).padding(13.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
            ) {
                Icon(Icons.Default.PlayCircle, null, tint = Color.White, modifier = Modifier.size(38.dp))
                Spacer(Modifier.height(6.dp))
                Text(title, color = Color.White, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black)
                Text(if (ready) "WATCH AD" else if (loading) "LOADING..." else "RETRY", color = Color.White.copy(alpha = .82f), style = MaterialTheme.typography.labelMedium)
                if (!loading) {
                    Spacer(Modifier.height(5.dp))
                    OutlinedButton(onClick = onClick, enabled = true, contentPadding = PaddingValues(horizontal = 14.dp, vertical = 1.dp)) { Text("CLAIM", color = Color.White) }
                }
            }
        }
    }
}

@Composable
private fun ArrowSkinCard(skin: ArrowSkin, unlocked: Boolean, selected: Boolean, onClick: () -> Unit) {
    val (tileColor, inkColor) = skinPreviewColors(skin.id)
    Card(shape = RoundedCornerShape(22.dp), modifier = Modifier.width(166.dp)) {
        Column(Modifier.padding(14.dp)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(92.dp)
                    .clip(RoundedCornerShape(17.dp))
                    .background(tileColor.copy(alpha = .16f)),
                contentAlignment = Alignment.Center,
            ) {
                Surface(shape = RoundedCornerShape(16.dp), color = tileColor, modifier = Modifier.size(58.dp), shadowElevation = 5.dp) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.ArrowForward, null, tint = inkColor, modifier = Modifier.size(34.dp))
                    }
                }
                if (!unlocked) {
                    Surface(shape = CircleShape, color = MaterialTheme.colorScheme.surface.copy(alpha = .9f), modifier = Modifier.align(Alignment.TopEnd).padding(7.dp)) {
                        Icon(Icons.Default.Lock, null, modifier = Modifier.padding(5.dp).size(14.dp))
                    }
                }
            }
            Spacer(Modifier.height(10.dp))
            Text(skin.title, style = MaterialTheme.typography.titleMedium, maxLines = 1)
            Text(skin.subtitle, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
            Spacer(Modifier.height(10.dp))
            OutlinedButton(onClick = onClick, enabled = !selected, modifier = Modifier.fillMaxWidth(), contentPadding = PaddingValues(horizontal = 8.dp)) {
                if (!unlocked) {
                    Icon(Icons.Default.MonetizationOn, null, tint = Color(0xFFFFB627), modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                }
                Text(when { selected -> "EQUIPPED"; unlocked -> "EQUIP"; else -> skin.coinCost.toString() }, style = MaterialTheme.typography.labelMedium)
            }
        }
    }
}

private fun skinPreviewColors(id: String): Pair<Color, Color> = when (id) {
    "mint" -> Color(0xFF12AFA2) to Color.White
    "sunset" -> Color(0xFFFF7043) to Color.White
    "gold" -> Color(0xFFF5B82E) to Color(0xFF422900)
    "neon" -> Color(0xFFB94CFF) to Color.White
    "midnight" -> Color(0xFF172A49) to Color(0xFF71E7FF)
    else -> Color(0xFF2F6BFF) to Color.White
}

@Composable
private fun BoosterCard(icon: ImageVector, title: String, subtitle: String, amount: String, cost: Int, onClick: () -> Unit) {
    Card(shape = RoundedCornerShape(20.dp)) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = RoundedCornerShape(14.dp), color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(50.dp)) {
                Box(contentAlignment = Alignment.Center) { Icon(icon, null, tint = MaterialTheme.colorScheme.primary) }
            }
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            }
            OutlinedButton(onClick = onClick) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(amount, style = MaterialTheme.typography.labelMedium)
                    Text("$cost coins", style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}

@Composable
private fun AchievementRow(icon: ImageVector, title: String, subtitle: String, value: Int, target: Int) {
    val done = value >= target
    Card(shape = RoundedCornerShape(18.dp)) {
        Row(Modifier.padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(if (done) Icons.Default.Check else icon, null, tint = if (done) MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.primary)
            Spacer(Modifier.width(13.dp))
            Column(Modifier.weight(1f)) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyMedium)
            }
            Text("${value.coerceAtMost(target)}/$target", style = MaterialTheme.typography.labelLarge)
        }
    }
}

@Composable
fun SettingsScreen(
    profile: PlayerProfile,
    onSound: (Boolean) -> Unit,
    onHaptics: (Boolean) -> Unit,
    onDarkTheme: (Boolean) -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(bottom = 110.dp),
    ) {
        item {
            Column(Modifier.padding(20.dp)) {
                Text("Profile", style = MaterialTheme.typography.headlineLarge)
                Text("Your progress and game preferences", color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(20.dp))
                Card(shape = RoundedCornerShape(24.dp), modifier = Modifier.fillMaxWidth()) {
                    Column(Modifier.padding(20.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary, modifier = Modifier.size(62.dp)) {
                                Box(contentAlignment = Alignment.Center) { Text(profile.rank.toString(), style = MaterialTheme.typography.headlineMedium, color = MaterialTheme.colorScheme.onPrimary) }
                            }
                            Spacer(Modifier.width(14.dp))
                            Column(Modifier.weight(1f)) {
                                Text("Pathfinder", style = MaterialTheme.typography.titleLarge)
                                Text("Rank ${profile.rank} • ${profile.xp} XP", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                            if (profile.premium) Icon(Icons.Default.WorkspacePremium, "Founder", tint = Color(0xFFFFB627), modifier = Modifier.size(30.dp))
                        }
                        Spacer(Modifier.height(18.dp))
                        LinearProgressIndicator(progress = { profile.rankProgress }, modifier = Modifier.fillMaxWidth().height(8.dp))
                    }
                }
            }
        }
        item {
            Row(Modifier.padding(horizontal = 20.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                StatCard("${profile.totalPuzzles}", "PUZZLES", Modifier.weight(1f))
                StatCard("${profile.completedLevel}", "LEVEL", Modifier.weight(1f))
                StatCard("${profile.bestRushScore}", "RUSH", Modifier.weight(1f))
            }
            Spacer(Modifier.height(24.dp))
        }
        item {
            Text("PREFERENCES", modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp), style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
            ListItem(
                headlineContent = { Text("Sound effects") },
                supportingContent = { Text("Arrow launches and rewards") },
                leadingContent = { Icon(Icons.Default.GraphicEq, null) },
                trailingContent = { Switch(profile.soundEnabled, onSound) },
            )
            HorizontalDivider(Modifier.padding(horizontal = 20.dp))
            ListItem(
                headlineContent = { Text("Haptic feedback") },
                supportingContent = { Text("Subtle feedback for every move") },
                leadingContent = { Icon(Icons.Default.TouchApp, null) },
                trailingContent = { Switch(profile.hapticsEnabled, onHaptics) },
            )
            HorizontalDivider(Modifier.padding(horizontal = 20.dp))
            ListItem(
                headlineContent = { Text("Dark theme") },
                supportingContent = { Text("A calm, low-light board") },
                leadingContent = { Icon(Icons.Default.DarkMode, null) },
                trailingContent = { Switch(profile.darkTheme, onDarkTheme) },
            )
        }
        item {
            Column(Modifier.padding(20.dp)) {
                Text("HOW TO PLAY", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.primary)
                Spacer(Modifier.height(8.dp))
                Card(shape = RoundedCornerShape(20.dp)) {
                    Column(Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                        Instruction("1", "Tap an arrow only when its path to the edge is clear.")
                        Instruction("2", "Blocked arrows cost a life in Levels and Daily.")
                        Instruction("3", "Clear the whole board. Any legal arrow is always safe.")
                    }
                }
                Spacer(Modifier.height(22.dp))
                Text("Arrow Logic • 1.0", modifier = Modifier.fillMaxWidth(), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
private fun StatCard(value: String, label: String, modifier: Modifier) {
    Surface(modifier = modifier, shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surfaceVariant) {
        Column(Modifier.padding(vertical = 15.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(value, style = MaterialTheme.typography.titleLarge, maxLines = 1)
            Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun Instruction(number: String, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primaryContainer, modifier = Modifier.size(28.dp)) {
            Box(contentAlignment = Alignment.Center) { Text(number, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary) }
        }
        Spacer(Modifier.width(10.dp))
        Text(text, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
    }
}
