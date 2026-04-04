import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import Game from "./src/Game";

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: "#050510" }}>
      <StatusBar hidden />
      <Game />
    </View>
  );
}
