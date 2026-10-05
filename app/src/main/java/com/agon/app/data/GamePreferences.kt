package com.agon.app.data

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.text.SimpleDateFormat
import java.util.Locale
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

private val Context.arrowDataStore by preferencesDataStore(name = "arrow_logic_save_v2")

class GamePreferences(private val context: Context) {
    private object Keys {
        val completed = intPreferencesKey("completed")
        val xp = intPreferencesKey("xp")
        val coins = intPreferencesKey("coins")
        val gems = intPreferencesKey("gems")
        val hints = intPreferencesKey("hints")
        val streak = intPreferencesKey("streak")
        val bestStreak = intPreferencesKey("best_streak")
        val daily = stringPreferencesKey("daily")
        val gift = stringPreferencesKey("gift")
        val puzzles = intPreferencesKey("puzzles")
        val moves = intPreferencesKey("moves")
        val attempts = intPreferencesKey("attempts")
        val wins = intPreferencesKey("wins")
        val losses = intPreferencesKey("losses")
        val perfectWins = intPreferencesKey("perfect_wins")
        val coinsEarned = intPreferencesKey("coins_earned")
        val coinsSpent = intPreferencesKey("coins_spent")
        val dailyCompleted = intPreferencesKey("daily_completed")
        val rushCompleted = intPreferencesKey("rush_completed")
        val zenCompleted = intPreferencesKey("zen_completed")
        val extremeCompleted = intPreferencesKey("extreme_completed")
        val playTime = intPreferencesKey("play_time")
        val fastestSolve = intPreferencesKey("fastest_solve")
        val arrowsCleared = intPreferencesKey("arrows_cleared")
        val rush = intPreferencesKey("rush")
        val sound = booleanPreferencesKey("sound")
        val haptics = booleanPreferencesKey("haptics")
        val dark = booleanPreferencesKey("dark")
        val premium = booleanPreferencesKey("premium")
        val nickname = stringPreferencesKey("nickname")
        val avatar = stringPreferencesKey("avatar")
        val unlockedSkins = stringPreferencesKey("unlocked_skins")
        val selectedSkin = stringPreferencesKey("selected_skin")
        val unlockedBoardSkins = stringPreferencesKey("unlocked_board_skins")
        val selectedBoardSkin = stringPreferencesKey("selected_board_skin")
        val unlockedBackgroundSkins = stringPreferencesKey("unlocked_background_skins")
        val selectedBackgroundSkin = stringPreferencesKey("selected_background_skin")
        val levelStars = stringPreferencesKey("level_stars")
        val completedAchievements = stringPreferencesKey("completed_achievements")
        val claimedAchievements = stringPreferencesKey("claimed_achievements")
        val session = stringPreferencesKey("session")
    }

    val profile: Flow<PlayerProfile> = context.arrowDataStore.data.map { p -> readProfile(p) }

    val savedSession: Flow<String> = context.arrowDataStore.data.map { it[Keys.session] ?: "" }

    suspend fun saveSession(value: String) = context.arrowDataStore.edit { it[Keys.session] = value }
    suspend fun clearSession() = context.arrowDataStore.edit { it.remove(Keys.session) }

