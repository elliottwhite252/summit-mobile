import React, { useRef, useCallback, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from "react-native";
import { Skia, SkPicture, SkCanvas } from "@shopify/react-native-skia";
import { SkiaPictureView } from "@shopify/react-native-skia";
import {
  GameState, InputState, GAME_W, GAME_H, TILE, PW, PH,
  createPlayer, createSnow, updateGame,
} from "./engine";
import { createRooms } from "./rooms";
import { playSfx, preloadSounds } from "./sound";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const CONTROLS_HEIGHT = 140;
const CANVAS_AREA_H = SCREEN_H - CONTROLS_HEIGHT;
const SCALE = Math.min(SCREEN_W / GAME_W, CANVAS_AREA_H / GAME_H);
const OFFSET_X = (SCREEN_W - GAME_W * SCALE) / 2;
const OFFSET_Y = (CANVAS_AREA_H - GAME_H * SCALE) / 2;

// ─── Render to SkPicture ─────────────────────────────────────────────────────
function renderToPicture(gs: GameState): SkPicture {
  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(
    Skia.XYWHRect(0, 0, SCREEN_W, CANVAS_AREA_H)
  );
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
    canvas.translate(
      (Math.random() - 0.5) * gs.screenShake,
      (Math.random() - 0.5) * gs.screenShake
    );
  }

  // Background
  paint.setColor(Skia.Color("#0a0a1e"));
  canvas.drawRect(Skia.XYWHRect(0, 0, GAME_W, GAME_H), paint);

  // Mountains
  const mountainPath = Skia.Path.Make();
  mountainPath.moveTo(0, GAME_H);
  for (let x = 0; x <= GAME_W; x += 40) {
    const h = 150 + Math.sin((x + gs.currentRoom * 200) * 0.008) * 80 +
      Math.sin((x + gs.currentRoom * 100) * 0.02) * 30;
    mountainPath.lineTo(x, GAME_H - h);
  }
  mountainPath.lineTo(GAME_W, GAME_H);
  mountainPath.close();
  paint.setColor(Skia.Color("rgba(20,20,50,0.6)"));
  canvas.drawPath(mountainPath, paint);

  // Snow
  paint.setColor(Skia.Color("rgba(255,255,255,0.6)"));
  for (const s of gs.snow) {
    canvas.drawRect(Skia.XYWHRect(s.x, s.y, s.size, s.size), paint);
  }

  // Platforms
  for (const p of room.platforms) {
    paint.setColor(Skia.Color("#2d3a4a"));
    canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.w, p.h), paint);
    paint.setColor(Skia.Color("#3d4e63"));
    canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.w, 2), paint);
  }

  // Crumbles
  for (const c of room.crumbles) {
    if (!c.visible) continue;
    const shaking = c.timer > 0;
    const ox = shaking ? Math.sin(time * 0.8) * 2 : 0;
    paint.setColor(Skia.Color(shaking ? "#5a4a3a" : "#4a3a2a"));
    canvas.drawRect(Skia.XYWHRect(c.x + ox, c.y, c.w, TILE), paint);
  }

  // Spikes
  paint.setColor(Skia.Color("#c0392b"));
  for (const s of room.spikes) {
    const path = Skia.Path.Make();
    switch (s.dir) {
      case "up":
        path.moveTo(s.x, s.y); path.lineTo(s.x + 10, s.y - 10); path.lineTo(s.x + 20, s.y);
        break;
      case "down":
        path.moveTo(s.x, s.y + TILE); path.lineTo(s.x + 10, s.y + TILE + 10); path.lineTo(s.x + 20, s.y + TILE);
        break;
      case "left":
        path.moveTo(s.x, s.y); path.lineTo(s.x - 10, s.y + 10); path.lineTo(s.x, s.y + 20);
        break;
      case "right":
        path.moveTo(s.x + TILE, s.y); path.lineTo(s.x + TILE + 10, s.y + 10); path.lineTo(s.x + TILE, s.y + 20);
        break;
    }
    path.close();
    canvas.drawPath(path, paint);
  }

  // Strawberries
  for (const s of room.strawberries) {
    if (s.collected) continue;
    const bob = Math.sin(time * 0.06) * 3;
    paint.setColor(Skia.Color("rgba(232,72,85,0.15)"));
    canvas.drawCircle(s.x, s.y + bob, 12, paint);
    paint.setColor(Skia.Color("#e84855"));
    canvas.drawCircle(s.x, s.y + bob, 6, paint);
    const leafPath = Skia.Path.Make();
    leafPath.moveTo(s.x, s.y + bob - 6);
    leafPath.lineTo(s.x - 4, s.y + bob - 10);
    leafPath.lineTo(s.x + 4, s.y + bob - 10);
    leafPath.close();
    paint.setColor(Skia.Color("#2ecc71"));
    canvas.drawPath(leafPath, paint);
  }

  // Springs
  for (const s of room.springs) {
    const compressed = s.activated > 0;
    const baseY = compressed ? s.y + 6 : s.y;
    paint.setColor(Skia.Color("#7f8c8d"));
    canvas.drawRect(Skia.XYWHRect(s.x - 8, s.y + 8, 36, 4), paint);
    paint.setColor(Skia.Color("#f39c12"));
    canvas.drawRect(Skia.XYWHRect(s.x - 6, baseY - 2, 32, 4), paint);
  }

  // Particles
  for (const p of gs.particles) {
    if (p.life <= 0) continue;
    paint.setColor(Skia.Color(p.color));
    paint.setAlphaf(Math.max(0, p.life));
    canvas.drawRect(Skia.XYWHRect(p.x, p.y, p.size, p.size), paint);
  }
  paint.setAlphaf(1);

  // Player
  const pl = gs.player;
  if (!pl.dead) {
    for (let i = pl.hair.length - 1; i >= 0; i--) {
      const h = pl.hair[i];
      const sz = 6 - i * 0.6;
      paint.setColor(Skia.Color(pl.hairColor));
      paint.setAlphaf(1 - i * 0.15);
      canvas.drawCircle(h.x, h.y, sz, paint);
    }
    paint.setAlphaf(1);

    paint.setColor(Skia.Color("#4a6fa5"));
    canvas.drawRect(Skia.XYWHRect(pl.x, pl.y, PW, PH), paint);
    paint.setColor(Skia.Color("#ffd6ba"));
    canvas.drawRect(Skia.XYWHRect(pl.x + 1, pl.y + 1, PW - 2, 7), paint);
    paint.setColor(Skia.Color("#1a1a2e"));
    const eyeX = pl.facing > 0 ? pl.x + PW / 2 + 1 : pl.x + PW / 2 - 3;
    canvas.drawRect(Skia.XYWHRect(eyeX, pl.y + 3, 2, 2), paint);
    paint.setColor(Skia.Color(pl.hairColor));
    canvas.drawRect(Skia.XYWHRect(pl.x - 1, pl.y - 2, PW + 2, 4), paint);
  }

  // HUD
  paint.setColor(Skia.Color("rgba(0,0,0,0.4)"));
  canvas.drawRect(Skia.XYWHRect(8, 8, 100, 24), paint);
  canvas.drawRect(Skia.XYWHRect(8, 36, 100, 24), paint);
  canvas.drawRect(Skia.XYWHRect(GAME_W - 98, 8, 90, 24), paint);

  const font = Skia.Font(undefined, 13);
  paint.setColor(Skia.Color("#c0392b"));
  canvas.drawText(`Deaths: ${gs.deaths}`, 14, 25, paint, font);
  paint.setColor(Skia.Color("#e84855"));
  canvas.drawText(`${gs.strawberriesCollected}/${gs.totalStrawberries}`, 14, 53, paint, font);
  paint.setColor(Skia.Color("#7f8fa6"));
  canvas.drawText(`${gs.currentRoom + 1}/${gs.rooms.length}`, GAME_W - 78, 25, paint, font);

  canvas.restore();
}

