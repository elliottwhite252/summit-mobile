// ─── Constants ───────────────────────────────────────────────────────────────
export const GAME_W = 800;
export const GAME_H = 500;
export const TILE = 20;
export const GRAVITY = 0.55;
export const MAX_FALL = 8;
export const PLAYER_SPEED = 3.2;
export const JUMP_FORCE = -9.5;
export const JUMP_CUT = -3;
export const WALL_SLIDE_SPEED = 1.2;
export const WALL_JUMP_H = 5;
export const WALL_JUMP_V = -9;
export const DASH_SPEED = 10;
export const DASH_DURATION = 8;
export const DASH_COOLDOWN = 4;
export const COYOTE_FRAMES = 6;
export const JUMP_BUFFER_FRAMES = 6;
export const CRUMBLE_DELAY = 18;
export const CRUMBLE_RESPAWN = 180;
export const SPRING_FORCE = -13;
export const PW = 12;
export const PH = 16;
export const HAIR_COUNT = 5;
export const DEFAULT_HAIR = "#E84855";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface Rect { x: number; y: number; w: number; h: number }
export interface Spike { x: number; y: number; dir: "up" | "down" | "left" | "right" }
export interface Strawberry { x: number; y: number; collected: boolean }
export interface Spring { x: number; y: number; activated: number }
export interface CrumblePlatform {
  x: number; y: number; w: number;
  timer: number; respawnTimer: number; visible: boolean;
}
export interface Room {
  platforms: Rect[]; spikes: Spike[]; strawberries: Strawberry[];
  springs: Spring[]; crumbles: CrumblePlatform[];
  spawn: { x: number; y: number }; exitX: number;
}
export interface HairNode { x: number; y: number }
export interface Player {
  x: number; y: number; vx: number; vy: number;
  grounded: boolean; wallDir: number; facing: number;
  canDash: boolean; dashing: number; dashDir: { x: number; y: number }; dashCooldown: number;
  coyoteTimer: number; jumpBuffer: number; jumpHeld: boolean;
  dead: boolean; deadTimer: number;
  hair: HairNode[]; hairColor: string;
  dashCount: number;
}
export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; color: string; size: number;
}
export interface Snowflake {
  x: number; y: number; speed: number; drift: number; size: number;
}

// ─── Shop Types ──────────────────────────────────────────────────────────────
export type BoosterType = "checkpoint" | "slowmo" | "shield" | "doubleDash" | "springBoost";

export interface BoosterDef {
  id: BoosterType; name: string; cost: number; desc: string; icon: string;
}

export interface CosmeticDef {
  id: string; type: "hair" | "trail" | "deathEffect"; name: string; cost: number; color: string;
}

export const BOOSTERS: BoosterDef[] = [
  { id: "checkpoint", name: "Checkpoint", cost: 5, desc: "Place a mid-room respawn", icon: "🚩" },
  { id: "slowmo", name: "Slow-Mo", cost: 3, desc: "50% speed for 5 sec", icon: "🕐" },
  { id: "shield", name: "Air Shield", cost: 8, desc: "Survive one spike hit", icon: "🛡️" },
  { id: "doubleDash", name: "Double Dash", cost: 10, desc: "Two air dashes", icon: "💨" },
  { id: "springBoost", name: "Spring+", cost: 3, desc: "Springs launch higher", icon: "🚀" },
];

export const COSMETICS: CosmeticDef[] = [
  { id: "hair_blue", type: "hair", name: "Blue Hair", cost: 10, color: "#3498db" },
  { id: "hair_purple", type: "hair", name: "Purple Hair", cost: 10, color: "#9b59b6" },
  { id: "hair_gold", type: "hair", name: "Gold Hair", cost: 10, color: "#f1c40f" },
  { id: "hair_green", type: "hair", name: "Green Hair", cost: 10, color: "#2ecc71" },
  { id: "hair_white", type: "hair", name: "White Hair", cost: 10, color: "#ecf0f1" },
  { id: "trail_fire", type: "trail", name: "Fire Trail", cost: 20, color: "#e67e22" },
  { id: "trail_ice", type: "trail", name: "Ice Trail", cost: 20, color: "#74b9ff" },
  { id: "trail_rainbow", type: "trail", name: "Rainbow Trail", cost: 20, color: "#fd79a8" },
  { id: "trail_stars", type: "trail", name: "Star Trail", cost: 20, color: "#ffeaa7" },
  { id: "death_explode", type: "deathEffect", name: "Explosion", cost: 15, color: "#e74c3c" },
  { id: "death_dissolve", type: "deathEffect", name: "Dissolve", cost: 15, color: "#a29bfe" },
  { id: "death_shatter", type: "deathEffect", name: "Shatter", cost: 15, color: "#00cec9" },
  // Starter pack exclusive
  { id: "hair_aurora", type: "hair", name: "Aurora Hair ⭐", cost: 999, color: "#ff6b9d" },
  { id: "trail_aurora", type: "trail", name: "Aurora Trail ⭐", cost: 999, color: "#c44dff" },
];

