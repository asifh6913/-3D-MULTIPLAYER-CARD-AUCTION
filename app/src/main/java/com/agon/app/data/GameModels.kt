package com.agon.app.data

enum class ArrowDirection(val rowDelta: Int, val colDelta: Int) {
    UP(-1, 0),
    RIGHT(0, 1),
    DOWN(1, 0),
    LEFT(0, -1),
}

enum class GameMode { JOURNEY, DAILY, ZEN, RUSH }
enum class GameStatus { PLAYING, COMPLETE, FAILED }

enum class PuzzleDifficulty(val label: String, val tier: Int) {
    EASY("Easy", 1),
    MEDIUM("Medium", 2),
    HARD("Hard", 3),
    EXTREME("Extreme Hard", 4),
}

data class ArrowSkin(val id: String, val title: String, val subtitle: String, val coinCost: Int)

val ArrowSkins = listOf(
    ArrowSkin("classic", "Classic Blue", "The original clean look", 0),
    ArrowSkin("neon", "Neon Pulse", "Electric arcade energy", 300),
    ArrowSkin("cyber", "Cyber Edge", "Digital circuit glow", 450),
    ArrowSkin("crystal", "Crystal Shard", "Faceted ice refraction", 600),
    ArrowSkin("fire", "Fire Storm", "Blazing molten trails", 750),
    ArrowSkin("ice", "Frost Beam", "Shimmering frozen arrows", 900),
    ArrowSkin("electric", "Electric Bolt", "Crackling voltage arcs", 1_050),
    ArrowSkin("galaxy", "Galaxy Drift", "Cosmic star dust", 1_200),
    ArrowSkin("metallic", "Chrome Steel", "Polished metal finish", 1_350),
    ArrowSkin("glass", "Glass Prism", "Transparent light split", 1_500),
    ArrowSkin("toxic", "Toxic Glow", "Radioactive green haze", 1_650),
    ArrowSkin("shadow", "Shadow Veil", "Dark stealth ink", 1_800),
    ArrowSkin("rainbow", "Rainbow Rush", "Every direction has color", 1_950),
    ArrowSkin("plasma", "Plasma Shift", "Pulsing cosmic energy", 2_100),
    ArrowSkin("golden", "Golden Path", "Champion gold finish", 2_250),
    ArrowSkin("pixel", "Pixel Retro", "8-bit arcade style", 2_400),
    ArrowSkin("holographic", "Holo Wave", "Iridescent shimmer", 2_550),
    ArrowSkin("lava", "Lava Core", "Animated molten energy", 2_700),
    ArrowSkin("aurora", "Aurora Flow", "Northern lights trail", 2_850),
    ArrowSkin("energy", "Energy Core", "Pure power conduit", 3_000),
)

data class BoardSkin(val id: String, val title: String, val subtitle: String, val coinCost: Int)

val BoardSkins = listOf(
    BoardSkin("classic", "Clean Slate", "Soft modern tiles", 0),
    BoardSkin("neon_grid", "Neon Grid", "Glowing circuit lines", 350),
    BoardSkin("futuristic", "Futuristic", "Sleek tech surface", 500),
    BoardSkin("marble", "Marble", "Elegant stone veins", 650),
    BoardSkin("glass", "Glass Panel", "Transparent depth", 800),
    BoardSkin("cyber", "Cyber Grid", "Animated circuit board", 950),
    BoardSkin("space", "Space Deck", "Starfield surface", 1_100),
    BoardSkin("crystal", "Crystal Ice", "Cool glass-like board", 1_250),
    BoardSkin("dark_tech", "Dark Tech", "Stealth operations", 1_400),
    BoardSkin("wood", "Walnut", "Warm crafted wood", 1_550),
    BoardSkin("energy", "Energy Board", "Pulsing power grid", 1_700),
    BoardSkin("holographic", "Holo Board", "Shifting light panels", 1_850),
    BoardSkin("metallic", "Metallic", "Brushed steel finish", 2_000),
    BoardSkin("arcade", "Arcade", "Retro game cabinet", 2_150),
    BoardSkin("ice", "Ice Floor", "Frozen crystal tiles", 2_300),
    BoardSkin("lava", "Lava Rock", "Glowing volcanic cracks", 2_450),
    BoardSkin("ancient", "Ancient Stone", "Carved temple tiles", 2_600),
    BoardSkin("minimal", "Minimal", "Pure focus surface", 2_750),
    BoardSkin("circuit", "Circuit", "Microchip pathways", 2_900),
    BoardSkin("premium_gold", "Premium Gold", "Luxury golden frame", 3_200),
)

data class BackgroundSkin(val id: String, val title: String, val subtitle: String, val coinCost: Int)

