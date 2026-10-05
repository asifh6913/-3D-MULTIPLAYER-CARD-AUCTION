package com.agon.app.ui.theme

import androidx.compose.ui.graphics.Color

data class ArrowPalette(val tile: Color, val ink: Color)
data class BoardPalette(val shell: Color, val edge: Color, val cell: Color, val dot: Color)
data class BackgroundPalette(val colors: List<Color>)

fun arrowPalette(id: String, fallback: Color, fallbackInk: Color): ArrowPalette = when (id) {
    "mint" -> ArrowPalette(Color(0xFF12AFA2), Color.White)
    "sunset" -> ArrowPalette(Color(0xFFFF7043), Color.White)
    "gold" -> ArrowPalette(Color(0xFFF5B82E), Color(0xFF422900))
    "neon" -> ArrowPalette(Color(0xFFB94CFF), Color.White)
    "midnight" -> ArrowPalette(Color(0xFF172A49), Color(0xFF71E7FF))
    "lava" -> ArrowPalette(Color(0xFFFF4B19), Color(0xFFFFF0B8))
    "ice" -> ArrowPalette(Color(0xFF69DFFF), Color(0xFF06354A))
    "rainbow" -> ArrowPalette(Color(0xFFFF4F9A), Color.White)
    "plasma" -> ArrowPalette(Color(0xFF8B3DFF), Color(0xFF8DFFFF))
    else -> ArrowPalette(fallback, fallbackInk)
}

fun boardPalette(id: String, dark: Boolean): BoardPalette = when (id) {
    "ice" -> if (dark) BoardPalette(Color(0xFF193448), Color(0xFF0D2130), Color(0xFF27516A), Color(0xFF8DDCFF))
        else BoardPalette(Color(0xFFEAF9FF), Color(0xFFA8D6E9), Color(0xFFD4F1FC), Color(0xFF4A91AD))
    "wood" -> if (dark) BoardPalette(Color(0xFF4B3224), Color(0xFF24170F), Color(0xFF654735), Color(0xFFD8A777))
        else BoardPalette(Color(0xFFE5C29F), Color(0xFF956B47), Color(0xFFF2D5B4), Color(0xFF865A36))
    "carbon" -> BoardPalette(Color(0xFF202731), Color(0xFF090D12), Color(0xFF303A46), Color(0xFF7D8998))
    "candy" -> if (dark) BoardPalette(Color(0xFF5D2948), Color(0xFF301125), Color(0xFF7A3B61), Color(0xFFFFA4D4))
        else BoardPalette(Color(0xFFFFD9EC), Color(0xFFD876A8), Color(0xFFFFECF5), Color(0xFFB94E83))
    "royal" -> if (dark) BoardPalette(Color(0xFF322454), Color(0xFF160D2D), Color(0xFF4B3976), Color(0xFFC3A8FF))
        else BoardPalette(Color(0xFFE8DFFF), Color(0xFF9274D2), Color(0xFFF4EFFF), Color(0xFF7658B9))
    "lava" -> BoardPalette(Color(0xFF32120D), Color(0xFF160503), Color(0xFF552018), Color(0xFFFF6A27))
    "tech" -> BoardPalette(Color(0xFF071E32), Color(0xFF020B13), Color(0xFF0D344D), Color(0xFF1FE4FF))
    "jungle" -> BoardPalette(Color(0xFF173B2A), Color(0xFF071B10), Color(0xFF275640), Color(0xFF82E07B))
    "galaxy" -> BoardPalette(Color(0xFF191033), Color(0xFF080414), Color(0xFF2A1D4D), Color(0xFFC383FF))
    else -> if (dark) BoardPalette(Color(0xFF111D30), Color(0xFF07101D), Color(0xFF1A2A41), Color(0xFF53657D))
        else BoardPalette(Color.White, Color(0xFFB8C4D4), Color(0xFFEAF0F8), Color(0xFF9AA8BB))
}

fun backgroundPalette(id: String, dark: Boolean): BackgroundPalette = when (id) {
    "ocean" -> if (dark) BackgroundPalette(listOf(Color(0xFF071827), Color(0xFF0B2D3B), Color(0xFF0E3A42)))
        else BackgroundPalette(listOf(Color(0xFFEAF5FF), Color(0xFFDDF5F5), Color(0xFFCDEEE8)))
    "sunset" -> if (dark) BackgroundPalette(listOf(Color(0xFF251328), Color(0xFF422336), Color(0xFF3B2B35)))
        else BackgroundPalette(listOf(Color(0xFFFFF1E8), Color(0xFFFFE1DE), Color(0xFFEDE2FF)))
    "forest" -> if (dark) BackgroundPalette(listOf(Color(0xFF091C17), Color(0xFF123126), Color(0xFF172A24)))
        else BackgroundPalette(listOf(Color(0xFFEDF7EF), Color(0xFFDCEEE3), Color(0xFFD2E7D9)))
    "aurora" -> if (dark) BackgroundPalette(listOf(Color(0xFF10132E), Color(0xFF123A3A), Color(0xFF29214A)))
        else BackgroundPalette(listOf(Color(0xFFE9E6FF), Color(0xFFD8F6EC), Color(0xFFE5EEFF)))
    "cosmos" -> if (dark) BackgroundPalette(listOf(Color(0xFF070B1C), Color(0xFF17143B), Color(0xFF26134A)))
        else BackgroundPalette(listOf(Color(0xFFF0EEFF), Color(0xFFE9E4FF), Color(0xFFF4E9FF)))
    "lava" -> BackgroundPalette(listOf(Color(0xFF210503), Color(0xFF55120A), Color(0xFF19050B)))
    "candy" -> BackgroundPalette(listOf(Color(0xFF401659), Color(0xFF7B286C), Color(0xFF173A72)))
    "cyber" -> BackgroundPalette(listOf(Color(0xFF020C22), Color(0xFF102B55), Color(0xFF2A0942)))
    "heaven" -> BackgroundPalette(listOf(Color(0xFF273777), Color(0xFF65539A), Color(0xFFB06B58)))
    else -> if (dark) BackgroundPalette(listOf(Color(0xFF0A1730), Color(0xFF17143A), Color(0xFF102D42)))
        else BackgroundPalette(listOf(Color(0xFFE5EEFF), Color(0xFFF0E7FF), Color(0xFFE3F7F3)))
}
