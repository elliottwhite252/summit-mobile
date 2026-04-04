import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState, COSMETICS } from "./engine";

export interface SaveData {
  coins: number;
  owned: string[];
  eqHair: string;
  eqTrail: string;
  eqDeath: string;
}

const KEY = "summit_save";

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { coins: 0, owned: [], eqHair: "", eqTrail: "", eqDeath: "" };
}

export async function writeSave(gs: GameState): Promise<void> {
  try {
    const data: SaveData = {
      coins: gs.coins,
      owned: Array.from(gs.ownedCosmetics),
      eqHair: gs.equippedHair,
      eqTrail: gs.equippedTrail,
      eqDeath: gs.equippedDeathEffect,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}