// ─── Input ───────────────────────────────────────────────────────────────────
export interface InputState {
  left: boolean; right: boolean; up: boolean; down: boolean;
  jump: boolean; jumpJustPressed: boolean; dash: boolean;
  activateSlowmo: boolean; placeCheckpoint: boolean;
}

// ─── GameState ───────────────────────────────────────────────────────────────
export interface GameState {
  player: Player;
  rooms: Room[];
  currentRoom: number;
  deaths: number;
  strawberriesCollected: number;
  totalStrawberries: number;
  particles: Particle[];
  snow: Snowflake[];
  status: "menu" | "playing" | "win" | "shop" | "offer";
  screenShake: number;
  time: number;
  // Economy
  coins: number;
  ownedCosmetics: Set<string>;
  equippedHair: string;
  equippedTrail: string;
  equippedDeathEffect: string;
  // Active boosters
  activeBooster: BoosterType | null;
  shieldActive: boolean;
  doubleDashActive: boolean;
  checkpoint: { x: number; y: number } | null;
  slowMoFrames: number;
  springBoostActive: boolean;
  starterPackBought: boolean;
  roomDeaths: number;
  offerBooster: BoosterType | null;
}

export type SfxCallback = (type: string) => void;

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function spikeHitbox(s: Spike): Rect {
  const sz = 8;
  switch (s.dir) {
    case "up": return { x: s.x + 4, y: s.y - sz, w: 12, h: sz };
    case "down": return { x: s.x + 4, y: s.y, w: 12, h: sz };
    case "left": return { x: s.x - sz, y: s.y + 4, w: sz, h: 12 };
    case "right": return { x: s.x + TILE, y: s.y + 4, w: sz, h: 12 };
  }
}

export function createSnow(): Snowflake[] {
  const flakes: Snowflake[] = [];
  for (let i = 0; i < 80; i++) {
    flakes.push({ x: Math.random() * GAME_W, y: Math.random() * GAME_H, speed: 0.3 + Math.random() * 0.8, drift: Math.random() * 0.5 - 0.25, size: 1 + Math.random() * 2 });
  }
  return flakes;
}

export function getHairColor(gs: GameState): string {
  if (gs.equippedHair) {
    const c = COSMETICS.find(c => c.id === gs.equippedHair);
    if (c) return c.color;
  }
  return DEFAULT_HAIR;
}

export function getTrailColor(gs: GameState): string {
  if (gs.equippedTrail) {
    const c = COSMETICS.find(c => c.id === gs.equippedTrail);
    if (c) return c.color;
  }
  return "#7ec8e3";
}

export function getDeathColors(gs: GameState): string[] {
  if (gs.equippedDeathEffect) {
    const c = COSMETICS.find(c => c.id === gs.equippedDeathEffect);
    if (c) return [c.color, "#fff"];
  }
  return [DEFAULT_HAIR, "#fff"];
}

export function createPlayer(spawn: { x: number; y: number }, hairColor: string = DEFAULT_HAIR): Player {
  const hair: HairNode[] = [];
  for (let i = 0; i < HAIR_COUNT; i++) hair.push({ x: spawn.x + PW / 2, y: spawn.y });
  return {
    x: spawn.x, y: spawn.y, vx: 0, vy: 0,
    grounded: false, wallDir: 0, facing: 1,
    canDash: true, dashing: 0, dashDir: { x: 0, y: 0 }, dashCooldown: 0,
    coyoteTimer: 0, jumpBuffer: 0, jumpHeld: false,
    dead: false, deadTimer: 0,
    hair, hairColor, dashCount: 0,
  };
}

