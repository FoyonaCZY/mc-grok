import { BLOCKS, ITEMS } from "../world/blocks.js";
import { faceTile } from "../world/textures.js";

const cache = new Map();

export function isSpriteItem(id) {
  const it = ITEMS[id];
  if (!it?.isBlock) return true;
  const b = BLOCKS[it.blockId];
  return !!(b?.plant || b?.fluid || (b && b.solid === false));
}

export function itemIcon(textures, id, size = 48) {
  const key = id + ":" + size;
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const it = ITEMS[id];
  if (it?.isBlock && !isSpriteItem(id)) {
    const b = BLOCKS[it.blockId];
    const top = tile(textures, faceTile(b, "top") || b.key);
    const side = tile(textures, faceTile(b, "side") || faceTile(b, "west") || b.key);
    const front = tile(textures, faceTile(b, "front") || faceTile(b, "south") || b.key);
    drawIso(g, top, side, front, size);
  } else if (it?.isBlock && isSpriteItem(id)) {
    const b = BLOCKS[it.blockId];
    const src = tile(textures, b.key);
    g.drawImage(src, 0, 0, 16, 16, 0, 0, size, size);
  } else if (textures.itemIcons[id]) {
    g.drawImage(textures.itemIcons[id], 0, 0, size, size);
  } else {
    g.fillStyle = "#f0f";
    g.fillRect(0, 0, size, size);
  }
  cache.set(key, c);
  return c;
}

function tile(textures, name) {
  const idx = textures.tileIndex[name] ?? textures.tileIndex.stone;
  return textures.tiles[idx];
}

function drawIso(ctx, top, left, right, s) {
  ctx.save();
  ctx.transform(1, 0.5, -1, 0.5, s * 0.5, s * 0.1);
  ctx.drawImage(top, 0, 0, 16, 16, -s * 0.26, -s * 0.26, s * 0.52, s * 0.52);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.transform(1, 0.5, 0, 1, s * 0.1, s * 0.36);
  ctx.drawImage(left, 0, 0, 16, 16, 0, 0, s * 0.4, s * 0.46);
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.68;
  ctx.transform(1, -0.5, 0, 1, s * 0.5, s * 0.56);
  ctx.drawImage(right, 0, 0, 16, 16, 0, 0, s * 0.4, s * 0.46);
  ctx.restore();
}

export function pixelIcon(kind) {
  const c = document.createElement("canvas");
  c.width = 9;
  c.height = 9;
  const g = c.getContext("2d");
  const p = (x, y, col) => {
    g.fillStyle = col;
    g.fillRect(x, y, 1, 1);
  };
  if (kind === "heart" || kind === "heart_half" || kind === "heart_empty") {
    const fill = kind === "heart_empty" ? null : "#ff0000";
    const dark = "#3f0000";
    const outline = [
      [1, 1], [2, 1], [3, 1], [5, 1], [6, 1], [7, 1],
      [0, 2], [4, 2], [8, 2],
      [0, 3], [8, 3],
      [0, 4], [8, 4],
      [1, 5], [7, 5],
      [2, 6], [6, 6],
      [3, 7], [5, 7],
      [4, 8],
    ];
    const body = [
      [1, 2], [2, 2], [3, 2], [5, 2], [6, 2], [7, 2],
      [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3],
      [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
      [2, 5], [3, 5], [4, 5], [5, 5], [6, 5],
      [3, 6], [4, 6], [5, 6],
      [4, 7],
    ];
    if (fill) {
      for (const [x, y] of body) {
        if (kind === "heart_half" && x >= 5) continue;
        p(x, y, x + y < 6 ? "#ff5555" : fill);
      }
    } else {
      for (const [x, y] of body) p(x, y, "#000");
    }
    for (const [x, y] of outline) p(x, y, kind === "heart_empty" ? "#3f3f3f" : dark);
    p(2, 2, "#ffaaaa");
  } else if (kind.startsWith("food")) {
    const full = kind !== "food_empty";
    const half = kind === "food_half";
    const col = full ? "#d45a20" : "#3f3f3f";
    for (let x = 1; x < 8; x++) p(x, 4, col);
    p(2, 3, col); p(3, 2, col); p(4, 1, col); p(5, 2, col); p(6, 3, col);
    p(2, 5, col); p(3, 6, col); p(4, 7, col); p(5, 6, col); p(6, 5, col);
    if (half) {
      for (let y = 0; y < 9; y++) {
        for (let x = 5; x < 9; x++) {
          const i = (y * 9 + x) * 4;
          /* clear right half */
        }
      }
      g.clearRect(5, 0, 4, 9);
    }
    p(4, 3, "#f0c070");
  } else if (kind === "armor") {
    g.fillStyle = "#cccccc";
    g.fillRect(2, 1, 5, 3);
    g.fillRect(1, 4, 7, 4);
    g.fillStyle = "#888";
    g.fillRect(3, 5, 3, 3);
  }
  return c;
}

export function drawCrosshair() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d");
  g.fillStyle = "rgba(255,255,255,0.9)";
  g.fillRect(7, 0, 2, 16);
  g.fillRect(0, 7, 16, 2);
  g.globalCompositeOperation = "difference";
  return c;
}

