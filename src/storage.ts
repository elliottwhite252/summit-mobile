import AsyncStorage from "@react-native-async-storage/async-storage";
import { GameState } from "./engine";

export interface SaveData {
  coins: number;
  owned: string[];
  eqHair: string;
  eqTrail: string;
  eqDeath: string;
  starterPack: boolean;
}

const KEY = "summit_save";

export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); return { ...d, starterPack: d.starterPack || false }; }
  } catch { /* ignore */ }
  return { coins: 0, owned: [], eqHair: "", eqTrail: "", eqDeath: "", starterPack: false };
}

export async function writeSave(gs: GameState): Promise<void> {
  try {
    const data: SaveData = {
      coins: gs.coins,
      owned: Array.from(gs.ownedCosmetics),
      eqHair: gs.equippedHair,
      eqTrail: gs.equippedTrail,
      eqDeath: gs.equippedDeathEffect,
      starterPack: gs.starterPackBought,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}