    suspend fun completePuzzle(
        profile: PlayerProfile,
        level: Int?,
        xpReward: Int,
        coinReward: Int,
        gemReward: Int,
        moves: Int,
        stars: Int = 0,
        dailyDate: String? = null,
        rushScore: Int? = null,
        mode: GameMode? = null,
        difficulty: PuzzleDifficulty? = null,
        seconds: Int = 0,
        perfect: Boolean = false,
        mistakes: Int = 0,
    ) = context.arrowDataStore.edit { p ->
        if (level != null) {
            p[Keys.completed] = max(p[Keys.completed] ?: profile.completedLevel, level)
            if (stars > 0) {
                val updatedStars = profile.levelStars.toMutableMap()
                updatedStars[level] = max(updatedStars[level] ?: 0, stars)
                p[Keys.levelStars] = updatedStars.entries.sortedBy { it.key }.joinToString(",") { "${it.key}:${it.value}" }
            }
        }
        p[Keys.xp] = (p[Keys.xp] ?: profile.xp) + xpReward
        p[Keys.coins] = (p[Keys.coins] ?: profile.coins) + coinReward
        p[Keys.gems] = (p[Keys.gems] ?: profile.gems) + gemReward
        p[Keys.puzzles] = (p[Keys.puzzles] ?: profile.totalPuzzles) + 1
        p[Keys.moves] = (p[Keys.moves] ?: profile.totalMoves) + moves
        p[Keys.wins] = (p[Keys.wins] ?: profile.totalWins) + 1
        p[Keys.coinsEarned] = (p[Keys.coinsEarned] ?: profile.totalCoinsEarned) + coinReward
        p[Keys.playTime] = (p[Keys.playTime] ?: profile.totalPlayTimeSeconds) + seconds
        p[Keys.arrowsCleared] = (p[Keys.arrowsCleared] ?: profile.totalArrowsCleared) + moves
        if (seconds > 0) {
            val current = p[Keys.fastestSolve] ?: profile.fastestSolveSeconds
            p[Keys.fastestSolve] = if (current == Int.MAX_VALUE || current == 0) seconds else min(current, seconds)
        }
        if (perfect) p[Keys.perfectWins] = (p[Keys.perfectWins] ?: profile.perfectWins) + 1
        when (mode) {
            GameMode.DAILY -> p[Keys.dailyCompleted] = (p[Keys.dailyCompleted] ?: profile.dailyPuzzlesCompleted) + 1
            GameMode.RUSH -> p[Keys.rushCompleted] = (p[Keys.rushCompleted] ?: profile.rushGamesCompleted) + 1
            GameMode.ZEN -> p[Keys.zenCompleted] = (p[Keys.zenCompleted] ?: profile.zenGamesCompleted) + 1
            else -> {}
        }
        if (difficulty == PuzzleDifficulty.EXTREME) {
            p[Keys.extremeCompleted] = (p[Keys.extremeCompleted] ?: profile.extremeCompleted) + 1
        }
        if (dailyDate != null && dailyDate != profile.lastDailyDate) {
            val parser = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val previous = runCatching { parser.parse(profile.lastDailyDate)?.time }.getOrNull()
            val current = runCatching { parser.parse(dailyDate)?.time }.getOrNull()
            val oneDay = 86_400_000L
            val continued = previous != null && current != null && abs(current - previous) in oneDay..(oneDay * 2 - 1)
            p[Keys.daily] = dailyDate
            val newStreak = if (continued) profile.streak + 1 else 1
            p[Keys.streak] = newStreak
            p[Keys.bestStreak] = max(p[Keys.bestStreak] ?: profile.bestStreak, newStreak)
        }
        if (rushScore != null) p[Keys.rush] = max(profile.bestRushScore, rushScore)
        markAchievementsComplete(p, profile)
    }

    suspend fun recordLoss(profile: PlayerProfile) = context.arrowDataStore.edit {
        it[Keys.losses] = (it[Keys.losses] ?: profile.totalLosses) + 1
        it[Keys.attempts] = (it[Keys.attempts] ?: profile.totalAttempts) + 1
    }

    suspend fun grantAdReward(profile: PlayerProfile, coins: Int, gems: Int) = context.arrowDataStore.edit {
        it[Keys.coins] = (it[Keys.coins] ?: profile.coins) + coins
        it[Keys.gems] = (it[Keys.gems] ?: profile.gems) + gems
        if (coins > 0) it[Keys.coinsEarned] = (it[Keys.coinsEarned] ?: profile.totalCoinsEarned) + coins
    }

    suspend fun grantDoubleCoins(profile: PlayerProfile, bonusCoins: Int) = context.arrowDataStore.edit {
        it[Keys.coins] = (it[Keys.coins] ?: profile.coins) + bonusCoins
        it[Keys.coinsEarned] = (it[Keys.coinsEarned] ?: profile.totalCoinsEarned) + bonusCoins
    }

    suspend fun claimAchievement(profile: PlayerProfile, achievement: Achievement): Boolean {
        if (achievement.id in profile.claimedAchievements) return false
        if (achievement.id !in profile.completedAchievements &&
            !AchievementDefinitions.isComplete(achievement, profile)
        ) return false
        context.arrowDataStore.edit {
            val completed = (profile.completedAchievements + achievement.id).joinToString(",")
            val claimed = (profile.claimedAchievements + achievement.id).joinToString(",")
            it[Keys.completedAchievements] = completed
            it[Keys.claimedAchievements] = claimed
            it[Keys.coins] = (it[Keys.coins] ?: profile.coins) + achievement.coinReward
            it[Keys.xp] = (it[Keys.xp] ?: profile.xp) + achievement.xpReward
            it[Keys.gems] = (it[Keys.gems] ?: profile.gems) + achievement.gemReward
            it[Keys.coinsEarned] = (it[Keys.coinsEarned] ?: profile.totalCoinsEarned) + achievement.coinReward
        }
        return true
    }

    suspend fun setNickname(profile: PlayerProfile, name: String): Boolean {
        val trimmed = name.trim()
        if (trimmed.isEmpty() || trimmed.length > 16) return false
        if (!trimmed.all { it.isLetterOrDigit() || it == ' ' || it == '_' }) return false
        context.arrowDataStore.edit { it[Keys.nickname] = trimmed }
        return true
    }

