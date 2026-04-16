import mobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

// Use test IDs in dev, real IDs in production
const USE_TEST_ADS = false; // Production — real ads

const INTERSTITIAL_ID = USE_TEST_ADS
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-4673214616192353/9960743975";

const REWARDED_ID = USE_TEST_ADS
  ? TestIds.REWARDED
  : "ca-app-pub-4673214616192353/4398155050";

// ─── Initialize SDK ──────────────────────────────────────────────────────────
let initialized = false;

export async function initAds() {
  if (initialized) return;
  // Delay initialization so it doesn't block app startup
  setTimeout(async () => {
    try {
      await mobileAds().initialize();
      initialized = true;
      loadInterstitial();
      loadRewarded();
    } catch (e) {
      console.log("AdMob init failed:", e);
    }
  }, 3000);
}

// ─── Interstitial ────────────────────────────────────────────────────────────
let interstitialLoaded = false;

function loadInterstitial() {
  const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);

  ad.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  ad.addAdEventListener(AdEventType.CLOSED, () => {
    interstitialLoaded = false;
    // Preload next
    setTimeout(loadInterstitial, 1000);
  });

  ad.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    setTimeout(loadInterstitial, 30000);
  });

  ad.load();
}

let currentInterstitial: InterstitialAd | null = null;

export function showInterstitial(): boolean {
  if (!interstitialLoaded) return false;
  try {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);
    ad.addAdEventListener(AdEventType.LOADED, () => {
      ad.show();
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => {
      setTimeout(loadInterstitial, 1000);
    });
    ad.addAdEventListener(AdEventType.ERROR, () => {
      setTimeout(loadInterstitial, 5000);
    });
    ad.load();
    interstitialLoaded = false;
    return true;
  } catch {
    return false;
  }
}

// ─── Rewarded ────────────────────────────────────────────────────────────────
let rewardedLoaded = false;
let rewardedAd: RewardedAd | null = null;

function loadRewarded() {
  rewardedAd = RewardedAd.createForAdRequest(REWARDED_ID);

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    rewardedLoaded = false;
    setTimeout(loadRewarded, 1000);
  });

  rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    setTimeout(loadRewarded, 30000);
  });

  rewardedAd.load();
}

export function showRewarded(onReward: () => void): boolean {
  if (!rewardedLoaded || !rewardedAd) return false;
  try {
    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      onReward();
    });
    rewardedAd.show();
    rewardedLoaded = false;
    return true;
  } catch {
    return false;
  }
}

export function isRewardedReady(): boolean {
  return rewardedLoaded;
}
