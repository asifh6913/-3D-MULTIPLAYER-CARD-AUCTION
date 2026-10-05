package com.agon.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CardGiftcard
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.agon.app.ads.RewardedAdManager
import com.agon.app.ads.RewardedAdState
import com.agon.app.data.GameMode
import com.agon.app.data.PuzzleDifficulty
import com.agon.app.ui.screens.DifficultySelectionScreen
import com.agon.app.ui.screens.GameLevelsScreen
import com.agon.app.ui.screens.GameProfileScreen
import com.agon.app.ui.screens.GameRewardsScreen
import com.agon.app.ui.screens.GameScreen
import com.agon.app.ui.screens.HomeScreen
import com.agon.app.ui.screens.SkinsScreen
import com.agon.app.ui.theme.AgonAppTheme
import com.agon.app.viewmodel.ArrowViewModel

class MainActivity : ComponentActivity() {
    private val gameViewModel: ArrowViewModel by viewModels()
    private lateinit var rewardedAdManager: RewardedAdManager

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        rewardedAdManager = RewardedAdManager(this)
        setContent {
            val state by gameViewModel.uiState.collectAsStateWithLifecycle()
            AgonAppTheme(darkTheme = state.profile.darkTheme) {
                ArrowLogicApp(gameViewModel, rewardedAdManager)
            }
        }
    }
}

@Composable
private fun ArrowLogicApp(viewModel: ArrowViewModel, rewardedAdManager: RewardedAdManager) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val adState by rewardedAdManager.state.collectAsStateWithLifecycle()
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }
    val backStack by navController.currentBackStackEntryAsState()
    val route = backStack?.destination?.route
    val adBusy = adState == RewardedAdState.LOADING || adState == RewardedAdState.SHOWING

    LaunchedEffect(state.giftMessage) {
        state.giftMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.consumeMessage()
        }
    }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (route == "home" || route == "skins" || route == "rewards" || route == "settings") ArrowBottomNav(navController)
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(innerPadding),
        ) {
            composable("home") {
                HomeScreen(
                    state = state,
                    onPlay = { navController.navigate("levels") },
                    onContinue = { navController.navigate("game") },
                    onDaily = {
                        viewModel.prepareMode(GameMode.DAILY)
                        navController.navigate("difficulty/daily")
                    },
                    onZen = {
                        viewModel.prepareMode(GameMode.ZEN)
                        navController.navigate("difficulty/zen")
                    },
                    onRush = {
                        viewModel.prepareMode(GameMode.RUSH)
                        navController.navigate("difficulty/rush")
                    },
                    onRewards = { navController.navigateTop("rewards") },
                    onSkins = { navController.navigateTop("skins") },
                    onSettings = { navController.navigateTop("settings") },
                )
            }
            composable("levels") {
                GameLevelsScreen(
                    profile = state.profile,
                    onBack = { navController.popBackStack() },
                    onLevel = { level ->
                        viewModel.startGame(GameMode.JOURNEY, level)
                        navController.navigate("game")
                    },
                )
            }
            composable("difficulty/daily") {
                DifficultySelectionScreen(
                    mode = GameMode.DAILY,
                    onBack = { navController.popBackStack() },
                    onSelect = { difficulty ->
                        viewModel.startGame(GameMode.DAILY, difficulty = difficulty)
                        navController.navigate("game") { popUpTo("home") }
                    },
                )
            }
            composable("difficulty/zen") {
                DifficultySelectionScreen(
                    mode = GameMode.ZEN,
                    onBack = { navController.popBackStack() },
                    onSelect = { difficulty ->
                        viewModel.startGame(GameMode.ZEN, difficulty = difficulty)
                        navController.navigate("game") { popUpTo("home") }
                    },
                )
            }
            composable("difficulty/rush") {
                DifficultySelectionScreen(
                    mode = GameMode.RUSH,
                    onBack = { navController.popBackStack() },
                    onSelect = { difficulty ->
                        viewModel.startGame(GameMode.RUSH, difficulty = difficulty)
                        navController.navigate("game") { popUpTo("home") }
                    },
                )
            }
            composable("skins") {
                SkinsScreen(
                    profile = state.profile,
                    onArrowSkin = viewModel::unlockOrSelectSkin,
                    onBoardSkin = viewModel::unlockOrSelectBoardSkin,
                    onBackgroundSkin = viewModel::unlockOrSelectBackgroundSkin,
                )
            }
            composable("rewards") {
                GameRewardsScreen(
                    profile = state.profile,
                    giftAvailable = state.profile.lastGiftDate != viewModel.today(),
                    adState = adState,
                    onClaimGift = viewModel::claimDailyGift,
                    onBuyHints = viewModel::purchaseHints,
                    onWatchCoins = {
                        rewardedAdManager.show(
                            onRewardEarned = { viewModel.grantAdReward(coins = 250, gems = 0) },
                            onUnavailable = { viewModel.showMessage("Rewarded ad is loading. Please try again shortly.") },
                        )
                    },
                    onWatchGems = {
                        rewardedAdManager.show(
                            onRewardEarned = { viewModel.grantAdReward(coins = 0, gems = 5) },
                            onUnavailable = { viewModel.showMessage("Rewarded ad is loading. Please try again shortly.") },
                        )
                    },
                    onPremium = viewModel::purchasePremium,
                    onClaimAchievement = viewModel::claimAchievement,
                )
            }
            composable("settings") {
                GameProfileScreen(
                    profile = state.profile,
                    onSound = viewModel::setSound,
                    onHaptics = viewModel::setHaptics,
                    onDarkTheme = viewModel::setDarkTheme,
                    onNickname = viewModel::setNickname,
                    onAvatar = viewModel::setAvatar,
                )
            }
            composable("game") {
                val session = state.session
                if (session != null) {
                    GameScreen(
                        session = session,
                        profile = state.profile,
                        adLoading = adBusy || session.adRewardPending,
                        onBack = { navController.popBackStack() },
                        onTap = viewModel::tapTile,
                        onHint = viewModel::useHint,
                        onUndo = viewModel::undo,
                        onRetry = viewModel::retry,
                        onContinueWithAd = {
                            viewModel.continueWithAd(
                                onUnavailable = { viewModel.showMessage("Ad unavailable. Please try again shortly.") },
                                onRewardEarned = {
                                    rewardedAdManager.show(
                                        onRewardEarned = { viewModel.applyContinueAfterAd() },
                                        onUnavailable = {
                                            viewModel.showMessage("Ad unavailable. Please try again shortly.")
                                        },
                                    )
                                },
                            )
                        },
                        onNext = {
                            viewModel.nextPuzzle()
                        },
                        onHome = {
                            viewModel.saveAndGoHome()
                            viewModel.abandonGame()
                            navController.navigate("home") {
                                popUpTo("home") { inclusive = true }
                            }
                        },
                        onDoubleCoins = {
                            viewModel.claimDoubleCoins(
                                onUnavailable = { viewModel.showMessage("Ad unavailable. Please try again shortly.") },
                                onRewardEarned = {
                                    rewardedAdManager.show(
                                        onRewardEarned = { viewModel.applyDoubleCoinReward() },
                                        onUnavailable = {
                                            viewModel.cancelAdReward()
                                            viewModel.showMessage("Ad unavailable. Please try again shortly.")
                                        },
                                    )
                                },
                            )
                        },
                    )
                } else {
                    LaunchedEffect(Unit) { navController.popBackStack() }
                }
            }
        }
    }
}