val BackgroundSkins = listOf(
    BackgroundSkin("clean", "Clean", "The focused original", 0),
    BackgroundSkin("space", "Deep Space", "Infinite star field", 400),
    BackgroundSkin("galaxy", "Galaxy", "Swirling nebula clouds", 550),
    BackgroundSkin("cyber_city", "Cyber City", "Neon skyline horizon", 700),
    BackgroundSkin("forest", "Quiet Forest", "Deep natural greens", 850),
    BackgroundSkin("desert", "Desert Dunes", "Warm sandy expanse", 1_000),
    BackgroundSkin("ice_world", "Ice World", "Frozen polar landscape", 1_150),
    BackgroundSkin("lava_world", "Lava World", "Molten volcanic realm", 1_300),
    BackgroundSkin("ocean", "Ocean Air", "Calm blue horizon", 1_450),
    BackgroundSkin("night_sky", "Night Sky", "Moonlit darkness", 1_600),
    BackgroundSkin("futuristic_city", "Future City", "Towering megastructures", 1_750),
    BackgroundSkin("abstract_energy", "Abstract Energy", "Flowing power waves", 1_900),
    BackgroundSkin("crystal_world", "Crystal World", "Gemstone caverns", 2_050),
    BackgroundSkin("neon_world", "Neon World", "Electric color wash", 2_200),
    BackgroundSkin("clouds", "Cloud Kingdom", "Soft floating clouds", 2_350),
    BackgroundSkin("ancient_ruins", "Ancient Ruins", "Mystical stone pillars", 2_500),
    BackgroundSkin("digital_matrix", "Digital Matrix", "Falling code rain", 2_650),
    BackgroundSkin("aurora", "Aurora", "Luminous polar wash", 2_800),
    BackgroundSkin("deep_space", "Deep Space", "Void between stars", 2_950),
    BackgroundSkin("dream_world", "Dream World", "Surreal pastel realm", 3_100),
)

data class ProfileAvatar(val id: String, val emoji: String, val label: String)

val ProfileAvatars = listOf(
    ProfileAvatar("arrow", "➡️", "Arrow"),
    ProfileAvatar("brain", "🧠", "Thinker"),
    ProfileAvatar("star", "⭐", "Star"),
    ProfileAvatar("fire", "🔥", "Blaze"),
    ProfileAvatar("ice", "❄️", "Frost"),
    ProfileAvatar("crown", "👑", "Royal"),
    ProfileAvatar("rocket", "🚀", "Rocket"),
    ProfileAvatar("gem", "💎", "Gem"),
    ProfileAvatar("bolt", "⚡", "Bolt"),
    ProfileAvatar("puzzle", "🧩", "Puzzle"),
)

data class ArrowTile(val id: Int, val row: Int, val col: Int, val direction: ArrowDirection)

data class Puzzle(
    val rows: Int,
    val columns: Int,
    val tiles: List<ArrowTile>,
    val seed: Long,
    val difficulty: Int,
    val puzzleDifficulty: PuzzleDifficulty = PuzzleDifficulty.MEDIUM,
    val structuralHash: String = "",
    val solutionLength: Int = 0,
    val dependencyCount: Int = 0,
)

data class GameSession(
    val puzzle: Puzzle,
    val mode: GameMode,
    val level: Int,
    val puzzleDifficulty: PuzzleDifficulty = PuzzleDifficulty.MEDIUM,
    val remainingIds: Set<Int> = puzzle.tiles.map { it.id }.toSet(),
    val removedIds: List<Int> = emptyList(),
    val hearts: Int = 3,
    val moves: Int = 0,
    val mistakes: Int = 0,
    val seconds: Int = if (mode == GameMode.RUSH) rushTimerFor(PuzzleDifficulty.MEDIUM) else 0,
    val score: Int = 0,
    val boardsCleared: Int = 0,
    val status: GameStatus = GameStatus.PLAYING,
    val exitingTileId: Int? = null,
    val invalidTileId: Int? = null,
    val invalidNonce: Int = 0,
    val hintTileId: Int? = null,
    val inputLocked: Boolean = false,
    val earnedStars: Int = 0,
    val rewardCoins: Int = 0,
    val rewardGems: Int = 0,
    val coinsDoubled: Boolean = false,
    val adRewardPending: Boolean = false,
    val perfectRun: Boolean = true,
    val continueUsed: Boolean = false,
) {
    val remainingTiles: List<ArrowTile>
        get() = puzzle.tiles.filter { it.id in remainingIds }
    val progress: Float
        get() = if (puzzle.tiles.isEmpty()) 1f else 1f - remainingIds.size.toFloat() / puzzle.tiles.size
}

fun rushTimerFor(difficulty: PuzzleDifficulty): Int = when (difficulty) {
    PuzzleDifficulty.EASY -> 120
    PuzzleDifficulty.MEDIUM -> 90
    PuzzleDifficulty.HARD -> 75
    PuzzleDifficulty.EXTREME -> 60
}