    suspend fun setAvatar(profile: PlayerProfile, avatarId: String) {
        if (ProfileAvatars.any { it.id == avatarId }) {
            context.arrowDataStore.edit { it[Keys.avatar] = avatarId }
        }
    }

    suspend fun spendHint(profile: PlayerProfile) = context.arrowDataStore.edit {
        it[Keys.hints] = (profile.hints - 1).coerceAtLeast(0)
    }

    suspend fun purchaseHints(profile: PlayerProfile, amount: Int, cost: Int): Boolean {
        if (profile.coins < cost) return false
        context.arrowDataStore.edit {
            it[Keys.coins] = profile.coins - cost
            it[Keys.hints] = profile.hints + amount
            it[Keys.coinsSpent] = (it[Keys.coinsSpent] ?: profile.totalCoinsSpent) + cost
        }
        return true
    }

    suspend fun spendGems(profile: PlayerProfile, cost: Int): Boolean {
        if (profile.gems < cost) return false
        context.arrowDataStore.edit { it[Keys.gems] = profile.gems - cost }
        return true
    }

    suspend fun claimGift(profile: PlayerProfile, date: String): Boolean {
        if (profile.lastGiftDate == date) return false
        context.arrowDataStore.edit {
            it[Keys.gift] = date
            it[Keys.coins] = profile.coins + 75
            it[Keys.hints] = profile.hints + 1
            it[Keys.coinsEarned] = (it[Keys.coinsEarned] ?: profile.totalCoinsEarned) + 75
        }
        return true
    }

    suspend fun unlockOrSelectSkin(profile: PlayerProfile, skin: ArrowSkin): Boolean {
        if (skin.id in profile.unlockedArrowSkins) {
            context.arrowDataStore.edit { it[Keys.selectedSkin] = skin.id }
            return true
        }
        if (profile.coins < skin.coinCost) return false
        context.arrowDataStore.edit {
            it[Keys.coins] = profile.coins - skin.coinCost
            it[Keys.unlockedSkins] = (profile.unlockedArrowSkins + skin.id).joinToString(",")
            it[Keys.selectedSkin] = skin.id
            it[Keys.coinsSpent] = (it[Keys.coinsSpent] ?: profile.totalCoinsSpent) + skin.coinCost
        }
        return true
    }

    suspend fun unlockOrSelectBoardSkin(profile: PlayerProfile, skin: BoardSkin): Boolean {
        if (skin.id in profile.unlockedBoardSkins) {
            context.arrowDataStore.edit { it[Keys.selectedBoardSkin] = skin.id }
            return true
        }
        if (profile.coins < skin.coinCost) return false
        context.arrowDataStore.edit {
            it[Keys.coins] = profile.coins - skin.coinCost
            it[Keys.unlockedBoardSkins] = (profile.unlockedBoardSkins + skin.id).joinToString(",")
            it[Keys.selectedBoardSkin] = skin.id
            it[Keys.coinsSpent] = (it[Keys.coinsSpent] ?: profile.totalCoinsSpent) + skin.coinCost
        }
        return true
    }

    suspend fun unlockOrSelectBackgroundSkin(profile: PlayerProfile, skin: BackgroundSkin): Boolean {
        if (skin.id in profile.unlockedBackgroundSkins) {
            context.arrowDataStore.edit { it[Keys.selectedBackgroundSkin] = skin.id }
            return true
        }
        if (profile.coins < skin.coinCost) return false
        context.arrowDataStore.edit {
            it[Keys.coins] = profile.coins - skin.coinCost
            it[Keys.unlockedBackgroundSkins] = (profile.unlockedBackgroundSkins + skin.id).joinToString(",")
            it[Keys.selectedBackgroundSkin] = skin.id
            it[Keys.coinsSpent] = (it[Keys.coinsSpent] ?: profile.totalCoinsSpent) + skin.coinCost
        }
        return true
    }

    suspend fun setSetting(key: String, value: Boolean) = context.arrowDataStore.edit {
        val preferenceKey: Preferences.Key<Boolean> = when (key) {
            "sound" -> Keys.sound
            "haptics" -> Keys.haptics
            "dark" -> Keys.dark
            else -> return@edit
        }
        it[preferenceKey] = value
    }

    suspend fun setPremium(profile: PlayerProfile) = context.arrowDataStore.edit {
        if (profile.gems >= 500) {
            it[Keys.gems] = profile.gems - 500
            it[Keys.premium] = true
        }
    }

