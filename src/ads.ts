import {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// Use test IDs in development, real IDs in production
const __DEV__ = true; // Set to false for production builds

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-4673214616192353/9960743975";

const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : "ca-app-pub-4673214616192353/4398155050";

// ─── Interstitial (between rooms) ────────────────────────────────────────────
let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

function loadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
  interstitialLoaded = false;

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    // Preload the next one
    loadInterstitial();
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    // Retry after 30 seconds
    setTimeout(loadInterstitial, 30000);
  });

  interstitial.load();
}

export function initAds() {
  loadInterstitial();
  loadRewarded();
}

export function showInterstitial(): boolean {
  if (interstitialLoaded && interstitial) {
    interstitial.show();
    interstitialLoaded = false;
    return true;
  }
  return false;
}

// ─── Rewarded Video (watch ad for coins) ─────────────────────────────────────
let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;

function loadRewarded() {
  rewarded = RewardedAd.createForAdRequest(REWARDED_ID);
  rewardedLoaded = false;

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });

  rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    // Reward will be handled by the callback passed to showRewarded
  });

  rewarded.addAdEventListener(AdEventType.CLOSED, () => {
    loadRewarded();
  });

  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    setTimeout(loadRewarded, 30000);
  });

  rewarded.load();
}

export function showRewarded(onReward: () => void): boolean {
  if (rewardedLoaded && rewarded) {
    // Listen for reward
    const unsub = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        onReward();
        unsub();
      }
    );
    rewarded.show();
    rewardedLoaded = false;
    return true;
  }
  return false;
}

export function isRewardedReady(): boolean {
  return rewardedLoaded;
}