fun journeyDifficultyForLevel(level: Int): PuzzleDifficulty = when {
    level <= 5 -> PuzzleDifficulty.EASY
    level <= 10 -> PuzzleDifficulty.EASY
    level <= 50 -> if (level <= 25) PuzzleDifficulty.EASY else PuzzleDifficulty.MEDIUM
    level <= 200 -> PuzzleDifficulty.MEDIUM
    level <= 400 -> if (level <= 300) PuzzleDifficulty.MEDIUM else PuzzleDifficulty.HARD
    level <= 700 -> PuzzleDifficulty.HARD
    level <= 900 -> if (level <= 800) PuzzleDifficulty.HARD else PuzzleDifficulty.EXTREME
    else -> PuzzleDifficulty.EXTREME
}

data class PlayerProfile(
    val completedLevel: Int = 0,
    val xp: Int = 0,
    val coins: Int = 250,
    val gems: Int = 20,
    val hints: Int = 3,
    val streak: Int = 0,
    val bestStreak: Int = 0,
    val lastDailyDate: String = "",
    val lastGiftDate: String = "",
    val totalPuzzles: Int = 0,
    val totalMoves: Int = 0,
    val totalAttempts: Int = 0,
    val totalWins: Int = 0,
    val totalLosses: Int = 0,
    val perfectWins: Int = 0,
    val totalCoinsEarned: Int = 250,
    val totalCoinsSpent: Int = 0,
    val dailyPuzzlesCompleted: Int = 0,
    val rushGamesCompleted: Int = 0,
    val zenGamesCompleted: Int = 0,
    val extremeCompleted: Int = 0,
    val totalPlayTimeSeconds: Int = 0,
    val fastestSolveSeconds: Int = Int.MAX_VALUE,
    val totalArrowsCleared: Int = 0,
    val bestRushScore: Int = 0,
    val soundEnabled: Boolean = true,
    val hapticsEnabled: Boolean = true,
    val darkTheme: Boolean = true,
    val premium: Boolean = false,
    val nickname: String = "Pathfinder",
    val avatarId: String = "arrow",
    val unlockedArrowSkins: Set<String> = setOf("classic"),
    val selectedArrowSkin: String = "classic",
    val unlockedBoardSkins: Set<String> = setOf("classic"),
    val selectedBoardSkin: String = "classic",
    val unlockedBackgroundSkins: Set<String> = setOf("clean"),
    val selectedBackgroundSkin: String = "clean",
    val levelStars: Map<Int, Int> = emptyMap(),
    val claimedAchievements: Set<String> = emptySet(),
    val completedAchievements: Set<String> = emptySet(),
    val playerTitle: String = "Beginner",
) {
    val rank: Int get() = xp / 300 + 1
    val rankProgress: Float get() = (xp % 300) / 300f
    val averageSolveTime: Int
        get() = if (totalWins == 0) 0 else totalPlayTimeSeconds / totalWins
    val problemSolvingScore: Int
        get() {
            var score = 0
            score += (completedLevel * 0.4).toInt().coerceAtMost(35)
            score += (perfectWins * 0.15).toInt().coerceAtMost(20)
            score += (extremeCompleted * 2).coerceAtMost(15)
            score += (bestStreak * 0.5).toInt().coerceAtMost(10)
            if (fastestSolveSeconds < Int.MAX_VALUE && fastestSolveSeconds <= 30) score += 5
            if (bestRushScore >= 1000) score += 5
            if (totalPuzzles >= 100) score += 5
            if (totalPuzzles >= 500) score += 5
            return score.coerceIn(0, 100)
        }
    val skillCategory: String
        get() = when {
            problemSolvingScore >= 85 -> "Master"
            problemSolvingScore >= 70 -> "Expert"
            problemSolvingScore >= 55 -> "Advanced"
            problemSolvingScore >= 40 -> "Skilled"
            problemSolvingScore >= 20 -> "Developing"
            else -> "Beginner"
        }
    val milestone: String
        get() = when {
            completedLevel >= 1000 -> "Grand Master"
            completedLevel >= 750 -> "Arrow Master"
            completedLevel >= 500 -> "Logic Expert"
            completedLevel >= 250 -> "Puzzle Master"
            completedLevel >= 50 -> "Solver"
            completedLevel >= 10 -> "Beginner"
            else -> "Newcomer"
        }
}

data class ArrowUiState(
    val loading: Boolean = true,
    val profile: PlayerProfile = PlayerProfile(),
    val session: GameSession? = null,
    val giftMessage: String? = null,
    val pendingMode: GameMode? = null,
    val pendingLevel: Int = 1,
)
