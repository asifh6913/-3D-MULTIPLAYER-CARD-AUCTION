package com.agon.app.data

import kotlin.math.max
import kotlin.random.Random

/**
 * Constructive puzzle generator with solvability validation, difficulty metrics,
 * and structural uniqueness checking.
 */
object PuzzleEngine {
    private data class Cell(val row: Int, val column: Int)

    private val journeyFingerprints = mutableSetOf<String>()

    fun forJourney(level: Int): Puzzle {
        val safeLevel = level.coerceIn(1, 1_000)
        val difficulty = journeyDifficultyForLevel(safeLevel)
        val seed = 8_871L + safeLevel * 104_729L
        return generateValidated(
            config = configForDifficulty(difficulty, safeLevel),
            seed = seed,
            difficultyTier = difficulty.tier + (safeLevel / 100),
            puzzleDifficulty = difficulty,
            rejectSimilarTo = journeyFingerprints,
        ).also { journeyFingerprints.add(it.structuralHash) }
    }

    fun forDaily(dateSeed: Long, difficulty: PuzzleDifficulty): Puzzle =
        generateValidated(
            config = configForDifficulty(difficulty, 0),
            seed = dateSeed xor 0x41A7BEEFL xor difficulty.ordinal * 99_983L,
            difficultyTier = difficulty.tier + 2,
            puzzleDifficulty = difficulty,
        )

    fun forZen(seed: Long, round: Int, difficulty: PuzzleDifficulty): Puzzle =
        generateValidated(
            config = configForDifficulty(difficulty, round),
            seed = seed xor round * 17_761L,
            difficultyTier = difficulty.tier,
            puzzleDifficulty = difficulty,
        )

    fun forRush(seed: Long, round: Int, difficulty: PuzzleDifficulty): Puzzle =
        generateValidated(
            config = configForDifficulty(difficulty, round).copy(
                density = configForDifficulty(difficulty, round).density - 0.04,
            ),
            seed = seed xor round * 31_337L,
            difficultyTier = difficulty.tier,
            puzzleDifficulty = difficulty,
        )

    private data class GenConfig(val rows: Int, val columns: Int, val density: Double, val minTiles: Int)

    private fun configForDifficulty(difficulty: PuzzleDifficulty, levelOrRound: Int): GenConfig = when (difficulty) {
        PuzzleDifficulty.EASY -> GenConfig(
            rows = 3 + (levelOrRound % 2),
            columns = 3 + (levelOrRound % 2),
            density = 0.55 + (levelOrRound % 3) * 0.05,
            minTiles = 4,
        )
        PuzzleDifficulty.MEDIUM -> GenConfig(
            rows = 5 + (levelOrRound % 2),
            columns = 5 + (levelOrRound % 2),
            density = 0.68 + (levelOrRound % 3) * 0.04,
            minTiles = 8,
        )
        PuzzleDifficulty.HARD -> GenConfig(
            rows = 6 + (levelOrRound % 3),
            columns = 6 + (levelOrRound % 3),
            density = 0.76 + (levelOrRound % 2) * 0.04,
            minTiles = 14,
        )
        PuzzleDifficulty.EXTREME -> GenConfig(
            rows = 8 + (levelOrRound % 3),
            columns = 8 + (levelOrRound % 3),
            density = 0.82 + (levelOrRound % 2) * 0.03,
            minTiles = 20,
        )
    }

