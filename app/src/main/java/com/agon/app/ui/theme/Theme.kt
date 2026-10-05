package com.agon.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

private val DarkColorScheme = darkColorScheme(
    primary = SkyBlue,
    onPrimary = Night,
    primaryContainer = Color(0xFF183D86),
    onPrimaryContainer = Color(0xFFDCE8FF),
    secondary = Aqua,
    onSecondary = Night,
    secondaryContainer = Color(0xFF164D4A),
    tertiary = Sun,
    background = Night,
    onBackground = Color(0xFFF0F5FF),
    surface = DeepSurface,
    onSurface = Color(0xFFF0F5FF),
    surfaceVariant = DeepSurfaceAlt,
    onSurfaceVariant = Color(0xFFB7C4D9),
    error = Coral,
    outline = Color(0xFF41516A),
)

private val LightColorScheme = lightColorScheme(
    primary = ElectricBlue,
    onPrimary = Color.White,
    primaryContainer = Color(0xFFDCE7FF),
    onPrimaryContainer = Ink,
    secondary = Color(0xFF087E77),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFC7F4EE),
    tertiary = Color(0xFF9A6200),
    background = Cloud,
    onBackground = Ink,
    surface = Color.White,
    onSurface = Ink,
    surfaceVariant = Arctic,
    onSurfaceVariant = Color(0xFF56647A),
    error = Color(0xFFD84242),
    outline = Color(0xFFC3CCDA),
)

private val ArrowTypography = Typography(
    displaySmall = TextStyle(fontSize = 36.sp, lineHeight = 40.sp, fontWeight = FontWeight.Black, letterSpacing = (-1).sp),
    headlineLarge = TextStyle(fontSize = 30.sp, lineHeight = 36.sp, fontWeight = FontWeight.Bold),
    headlineMedium = TextStyle(fontSize = 24.sp, lineHeight = 30.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 20.sp, lineHeight = 26.sp, fontWeight = FontWeight.Bold),
    titleMedium = TextStyle(fontSize = 16.sp, lineHeight = 22.sp, fontWeight = FontWeight.SemiBold),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Normal),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Normal),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
    labelMedium = TextStyle(fontSize = 12.sp, lineHeight = 16.sp, fontWeight = FontWeight.SemiBold),
)

@Composable
fun AgonAppTheme(
    darkTheme: Boolean = false,
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme,
        typography = ArrowTypography,
        content = content,
    )
}
