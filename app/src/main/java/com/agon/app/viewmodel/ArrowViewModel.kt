package com.agon.app.viewmodel

import android.app.Application
import android.media.AudioManager
import android.media.ToneGenerator
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.agon.app.data.ArrowDirection
import com.agon.app.data.ArrowSkin
import com.agon.app.data.ArrowTile
import com.agon.app.data.ArrowUiState
import com.agon.app.data.BackgroundSkin
import com.agon.app.data.BoardSkin
import com.agon.app.data.GameMode
import com.agon.app.data.GamePreferences
import com.agon.app.data.GameSession
import com.agon.app.data.GameStatus
import com.agon.app.data.Achievement
import com.agon.app.data.AchievementDefinitions
import com.agon.app.data.Puzzle
import com.agon.app.data.PuzzleDifficulty
import com.agon.app.data.PuzzleEngine
import com.agon.app.data.rushTimerFor
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max

class ArrowViewModel(application: Application) : AndroidViewModel(application) {
    private val preferences = GamePreferences(application)
    private val _uiState = MutableStateFlow(ArrowUiState())
    val uiState: StateFlow<ArrowUiState> = _uiState.asStateFlow()
    private var ticker: Job? = null
    private val tones: ToneGenerator? = runCatching { ToneGenerator(AudioManager.STREAM_MUSIC, 28) }.getOrNull()

    init {
        viewModelScope.launch {
            preferences.profile.collect { profile ->
                _uiState.update { it.copy(profile = profile, loading = false) }
            }
        }
        viewModelScope.launch {
            val saved = preferences.savedSession.first()
            if (saved.isNotBlank()) {
                decodeSession(saved)?.let { session ->
                    _uiState.update { it.copy(session = session) }
                    startTicker()
                }
            }
        }
    }

    fun today(): String = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    fun prepareMode(mode: GameMode, level: Int = 1) {
        _uiState.update { it.copy(pendingMode = mode, pendingLevel = level) }
    }

    fun startGame(mode: GameMode, level: Int = 1, difficulty: PuzzleDifficulty = PuzzleDifficulty.MEDIUM) {
        val now = System.currentTimeMillis()
        val puzzle = when (mode) {
            GameMode.JOURNEY -> PuzzleEngine.forJourney(level)
            GameMode.DAILY -> PuzzleEngine.forDaily(today().replace("-", "").toLong(), difficulty)
            GameMode.ZEN -> PuzzleEngine.forZen(now xor 0x2E71L, 0, difficulty)
            GameMode.RUSH -> PuzzleEngine.forRush(now xor 0x7A55L, 0, difficulty)
        }
        val timerSeconds = if (mode == GameMode.RUSH) PuzzleEngine.rushTimeAllowance(puzzle) else 0
        val session = GameSession(
            puzzle = puzzle,
            mode = mode,
            level = level,
            puzzleDifficulty = if (mode == GameMode.JOURNEY) puzzle.puzzleDifficulty else difficulty,
            seconds = timerSeconds,
        )
        _uiState.update { it.copy(session = session, pendingMode = null) }
        persist(session)
        startTicker()
    }

    fun tapTile(id: Int) {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.PLAYING || session.inputLocked || id !in session.remainingIds) return
        val tile = session.puzzle.tiles.firstOrNull { it.id == id } ?: return
        if (!PuzzleEngine.isClear(tile, session.puzzle, session.remainingIds)) {
            playTone(ToneGenerator.TONE_PROP_NACK, 90)
            val newHearts = when (session.mode) {
                GameMode.ZEN, GameMode.RUSH -> session.hearts
                else -> (session.hearts - 1).coerceAtLeast(0)
            }
            val newSeconds = if (session.mode == GameMode.RUSH) (session.seconds - 5).coerceAtLeast(0) else session.seconds
            val failed = newHearts == 0 || (session.mode == GameMode.RUSH && newSeconds == 0)
            val changed = session.copy(
                hearts = newHearts,
                seconds = newSeconds,
                mistakes = session.mistakes + 1,
                perfectRun = false,
                status = if (failed) GameStatus.FAILED else session.status,
                invalidTileId = id,
                invalidNonce = session.invalidNonce + 1,
                hintTileId = null,
            )
            _uiState.update { it.copy(session = changed) }
            if (failed) {
                viewModelScope.launch { preferences.recordLoss(_uiState.value.profile) }
                if (session.mode == GameMode.RUSH) finishRush(changed)
            } else persist(changed)
            return
        }