    fun generateValidated(
        config: GenConfig,
        seed: Long,
        difficultyTier: Int,
        puzzleDifficulty: PuzzleDifficulty,
        rejectSimilarTo: Set<String> = emptySet(),
    ): Puzzle {
        val maxAttempts = 24
        var best: Puzzle? = null
        var bestScore = Int.MIN_VALUE
        repeat(maxAttempts) { attempt ->
            val candidate = construct(
                config.rows, config.columns, seed + attempt * 7_919L,
                difficultyTier, config.density.coerceIn(0.4, 0.96),
            )
            val solution = solve(candidate) ?: return@repeat
            val metrics = computeMetrics(candidate, solution)
            if (!matchesDifficulty(metrics, puzzleDifficulty)) return@repeat
            val hash = structuralFingerprint(candidate)
            if (hash in rejectSimilarTo) return@repeat
            val score = metrics.score(difficultyTier)
            if (score > bestScore) {
                best = candidate.copy(
                    puzzleDifficulty = puzzleDifficulty,
                    structuralHash = hash,
                    solutionLength = solution.size,
                    dependencyCount = metrics.dependencies,
                )
                bestScore = score
            }
        }
        return best ?: run {
            val fallback = construct(config.rows, config.columns, seed, difficultyTier, config.density)
            val solution = solve(fallback) ?: emptyList()
            fallback.copy(
                puzzleDifficulty = puzzleDifficulty,
                structuralHash = structuralFingerprint(fallback),
                solutionLength = solution.size,
                dependencyCount = computeMetrics(fallback, solution).dependencies,
            )
        }
    }

    private data class PuzzleMetrics(
        val arrowCount: Int,
        val dependencies: Int,
        val initiallyFree: Int,
        val branching: Int,
        val solutionSteps: Int,
    ) {
        fun score(tier: Int): Int = dependencies * max(1, tier) - initiallyFree * (3 + tier) + branching * 2
    }

    private fun computeMetrics(puzzle: Puzzle, solution: List<Int>): PuzzleMetrics {
        val initiallyFree = availableTiles(puzzle, puzzle.tiles.map { it.id }.toSet()).size
        val dependencies = puzzle.tiles.sumOf { tile ->
            rayCells(tile, puzzle.rows, puzzle.columns).count { cell ->
                puzzle.tiles.any { it.row == cell.row && it.col == cell.column }
            }
        }
        var branching = 0
        var remaining = puzzle.tiles.map { it.id }.toMutableSet()
        while (remaining.isNotEmpty()) {
            val legal = availableTiles(puzzle, remaining)
            if (legal.size > 1) branching++
            val chosen = legal.minByOrNull { it.id } ?: break
            remaining.remove(chosen.id)
        }
        return PuzzleMetrics(
            arrowCount = puzzle.tiles.size,
            dependencies = dependencies,
            initiallyFree = initiallyFree,
            branching = branching,
            solutionSteps = solution.size,
        )
    }

    private fun matchesDifficulty(metrics: PuzzleMetrics, difficulty: PuzzleDifficulty): Boolean = when (difficulty) {
        PuzzleDifficulty.EASY -> metrics.arrowCount in 4..12 && metrics.dependencies <= 8 && metrics.initiallyFree >= 2
        PuzzleDifficulty.MEDIUM -> metrics.arrowCount in 8..22 && metrics.dependencies in 4..20
        PuzzleDifficulty.HARD -> metrics.arrowCount in 14..35 && metrics.dependencies >= 10 && metrics.initiallyFree <= 4
        PuzzleDifficulty.EXTREME -> metrics.arrowCount >= 20 && metrics.dependencies >= 18 && metrics.branching >= 3
    }

    fun structuralFingerprint(puzzle: Puzzle): String {
        val deps = puzzle.tiles.map { tile ->
            val blockers = rayCells(tile, puzzle.rows, puzzle.columns)
                .mapNotNull { cell -> puzzle.tiles.find { it.row == cell.row && it.col == cell.column }?.id }
                .sorted()
            "${tile.direction.ordinal}:${blockers.joinToString(".")}"
        }.sorted()
        return deps.joinToString("|").hashCode().toString(16) + "_${puzzle.tiles.size}_${puzzle.rows}x${puzzle.columns}"
    }

    fun rushTimeAllowance(puzzle: Puzzle): Int {
        val base = rushTimerFor(puzzle.puzzleDifficulty)
        val complexityBonus = (puzzle.solutionLength * 2 + puzzle.dependencyCount).coerceAtMost(45)
        return base + complexityBonus
    }

