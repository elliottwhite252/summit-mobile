import React, { useRef, useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet, ScrollView } from "react-native";
import { Skia, SkPicture, SkCanvas, matchFont } from "@shopify/react-native-skia";
import { SkiaPictureView } from "@shopify/react-native-skia";
import {
  GameState, InputState, GAME_W, GAME_H, TILE, PW, PH, DEFAULT_HAIR,
  createPlayer, createSnow, updateGame, getHairColor, getTrailColor,
  BOOSTERS, COSMETICS, BoosterType, CosmeticDef,
} from "./engine";
import { createRooms } from "./rooms";
import { playSfx, preloadSounds, startBGM, stopBGM, sfxMuted, musicMuted, setSfxMuted, setMusicMuted } from "./sound";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadSave, writeSave, SaveData } from "./storage";

// Landscape layout: game canvas on top, thin control strip on bottom
const screen = Dimensions.get("window");
const SCREEN_W = Math.max(screen.width, screen.height);
const SCREEN_H = Math.min(screen.width, screen.height);
const CONTROLS_HEIGHT = 80;
const CANVAS_W = SCREEN_W;
const CANVAS_H = SCREEN_H - CONTROLS_HEIGHT;
const SCALE = Math.min(CANVAS_W / GAME_W, CANVAS_H / GAME_H);
const OFFSET_X = (CANVAS_W - GAME_W * SCALE) / 2;
const OFFSET_Y = (CANVAS_H - GAME_H * SCALE) / 2;

// ─── Render to SkPicture ─────────────────────────────────────────────────────
function renderToPicture(gs: GameState): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, CANVAS_W, CANVAS_H + 1));
  drawGame(canvas, gs);
  return recorder.finishRecordingAsPicture();
}