    private fun readProfile(p: Preferences): PlayerProfile = PlayerProfile(
        completedLevel = p[Keys.completed] ?: 0,
        xp = p[Keys.xp] ?: 0,
        coins = p[Keys.coins] ?: 250,
        gems = p[Keys.gems] ?: 20,
        hints = p[Keys.hints] ?: 3,
        streak = p[Keys.streak] ?: 0,
        bestStreak = p[Keys.bestStreak] ?: 0,
        lastDailyDate = p[Keys.daily] ?: "",
        lastGiftDate = p[Keys.gift] ?: "",
        totalPuzzles = p[Keys.puzzles] ?: 0,
        totalMoves = p[Keys.moves] ?: 0,
        totalAttempts = p[Keys.attempts] ?: 0,
        totalWins = p[Keys.wins] ?: 0,
        totalLosses = p[Keys.losses] ?: 0,
        perfectWins = p[Keys.perfectWins] ?: 0,
        totalCoinsEarned = p[Keys.coinsEarned] ?: 250,
        totalCoinsSpent = p[Keys.coinsSpent] ?: 0,
        dailyPuzzlesCompleted = p[Keys.dailyCompleted] ?: 0,
        rushGamesCompleted = p[Keys.rushCompleted] ?: 0,
        zenGamesCompleted = p[Keys.zenCompleted] ?: 0,
        extremeCompleted = p[Keys.extremeCompleted] ?: 0,
        totalPlayTimeSeconds = p[Keys.playTime] ?: 0,
        fastestSolveSeconds = p[Keys.fastestSolve]?.takeIf { it > 0 } ?: Int.MAX_VALUE,
        totalArrowsCleared = p[Keys.arrowsCleared] ?: 0,
        bestRushScore = p[Keys.rush] ?: 0,
        soundEnabled = p[Keys.sound] ?: true,
        hapticsEnabled = p[Keys.haptics] ?: true,
        darkTheme = p[Keys.dark] ?: true,
        premium = p[Keys.premium] ?: false,
        nickname = p[Keys.nickname] ?: "Pathfinder",
        avatarId = p[Keys.avatar] ?: "arrow",
        unlockedArrowSkins = parseSet(p[Keys.unlockedSkins], "classic"),
        selectedArrowSkin = p[Keys.selectedSkin] ?: "classic",
        unlockedBoardSkins = parseSet(p[Keys.unlockedBoardSkins], "classic"),
        selectedBoardSkin = p[Keys.selectedBoardSkin] ?: "classic",
        unlockedBackgroundSkins = parseSet(p[Keys.unlockedBackgroundSkins], "clean"),
        selectedBackgroundSkin = p[Keys.selectedBackgroundSkin] ?: "clean",
        levelStars = parseStars(p[Keys.levelStars]),
        completedAchievements = parseSet(p[Keys.completedAchievements]),
        claimedAchievements = parseSet(p[Keys.claimedAchievements]),
    )

    private fun parseSet(raw: String?, default: String = ""): Set<String> =
        (raw ?: default).split(",").filter { it.isNotBlank() }.toSet().let {
            if (default.isNotEmpty()) it + default else it
        }

    private fun parseStars(raw: String?): Map<Int, Int> =
        (raw ?: "").split(",").mapNotNull { entry ->
            val values = entry.split(":")
            if (values.size == 2) values[0].toIntOrNull()?.let { level ->
                values[1].toIntOrNull()?.let { stars -> level to stars }
            } else null
        }.toMap()

    private fun markAchievementsComplete(p: Preferences, profile: PlayerProfile) {
        val updated = profile.copy(
            completedLevel = p[Keys.completed] ?: profile.completedLevel,
            perfectWins = p[Keys.perfectWins] ?: profile.perfectWins,
            dailyPuzzlesCompleted = p[Keys.dailyCompleted] ?: profile.dailyPuzzlesCompleted,
            rushGamesCompleted = p[Keys.rushCompleted] ?: profile.rushGamesCompleted,
            zenGamesCompleted = p[Keys.zenCompleted] ?: profile.zenGamesCompleted,
            extremeCompleted = p[Keys.extremeCompleted] ?: profile.extremeCompleted,
            totalCoinsEarned = p[Keys.coinsEarned] ?: profile.totalCoinsEarned,
            unlockedArrowSkins = parseSet(p[Keys.unlockedSkins], "classic"),
            unlockedBoardSkins = parseSet(p[Keys.unlockedBoardSkins], "classic"),
            unlockedBackgroundSkins = parseSet(p[Keys.unlockedBackgroundSkins], "clean"),
        )
        val completed = AchievementDefinitions.all
            .filter { AchievementDefinitions.isComplete(it, updated) }
            .map { it.id }
            .toSet()
        p[Keys.completedAchievements] = (profile.completedAchievements + completed).joinToString(",")
    }
}
