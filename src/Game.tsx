import React, { useRef, useCallback, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { WebView } from "react-native-webview";
import { Asset } from "expo-asset";
import { showInterstitial, showRewarded, initAds } from "./ads";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function Game() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    initAds();
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