    private fun construct(rows: Int, columns: Int, seed: Long, difficulty: Int, density: Double): Puzzle {
        val random = Random(seed)
        val all = mutableListOf<Cell>()
        for (row in 0 until rows) for (column in 0 until columns) {
            if (random.nextDouble() <= density) all += Cell(row, column)
        }
        for (row in 0 until rows) if (all.none { it.row == row }) all += Cell(row, random.nextInt(columns))
        for (column in 0 until columns) if (all.none { it.column == column }) all += Cell(random.nextInt(rows), column)
        val distinct = all.distinct().toMutableSet()
        val original = distinct.toSet()
        val assigned = mutableListOf<ArrowTile>()
        var id = 0

        while (distinct.isNotEmpty()) {
            val candidates = distinct.mapNotNull { cell ->
                val open = ArrowDirection.entries.filter { direction ->
                    ray(cell, direction, rows, columns).none { it in distinct }
                }
                if (open.isEmpty()) null else cell to open
            }
            val pool = if (difficulty <= 1) {
                candidates.sortedByDescending { it.second.size }.take(max(1, candidates.size / 2))
            } else {
                val ranked = candidates.sortedBy { (candidateCell, open) ->
                    val strongestDependency = open.maxOf { direction ->
                        ray(candidateCell, direction, rows, columns).count { it in original && it !in distinct }
                    }
                    open.size * 100 - strongestDependency
                }
                ranked.take((candidates.size - difficulty + 1).coerceIn(1, candidates.size))
            }
            val (cell, openDirections) = pool[random.nextInt(pool.size)]
            val direction = if (difficulty <= 1) {
                openDirections.minBy { dir -> ray(cell, dir, rows, columns).count { it in original } }
            } else {
                val ranked = openDirections.sortedByDescending { dir ->
                    ray(cell, dir, rows, columns).count { it in original && it !in distinct }
                }
                ranked.take(if (difficulty >= 3) 1 else minOf(2, ranked.size)).random(random)
            }
            assigned += ArrowTile(id++, cell.row, cell.column, direction)
            distinct.remove(cell)
        }
        return Puzzle(rows, columns, assigned.shuffled(random), seed, difficulty)
    }

    fun isClear(tile: ArrowTile, puzzle: Puzzle, remainingIds: Set<Int>): Boolean {
        val occupied = puzzle.tiles.asSequence()
            .filter { it.id in remainingIds && it.id != tile.id }
            .map { Cell(it.row, it.col) }
            .toHashSet()
        return rayCells(tile, puzzle.rows, puzzle.columns).none { Cell(it.row, it.column) in occupied }
    }

    fun availableTiles(puzzle: Puzzle, remainingIds: Set<Int>): List<ArrowTile> =
        puzzle.tiles.filter { it.id in remainingIds && isClear(it, puzzle, remainingIds) }

    fun solve(puzzle: Puzzle, initialRemaining: Set<Int> = puzzle.tiles.map { it.id }.toSet()): List<Int>? {
        val remaining = initialRemaining.toMutableSet()
        val order = mutableListOf<Int>()
        while (remaining.isNotEmpty()) {
            val legal = availableTiles(puzzle, remaining)
            if (legal.isEmpty()) return null
            val chosen = legal.minBy { it.id }
            order += chosen.id
            remaining.remove(chosen.id)
        }
        return order
    }

    fun validate(puzzle: Puzzle): Boolean = solve(puzzle)?.size == puzzle.tiles.size

    private fun rayCells(tile: ArrowTile, rows: Int, columns: Int): List<Cell> =
        ray(Cell(tile.row, tile.col), tile.direction, rows, columns)

    private fun ray(cell: Cell, direction: ArrowDirection, rows: Int, columns: Int): List<Cell> {
        val result = mutableListOf<Cell>()
        var row = cell.row + direction.rowDelta
        var column = cell.column + direction.colDelta
        while (row in 0 until rows && column in 0 until columns) {
            result += Cell(row, column)
            row += direction.rowDelta
            column += direction.colDelta
        }
        return result
    }
}
