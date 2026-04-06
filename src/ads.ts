// Ads stub — AdMob will be integrated via react-native-google-mobile-ads
// with proper native delegate setup in a future session.
// For now, all ad functions are no-ops so the app runs without ads.

export async function initAds() {
  // No-op
}

export async function showInterstitial(): Promise<boolean> {
  return false;
}

export async function showRewarded(onReward: () => void): Promise<boolean> {
  return false;
}

export function isRewardedReady(): boolean {
  return false;
}