export function drawHotbarSel() {
  const c = document.createElement("canvas");
  c.width = 24;
  c.height = 24;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 24, 2);
  g.fillRect(0, 22, 24, 2);
  g.fillRect(0, 0, 2, 24);
  g.fillRect(22, 0, 2, 24);
  g.fillStyle = "#404040";
  g.fillRect(2, 2, 20, 1);
  g.fillRect(2, 21, 20, 1);
  g.fillRect(2, 2, 1, 20);
  g.fillRect(21, 2, 1, 20);
  return c;
}

export function drawLogo() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 220;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const text = "MINECRAFTS";
  g.font = "bold 92px 'Fusion Pixel', Impact, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const x = 512, y = 118;
  for (let i = 8; i >= 1; i--) {
    g.fillStyle = `rgb(${90 - i * 4},${50 - i * 2},0)`;
    g.fillText(text, x + i, y + i * 1.4);
  }
  const grd = g.createLinearGradient(0, 50, 0, 180);
  grd.addColorStop(0, "#fff4a0");
  grd.addColorStop(0.45, "#ffd43a");
  grd.addColorStop(1, "#c47a12");
  g.fillStyle = grd;
  g.fillText(text, x, y);
  g.strokeStyle = "#5a3208";
  g.lineWidth = 3;
  g.strokeText(text, x, y);
  return c.toDataURL();
}

export const SPLASHES = [
  "Also try Minecraft!",
  "100% 方块！",
  "As seen on the web!",
  "纯前端驱动！",
  "Don't mine at night!",
  "Creeper?",
  "Aw man!",
  "无限的世界！",
  "Technically a voxel engine!",
  "Wasd 走起！",
  "It's a game!",
  " splashes.txt",
  "Open source vibes!",
  "Best played with friends!",
  "含有微量红石！",
  "Do not drop your diamonds!",
  "Punch a tree!",
  "先做木镐！",
  "Survival is optional!",
  "Craft, mine, repeat!",
  "Now with more dirt!",
  "河马喜欢西瓜！",
  "A long time ago...",
  "It's not a bug, it's a feature!",
  "Pixelated dreams!",
  "支持中文！",
  "Press F3!",
  "Water is wet!",
  "Lava is hot!",
  "Bring a bucket!",
  "Never dig straight down!",
  "不要直着往下挖！",
  "Seeds are fun!",
  "Home by sunset!",
  "Wow!",
  "Mmmph!",
  "So we back in the mine!",
  "Take it slow!",
  "Made of JavaScript!",
  "No JVM required!",
  "Browser powered!",
  "Almost vanilla!",
];

export function randomSplash() {
  return SPLASHES[(Math.random() * SPLASHES.length) | 0];
}