function spawnParticles(gs: GameState, x: number, y: number, color: string, count: number, spread = 4) {
  for (let i = 0; i < count; i++) gs.particles.push({ x, y, vx: (Math.random() - 0.5) * spread, vy: (Math.random() - 0.5) * spread - 1, life: 1, color, size: 1 + Math.random() * 3 });
}

function killPlayer(gs: GameState, sfx: SfxCallback) {
  // Shield check
  if (gs.shieldActive) {
    gs.shieldActive = false;
    gs.activeBooster = null;
    sfx("shield");
    spawnParticles(gs, gs.player.x + PW / 2, gs.player.y + PH / 2, "#f1c40f", 15, 6);
    gs.player.vy = JUMP_FORCE * 0.5;
    gs.screenShake = 4;
    return;
  }
  const p = gs.player;
  p.dead = true; p.deadTimer = 20;
  gs.deaths++; gs.roomDeaths++; gs.screenShake = 8;
  sfx("death");
  const colors = getDeathColors(gs);
  spawnParticles(gs, p.x + PW / 2, p.y + PH / 2, colors[0], 20, 8);
  spawnParticles(gs, p.x + PW / 2, p.y + PH / 2, colors[1], 10, 6);

  // Death-triggered offer
  if (gs.roomDeaths % 3 === 0 && !gs.activeBooster && gs.coins >= 3) {
    gs.offerBooster = gs.roomDeaths >= 6 ? "doubleDash" : "shield";
    p.deadTimer = 25;
  }
}

function respawnPlayer(gs: GameState) {
  const room = gs.rooms[gs.currentRoom];
  const spawnPt = gs.checkpoint || room.spawn;
  gs.player = createPlayer(spawnPt, getHairColor(gs));
  if (gs.checkpoint) { gs.checkpoint = null; gs.activeBooster = null; }
  for (const c of room.crumbles) { c.timer = 0; c.respawnTimer = 0; c.visible = true; }
  for (const s of room.springs) { s.activated = 0; }
}

function enterRoom(gs: GameState, roomIdx: number) {
  gs.currentRoom = roomIdx;
  gs.player = createPlayer(gs.rooms[roomIdx].spawn, getHairColor(gs));
  gs.checkpoint = null;
  gs.doubleDashActive = false;
  gs.springBoostActive = false;
  gs.slowMoFrames = 0;
  gs.roomDeaths = 0;
  gs.offerBooster = null;
}

