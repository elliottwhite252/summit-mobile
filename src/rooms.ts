import { Room, GAME_W, GAME_H, TILE, PW, PH } from "./engine";

const W = GAME_W;
const H = GAME_H;
const T = TILE;

export function createRooms(): Room[] {
  return [
    // Room 0: Tutorial - basic movement
    {
      platforms: [
        { x: 0, y: H - T, w: W, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 200, y: 380, w: 100, h: T },
        { x: 400, y: 320, w: 100, h: T },
        { x: 580, y: 260, w: 120, h: T },
      ],
      spikes: [],
      strawberries: [
        { x: 250, y: 355, collected: false },
        { x: 640, y: 235, collected: false },
      ],
      springs: [],
      crumbles: [],
      spawn: { x: 50, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 1: Introduce spikes
    {
      platforms: [
        { x: 0, y: H - T, w: 200, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 300, y: H - T, w: 200, h: T },
        { x: 600, y: H - T, w: 200, h: T },
        { x: 150, y: 360, w: 80, h: T },
        { x: 420, y: 300, w: 80, h: T },
        { x: 650, y: 360, w: 80, h: T },
      ],
      spikes: [
        { x: 210, y: H - T, dir: "up" }, { x: 230, y: H - T, dir: "up" },
        { x: 250, y: H - T, dir: "up" }, { x: 270, y: H - T, dir: "up" },
        { x: 290, y: H - T, dir: "up" }, { x: 510, y: H - T, dir: "up" },
        { x: 530, y: H - T, dir: "up" }, { x: 550, y: H - T, dir: "up" },
        { x: 570, y: H - T, dir: "up" }, { x: 590, y: H - T, dir: "up" },
      ],
      strawberries: [{ x: 450, y: 270, collected: false }],
      springs: [],
      crumbles: [],
      spawn: { x: 40, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 2: Wall jumping
    {
      platforms: [
        { x: 0, y: H - T, w: W, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 180, y: 160, w: T, h: 340 },
        { x: 300, y: 100, w: T, h: 340 },
        { x: 300, y: 100, w: 200, h: T },
        { x: 550, y: 150, w: 100, h: T },
        { x: 650, y: H - 120, w: 130, h: T },
      ],
      spikes: [
        { x: 200, y: H - T, dir: "up" }, { x: 220, y: H - T, dir: "up" },
        { x: 240, y: H - T, dir: "up" }, { x: 260, y: H - T, dir: "up" },
        { x: 280, y: H - T, dir: "up" },
      ],
      strawberries: [
        { x: 240, y: 180, collected: false },
        { x: 700, y: H - 145, collected: false },
      ],
      springs: [],
      crumbles: [],
      spawn: { x: 50, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 3: Dash introduction
    {
      platforms: [
        { x: 0, y: H - T, w: 160, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 350, y: 350, w: 100, h: T },
        { x: 550, y: 250, w: 100, h: T },
        { x: 650, y: H - T, w: 150, h: T },
      ],
      spikes: Array.from({ length: 24 }, (_, i) => ({
        x: 170 + i * 20, y: H - T, dir: "up" as const,
      })),
      strawberries: [{ x: 590, y: 220, collected: false }],
      springs: [],
      crumbles: [],
      spawn: { x: 50, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 4: Springs
    {
      platforms: [
        { x: 0, y: H - T, w: 120, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 250, y: H - T, w: 80, h: T },
        { x: 500, y: 350, w: 80, h: T },
        { x: 300, y: 180, w: 100, h: T },
        { x: 600, y: H - T, w: 200, h: T },
      ],
      spikes: [
        ...Array.from({ length: 6 }, (_, i) => ({ x: 130 + i * 20, y: H - T, dir: "up" as const })),
        ...Array.from({ length: 13 }, (_, i) => ({ x: 340 + i * 20, y: H - T, dir: "up" as const })),
      ],
      strawberries: [{ x: 340, y: 150, collected: false }],
      springs: [
        { x: 275, y: H - T - 12, activated: 0 },
        { x: 525, y: 350 - 12, activated: 0 },
      ],
      crumbles: [],
      spawn: { x: 40, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 5: Crumbling platforms
    {
      platforms: [
        { x: 0, y: H - T, w: 100, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 680, y: H - T, w: 120, h: T },
      ],
      spikes: Array.from({ length: 29 }, (_, i) => ({
        x: 110 + i * 20, y: H - T, dir: "up" as const,
      })),
      strawberries: [{ x: 400, y: 300, collected: false }],
      springs: [],
      crumbles: [
        { x: 150, y: 400, w: 60, timer: 0, respawnTimer: 0, visible: true },
        { x: 280, y: 350, w: 60, timer: 0, respawnTimer: 0, visible: true },
        { x: 410, y: 330, w: 60, timer: 0, respawnTimer: 0, visible: true },
        { x: 530, y: 360, w: 60, timer: 0, respawnTimer: 0, visible: true },
        { x: 630, y: 300, w: 60, timer: 0, respawnTimer: 0, visible: true },
      ],
      spawn: { x: 40, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 6: Combining everything
    {
      platforms: [
        { x: 0, y: H - T, w: 100, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 200, y: 300, w: T, h: 200 },
        { x: 320, y: 200, w: T, h: 200 },
        { x: 400, y: 120, w: 200, h: T },
        { x: 650, y: 200, w: T, h: 80 },
        { x: 650, y: H - T, w: 150, h: T },
        { x: 650, y: 350, w: 130, h: T },
      ],
      spikes: [
        ...Array.from({ length: 5 }, (_, i) => ({ x: 110 + i * 20, y: H - T, dir: "up" as const })),
        ...Array.from({ length: 16 }, (_, i) => ({ x: 330 + i * 20, y: H - T, dir: "up" as const })),
        { x: 220, y: T, dir: "down" as const }, { x: 240, y: T, dir: "down" as const },
        { x: 260, y: T, dir: "down" as const }, { x: 280, y: T, dir: "down" as const },
        { x: 300, y: T, dir: "down" as const },
      ],
      strawberries: [
        { x: 260, y: 220, collected: false },
        { x: 500, y: 90, collected: false },
      ],
      springs: [{ x: 700, y: 350 - 12, activated: 0 }],
      crumbles: [],
      spawn: { x: 40, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
    // Room 7: Final challenge
    {
      platforms: [
        { x: 0, y: H - T, w: 80, h: T },
        { x: 0, y: 0, w: T, h: H },
        { x: W - T, y: 0, w: T, h: H },
        { x: 0, y: 0, w: W, h: T },
        { x: 160, y: 420, w: 40, h: T },
        { x: 280, y: 360, w: 40, h: T },
        { x: 380, y: 180, w: T, h: 200 },
        { x: 480, y: 120, w: T, h: 260 },
        { x: 550, y: 100, w: 230, h: T },
        { x: 550, y: 100, w: T, h: 400 },
        { x: 650, y: 300, w: 130, h: T },
      ],
      spikes: [
        ...Array.from({ length: 4 }, (_, i) => ({ x: 90 + i * 20, y: H - T, dir: "up" as const })),
        ...Array.from({ length: 4 }, (_, i) => ({ x: 210 + i * 20, y: H - T, dir: "up" as const })),
        ...Array.from({ length: 3 }, (_, i) => ({ x: 330 + i * 20, y: H - T, dir: "up" as const })),
        ...Array.from({ length: 3 }, (_, i) => ({ x: 500 + i * 20, y: H - T, dir: "up" as const })),
        { x: 380, y: 350, dir: "right" }, { x: 380, y: 330, dir: "right" },
        { x: 480, y: 200, dir: "left" }, { x: 480, y: 220, dir: "left" },
      ],
      strawberries: [
        { x: 430, y: 200, collected: false },
        { x: 700, y: 270, collected: false },
      ],
      springs: [{ x: 290, y: 360 - 12, activated: 0 }],
      crumbles: [
        { x: 160, y: 420, w: 40, timer: 0, respawnTimer: 0, visible: true },
      ],
      spawn: { x: 30, y: H - T - PH - 2 },
      exitX: W - T - PW - 2,
    },
  ];
}
