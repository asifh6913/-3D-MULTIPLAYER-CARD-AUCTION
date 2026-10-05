package com.agon.app.ads

import android.app.Activity
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class RewardedAdState { LOADING, READY, SHOWING, ERROR }

/** Loads and presents rewarded ads with duplicate-reward protection. */
class RewardedAdManager(private val activity: Activity) {
    private val _state = MutableStateFlow(RewardedAdState.LOADING)
    val state: StateFlow<RewardedAdState> = _state.asStateFlow()
    private var rewardedAd: RewardedAd? = null
    private var rewardGrantedForCurrentShow = false
    private var pendingRewardCallback: (() -> Unit)? = null

    init {
        MobileAds.initialize(activity) { loadInternal() }
    }

    fun load() {
        if (_state.value == RewardedAdState.LOADING || rewardedAd != null) return
        loadInternal()
    }

    private fun loadInternal() {
        _state.value = RewardedAdState.LOADING
        RewardedAd.load(
            activity,
            TEST_REWARDED_AD_UNIT,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedAd = ad
                    _state.value = RewardedAdState.READY
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedAd = null
                    _state.value = RewardedAdState.ERROR
                }
            },
        )
    }

    fun show(onRewardEarned: () -> Unit, onUnavailable: () -> Unit) {
        val ad = rewardedAd
        if (ad == null || _state.value != RewardedAdState.READY) {
            onUnavailable()
            if (_state.value != RewardedAdState.LOADING) loadInternal()
            return
        }
        rewardedAd = null
        rewardGrantedForCurrentShow = false
        pendingRewardCallback = onRewardEarned
        _state.value = RewardedAdState.SHOWING
        ad.fullScreenContentCallback = object : FullScreenContentCallback() {
            override fun onAdDismissedFullScreenContent() {
                pendingRewardCallback = null
                loadInternal()
            }

            override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                pendingRewardCallback = null
                rewardGrantedForCurrentShow = false
                _state.value = RewardedAdState.ERROR
                loadInternal()
            }
        }
        ad.show(activity) {
            if (!rewardGrantedForCurrentShow) {
                rewardGrantedForCurrentShow = true
                pendingRewardCallback?.invoke()
                pendingRewardCallback = null
            }
        }
    }

    companion object {
        const val TEST_REWARDED_AD_UNIT = "ca-app-pub-3940256099942544/5224354917"
    }
}
