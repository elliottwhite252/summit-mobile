import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { useEffect } from "react";
import Game from "./src/Game";

export default function App() {
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#050510" }}>
      <StatusBar hidden />
      <Game />
    </View>
  );
}
