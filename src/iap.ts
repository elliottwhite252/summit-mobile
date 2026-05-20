import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Purchase,
  type PurchaseError,
} from "react-native-iap";
import { Platform } from "react-native";

// ─── Product IDs ─────────────────────────────────────────────────────────────
export const PRODUCT_IDS = {
  dreamPack: "com.elliottwhite.drift.dreampack",
  coins50: "com.elliottwhite.drift.coins50",
  coins200: "com.elliottwhite.drift.coins200",
  coins500: "com.elliottwhite.drift.coins500",
} as const;

export type ProductId = (typeof PRODUCT_IDS)[keyof typeof PRODUCT_IDS];

const ALL_IDS: ProductId[] = Object.values(PRODUCT_IDS);
const CONSUMABLE_IDS = new Set<ProductId>([
  PRODUCT_IDS.coins50,
  PRODUCT_IDS.coins200,
  PRODUCT_IDS.coins500,
]);

// Map product IDs to coin amounts (consumables only)
export const COIN_AMOUNTS: Partial<Record<ProductId, number>> = {
  [PRODUCT_IDS.coins50]: 50,
  [PRODUCT_IDS.coins200]: 200,
  [PRODUCT_IDS.coins500]: 500,
};

// ─── State ────────────────────────────────────────────────────────────────────
let initialized = false;
let products: Product[] = [];
let purchaseListener: { remove: () => void } | null = null;
let errorListener: { remove: () => void } | null = null;

// Callbacks to bridge purchases back to the WebView
type PurchaseCallback = (productId: string) => void;
type ErrorCallback = (productId: string | null, message: string) => void;

let onPurchaseSuccess: PurchaseCallback | null = null;
let onPurchaseFailed: ErrorCallback | null = null;

export function setPurchaseCallbacks(
  onSuccess: PurchaseCallback,
  onFailed: ErrorCallback
) {
  onPurchaseSuccess = onSuccess;
  onPurchaseFailed = onFailed;
}

// ─── Initialize ───────────────────────────────────────────────────────────────
export async function initIAP() {
  if (initialized) return;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;

  // Delay so it doesn't block app startup
  setTimeout(async () => {
    try {
      await initConnection();
      initialized = true;

      // Fetch product catalog from App Store
      try {
        products = (await fetchProducts({
          skus: ALL_IDS,
          type: "in-app",
        })) as Product[];
      } catch (e) {
        console.log("IAP fetchProducts failed:", e);
      }

      // Listen for purchase updates (including deferred / interrupted)
      purchaseListener = purchaseUpdatedListener(async (purchase: Purchase) => {
        const productId = purchase.productId as ProductId;
        try {
          // Acknowledge the transaction so Apple stops re-delivering it
          await finishTransaction({
            purchase,
            isConsumable: CONSUMABLE_IDS.has(productId),
          });
          onPurchaseSuccess?.(productId);
        } catch (e) {
          console.log("finishTransaction failed:", e);
          onPurchaseFailed?.(productId, "Could not finalize purchase.");
        }
      });

      errorListener = purchaseErrorListener((error: PurchaseError) => {
        // E_USER_CANCELLED is silent — user just dismissed the sheet
        if (error.code === "E_USER_CANCELLED") {
          onPurchaseFailed?.(null, "cancelled");
          return;
        }
        onPurchaseFailed?.(null, error.message || "Purchase failed.");
      });
    } catch (e) {
      console.log("IAP init failed:", e);
    }
  }, 3000);
}

// ─── Purchase ─────────────────────────────────────────────────────────────────
export async function purchase(productId: ProductId): Promise<void> {
  if (!initialized) {
    onPurchaseFailed?.(productId, "Store not ready. Try again in a moment.");
    return;
  }
  try {
    await requestPurchase({
      request: { apple: { sku: productId } },
      type: "in-app",
    } as any);
    // Result comes through purchaseUpdatedListener above
  } catch (e: any) {
    onPurchaseFailed?.(productId, e?.message || "Purchase request failed.");
  }
}

// ─── Restore (non-consumables only — Apple requires this) ─────────────────────
export async function restore(): Promise<string[]> {
  if (!initialized) return [];
  try {
    const purchases = await getAvailablePurchases();
    const restored: string[] = [];
    for (const p of purchases) {
      const pid = p.productId as ProductId;
      // Only non-consumables can be restored (Dream Pack)
      if (!CONSUMABLE_IDS.has(pid)) {
        restored.push(pid);
        onPurchaseSuccess?.(pid);
      }
    }
    return restored;
  } catch (e) {
    console.log("restore failed:", e);
    return [];
  }
}

// ─── Cleanup ──────────────────────────────────────────────────────────────────
export function teardownIAP() {
  purchaseListener?.remove();
  errorListener?.remove();
  if (initialized) endConnection();
  initialized = false;
}

// ─── Product info (for displaying real prices in UI, optional) ────────────────
export function getProductInfo(productId: ProductId): Product | undefined {
  return products.find((p) => p.productId === productId);
}