function drawGame(canvas: SkCanvas, gs: GameState) {
  const paint = Skia.Paint();
  const time = gs.time;
  const room = gs.rooms[gs.currentRoom];

  canvas.save();
  canvas.translate(OFFSET_X, OFFSET_Y);
  canvas.scale(SCALE, SCALE);

  if (gs.screenShake > 0) {
    canvas.translate((Math.random() - 0.5) * gs.screenShake, (Math.random() - 0.5) * gs.screenShake);
  }

  // Background
  paint.setColor(Skia.Color("#0a0a1e"));
  canvas.drawRect(Skia.XYWHRect(0, 0, GAME_W, GAME_H), paint);

  const mountainPath = Skia.Path.Make();
  mountainPath.moveTo(0, GAME_H);
  for (let x = 0; x <= GAME_W; x += 40) {
    const h = 150 + Math.sin((x + gs.currentRoom * 200) * 0.008) * 80 + Math.sin((x + gs.currentRoom * 100) * 0.02) * 30;
    mountainPath.lineTo(x, GAME_H - h);
  }
  mountainPath.lineTo(GAME_W, GAME_H); mountainPath.close();
  paint.setColor(Skia.Color("rgba(20,20,50,0.6)"));
  canvas.drawPath(mountainPath, paint);

  // Snow
  paint.setColor(Skia.Color("rgba(255,255,255,0.6)"));
  for (const s of gs.snow) canvas.drawRect(Skia.XYWHRect(s.x, s.y, s.size, s.size), paint);

  // Platforms
  for (const p of room.platforms) {
    paint.setColor(Skia.Color("#2d3a4a")); canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.w, p.h), paint);
    paint.setColor(Skia.Color("#3d4e63")); canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.w, 2), paint);
  }

  // Crumbles
  for (const c of room.crumbles) {
    if (!c.visible) continue;
    const ox = c.timer > 0 ? Math.sin(time * 0.8) * 2 : 0;
    paint.setColor(Skia.Color(c.timer > 0 ? "#5a4a3a" : "#4a3a2a"));
    canvas.drawRect(Skia.XYWHRect(c.x + ox, c.y, c.w, TILE), paint);
  }

  // Spikes
  paint.setColor(Skia.Color("#c0392b"));
  for (const s of room.spikes) {
    const path = Skia.Path.Make();
    switch (s.dir) {
      case "up": path.moveTo(s.x, s.y); path.lineTo(s.x + 10, s.y - 10); path.lineTo(s.x + 20, s.y); break;
      case "down": path.moveTo(s.x, s.y + TILE); path.lineTo(s.x + 10, s.y + TILE + 10); path.lineTo(s.x + 20, s.y + TILE); break;
      case "left": path.moveTo(s.x, s.y); path.lineTo(s.x - 10, s.y + 10); path.lineTo(s.x, s.y + 20); break;
      case "right": path.moveTo(s.x + TILE, s.y); path.lineTo(s.x + TILE + 10, s.y + 10); path.lineTo(s.x + TILE, s.y + 20); break;
    }
    path.close(); canvas.drawPath(path, paint);
  }

  // Strawberries
  for (const s of room.strawberries) {
    if (s.collected) continue;
    const bob = Math.sin(time * 0.06) * 3;
    paint.setColor(Skia.Color("rgba(232,72,85,0.15)")); canvas.drawCircle(s.x, s.y + bob, 12, paint);
    paint.setColor(Skia.Color("#e84855")); canvas.drawCircle(s.x, s.y + bob, 6, paint);
    const leafPath = Skia.Path.Make();
    leafPath.moveTo(s.x, s.y + bob - 6); leafPath.lineTo(s.x - 4, s.y + bob - 10); leafPath.lineTo(s.x + 4, s.y + bob - 10); leafPath.close();
    paint.setColor(Skia.Color("#2ecc71")); canvas.drawPath(leafPath, paint);
  }

  // Springs
  for (const s of room.springs) {
    const compressed = s.activated > 0;
    const baseY = compressed ? s.y + 6 : s.y;
    paint.setColor(Skia.Color("#7f8c8d")); canvas.drawRect(Skia.XYWHRect(s.x - 8, s.y + 8, 36, 4), paint);
    paint.setColor(Skia.Color("#f39c12")); canvas.drawRect(Skia.XYWHRect(s.x - 6, baseY - 2, 32, 4), paint);
  }

  // Checkpoint flag
  if (gs.checkpoint) {
    const cp = gs.checkpoint;
    paint.setColor(Skia.Color("#f1c40f"));
    canvas.drawRect(Skia.XYWHRect(cp.x - 1, cp.y - 12, 2, 16), paint);
    const flagPath = Skia.Path.Make();
    flagPath.moveTo(cp.x, cp.y - 12); flagPath.lineTo(cp.x + 10, cp.y - 6); flagPath.lineTo(cp.x, cp.y); flagPath.close();
    canvas.drawPath(flagPath, paint);
  }

  // Particles
  for (const p of gs.particles) {
    if (p.life <= 0) continue;
    paint.setColor(Skia.Color(p.color)); paint.setAlphaf(Math.max(0, p.life));
    canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.size, p.size), paint);
  }
  paint.setAlphaf(1);

  // Player
  const pl = gs.player;
  if (!pl.dead) {
    for (let i = pl.hair.length - 1; i >= 0; i--) {
      const h = pl.hair[i]; const sz = 6 - i * 0.6;
      paint.setColor(Skia.Color(pl.hairColor)); paint.setAlphaf(1 - i * 0.15);
      canvas.drawCircle(h.x, h.y, sz, paint);
    }
    paint.setAlphaf(1);
    paint.setColor(Skia.Color("#4a6fa5")); canvas.drawRect(Skia.XYWHRect(pl.x, pl.y, PW, PH), paint);
    paint.setColor(Skia.Color("#ffd6ba")); canvas.drawRect(Skia.XYWHRect(pl.x + 1, pl.y + 1, PW - 2, 7), paint);
    paint.setColor(Skia.Color("#1a1a2e"));
    const eyeX = pl.facing > 0 ? pl.x + PW / 2 + 1 : pl.x + PW / 2 - 3;
    canvas.drawRect(Skia.XYWHRect(eyeX, pl.y + 3, 2, 2), paint);
    paint.setColor(Skia.Color(pl.hairColor)); canvas.drawRect(Skia.XYWHRect(pl.x - 1, pl.y - 2, PW + 2, 4), paint);

    // Shield glow
    if (gs.shieldActive) {
      paint.setColor(Skia.Color("rgba(241,196,15,0.4)"));
      canvas.drawCircle(pl.x + PW / 2, pl.y + PH / 2, 14, paint);
    }
  }

  // HUD
  const font = matchFont({ fontSize: 13 });
  paint.setColor(Skia.Color("rgba(0,0,0,0.4)"));
  canvas.drawRect(Skia.XYWHRect(8, 8, 100, 24), paint);
  canvas.drawRect(Skia.XYWHRect(8, 36, 100, 24), paint);
  canvas.drawRect(Skia.XYWHRect(GAME_W / 2 - 50, 8, 100, 24), paint);
  canvas.drawRect(Skia.XYWHRect(GAME_W - 98, 8, 90, 24), paint);

  paint.setColor(Skia.Color("#c0392b")); canvas.drawText(`Deaths: ${gs.deaths}`, 14, 25, paint, font);
  paint.setColor(Skia.Color("#e84855")); canvas.drawText(`${gs.strawberriesCollected}/${gs.totalStrawberries}`, 14, 53, paint, font);
  paint.setColor(Skia.Color("#f1c40f")); canvas.drawText(`${gs.coins} coins`, GAME_W / 2 - 38, 25, paint, font);
  paint.setColor(Skia.Color("#7f8fa6")); canvas.drawText(`${gs.currentRoom + 1}/${gs.rooms.length}`, GAME_W - 78, 25, paint, font);

  // Active booster
  if (gs.activeBooster) {
    const b = BOOSTERS.find(b => b.id === gs.activeBooster);
    if (b) {
      paint.setColor(Skia.Color("rgba(0,0,0,0.4)")); canvas.drawRect(Skia.XYWHRect(GAME_W / 2 - 50, 36, 100, 20), paint);
      paint.setColor(Skia.Color("#f39c12")); canvas.drawText(b.name, GAME_W / 2 - 30, 50, paint, font);
    }
  }

  // Slow-mo bar
  if (gs.slowMoFrames > 0) {
    paint.setColor(Skia.Color("rgba(100,200,255,0.3)"));
    canvas.drawRect(Skia.XYWHRect(0, 0, GAME_W * (gs.slowMoFrames / 300), 3), paint);
  }

  // Room transition fade
  if (gs.transitionTimer > 0) {
    const progress = gs.transitionDir === 1
      ? (20 - gs.transitionTimer) / 10
      : gs.transitionTimer / 10;
    const alpha = Math.min(1, Math.max(0, progress));
    paint.setColor(Skia.Color(`rgba(0,0,0,${alpha})`));
    canvas.drawRect(Skia.XYWHRect(-10, -10, GAME_W + 20, GAME_H + 20), paint);
  }

  canvas.restore();
}