        playTone(ToneGenerator.TONE_PROP_BEEP, 45)
        val launching = session.copy(
            moves = session.moves + 1,
            score = session.score + 10,
            exitingTileId = id,
            invalidTileId = null,
            hintTileId = null,
            inputLocked = true,
        )
        _uiState.update { it.copy(session = launching) }
        viewModelScope.launch {
            delay(260)
            val current = _uiState.value.session ?: return@launch
            if (current.exitingTileId != id) return@launch
            val remaining = current.remainingIds - id
            var next = current.copy(
                remainingIds = remaining,
                removedIds = current.removedIds + id,
                exitingTileId = null,
                inputLocked = false,
            )
            if (remaining.isEmpty()) next = onBoardCleared(next)
            _uiState.update { it.copy(session = next) }
            if (next.status == GameStatus.PLAYING) persist(next) else preferences.clearSession()
        }
    }

    private fun onBoardCleared(session: GameSession): GameSession {
        playTone(ToneGenerator.TONE_PROP_ACK, 160)
        if (session.mode == GameMode.RUSH) {
            val boardNumber = session.boardsCleared + 1
            val nextPuzzle = PuzzleEngine.forRush(
                session.puzzle.seed + 65_537L + boardNumber,
                boardNumber,
                session.puzzleDifficulty,
            )
            return session.copy(
                puzzle = nextPuzzle,
                remainingIds = nextPuzzle.tiles.map { it.id }.toSet(),
                removedIds = emptyList(),
                boardsCleared = boardNumber,
                seconds = (session.seconds + 8).coerceAtMost(PuzzleEngine.rushTimeAllowance(nextPuzzle)),
                score = session.score + 500 + session.seconds * 5,
                inputLocked = false,
                perfectRun = session.perfectRun,
            )
        }

        val profile = _uiState.value.profile
        val repeatedDaily = session.mode == GameMode.DAILY && profile.lastDailyDate == today()
        val rewards = when (session.mode) {
            GameMode.JOURNEY -> Triple(60 + session.level * 2, 200 + ((session.level - 1) / 5) * 10, if (session.level % 5 == 0) 2 else 0)
            GameMode.DAILY -> if (repeatedDaily) Triple(10, 0, 0) else Triple(150, 250, 5)
            GameMode.ZEN -> Triple(30, 80, 0)
            GameMode.RUSH -> Triple(0, 0, 0)
        }
        val earnedStars = when {
            session.hearts >= 3 && session.moves <= session.puzzle.tiles.size + 2 && session.mistakes == 0 -> 3
            session.hearts >= 2 -> 2
            else -> 1
        }
        val newStars = if (session.mode == GameMode.JOURNEY) {
            profile.levelStars + (session.level to max(profile.levelStars[session.level] ?: 0, earnedStars))
        } else profile.levelStars

        val updatedProfile = profile.copy(
            completedLevel = if (session.mode == GameMode.JOURNEY) max(profile.completedLevel, session.level) else profile.completedLevel,
            xp = profile.xp + rewards.first,
            coins = profile.coins + rewards.second,
            gems = profile.gems + rewards.third,
            totalPuzzles = profile.totalPuzzles + 1,
            totalMoves = profile.totalMoves + session.moves,
            levelStars = newStars,
        )
        _uiState.update { it.copy(profile = updatedProfile) }
        viewModelScope.launch {
            preferences.completePuzzle(
                profile = profile,
                level = if (session.mode == GameMode.JOURNEY) session.level else null,
                xpReward = rewards.first,
                coinReward = rewards.second,
                gemReward = rewards.third,
                moves = session.moves,
                stars = if (session.mode == GameMode.JOURNEY) earnedStars else 0,
                dailyDate = if (session.mode == GameMode.DAILY) today() else null,
                mode = session.mode,
                difficulty = session.puzzleDifficulty,
                seconds = session.seconds,
                perfect = session.perfectRun && session.mistakes == 0,
                mistakes = session.mistakes,
            )
            AchievementDefinitions.newlyCompleted(_uiState.value.profile).forEach { achievement ->
                message("Achievement unlocked: ${achievement.title}")
            }
        }
        return session.copy(
            status = GameStatus.COMPLETE,
            earnedStars = earnedStars,
            rewardCoins = rewards.second,
            rewardGems = rewards.third,
        )
    }

    fun claimDoubleCoins(onUnavailable: () -> Unit, onRewardEarned: () -> Unit) {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.COMPLETE || session.coinsDoubled || session.adRewardPending) return
        _uiState.update { it.copy(session = session.copy(adRewardPending = true)) }
        onRewardEarned()
    }

    fun applyDoubleCoinReward() {
        val session = _uiState.value.session ?: return
        if (session.coinsDoubled || session.rewardCoins <= 0) {
            _uiState.update { it.copy(session = session.copy(adRewardPending = false)) }
            return
        }
        val bonus = session.rewardCoins
        val profile = _uiState.value.profile
        _uiState.update {
            it.copy(
                session = session.copy(coinsDoubled = true, adRewardPending = false, rewardCoins = session.rewardCoins + bonus),
                profile = profile.copy(coins = profile.coins + bonus, totalCoinsEarned = profile.totalCoinsEarned + bonus),
            )
        }
        viewModelScope.launch {
            preferences.grantDoubleCoins(profile, bonus)
            message("+$bonus bonus coins added!")
        }
    }

    fun cancelAdReward() {
        val session = _uiState.value.session ?: return
        _uiState.update { it.copy(session = session.copy(adRewardPending = false)) }
    }

    fun continueWithAd(onUnavailable: () -> Unit, onRewardEarned: () -> Unit) {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.FAILED || session.continueUsed) return
        onRewardEarned()
    }

    fun applyContinueAfterAd() {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.FAILED) return
        val revived = session.copy(
            hearts = 3,
            status = GameStatus.PLAYING,
            inputLocked = false,
            continueUsed = true,
        )
        _uiState.update { it.copy(session = revived) }
        persist(revived)
        message("Lives restored — keep going!")
    }

    private fun startTicker() {
        ticker?.cancel()
        ticker = viewModelScope.launch {
            while (true) {
                delay(1_000)
                val session = _uiState.value.session ?: continue
                if (session.status != GameStatus.PLAYING) continue
                if (session.mode == GameMode.RUSH) {
                    val seconds = (session.seconds - 1).coerceAtLeast(0)
                    val next = session.copy(seconds = seconds)
                    _uiState.update { it.copy(session = next) }
                    if (seconds == 0) {
                        viewModelScope.launch { preferences.recordLoss(_uiState.value.profile) }
                        finishRush(next)
                    } else if (seconds % 5 == 0) persist(next)
                } else {
                    val next = session.copy(seconds = session.seconds + 1)
                    _uiState.update { it.copy(session = next) }
                    if (next.seconds % 5 == 0) persist(next)
                }
            }
        }
    }

    private fun finishRush(session: GameSession) {
        if (session.status == GameStatus.COMPLETE) return
        val finished = session.copy(status = GameStatus.COMPLETE, seconds = 0, inputLocked = true)
        _uiState.update { it.copy(session = finished) }
        val profile = _uiState.value.profile
        viewModelScope.launch {
            preferences.completePuzzle(
                profile = profile,
                level = null,
                xpReward = (finished.score / 20).coerceAtLeast(20),
                coinReward = (finished.score / 30).coerceAtLeast(15),
                gemReward = if (finished.boardsCleared >= 3) 1 else 0,
                moves = finished.moves,
                rushScore = finished.score,
                mode = GameMode.RUSH,
                difficulty = finished.puzzleDifficulty,
                seconds = finished.seconds,
            )
            preferences.clearSession()
        }
    }

    fun useHint() {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.PLAYING || session.inputLocked) return
        val profile = _uiState.value.profile
        if (profile.hints <= 0) {
            message("You're out of hints. Find more in Rewards.")
            return
        }
        val tile = PuzzleEngine.availableTiles(session.puzzle, session.remainingIds).firstOrNull() ?: return
        _uiState.update { it.copy(session = session.copy(hintTileId = tile.id)) }
        viewModelScope.launch { preferences.spendHint(profile) }
    }

    fun undo() {
        val session = _uiState.value.session ?: return
        if (session.status != GameStatus.PLAYING || session.inputLocked) return
        val id = session.removedIds.lastOrNull() ?: return
        val next = session.copy(
            remainingIds = session.remainingIds + id,
            removedIds = session.removedIds.dropLast(1),
            moves = (session.moves - 1).coerceAtLeast(0),
            hintTileId = null,
        )
        _uiState.update { it.copy(session = next) }
        persist(next)
    }

    fun retry() {
        val session = _uiState.value.session ?: return
        val reset = GameSession(
            puzzle = session.puzzle,
            mode = session.mode,
            level = session.level,
            puzzleDifficulty = session.puzzleDifficulty,
            seconds = if (session.mode == GameMode.RUSH) PuzzleEngine.rushTimeAllowance(session.puzzle) else 0,
        )
        _uiState.update { it.copy(session = reset) }
        persist(reset)
        startTicker()
    }

    fun nextPuzzle() {
        val session = _uiState.value.session ?: return
        when (session.mode) {
            GameMode.JOURNEY -> startGame(GameMode.JOURNEY, (session.level + 1).coerceAtMost(1_000))
            GameMode.DAILY -> startGame(GameMode.DAILY, difficulty = session.puzzleDifficulty)
            GameMode.ZEN -> {
                val round = session.boardsCleared + 1
                val puzzle = PuzzleEngine.forZen(System.currentTimeMillis() xor session.puzzle.seed, round, session.puzzleDifficulty)
                val next = GameSession(puzzle, GameMode.ZEN, round + 1, session.puzzleDifficulty, boardsCleared = round)
                _uiState.update { it.copy(session = next) }
                persist(next)
                startTicker()
            }
            GameMode.RUSH -> startGame(GameMode.RUSH, difficulty = session.puzzleDifficulty)
        }
    }

    fun saveAndGoHome() {
        val session = _uiState.value.session
        if (session?.status == GameStatus.COMPLETE) {
            ticker?.cancel()
            _uiState.update { it.copy(session = null) }
        } else if (session != null) {
            persist(session)
        }
    }

    fun abandonGame() {
        ticker?.cancel()
        _uiState.update { it.copy(session = null) }
        viewModelScope.launch { preferences.clearSession() }
    }

    fun claimDailyGift() {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.claimGift(profile, today())) message("Daily gift opened: +75 coins and +1 hint")
            else message("Your next gift arrives tomorrow.")
        }
    }

    fun grantAdReward(coins: Int, gems: Int) {
        val profile = _uiState.value.profile
        _uiState.update { it.copy(profile = profile.copy(coins = profile.coins + coins, gems = profile.gems + gems)) }
        viewModelScope.launch {
            preferences.grantAdReward(profile, coins, gems)
            message(if (coins > 0) "+$coins coins added!" else "+$gems gems added!")
        }
    }

    fun claimAchievement(achievement: Achievement) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.claimAchievement(profile, achievement)) {
                message("Claimed: ${achievement.title} (+${achievement.coinReward} coins)")
            }
        }
    }

    fun setNickname(name: String) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.setNickname(profile, name)) message("Nickname updated!")
            else message("Invalid nickname. Use 1-16 letters, numbers, or underscores.")
        }
    }

    fun setAvatar(avatarId: String) {
        val profile = _uiState.value.profile
        viewModelScope.launch { preferences.setAvatar(profile, avatarId) }
    }

    fun showMessage(text: String) = message(text)

    fun purchaseHints(amount: Int, cost: Int) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.purchaseHints(profile, amount, cost)) message("Added $amount hints to your inventory")
            else message("Not enough coins yet.")
        }
    }

    fun unlockOrSelectSkin(skin: ArrowSkin) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.unlockOrSelectSkin(profile, skin)) {
                message(if (skin.id in profile.unlockedArrowSkins) "${skin.title} equipped" else "${skin.title} unlocked and equipped")
            } else message("You need ${skin.coinCost - profile.coins} more coins for ${skin.title}.")
        }
    }

    fun unlockOrSelectBoardSkin(skin: BoardSkin) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.unlockOrSelectBoardSkin(profile, skin)) {
                message(if (skin.id in profile.unlockedBoardSkins) "${skin.title} board equipped" else "${skin.title} board unlocked")
            } else message("You need ${skin.coinCost - profile.coins} more coins for ${skin.title}.")
        }
    }

    fun unlockOrSelectBackgroundSkin(skin: BackgroundSkin) {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (preferences.unlockOrSelectBackgroundSkin(profile, skin)) {
                message(if (skin.id in profile.unlockedBackgroundSkins) "${skin.title} background equipped" else "${skin.title} background unlocked")
            } else message("You need ${skin.coinCost - profile.coins} more coins for ${skin.title}.")
        }
    }

    fun purchasePremium() {
        val profile = _uiState.value.profile
        viewModelScope.launch {
            if (profile.premium) message("Founder Pass is already active.")
            else if (profile.gems >= 500) {
                preferences.setPremium(profile)
                message("Founder Pass unlocked — thank you!")
            } else message("Founder Pass requires 500 gems.")
        }
    }

    fun setSound(value: Boolean) = viewModelScope.launch { preferences.setSetting("sound", value) }
    fun setHaptics(value: Boolean) = viewModelScope.launch { preferences.setSetting("haptics", value) }
    fun setDarkTheme(value: Boolean) = viewModelScope.launch { preferences.setSetting("dark", value) }
    fun consumeMessage() = _uiState.update { it.copy(giftMessage = null) }

    private fun message(value: String) = _uiState.update { it.copy(giftMessage = value) }

    private fun persist(session: GameSession) {
        if (session.status != GameStatus.COMPLETE) {
            viewModelScope.launch { preferences.saveSession(encodeSession(session)) }
        }
    }

    private fun playTone(tone: Int, duration: Int) {
        if (_uiState.value.profile.soundEnabled) tones?.startTone(tone, duration)
    }

    override fun onCleared() {
        ticker?.cancel()
        tones?.release()
        super.onCleared()
    }

    private fun encodeSession(s: GameSession): String {
        val tiles = s.puzzle.tiles.joinToString(";") { "${it.id},${it.row},${it.col},${it.direction.ordinal}" }
        return listOf(
            s.mode.name, s.level, s.puzzle.rows, s.puzzle.columns, s.puzzle.difficulty, s.puzzle.seed,
            s.remainingIds.joinToString(","), s.removedIds.joinToString(","), s.hearts, s.moves,
            s.seconds, s.score, s.boardsCleared, tiles, s.status.name,
            s.puzzleDifficulty.name, s.mistakes, s.coinsDoubled, s.continueUsed, s.puzzleDifficulty.ordinal,
        ).joinToString("|")
    }

    private fun decodeSession(raw: String): GameSession? = try {
        val p = raw.split("|")
        if (p.size < 14) return null
        val tiles = p[13].split(";").filter { it.isNotBlank() }.map { encoded ->
            val v = encoded.split(",")
            ArrowTile(v[0].toInt(), v[1].toInt(), v[2].toInt(), ArrowDirection.entries[v[3].toInt()])
        }
        val puzzleDiff = if (p.size > 15) PuzzleDifficulty.valueOf(p[15]) else PuzzleDifficulty.MEDIUM
        val puzzle = Puzzle(p[2].toInt(), p[3].toInt(), tiles, p[5].toLong(), p[4].toInt(), puzzleDiff)
        val remaining = p[6].split(",").filter { it.isNotBlank() }.map { it.toInt() }.toSet()
        val removed = p[7].split(",").filter { it.isNotBlank() }.map { it.toInt() }
        GameSession(
            puzzle = puzzle,
            mode = GameMode.valueOf(p[0]),
            level = p[1].toInt(),
            puzzleDifficulty = puzzleDiff,
            remainingIds = remaining,
            removedIds = removed,
            hearts = p[8].toInt(),
            moves = p[9].toInt(),
            seconds = p[10].toInt(),
            score = p[11].toInt(),
            boardsCleared = p[12].toInt(),
            mistakes = if (p.size > 16) p[16].toInt() else 0,
            coinsDoubled = if (p.size > 17) p[17].toBooleanStrictOrNull() ?: false else false,
            continueUsed = if (p.size > 18) p[18].toBooleanStrictOrNull() ?: false else false,
            status = if (p.size > 14) GameStatus.valueOf(p[14]) else if (p[8].toInt() == 0) GameStatus.FAILED else GameStatus.PLAYING,
        )
    } catch (_: Exception) {
        null
    }
}
