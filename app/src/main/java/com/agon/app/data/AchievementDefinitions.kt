package com.agon.app.data

data class Achievement(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val target: Int,
    val coinReward: Int,
    val xpReward: Int,
    val gemReward: Int = 0,
)

object AchievementDefinitions {
    val all: List<Achievement> = listOf(
        Achievement("level_1", "First Step", "Complete 1 level", "Level", 1, 50, 25),
        Achievement("level_10", "Getting Started", "Complete 10 levels", "Level", 10, 100, 50),
        Achievement("level_50", "Half Century", "Complete 50 levels", "Level", 50, 250, 100),
        Achievement("level_100", "Centurion", "Complete 100 levels", "Level", 100, 500, 200),
        Achievement("level_250", "Quarter Master", "Complete 250 levels", "Level", 250, 750, 350),
        Achievement("level_500", "Halfway Hero", "Complete 500 levels", "Level", 500, 1_000, 500),
        Achievement("level_750", "Almost There", "Complete 750 levels", "Level", 750, 1_500, 750),
        Achievement("level_1000", "Grand Master", "Complete all 1000 levels", "Level", 1000, 5_000, 2_000, 50),
        Achievement("perfect_1", "Flawless", "Complete without mistakes", "Perfect", 1, 75, 40),
        Achievement("perfect_5", "Precision", "Complete 5 perfect levels", "Perfect", 5, 200, 80),
        Achievement("perfect_25", "Perfectionist", "Complete 25 perfect levels", "Perfect", 25, 500, 200),
        Achievement("perfect_100", "Untouchable", "Complete 100 perfect levels", "Perfect", 100, 1_500, 600),
        Achievement("daily_1", "Daily Starter", "Complete first Daily Puzzle", "Daily", 1, 100, 50),
        Achievement("daily_7", "Week Warrior", "Complete 7 Daily Puzzles", "Daily", 7, 300, 120),
        Achievement("daily_30", "Monthly Mind", "Complete 30 Daily Puzzles", "Daily", 30, 750, 300),
        Achievement("daily_100", "Daily Devotee", "Complete 100 Daily Puzzles", "Daily", 100, 2_000, 800),
        Achievement("daily_extreme", "Daily Extreme", "Complete Extreme Daily Puzzle", "Daily Extreme", 1, 500, 200, 5),
        Achievement("rush_1", "Speed Starter", "First Rush victory", "Rush", 1, 100, 50),
        Achievement("rush_10", "Speed Runner", "10 Rush victories", "Rush", 10, 300, 120),
        Achievement("rush_50", "Rush Expert", "50 Rush victories", "Rush", 50, 750, 300),
        Achievement("rush_100", "Rush Legend", "100 Rush victories", "Rush", 100, 2_000, 800),
        Achievement("rush_hard", "Hard Rush", "Complete Hard Rush", "Rush Hard", 1, 400, 150),
        Achievement("rush_extreme", "Extreme Rush", "Complete Extreme Rush", "Rush Extreme", 1, 600, 250, 10),
        Achievement("zen_1", "Zen Beginner", "First Zen puzzle", "Zen", 1, 75, 40),
        Achievement("zen_10", "Zen Flow", "10 Zen puzzles", "Zen", 10, 250, 100),
        Achievement("zen_50", "Zen Master", "50 Zen puzzles", "Zen", 50, 600, 250),
        Achievement("zen_100", "Zen Sage", "100 Zen puzzles", "Zen", 100, 1_500, 600),
        Achievement("zen_extreme", "Extreme Zen", "Complete Extreme Zen", "Zen Extreme", 1, 500, 200),
        Achievement("skin_arrow_1", "Stylist", "Unlock first Arrow skin", "Collection", 1, 50, 25),
        Achievement("skin_arrow_5", "Collector", "Unlock 5 Arrow skins", "Collection", 5, 200, 80),
        Achievement("skin_arrow_all", "Arrow Master", "Unlock all Arrow skins", "Collection", 20, 2_000, 500, 20),
        Achievement("skin_board_5", "Board Fan", "Unlock 5 Board skins", "Collection", 5, 200, 80),
        Achievement("skin_board_all", "Board Master", "Unlock all Board skins", "Collection", 20, 2_000, 500, 20),
        Achievement("skin_world_5", "World Traveler", "Unlock 5 World skins", "Collection", 5, 200, 80),
        Achievement("skin_world_all", "World Master", "Unlock all World skins", "Collection", 20, 2_000, 500, 20),
        Achievement("coins_1k", "Saver", "Earn 1,000 coins", "Coins", 1_000, 100, 50),
        Achievement("coins_10k", "Wealthy", "Earn 10,000 coins", "Coins", 10_000, 500, 200),
        Achievement("coins_50k", "Rich", "Earn 50,000 coins", "Coins", 50_000, 1_500, 600),
        Achievement("coins_100k", "Tycoon", "Earn 100,000 coins", "Coins", 100_000, 3_000, 1_200, 25),
    )

    fun progressFor(achievement: Achievement, profile: PlayerProfile): Int = when (achievement.id) {
        "level_1", "level_10", "level_50", "level_100", "level_250", "level_500", "level_750", "level_1000" -> profile.completedLevel
        "perfect_1", "perfect_5", "perfect_25", "perfect_100" -> profile.perfectWins
        "daily_1", "daily_7", "daily_30", "daily_100" -> profile.dailyPuzzlesCompleted
        "daily_extreme", "rush_extreme", "zen_extreme" -> profile.extremeCompleted.coerceAtMost(achievement.target)
        "rush_1", "rush_10", "rush_50", "rush_100" -> profile.rushGamesCompleted
        "rush_hard" -> profile.rushGamesCompleted.coerceAtMost(1)
        "zen_1", "zen_10", "zen_50", "zen_100" -> profile.zenGamesCompleted
        "skin_arrow_1", "skin_arrow_5", "skin_arrow_all" -> profile.unlockedArrowSkins.size
        "skin_board_5", "skin_board_all" -> profile.unlockedBoardSkins.size
        "skin_world_5", "skin_world_all" -> profile.unlockedBackgroundSkins.size
        "coins_1k", "coins_10k", "coins_50k", "coins_100k" -> profile.totalCoinsEarned
        else -> 0
    }

    fun isComplete(achievement: Achievement, profile: PlayerProfile): Boolean =
        progressFor(achievement, profile) >= achievement.target

    fun newlyCompleted(profile: PlayerProfile): List<Achievement> =
        all.filter { achievement ->
            isComplete(achievement, profile) && achievement.id !in profile.completedAchievements
        }
}