// ─── Main Game Component ─────────────────────────────────────────────────────
export default function Game() {
  const gsRef = useRef<GameState | null>(null);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false,
    jump: false, jumpJustPressed: false, dash: false,
  });
  const animRef = useRef<number>(0);
  const [status, setStatus] = useState<"menu" | "playing" | "win">("menu");
  const [picture, setPicture] = useState<SkPicture | null>(null);

  useEffect(() => {
    preloadSounds();
  }, []);

  const sfxCallback = useCallback((type: string) => {
    playSfx(type);
  }, []);

  const initGame = useCallback(() => {
    const rooms = createRooms();
    let total = 0;
    for (const r of rooms) total += r.strawberries.length;
    gsRef.current = {
      player: createPlayer(rooms[0].spawn),
      rooms,
      currentRoom: 0,
      deaths: 0,
      strawberriesCollected: 0,
      totalStrawberries: total,
      particles: [],
      snow: createSnow(),
      status: "playing",
      screenShake: 0,
      time: 0,
    };
    setStatus("playing");
  }, []);

  const gameLoop = useCallback(() => {
    const gs = gsRef.current;
    if (!gs || gs.status !== "playing") return;

    const input = { ...inputRef.current };
    inputRef.current.jumpJustPressed = false;
    inputRef.current.dash = false;

    updateGame(gs, input, sfxCallback);

    if ((gs.status as string) === "win") {
      setStatus("win");
    }

    setPicture(renderToPicture(gs));
    animRef.current = requestAnimationFrame(gameLoop);
  }, [sfxCallback]);

  useEffect(() => {
    if (status === "playing") {
      animRef.current = requestAnimationFrame(gameLoop);
      return () => cancelAnimationFrame(animRef.current);
    }
  }, [status, gameLoop]);

  const setInput = (key: keyof InputState, value: boolean) => {
    inputRef.current[key] = value;
    if (key === "jump" && value) inputRef.current.jumpJustPressed = true;
    if (key === "dash" && value) inputRef.current.dash = true;
  };

  return (
    <View style={styles.container}>
      {status === "menu" && (
        <View style={styles.overlay}>
          <Text style={styles.mountain}>🏔️</Text>
          <Text style={styles.title}>SUMMIT</Text>
          <Text style={styles.subtitle}>REACH THE TOP</Text>
          <TouchableOpacity style={styles.startBtn} onPress={initGame} activeOpacity={0.7}>
            <Text style={styles.startText}>CLIMB</Text>
          </TouchableOpacity>
          <Text style={styles.hint}>Use the controls below to move, jump, and dash</Text>
        </View>
      )}

      {status === "win" && (
        <View style={styles.overlay}>
          <Text style={styles.mountain}>⛰️</Text>
          <Text style={styles.title}>SUMMIT REACHED</Text>
          <Text style={styles.stat}>Deaths: {gsRef.current?.deaths || 0}</Text>
          <Text style={styles.stat}>
            Strawberries: {gsRef.current?.strawberriesCollected || 0}/{gsRef.current?.totalStrawberries || 0}
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={initGame} activeOpacity={0.7}>
            <Text style={styles.startText}>CLIMB AGAIN</Text>
          </TouchableOpacity>
        </View>
      )}

      <SkiaPictureView
        style={{ width: SCREEN_W, height: CANVAS_AREA_H }}
        picture={picture ?? undefined}
      />

      {status === "playing" && (
        <View style={styles.controls}>
          <View style={styles.dpad}>
            <TouchableOpacity
              style={styles.dpadBtn}
              onPressIn={() => setInput("left", true)}
              onPressOut={() => setInput("left", false)}
              activeOpacity={0.6}
            >
              <Text style={styles.dpadText}>◀</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dpadBtn}
              onPressIn={() => setInput("right", true)}
              onPressOut={() => setInput("right", false)}
              activeOpacity={0.6}
            >
              <Text style={styles.dpadText}>▶</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.dashBtnStyle]}
              onPressIn={() => setInput("dash", true)}
              onPressOut={() => setInput("dash", false)}
              activeOpacity={0.6}
            >
              <Text style={styles.actionText}>DASH</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.jumpBtnStyle]}
              onPressIn={() => setInput("jump", true)}
              onPressOut={() => setInput("jump", false)}
              activeOpacity={0.6}
            >
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
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  mountain: { fontSize: 48, marginBottom: 8 },
  title: {
    fontSize: 36, fontWeight: "bold", color: "#67c7d4",
    fontFamily: "monospace", letterSpacing: 6,
    textShadowColor: "rgba(100,200,255,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 12, color: "#7f8fa6", fontFamily: "monospace",
    letterSpacing: 4, marginTop: 4, marginBottom: 24,
  },
  startBtn: {
    backgroundColor: "#0e7490", paddingHorizontal: 32,
    paddingVertical: 14, borderRadius: 6,
  },
  startText: { color: "#fff", fontSize: 18, fontWeight: "bold", fontFamily: "monospace" },
  hint: { color: "#555", fontSize: 11, fontFamily: "monospace", marginTop: 20 },
  stat: { color: "#aaa", fontSize: 14, fontFamily: "monospace", marginTop: 6 },
  controls: {
    height: CONTROLS_HEIGHT, flexDirection: "row",
    justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, backgroundColor: "#0a0a18",
  },
  dpad: { flexDirection: "row", gap: 12 },
  dpadBtn: {
    width: 64, height: 64, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  dpadText: { color: "#aaa", fontSize: 24 },
  actionBtns: { flexDirection: "row", gap: 12 },
  actionBtn: {
    width: 72, height: 72, borderRadius: 36,
    justifyContent: "center", alignItems: "center", borderWidth: 2,
  },
  jumpBtnStyle: {
    backgroundColor: "rgba(103,199,212,0.15)",
    borderColor: "rgba(103,199,212,0.4)",
  },
  dashBtnStyle: {
    backgroundColor: "rgba(232,72,85,0.15)",
    borderColor: "rgba(232,72,85,0.4)",
  },
  actionText: { color: "#ccc", fontSize: 11, fontWeight: "bold", fontFamily: "monospace" },
});