// ─── Main Game Component ─────────────────────────────────────────────────────
export default function Game() {
  const gsRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false,
    jump: false, jumpJustPressed: false, dash: false,
    activateSlowmo: false, placeCheckpoint: false,
  });
  const animRef = useRef<number>(0);
  const [status, setStatus] = useState<"menu" | "playing" | "win" | "shop" | "offer">("menu");
  const [shopTab, setShopTab] = useState<"boosters" | "cosmetics">("boosters");
  const [picture, setPicture] = useState<SkPicture | null>(null);
  const [, forceUpdate] = useState(0);
  const [savedCoins, setSavedCoins] = useState(0);
  const [isSfxMuted, setIsSfxMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);

  useEffect(() => {
    preloadSounds();
    loadSave().then(s => setSavedCoins(s.coins));
    // Load audio settings
    AsyncStorage.getItem("summit_sfx_muted").then(v => { if (v === "true") { setSfxMuted(true); setIsSfxMuted(true); } });
    AsyncStorage.getItem("summit_music_muted").then(v => { if (v === "true") { setMusicMuted(true); setIsMusicMuted(true); } });
  }, []);

  const toggleSfx = useCallback(() => {
    const next = !sfxMuted;
    setSfxMuted(next);
    setIsSfxMuted(next);
    AsyncStorage.setItem("summit_sfx_muted", String(next));
  }, []);

  const toggleMusic = useCallback(() => {
    const next = !musicMuted;
    setMusicMuted(next);
    setIsMusicMuted(next);
    AsyncStorage.setItem("summit_music_muted", String(next));
    if (next) stopBGM(); else if (status === "playing") startBGM();
  }, [status]);

  const sfxCallback = useCallback((type: string) => { playSfx(type); }, []);

  const initGame = useCallback(async () => {
    const save = await loadSave();
    const rooms = createRooms();
    let total = 0;
    for (const r of rooms) total += r.strawberries.length;
    const hairColor = save.eqHair ? (COSMETICS.find(c => c.id === save.eqHair)?.color || DEFAULT_HAIR) : DEFAULT_HAIR;
    gsRef.current = {
      player: createPlayer(rooms[0].spawn, hairColor),
      rooms, currentRoom: 0, deaths: 0,
      strawberriesCollected: 0, totalStrawberries: total,
      particles: [], snow: createSnow(),
      status: "playing", screenShake: 0, time: 0,
      coins: save.coins,
      ownedCosmetics: new Set(save.owned),
      equippedHair: save.eqHair, equippedTrail: save.eqTrail, equippedDeathEffect: save.eqDeath,
      activeBooster: null, shieldActive: false, doubleDashActive: false,
      checkpoint: null, slowMoFrames: 0, springBoostActive: false,
      starterPackBought: save.starterPack,
      roomDeaths: 0, offerBooster: null,
      transitionTimer: 0, transitionDir: 0,
    };
    setStatus("playing");
    startBGM();
  }, []);

  const buyBooster = useCallback((id: BoosterType) => {
    const gs = gsRef.current; if (!gs) return;
    const def = BOOSTERS.find(b => b.id === id); if (!def || gs.coins < def.cost) return;
    gs.coins -= def.cost;
    gs.activeBooster = id;
    if (id === "shield") gs.shieldActive = true;
    if (id === "doubleDash") gs.doubleDashActive = true;
    if (id === "springBoost") gs.springBoostActive = true;
    playSfx("buy"); writeSave(gs); forceUpdate(n => n + 1);
  }, []);

  const buyCosmetic = useCallback((id: string) => {
    const gs = gsRef.current; if (!gs) return;
    const def = COSMETICS.find(c => c.id === id); if (!def) return;
    if (gs.ownedCosmetics.has(id)) {
      if (def.type === "hair") { gs.equippedHair = id; gs.player.hairColor = def.color; }
      else if (def.type === "trail") gs.equippedTrail = id;
      else if (def.type === "deathEffect") gs.equippedDeathEffect = id;
    } else {
      if (gs.coins < def.cost) return;
      gs.coins -= def.cost;
      gs.ownedCosmetics.add(id);
      playSfx("buy");
    }
    writeSave(gs); forceUpdate(n => n + 1);
  }, []);

  const buyStarterPack = useCallback(() => {
    const gs = gsRef.current; if (!gs || gs.starterPackBought) return;
    gs.starterPackBought = true;
    gs.coins += 100;
    gs.ownedCosmetics.add("hair_aurora");
    gs.ownedCosmetics.add("trail_aurora");
    gs.equippedHair = "hair_aurora";
    gs.equippedTrail = "trail_aurora";
    gs.player.hairColor = "#ff6b9d";
    playSfx("strawberry");
    playSfx("buy");
    writeSave(gs); forceUpdate(n => n + 1);
  }, []);

  const gameLoop = useCallback(() => {
    const gs = gsRef.current;
    if (!gs) return;
    if (gs.status === "playing") {
      const input = { ...inputRef.current };
      inputRef.current.jumpJustPressed = false;
      inputRef.current.dash = false;
      inputRef.current.activateSlowmo = false;
      inputRef.current.placeCheckpoint = false;
      updateGame(gs, input, sfxCallback);
      if ((gs.status as string) === "win") { setStatus("win"); writeSave(gs); stopBGM(); }
      if ((gs.status as string) === "offer") { setStatus("offer"); }
    }
    setPicture(renderToPicture(gs));
    animRef.current = requestAnimationFrame(gameLoop);
  }, [sfxCallback]);

  useEffect(() => {
    if (status === "playing" || status === "offer") {
      animRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [status, gameLoop]);

  const setInput = (key: keyof InputState, value: boolean) => {
    (inputRef.current as any)[key] = value;
    if (key === "jump" && value) inputRef.current.jumpJustPressed = true;
    if (key === "dash" && value) inputRef.current.dash = true;
  };

  const gs = gsRef.current;

  return (
    <View style={styles.container}>
      {/* Menu */}
      {status === "menu" && (
        <View style={styles.overlay}>
          <Text style={styles.mountain}>🏔️</Text>
          <Text style={styles.title}>SUMMIT</Text>
          <Text style={styles.subtitle}>REACH THE TOP</Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <TouchableOpacity style={styles.startBtn} onPress={initGame}><Text style={styles.startText}>CLIMB</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: "#92400e" }]} onPress={() => { if (!gsRef.current) initGame().then(() => { setStatus("shop"); if (gsRef.current) gsRef.current.status = "shop"; }); else { setStatus("shop"); gsRef.current.status = "shop"; } }}>
              <Text style={styles.startText}>🪙 SHOP</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: "#f1c40f", fontSize: 13, fontFamily: "monospace" }}>🪙 {savedCoins} coins</Text>
          <Text style={styles.hint}>Use controls below to move, jump, and dash</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity onPress={toggleSfx} style={{ backgroundColor: isSfxMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ color: isSfxMuted ? "#ef4444" : "#9ca3af", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}>{isSfxMuted ? "🔇 SFX OFF" : "🔊 SFX ON"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleMusic} style={{ backgroundColor: isMusicMuted ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
              <Text style={{ color: isMusicMuted ? "#ef4444" : "#9ca3af", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}>{isMusicMuted ? "🔇 MUSIC OFF" : "🎵 MUSIC ON"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Win */}
      {status === "win" && (
        <View style={styles.overlay}>
          <Text style={styles.mountain}>⛰️</Text>
          <Text style={styles.title}>SUMMIT REACHED</Text>
          <Text style={styles.stat}>Deaths: {gs?.deaths || 0}</Text>
          <Text style={styles.stat}>Strawberries: {gs?.strawberriesCollected || 0}/{gs?.totalStrawberries || 0}</Text>
          <Text style={[styles.stat, { color: "#f1c40f" }]}>Coins: 🪙 {gs?.coins || 0}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={styles.startBtn} onPress={initGame}><Text style={styles.startText}>CLIMB AGAIN</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.startBtn, { backgroundColor: "#92400e" }]} onPress={() => { setStatus("shop"); if (gs) gs.status = "shop"; }}>
              <Text style={styles.startText}>🪙 SHOP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shop */}
      {status === "shop" && gs && (
        <View style={styles.overlay}>
          <View style={{ width: "100%", maxWidth: 400, flex: 1, paddingTop: 40 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10, paddingHorizontal: 10 }}>
              <Text style={{ color: "#67c7d4", fontSize: 20, fontWeight: "bold", fontFamily: "monospace" }}>🪙 SHOP</Text>
              <Text style={{ color: "#f1c40f", fontSize: 14, fontWeight: "bold", fontFamily: "monospace" }}>🪙 {gs.coins}</Text>
              <TouchableOpacity onPress={() => { setStatus("playing"); gs.status = "playing"; startBGM(); }} style={{ backgroundColor: "#374151", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontFamily: "monospace" }}>✕ CLOSE</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, paddingHorizontal: 10 }}>
              <TouchableOpacity onPress={() => setShopTab("boosters")} style={{ backgroundColor: shopTab === "boosters" ? "#0e7490" : "#1f2937", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold", fontFamily: "monospace" }}>BOOSTERS</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShopTab("cosmetics")} style={{ backgroundColor: shopTab === "cosmetics" ? "#0e7490" : "#1f2937", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold", fontFamily: "monospace" }}>COSMETICS</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, paddingHorizontal: 10 }}>
              {/* Starter Pack Banner */}
              {!gs.starterPackBought && (
                <View style={{ marginBottom: 12, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "rgba(196,77,255,0.4)", backgroundColor: "#1a0533" }}>
                  <View style={{ padding: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                      <Text style={{ fontSize: 16, marginRight: 6 }}>⭐</Text>
                      <Text style={{ color: "#fde68a", fontWeight: "bold", fontSize: 13, fontFamily: "monospace" }}>STARTER PACK</Text>
                      <View style={{ marginLeft: "auto", backgroundColor: "#ef4444", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "bold", fontFamily: "monospace" }}>BEST VALUE</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff6b9d" }} />
                          <Text style={{ color: "#d1d5db", fontSize: 11, fontFamily: "monospace" }}>Aurora Hair (Exclusive)</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#c44dff" }} />
                          <Text style={{ color: "#d1d5db", fontSize: 11, fontFamily: "monospace" }}>Aurora Trail (Exclusive)</Text>
                        </View>
                        <Text style={{ color: "#f1c40f", fontSize: 11, fontFamily: "monospace" }}>+ 100 🪙 Coins</Text>
                        <Text style={{ color: "#6b7280", fontSize: 10, fontFamily: "monospace", textDecorationLine: "line-through", marginTop: 2 }}>Value: 140 coins</Text>
                      </View>
                      <TouchableOpacity onPress={buyStarterPack} style={{ backgroundColor: "#7c3aed", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }} activeOpacity={0.7}>
                        <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 14, fontFamily: "monospace" }}>$0.99</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {shopTab === "boosters" && BOOSTERS.map(b => (
                <View key={b.id} style={{ backgroundColor: "#1f2937", borderRadius: 8, padding: 10, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{b.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold", fontFamily: "monospace" }}>{b.name}</Text>
                    <Text style={{ color: "#6b7280", fontSize: 10, fontFamily: "monospace" }}>{b.desc}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => buyBooster(b.id)}
                    disabled={gs.coins < b.cost || gs.activeBooster === b.id}
                    style={{ backgroundColor: gs.activeBooster === b.id ? "#15803d" : gs.coins < b.cost ? "#374151" : "#92400e", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 }}
                  >
                    <Text style={{ color: gs.coins < b.cost && gs.activeBooster !== b.id ? "#6b7280" : "#fff", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" }}>
                      {gs.activeBooster === b.id ? "ACTIVE" : `🪙 ${b.cost}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {shopTab === "cosmetics" && (["hair", "trail", "deathEffect"] as const).map(type => (
                <View key={type} style={{ marginBottom: 12 }}>
                  <Text style={{ color: "#6b7280", fontSize: 10, fontFamily: "monospace", marginBottom: 4, textTransform: "uppercase" }}>
                    {type === "hair" ? "Hair Colors" : type === "trail" ? "Dash Trails" : "Death Effects"}
                  </Text>
                  {COSMETICS.filter(c => c.type === type).map(c => {
                    const owned = gs.ownedCosmetics.has(c.id);
                    const equipped = (type === "hair" && gs.equippedHair === c.id) || (type === "trail" && gs.equippedTrail === c.id) || (type === "deathEffect" && gs.equippedDeathEffect === c.id);
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => buyCosmetic(c.id)}
                        disabled={!owned && gs.coins < c.cost}
                        style={{ backgroundColor: equipped ? "#164e63" : "#1f2937", borderRadius: 6, padding: 8, marginBottom: 4, flexDirection: "row", alignItems: "center", borderWidth: equipped ? 1 : 0, borderColor: "#67c7d4" }}
                      >
                        <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.color, marginRight: 8 }} />
                        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "monospace", flex: 1 }}>{c.name}</Text>
                        {!owned && <Text style={{ color: "#f1c40f", fontSize: 11, fontFamily: "monospace" }}>🪙{c.cost}</Text>}
                        {equipped && <Text style={{ color: "#67c7d4", fontSize: 11, fontFamily: "monospace" }}>✓</Text>}
                        {owned && !equipped && <Text style={{ color: "#6b7280", fontSize: 10, fontFamily: "monospace" }}>EQUIP</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Death-triggered offer */}
      {status === "offer" && gs && gs.offerBooster && (() => {
        const booster = BOOSTERS.find(b => b.id === gs.offerBooster);
        if (!booster) return null;
        const canAfford = gs.coins >= booster.cost;
        return (
          <View style={styles.overlay}>
            <View style={{ backgroundColor: "#111827", borderWidth: 1, borderColor: "rgba(234,179,8,0.4)", borderRadius: 16, padding: 20, maxWidth: 280, alignItems: "center" }}>
              <Text style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", marginBottom: 8 }}>Struggling? Try a boost!</Text>
              <Text style={{ fontSize: 28, marginBottom: 4 }}>{booster.icon}</Text>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold", fontFamily: "monospace", marginBottom: 4 }}>{booster.name}</Text>
              <Text style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>{booster.desc}</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (canAfford) {
                      gs.coins -= booster.cost;
                      gs.activeBooster = booster.id;
                      if (booster.id === "shield") gs.shieldActive = true;
                      if (booster.id === "doubleDash") gs.doubleDashActive = true;
                      if (booster.id === "springBoost") gs.springBoostActive = true;
                      playSfx("buy");
                      writeSave(gs);
                    }
                    gs.offerBooster = null;
                    gs.status = "playing";
                    setStatus("playing");
                  }}
                  disabled={!canAfford}
                  style={{ backgroundColor: canAfford ? "#92400e" : "#374151", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: canAfford ? "#fff" : "#6b7280", fontSize: 13, fontWeight: "bold", fontFamily: "monospace" }}>
                    {canAfford ? `🪙 ${booster.cost} — BUY` : `Need ${booster.cost}`}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { gs.offerBooster = null; gs.status = "playing"; setStatus("playing"); }}
                  style={{ backgroundColor: "#1f2937", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: "#9ca3af", fontSize: 13, fontWeight: "bold", fontFamily: "monospace" }}>No thanks</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: "#4b5563", fontSize: 10, fontFamily: "monospace", marginTop: 10 }}>🪙 {gs.coins} coins</Text>
            </View>
          </View>
        );
      })()}

      <SkiaPictureView style={{ width: CANVAS_W, height: CANVAS_H }} picture={picture ?? undefined} />

      {/* Controls — bottom strip like a game controller */}
      {status === "playing" && (
        <View style={{ height: CONTROLS_HEIGHT, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, backgroundColor: "#0a0a18" }}>
          {/* D-pad — left side */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity style={styles.dpadBtn} onPressIn={() => setInput("left", true)} onPressOut={() => setInput("left", false)} activeOpacity={0.6}>
              <Text style={styles.dpadText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dpadBtn} onPressIn={() => setInput("right", true)} onPressOut={() => setInput("right", false)} activeOpacity={0.6}>
              <Text style={styles.dpadText}>▶</Text>
            </TouchableOpacity>
          </View>

          {/* Center — shop, mute, boosters */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {gs?.activeBooster === "slowmo" && gs.slowMoFrames <= 0 && (
              <TouchableOpacity style={styles.boosterBtn} onPress={() => { inputRef.current.activateSlowmo = true; }} activeOpacity={0.6}>
                <Text style={styles.boosterText}>🕐</Text>
              </TouchableOpacity>
            )}
            {gs?.activeBooster === "checkpoint" && !gs.checkpoint && (
              <TouchableOpacity style={styles.boosterBtn} onPress={() => { inputRef.current.placeCheckpoint = true; }} activeOpacity={0.6}>
                <Text style={styles.boosterText}>🚩</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={toggleSfx} activeOpacity={0.6} style={{ padding: 4 }}>
              <Text style={{ fontSize: 14 }}>{isSfxMuted ? "🔇" : "🔊"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleMusic} activeOpacity={0.6} style={{ padding: 4 }}>
              <Text style={{ fontSize: 14 }}>{isMusicMuted ? "🔇" : "🎵"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shopMiniBtn} onPress={() => { setStatus("shop"); if (gs) gs.status = "shop"; stopBGM(); }} activeOpacity={0.6}>
              <Text style={{ color: "#f1c40f", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" }}>🪙 SHOP</Text>
            </TouchableOpacity>
          </View>

          {/* Action buttons — right side */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={[styles.actionBtn, styles.dashBtnStyle]} onPressIn={() => setInput("dash", true)} onPressOut={() => setInput("dash", false)} activeOpacity={0.6}>
              <Text style={styles.actionText}>DASH</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.jumpBtnStyle]} onPressIn={() => setInput("jump", true)} onPressOut={() => setInput("jump", false)} activeOpacity={0.6}>
              <Text style={styles.actionText}>JUMP</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050510" },
  overlay: {
    ...StyleSheet.absoluteFillObject, zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center",
  },
  mountain: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 32, fontWeight: "bold", color: "#67c7d4", fontFamily: "monospace", letterSpacing: 6,
    textShadowColor: "rgba(100,200,255,0.4)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitle: { fontSize: 12, color: "#7f8fa6", fontFamily: "monospace", letterSpacing: 4, marginTop: 4, marginBottom: 20 },
  startBtn: { backgroundColor: "#0e7490", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 6 },
  startText: { color: "#fff", fontSize: 16, fontWeight: "bold", fontFamily: "monospace" },
  hint: { color: "#555", fontSize: 10, fontFamily: "monospace", marginTop: 16 },
  stat: { color: "#aaa", fontSize: 13, fontFamily: "monospace", marginTop: 4 },
  controls: {
    flexDirection: "column",
    justifyContent: "space-between", alignItems: "center",
    paddingVertical: 16,
  },
  dpad: { flexDirection: "row", gap: 8 },
  dpadBtn: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  dpadText: { color: "#aaa", fontSize: 22 },
  actionBtns: { flexDirection: "row", gap: 10 },
  actionBtn: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: "center", alignItems: "center", borderWidth: 2,
  },
  jumpBtnStyle: { backgroundColor: "rgba(103,199,212,0.15)", borderColor: "rgba(103,199,212,0.4)" },
  dashBtnStyle: { backgroundColor: "rgba(232,72,85,0.15)", borderColor: "rgba(232,72,85,0.4)" },
  actionText: { color: "#ccc", fontSize: 10, fontWeight: "bold", fontFamily: "monospace" },
  boosterBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(241,196,15,0.15)", borderWidth: 1, borderColor: "rgba(241,196,15,0.4)",
    justifyContent: "center", alignItems: "center",
  },
  boosterText: { fontSize: 18 },
  shopMiniBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4,
    backgroundColor: "rgba(241,196,15,0.1)", borderWidth: 1, borderColor: "rgba(241,196,15,0.2)",
  },
});
