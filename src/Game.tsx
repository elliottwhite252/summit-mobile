import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { showInterstitial, showRewarded, initAds } from "./ads";
import {
  initIAP,
  purchase,
  restore,
  setPurchaseCallbacks,
  type ProductId,
} from "./iap";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// Escape a string for safe injection into a JS string literal
function jsStr(s: string) {
  return JSON.stringify(s);
}

export default function Game() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    initAds();

    // Wire IAP callbacks → forward results back into the WebView
    setPurchaseCallbacks(
      (productId) => {
        webViewRef.current?.injectJavaScript(
          `window.onPurchaseSuccess && window.onPurchaseSuccess(${jsStr(productId)}); true;`
        );
      },
      (productId, message) => {
        webViewRef.current?.injectJavaScript(
          `window.onPurchaseFailed && window.onPurchaseFailed(${jsStr(productId ?? "")}, ${jsStr(message)}); true;`
        );
      }
    );

    initIAP();
  }, []);

  const onMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === "showInterstitial") {
        showInterstitial();
      } else if (data.type === "showRewarded") {
        showRewarded(() => {
          // Send coins back to the WebView
          webViewRef.current?.injectJavaScript(
            "window.onRewardedAdComplete && window.onRewardedAdComplete(); true;"
          );
        });
      } else if (data.type === "purchase") {
        purchase(data.productId as ProductId);
      } else if (data.type === "restorePurchases") {
        restore().then((restored) => {
          webViewRef.current?.injectJavaScript(
            `window.onRestoreComplete && window.onRestoreComplete(${JSON.stringify(restored)}); true;`
          );
        });
      }
    } catch {
      // ignore invalid messages
    }
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={require("../assets/game.html")}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        onMessage={onMessage}
        injectedJavaScript={`
          // Prevent zooming/scrolling
          document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
          const meta = document.createElement('meta');
          meta.name = 'viewport';
          meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
          document.head.appendChild(meta);
          true;
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
  },
  webview: {
    flex: 1,
    backgroundColor: "#050510",
  },
});