private fun NavHostController.navigateTop(route: String) {
    navigate(route) {
        popUpTo("home") { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

@Composable
private fun ArrowBottomNav(navController: NavHostController) {
    val backStack by navController.currentBackStackEntryAsState()
    val current = backStack?.destination?.route
    val destinations = listOf(
        Triple("home", "HOME", Icons.Default.Home),
        Triple("skins", "SKINS", Icons.Default.Palette),
        Triple("rewards", "REWARDS", Icons.Default.CardGiftcard),
        Triple("settings", "PROFILE", Icons.Default.Person),
    )
    Surface(
        modifier = Modifier.fillMaxWidth().height(88.dp),
        color = Color(0xFF160C3B),
        shadowElevation = 22.dp,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
    ) {
        Row(
            Modifier.fillMaxSize().padding(horizontal = 8.dp, vertical = 7.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            destinations.forEach { (route, label, icon) ->
                val selected = current == route
                val lift by animateDpAsState(if (selected) (-7).dp else 0.dp, label = "navLift")
                val scale by animateFloatAsState(if (selected) 1.12f else .92f, label = "navScale")
                Column(
                    modifier = Modifier.weight(1f).clickable { navController.navigateTop(route) },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(Modifier.height(49.dp), contentAlignment = Alignment.Center) {
                        if (selected) {
                            Surface(
                                modifier = Modifier.size(48.dp).offset(y = lift),
                                shape = CircleShape,
                                color = Color(0xFF2E146C),
                            ) {}
                        }
                        Surface(
                            modifier = Modifier.size(if (selected) 45.dp else 39.dp).offset(y = lift).graphicsLayer { scaleX = scale; scaleY = scale },
                            shape = CircleShape,
                            color = if (selected) Color(0xFF7447F5) else Color(0xFF251554),
                            shadowElevation = if (selected) 13.dp else 4.dp,
                        ) {
                            Icon(icon, label, tint = if (selected) Color.White else Color(0xFF9485C4), modifier = Modifier.padding(if (selected) 10.dp else 9.dp))
                        }
                    }
                    Text(label, color = if (selected) Color(0xFF72E7FF) else Color(0xFF887AAE), style = MaterialTheme.typography.labelMedium)
                }
            }
        }
    }
}