// ─── Main Update ─────────────────────────────────────────────────────────────
export function updateGame(gs: GameState, input: InputState, sfx: SfxCallback): void {
  if (gs.status !== "playing") return;

  const slowMo = gs.slowMoFrames > 0 ? 0.5 : 1;
  gs.time++;
  const p = gs.player;
  const room = gs.rooms[gs.currentRoom];

  // Snow
  for (const s of gs.snow) { s.y += s.speed; s.x += s.drift + Math.sin(gs.time * 0.01 + s.x) * 0.2; if (s.y > GAME_H) { s.y = -5; s.x = Math.random() * GAME_W; } if (s.x > GAME_W) s.x = 0; if (s.x < 0) s.x = GAME_W; }
  if (gs.screenShake > 0) gs.screenShake -= 0.5;
  if (gs.slowMoFrames > 0) gs.slowMoFrames--;

  // Death timer
  if (p.dead) {
    p.deadTimer--;
    if (p.deadTimer <= 0) {
      respawnPlayer(gs);
      if (gs.offerBooster) {
        gs.status = "offer";
        return;
      }
    }
    gs.particles = gs.particles.filter(part => { part.x += part.vx; part.y += part.vy; part.vy += 0.1; part.life -= 0.04; return part.life > 0; });
    return;
  }

  // Activate boosters
  if (input.activateSlowmo && gs.activeBooster === "slowmo" && gs.slowMoFrames <= 0) {
    gs.slowMoFrames = 300; gs.activeBooster = null; sfx("buy");
  }
  if (input.placeCheckpoint && gs.activeBooster === "checkpoint" && !gs.checkpoint) {
    gs.checkpoint = { x: p.x, y: p.y }; sfx("buy");
  }

  // Horizontal
  if (p.dashing <= 0) {
    if (input.left) { p.vx = -PLAYER_SPEED * slowMo; p.facing = -1; }
    else if (input.right) { p.vx = PLAYER_SPEED * slowMo; p.facing = 1; }
    else { p.vx *= 0.65; }
  }

  // Coyote & jump buffer
  if (p.grounded) p.coyoteTimer = COYOTE_FRAMES; else p.coyoteTimer = Math.max(0, p.coyoteTimer - 1);
  if (input.jumpJustPressed) p.jumpBuffer = JUMP_BUFFER_FRAMES; else p.jumpBuffer = Math.max(0, p.jumpBuffer - 1);

  // Jump
  if (p.dashing <= 0) {
    if (p.jumpBuffer > 0 && p.coyoteTimer > 0) {
      p.vy = JUMP_FORCE * slowMo; p.grounded = false; p.coyoteTimer = 0; p.jumpBuffer = 0; p.jumpHeld = true;
      sfx("jump"); spawnParticles(gs, p.x + PW / 2, p.y + PH, "rgba(255,255,255,0.5)", 4);
    } else if (p.jumpBuffer > 0 && p.wallDir !== 0) {
      p.vx = -p.wallDir * WALL_JUMP_H; p.vy = WALL_JUMP_V * slowMo; p.facing = -p.wallDir; p.wallDir = 0; p.jumpBuffer = 0; p.jumpHeld = true; p.canDash = true; p.dashCount = 0;
      sfx("walljump"); spawnParticles(gs, p.x + (p.facing < 0 ? PW : 0), p.y + PH / 2, "rgba(255,255,255,0.5)", 5);
    }
    if (!input.jump && p.vy < JUMP_CUT && p.jumpHeld) { p.vy = JUMP_CUT; p.jumpHeld = false; }
  }

  // Dash
  const maxDashes = gs.doubleDashActive ? 2 : 1;
  if (input.dash && p.dashCount < maxDashes && p.dashing <= 0 && p.dashCooldown <= 0) {
    let dx = input.right ? 1 : input.left ? -1 : 0;
    let dy = input.up ? -1 : input.down ? 1 : 0;
    if (dx === 0 && dy === 0) dx = p.facing;
    const len = Math.sqrt(dx * dx + dy * dy);
    p.dashDir = { x: dx / len, y: dy / len };
    p.dashing = DASH_DURATION; p.dashCount++; p.dashCooldown = DASH_COOLDOWN;
    const trailColor = getTrailColor(gs);
    p.hairColor = trailColor;
    gs.screenShake = 3;
    sfx("dash"); spawnParticles(gs, p.x + PW / 2, p.y + PH / 2, trailColor, 8, 3);
  }

  if (p.dashing > 0) {
    p.vx = p.dashDir.x * DASH_SPEED * slowMo; p.vy = p.dashDir.y * DASH_SPEED * slowMo; p.dashing--;
    if (gs.time % 2 === 0) gs.particles.push({ x: p.x + PW / 2, y: p.y + PH / 2, vx: 0, vy: 0, life: 0.6, color: p.hairColor, size: 4 });
  } else { p.dashCooldown = Math.max(0, p.dashCooldown - 1); }

  // Gravity
  if (p.dashing <= 0) {
    if (p.wallDir !== 0 && p.vy > 0) p.vy = Math.min(p.vy + GRAVITY * 0.4 * slowMo, WALL_SLIDE_SPEED);
    else p.vy = Math.min(p.vy + GRAVITY * slowMo, MAX_FALL);
  }

  // Collisions
  p.x += p.vx;
  const allSolids = [...room.platforms];
  for (const c of room.crumbles) { if (c.visible) allSolids.push({ x: c.x, y: c.y, w: c.w, h: TILE }); }
  for (const plat of allSolids) { if (rectsOverlap({ x: p.x, y: p.y, w: PW, h: PH }, plat)) { if (p.vx > 0) p.x = plat.x - PW; else if (p.vx < 0) p.x = plat.x + plat.w; p.vx = 0; } }

  p.y += p.vy; p.grounded = false;
  for (const plat of allSolids) {
    if (rectsOverlap({ x: p.x, y: p.y, w: PW, h: PH }, plat)) {
      if (p.vy > 0) {
        p.y = plat.y - PH; p.grounded = true; p.canDash = true; p.dashCount = 0;
        p.hairColor = getHairColor(gs);
        if (p.vy > 4) { spawnParticles(gs, p.x + PW / 2, p.y + PH, "rgba(255,255,255,0.4)", 3); sfx("land"); }
      } else if (p.vy < 0) { p.y = plat.y + plat.h; }
      p.vy = 0;
    }
  }

  // Walls
  p.wallDir = 0;
  if (!p.grounded) {
    for (const plat of allSolids) {
      if (rectsOverlap({ x: p.x - 2, y: p.y + 2, w: 2, h: PH - 4 }, plat) && input.left) p.wallDir = -1;
      if (rectsOverlap({ x: p.x + PW, y: p.y + 2, w: 2, h: PH - 4 }, plat) && input.right) p.wallDir = 1;
    }
  }

  // Crumbles
  for (const c of room.crumbles) {
    if (!c.visible) { c.respawnTimer--; if (c.respawnTimer <= 0) { c.visible = true; c.timer = 0; } continue; }
    if (p.grounded && p.x + PW > c.x && p.x < c.x + c.w && Math.abs(p.y + PH - c.y) < 2) { if (c.timer === 0) c.timer = CRUMBLE_DELAY; }
    if (c.timer > 0) { c.timer--; if (c.timer <= 0) { c.visible = false; c.respawnTimer = CRUMBLE_RESPAWN; sfx("crumble"); spawnParticles(gs, c.x + c.w / 2, c.y + TILE / 2, "#4a3a2a", 8, 4); } }
  }

  // Springs
  const springMult = gs.springBoostActive ? 1.5 : 1;
  for (const s of room.springs) {
    if (s.activated > 0) s.activated--;
    if (rectsOverlap({ x: p.x, y: p.y, w: PW, h: PH }, { x: s.x - 6, y: s.y - 4, w: 32, h: 16 }) && p.vy >= 0) {
      p.vy = SPRING_FORCE * springMult; p.grounded = false; p.canDash = true; p.dashCount = 0; p.hairColor = getHairColor(gs);
      s.activated = 15; sfx("spring"); spawnParticles(gs, s.x + 10, s.y, "#f1c40f", 6, 5);
    }
  }

  // Spikes
  for (const s of room.spikes) {
    if (rectsOverlap({ x: p.x + 2, y: p.y + 2, w: PW - 4, h: PH - 4 }, spikeHitbox(s))) {
      killPlayer(gs, sfx); return;
    }
  }

  // Strawberries
  for (const s of room.strawberries) {
    if (s.collected) continue;
    const dx = (p.x + PW / 2) - s.x, dy = (p.y + PH / 2) - s.y;
    if (Math.sqrt(dx * dx + dy * dy) < 16) {
      s.collected = true; gs.strawberriesCollected++;
      gs.coins += 2; sfx("strawberry"); sfx("coin");
      spawnParticles(gs, s.x, s.y, "#e84855", 10, 5);
      spawnParticles(gs, s.x, s.y, "#2ecc71", 5, 3);
    }
  }

  // Fall
  if (p.y > GAME_H + 20 || p.y < -40 || p.x < -20 || p.x > GAME_W + 20) { killPlayer(gs, sfx); return; }

  // Room transition
  if (p.x >= room.exitX && p.grounded) {
    gs.coins += 1; sfx("coin");
    if (gs.currentRoom < gs.rooms.length - 1) { enterRoom(gs, gs.currentRoom + 1); sfx("roomenter"); }
    else { gs.coins += 5; gs.status = "win"; sfx("win"); }
    return;
  }

  // Hair
  const headX = p.x + PW / 2, headY = p.y - 1;
  for (let i = 0; i < p.hair.length; i++) {
    const target = i === 0 ? { x: headX, y: headY } : p.hair[i - 1];
    p.hair[i].x += (target.x - p.hair[i].x) * 0.4; p.hair[i].y += (target.y - p.hair[i].y) * 0.4;
    p.hair[i].x -= p.facing * (i * 1.2); p.hair[i].y += i * 0.5;
  }

  // Particles
  gs.particles = gs.particles.filter(part => { part.x += part.vx; part.y += part.vy; part.vy += 0.08; part.life -= 0.03; return part.life > 0; });
}
