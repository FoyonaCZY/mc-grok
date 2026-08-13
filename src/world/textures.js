import { BLOCKS } from "./blocks.js";
import { mulberry32 } from "../core/noise.js";

export const TILE = 16;
export const ATLAS_COLS = 16;

function px(data, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
  const i = (y * TILE + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

function lerpC(a, b, t) {
  return [
    (a[0] + (b[0] - a[0]) * t) | 0,
    (a[1] + (b[1] - a[1]) * t) | 0,
    (a[2] + (b[2] - a[2]) * t) | 0,
  ];
}

function fillNoise(data, rng, c1, c2, c3 = null) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = rng();
      const c = r > 0.86 && c3 ? c3 : r > 0.45 ? c2 : c1;
      px(data, x, y, c[0], c[1], c[2]);
    }
  }
}

function drawTile(fn) {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext("2d");
  const img = g.createImageData(TILE, TILE);
  fn(img.data);
  g.putImageData(img, 0, 0);
  return c;
}

function overlayPixels(data, rng, color, chance) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (rng() < chance) px(data, x, y, color[0], color[1], color[2]);
    }
  }
}

function rect(data, x, y, w, h, c, a = 255) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) px(data, x + i, y + j, c[0], c[1], c[2], a);
  }
}

function clearTile(d) {
  d.fill(0);
}

function shade(c, n) {
  return [
    Math.max(0, Math.min(255, c[0] + n)),
    Math.max(0, Math.min(255, c[1] + n)),
    Math.max(0, Math.min(255, c[2] + n)),
  ];
}

function stamp(d, art, pal) {
  for (let y = 0; y < art.length; y++) {
    const row = art[y];
    for (let x = 0; x < row.length; x++) {
      const c = pal[row[x]];
      if (c) px(d, x, y, c[0], c[1], c[2], c[3] ?? 255);
    }
  }
}

function ore(data, rng, base1, base2, oreC, dens = 0.12) {
  fillNoise(data, rng, base1, base2);
  const n = 4 + ((dens * 20) | 0);
  for (let k = 0; k < n; k++) {
    const cx = 2 + ((rng() * 12) | 0);
    const cy = 2 + ((rng() * 12) | 0);
    const r = 1 + ((rng() * 2) | 0);
    for (let y = -r - 1; y <= r + 1; y++) {
      for (let x = -r - 1; x <= r + 1; x++) {
        if (x * x + y * y <= r * r + (rng() > 0.55 ? 1 : 0)) {
          const hi = x + y <= 0 ? 40 : -18;
          px(data, cx + x, cy + y, shade(oreC, hi)[0], shade(oreC, hi)[1], shade(oreC, hi)[2]);
        }
      }
    }
  }
}

function plankNoise(data, rng, c1, c2) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const band = (y >> 2) & 1;
      const c = band ? c1 : c2;
      const n = rng() > 0.85 ? -18 : rng() > 0.2 ? 0 : 12;
      px(data, x, y, c[0] + n, c[1] + n, c[2] + n);
    }
  }
  for (let y = 3; y < TILE; y += 4) {
    for (let x = 0; x < TILE; x++) px(data, x, y, c1[0] - 40, c1[1] - 40, c1[2] - 40);
  }
}

function leafNoise(data, rng, c1, c2) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (rng() < 0.28) px(data, x, y, 0, 0, 0, 0);
      else {
        const c = rng() > 0.5 ? c1 : c2;
        px(data, x, y, c[0], c[1], c[2], 255);
      }
    }
  }
}

export const TILE_INDEX = {};
const TILE_CANVASES = [];

function addTile(name, canvas) {
  TILE_INDEX[name] = TILE_CANVASES.length;
  TILE_CANVASES.push(canvas);
}

function makeItemIcon(draw) {
  return drawTile(draw);
}

export function createTextures() {
  const rng = mulberry32(20241308);

  addTile("stone", drawTile((d) => fillNoise(d, rng, [125, 125, 125], [104, 104, 104], [147, 147, 147])));
  addTile("dirt", drawTile((d) => fillNoise(d, rng, [134, 96, 67], [96, 66, 45], [160, 115, 80])));
  addTile("grass_top", drawTile((d) => {
    fillNoise(d, rng, [79, 154, 56], [60, 128, 40], [96, 176, 64]);
  }));
  addTile("grass_side", drawTile((d) => {
    fillNoise(d, rng, [134, 96, 67], [96, 66, 45], [160, 115, 80]);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < TILE; x++) {
        const g = lerpC([79, 154, 56], [60, 128, 40], rng());
        px(d, x, y, g[0], g[1], g[2]);
      }
    }
    for (let x = 0; x < TILE; x++) {
      if (rng() > 0.55) px(d, x, 4, 70, 140, 50);
    }
  }));
  addTile("cobblestone", drawTile((d) => {
    fillNoise(d, rng, [110, 110, 110], [90, 90, 90], [140, 140, 140]);
    for (let i = 0; i < 8; i++) {
      const x = (rng() * 12) | 0, y = (rng() * 12) | 0;
      rect(d, x, y, 4, 3, [70, 70, 70]);
    }
  }));
  addTile("oak_planks", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const band = (y >> 2) & 1;
        const c = band ? [176, 142, 86] : [157, 128, 73];
        const n = rng() > 0.85 ? -18 : rng() > 0.2 ? 0 : 12;
        px(d, x, y, c[0] + n, c[1] + n, c[2] + n);
      }
    }
    for (let y = 3; y < TILE; y += 4) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 90, 70, 40);
    }
    for (let k = 0; k < 4; k++) {
      const x = 4 + ((k * 7) % 12);
      for (let y = k * 4; y < k * 4 + 3; y++) px(d, x, y, 90, 70, 40);
    }
  }));
  addTile("bedrock", drawTile((d) => fillNoise(d, rng, [50, 50, 50], [20, 20, 20], [80, 80, 80])));
  addTile("sand", drawTile((d) => fillNoise(d, rng, [219, 209, 160], [202, 188, 140], [232, 224, 180])));
  addTile("gravel", drawTile((d) => fillNoise(d, rng, [127, 124, 123], [90, 88, 86], [160, 155, 150])));
  addTile("log_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const v = Math.sin(x * 0.9) * 10;
        const c = 86 + v + (rng() * 18 - 9);
        px(d, x, y, c + 20, c, 40);
      }
    }
  }));
  addTile("log_top", drawTile((d) => {
    fillNoise(d, rng, [155, 118, 70], [120, 90, 50]);
    for (let r = 6; r >= 1; r -= 2) {
      for (let a = 0; a < 40; a++) {
        const t = (a / 40) * Math.PI * 2;
        px(d, (8 + Math.cos(t) * r) | 0, (8 + Math.sin(t) * r) | 0, 90, 68, 40);
      }
    }
  }));
  addTile("oak_leaves", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        if (rng() < 0.28) px(d, x, y, 0, 0, 0, 0);
        else {
          const c = rng() > 0.5 ? [46, 116, 32] : [30, 90, 22];
          px(d, x, y, c[0], c[1], c[2], 255);
        }
      }
    }
  }));
  addTile("glass", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const edge = x === 0 || y === 0 || x === 15 || y === 15;
        if (edge) px(d, x, y, 190, 220, 230, 180);
        else if (rng() < 0.08) px(d, x, y, 220, 240, 255, 90);
        else px(d, x, y, 180, 210, 230, 40);
      }
    }
  }));
  addTile("water", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const w = 40 + ((x + y + ((rng() * 3) | 0)) % 6) * 6;
        px(d, x, y, 30, 80 + w * 0.3, 170 + w * 0.2, 160);
      }
    }
  }));
  addTile("lava", drawTile((d) => {
    fillNoise(d, rng, [200, 70, 10], [255, 140, 20], [120, 20, 0]);
  }));
  addTile("coal_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [20, 20, 20], 0.14)));
  addTile("iron_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [200, 170, 140], 0.13)));
  addTile("gold_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [255, 210, 60], 0.12)));
  addTile("diamond_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [80, 230, 230], 0.1)));
  addTile("lapis_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [20, 50, 180], 0.12)));
  addTile("redstone_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [180, 20, 20], 0.13)));
  addTile("craft_top", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [176, 142, 86]);
    rect(d, 1, 1, 14, 14, [120, 90, 50]);
    rect(d, 2, 2, 12, 12, [170, 140, 80]);
    for (let i = 1; i < 4; i++) {
      rect(d, 1, i * 4, 14, 1, [90, 70, 40]);
      rect(d, i * 4, 1, 1, 14, [90, 70, 40]);
    }
  }));
  addTile("craft_side", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [130, 100, 55]);
    rect(d, 4, 3, 8, 2, [70, 70, 70]);
    rect(d, 6, 6, 4, 7, [90, 70, 40]);
  }));
  addTile("craft_front", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [130, 100, 55]);
    rect(d, 3, 4, 10, 8, [90, 70, 40]);
    rect(d, 5, 6, 6, 4, [50, 40, 20]);
  }));
  addTile("planks", TILE_CANVASES[TILE_INDEX.oak_planks]);
  addTile("furnace_top", drawTile((d) => fillNoise(d, rng, [90, 90, 90], [70, 70, 70])));
  addTile("furnace_side", drawTile((d) => fillNoise(d, rng, [90, 90, 90], [70, 70, 70], [110, 110, 110])));
  addTile("furnace_front", drawTile((d) => {
    fillNoise(d, rng, [96, 96, 96], [72, 72, 72], [118, 118, 118]);
    rect(d, 0, 0, 16, 1, [50, 50, 50]);
    rect(d, 0, 15, 16, 1, [40, 40, 40]);
    rect(d, 3, 2, 10, 7, [18, 16, 14]);
    rect(d, 4, 3, 8, 5, [12, 10, 8]);
    rect(d, 5, 5, 6, 3, [230, 120, 20]);
    px(d, 6, 6, 255, 200, 60);
    px(d, 9, 7, 255, 160, 40);
    rect(d, 4, 10, 8, 4, [28, 26, 24]);
    rect(d, 6, 11, 4, 2, [16, 14, 12]);
  }));
  addTile("chest_front", drawTile((d) => {
    fillNoise(d, rng, [162, 102, 28], [128, 78, 16], [190, 124, 40]);
    rect(d, 0, 0, 16, 16, [92, 54, 10]);
    rect(d, 1, 1, 14, 14, [176, 112, 32]);
    rect(d, 1, 1, 14, 6, [190, 124, 42]);
    rect(d, 1, 7, 14, 1, [72, 42, 8]);
    rect(d, 7, 6, 2, 4, [255, 220, 50]);
    px(d, 7, 7, 200, 160, 20);
    px(d, 8, 8, 255, 240, 120);
  }));
  addTile("chest_side", drawTile((d) => {
    fillNoise(d, rng, [162, 102, 28], [128, 78, 16]);
    rect(d, 0, 7, 16, 1, [72, 42, 8]);
  }));
  addTile("chest_top", drawTile((d) => {
    fillNoise(d, rng, [176, 112, 32], [140, 86, 18]);
    rect(d, 6, 6, 4, 4, [255, 220, 50]);
  }));
  addTile("bricks", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const row = y >> 2;
        const off = (row & 1) * 4;
        const mortar = y % 4 === 3 || (x + off) % 8 === 7;
        if (mortar) px(d, x, y, 180, 175, 170);
        else {
          const n = (rng() * 20 - 10) | 0;
          px(d, x, y, 150 + n, 70 + n, 55 + n);
        }
      }
    }
  }));
  addTile("stone_bricks", drawTile((d) => {
    fillNoise(d, rng, [120, 120, 120], [100, 100, 100]);
    for (let y = 0; y < TILE; y += 8) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 70, 70, 70);
    }
    for (let x = 0; x < TILE; x += 8) {
      for (let y = 0; y < TILE; y++) px(d, x, y, 70, 70, 70);
    }
  }));
  addTile("snow_block", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 246, 251, 255);
    }
    overlayPixels(d, rng, [255, 255, 255], 0.22);
    overlayPixels(d, rng, [228, 238, 246], 0.07);
  }));
  addTile("ice", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        px(d, x, y, 140, 180, 230, 180);
      }
    }
    overlayPixels(d, rng, [200, 230, 255], 0.1);
  }));
  addTile("cactus_side", drawTile((d) => {
    fillNoise(d, rng, [20, 140, 30], [10, 110, 20]);
    for (let x of [2, 8, 13]) {
      for (let y = 0; y < TILE; y++) px(d, x, y, 8, 80, 12);
    }
  }));
  addTile("cactus_top", drawTile((d) => fillNoise(d, rng, [20, 140, 30], [180, 200, 80])));
  addTile("clay", drawTile((d) => fillNoise(d, rng, [158, 164, 176], [140, 148, 160])));
  addTile("glowstone", drawTile((d) => fillNoise(d, rng, [255, 200, 80], [220, 140, 20], [255, 240, 150])));
  addTile("obsidian", drawTile((d) => fillNoise(d, rng, [20, 10, 30], [5, 0, 15], [60, 20, 80])));
  addTile("netherrack", drawTile((d) => fillNoise(d, rng, [110, 50, 50], [80, 30, 30], [140, 70, 70])));
  addTile("nether_portal", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const w = Math.sin((x + y * 0.4) * 0.9 + rng() * 0.4);
        const a = 210 + w * 30;
        px(d, x, y, 90 + w * 40, 20, a, 230);
      }
    }
  }));
  addTile("soul_sand", drawTile((d) => {
    fillNoise(d, rng, [80, 60, 48], [55, 42, 32], [100, 78, 58]);
    overlayPixels(d, rng, [30, 22, 18], 0.12);
    rect(d, 3, 4, 3, 2, [18, 12, 10]);
    rect(d, 9, 8, 3, 2, [18, 12, 10]);
  }));
  addTile("nether_bricks", drawTile((d) => {
    fillNoise(d, rng, [50, 22, 26], [38, 16, 20]);
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        if (y % 4 === 0 || ((y >> 2) % 2 === 0 ? x % 8 === 0 : x % 8 === 4)) px(d, x, y, 28, 10, 12);
      }
    }
  }));
  addTile("nether_quartz_ore", drawTile((d) => ore(d, rng, [110, 50, 50], [80, 30, 30], [235, 230, 225], 0.14)));
  addTile("magma_block", drawTile((d) => {
    fillNoise(d, rng, [90, 30, 20], [40, 12, 10], [200, 90, 30]);
    overlayPixels(d, rng, [255, 160, 40], 0.1);
  }));
  addTile("nether_wart", drawTile((d) => {
    clearTile(d);
    stamp(d, [
      "................",
      "....rr..rr......",
      "...rrrrrrrr.....",
      "...r.rrrr.r.....",
      "....rr..rr......",
      ".....s..s.......",
      ".....s..s.......",
      ".....s.ss.......",
      "......ss........",
    ], { r: [140, 20, 30], s: [90, 18, 24] });
  }));
  addTile("crimson_nylium_top", drawTile((d) => fillNoise(d, rng, [150, 30, 40], [110, 18, 28], [190, 50, 60])));
  addTile("crimson_nylium_side", drawTile((d) => {
    fillNoise(d, rng, [110, 50, 50], [80, 30, 30]);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 150, 30, 40);
    }
  }));
  addTile("warped_nylium_top", drawTile((d) => fillNoise(d, rng, [20, 140, 130], [14, 100, 96], [40, 180, 160])));
  addTile("warped_nylium_side", drawTile((d) => {
    fillNoise(d, rng, [110, 50, 50], [80, 30, 30]);
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 20, 140, 130);
    }
  }));
  addTile("blackstone", drawTile((d) => fillNoise(d, rng, [36, 32, 36], [22, 20, 24], [55, 50, 58])));
  addTile("crimson_stem_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const v = Math.sin(x * 1.05) * 10;
        px(d, x, y, 140 + v, 30, 40);
      }
    }
  }));
  addTile("crimson_stem_top", drawTile((d) => fillNoise(d, rng, [90, 20, 30], [180, 70, 70])));
  addTile("warped_stem_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const v = Math.sin(x * 1.05) * 10;
        px(d, x, y, 20, 90 + v, 90);
      }
    }
  }));
  addTile("warped_stem_top", drawTile((d) => fillNoise(d, rng, [14, 70, 70], [40, 160, 140])));
  addTile("nether_wart_block", drawTile((d) => fillNoise(d, rng, [120, 18, 28], [90, 10, 18], [160, 40, 48])));
  addTile("warped_wart_block", drawTile((d) => fillNoise(d, rng, [16, 120, 110], [10, 80, 78], [40, 170, 150])));
  addTile("bookshelf", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [130, 100, 55]);
    for (let row = 0; row < 2; row++) {
      for (let y = 1 + row * 8; y < 7 + row * 8; y++) {
        for (let x = 1; x < 15; x++) {
          const book = ((x / 3) | 0) % 4;
          const cols = [[140, 30, 30], [30, 50, 140], [40, 100, 40], [140, 120, 30]];
          const c = cols[book];
          px(d, x, y, c[0], c[1], c[2]);
        }
      }
    }
  }));
  addTile("melon_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const stripe = (x + (y >> 2)) % 4 < 2;
        const sc = stripe ? [90, 160, 30] : [70, 130, 20];
        px(d, x, y, sc[0], sc[1], sc[2]);
      }
    }
  }));
  addTile("melon_top", drawTile((d) => fillNoise(d, rng, [90, 160, 30], [180, 80, 80])));
  addTile("pumpkin_side", drawTile((d) => fillNoise(d, rng, [210, 120, 20], [180, 90, 10])));
  addTile("pumpkin_front", drawTile((d) => {
    fillNoise(d, rng, [210, 120, 20], [180, 90, 10]);
    rect(d, 3, 4, 3, 3, [20, 10, 0]);
    rect(d, 10, 4, 3, 3, [20, 10, 0]);
    rect(d, 5, 10, 6, 2, [20, 10, 0]);
  }));
  addTile("pumpkin_top", drawTile((d) => fillNoise(d, rng, [210, 120, 20], [80, 120, 20])));
  addTile("white_wool", drawTile((d) => fillNoise(d, rng, [230, 230, 230], [210, 210, 210], [245, 245, 245])));
  addTile("tnt_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const band = y > 5 && y < 11;
        px(d, x, y, band ? 220 : 180, band ? 220 : 40, band ? 220 : 40);
      }
    }
  }));
  addTile("tnt_top", drawTile((d) => fillNoise(d, rng, [180, 40, 40], [140, 20, 20])));
  addTile("tnt_bottom", drawTile((d) => fillNoise(d, rng, [140, 20, 20], [100, 10, 10])));
  addTile("mossy_cobblestone", drawTile((d) => {
    fillNoise(d, rng, [110, 110, 110], [90, 90, 90], [140, 140, 140]);
    overlayPixels(d, rng, [40, 110, 40], 0.22);
  }));
  addTile("farmland", drawTile((d) => fillNoise(d, rng, [90, 60, 30], [70, 45, 22], [110, 75, 40])));
  addTile("coal_block", drawTile((d) => fillNoise(d, rng, [20, 20, 20], [40, 40, 40], [10, 10, 10])));
  addTile("iron_block", drawTile((d) => {
    fillNoise(d, rng, [210, 210, 210], [180, 180, 180]);
    rect(d, 1, 1, 14, 14, [230, 230, 230]);
    rect(d, 2, 2, 12, 12, [200, 200, 200]);
  }));
  addTile("gold_block", drawTile((d) => {
    fillNoise(d, rng, [250, 220, 50], [220, 180, 20]);
    rect(d, 2, 2, 12, 12, [255, 230, 70]);
  }));
  addTile("diamond_block", drawTile((d) => {
    fillNoise(d, rng, [80, 230, 220], [40, 200, 190]);
    rect(d, 2, 2, 12, 12, [100, 255, 240]);
  }));
  addTile("sandstone_side", drawTile((d) => fillNoise(d, rng, [210, 200, 150], [190, 180, 130])));
  addTile("sandstone_top", drawTile((d) => fillNoise(d, rng, [220, 210, 160], [200, 190, 140])));
  addTile("sandstone_bottom", drawTile((d) => fillNoise(d, rng, [190, 180, 130], [170, 160, 110])));
  addTile("podzol_top", drawTile((d) => fillNoise(d, rng, [90, 60, 30], [70, 90, 40], [120, 80, 40])));
  addTile("podzol_side", drawTile((d) => {
    fillNoise(d, rng, [134, 96, 67], [96, 66, 45]);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 90, 60, 30);
    }
  }));
  addTile("andesite", drawTile((d) => fillNoise(d, rng, [132, 132, 132], [110, 110, 112], [150, 150, 148])));
  addTile("diorite", drawTile((d) => fillNoise(d, rng, [200, 200, 200], [170, 170, 172], [230, 230, 228])));
  addTile("granite", drawTile((d) => fillNoise(d, rng, [160, 110, 95], [130, 80, 70], [190, 140, 120])));
  addTile("birch_log_side", drawTile((d) => {
    fillNoise(d, rng, [216, 214, 205], [230, 228, 220]);
    for (let i = 0; i < 18; i++) {
      const x = (rng() * 14) | 0;
      const y = (rng() * 14) | 0;
      rect(d, x, y, 1 + (rng() > 0.6 ? 1 : 0), 2, [40, 38, 32]);
    }
  }));
  addTile("birch_log_top", drawTile((d) => {
    fillNoise(d, rng, [200, 186, 140], [170, 150, 110]);
    for (let r = 5; r >= 1; r -= 2) {
      for (let a = 0; a < 32; a++) {
        const t = (a / 32) * Math.PI * 2;
        px(d, (8 + Math.cos(t) * r) | 0, (8 + Math.sin(t) * r) | 0, 150, 140, 110);
      }
    }
  }));
  addTile("birch_planks", drawTile((d) => plankNoise(d, rng, [196, 179, 123], [214, 201, 150])));
  addTile("birch_leaves", drawTile((d) => leafNoise(d, rng, [90, 160, 70], [70, 140, 50])));
  addTile("spruce_log_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const v = Math.sin(x * 0.8) * 8;
        const c = 55 + v + (rng() * 14 - 7);
        px(d, x, y, c, c - 8, 30);
      }
    }
  }));
  addTile("spruce_log_top", drawTile((d) => fillNoise(d, rng, [90, 70, 45], [70, 52, 32])));
  addTile("spruce_planks", drawTile((d) => plankNoise(d, rng, [105, 79, 46], [122, 90, 54])));
  addTile("spruce_leaves", drawTile((d) => leafNoise(d, rng, [30, 80, 40], [20, 60, 30])));
  addTile("jungle_log_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const v = Math.sin(x * 1.1) * 12;
        const c = 70 + v + (rng() * 16 - 8);
        px(d, x, y, c + 40, c, 20);
      }
    }
  }));
  addTile("jungle_log_top", drawTile((d) => fillNoise(d, rng, [170, 120, 50], [140, 90, 35])));
  addTile("jungle_planks", drawTile((d) => plankNoise(d, rng, [160, 115, 70], [184, 132, 82])));
  addTile("jungle_leaves", drawTile((d) => leafNoise(d, rng, [30, 130, 20], [20, 100, 14])));
  addTile("emerald_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [40, 220, 90], 0.1)));
  addTile("emerald_block", drawTile((d) => {
    fillNoise(d, rng, [40, 200, 90], [20, 160, 70]);
    rect(d, 2, 2, 12, 12, [50, 230, 110]);
  }));
  addTile("copper_ore", drawTile((d) => ore(d, rng, [125, 125, 125], [104, 104, 104], [180, 100, 70], 0.13)));
  addTile("copper_block", drawTile((d) => fillNoise(d, rng, [190, 110, 80], [160, 80, 55], [220, 140, 100])));
  addTile("lapis_block", drawTile((d) => fillNoise(d, rng, [20, 50, 160], [30, 70, 200], [10, 30, 120])));
  addTile("redstone_block", drawTile((d) => fillNoise(d, rng, [170, 20, 20], [210, 40, 40], [120, 10, 10])));
  addTile("hay_top", drawTile((d) => {
    fillNoise(d, rng, [180, 150, 40], [160, 130, 30]);
    for (let r = 6; r >= 1; r -= 2) {
      for (let a = 0; a < 28; a++) {
        const t = (a / 28) * Math.PI * 2;
        px(d, (8 + Math.cos(t) * r) | 0, (8 + Math.sin(t) * r) | 0, 140, 110, 20);
      }
    }
  }));
  addTile("hay_side", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const n = ((x + y) % 3) * 8;
        px(d, x, y, 190 - n, 160 - n, 40);
      }
    }
  }));
  addTile("hay_block", TILE_CANVASES[TILE_INDEX.hay_side]);
  addTile("packed_ice", drawTile((d) => fillNoise(d, rng, [150, 190, 230], [170, 210, 245], [120, 170, 220])));
  addTile("mycelium_top", drawTile((d) => fillNoise(d, rng, [110, 90, 110], [80, 70, 90], [140, 80, 140])));
  addTile("mycelium_side", drawTile((d) => {
    fillNoise(d, rng, [134, 96, 67], [96, 66, 45]);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 110, 90, 110);
    }
  }));
  addTile("red_wool", drawTile((d) => fillNoise(d, rng, [170, 40, 40], [150, 25, 25], [190, 60, 60])));
  addTile("blue_wool", drawTile((d) => fillNoise(d, rng, [40, 50, 160], [30, 40, 140], [60, 70, 190])));
  addTile("yellow_wool", drawTile((d) => fillNoise(d, rng, [220, 200, 40], [200, 180, 20], [240, 220, 70])));
  addTile("black_wool", drawTile((d) => fillNoise(d, rng, [25, 25, 28], [12, 12, 14], [40, 40, 44])));
  addTile("green_wool", drawTile((d) => fillNoise(d, rng, [50, 120, 40], [35, 95, 28], [70, 145, 55])));
  addTile("orange_wool", drawTile((d) => fillNoise(d, rng, [220, 120, 30], [200, 95, 15], [240, 145, 50])));
  addTile("brown_wool", drawTile((d) => fillNoise(d, rng, [110, 70, 40], [90, 55, 28], [130, 85, 50])));
  addTile("pink_wool", drawTile((d) => fillNoise(d, rng, [230, 150, 170], [210, 120, 145], [245, 175, 190])));
  addTile("terracotta", drawTile((d) => fillNoise(d, rng, [150, 90, 70], [130, 75, 58], [170, 105, 82])));
  addTile("red_terracotta", drawTile((d) => fillNoise(d, rng, [142, 60, 46], [120, 42, 32], [168, 78, 58])));
  addTile("orange_terracotta", drawTile((d) => fillNoise(d, rng, [162, 82, 38], [140, 64, 24], [188, 102, 50])));
  addTile("yellow_terracotta", drawTile((d) => fillNoise(d, rng, [186, 132, 42], [164, 110, 28], [210, 154, 62])));
  addTile("prismarine", drawTile((d) => fillNoise(d, rng, [70, 140, 130], [50, 120, 115], [90, 170, 155])));
  addTile("end_stone", drawTile((d) => fillNoise(d, rng, [220, 220, 160], [200, 200, 140], [235, 235, 180])));
  addTile("end_portal_frame_side", drawTile((d) => {
    fillNoise(d, rng, [180, 170, 120], [150, 140, 90]);
    rect(d, 0, 0, 16, 3, [90, 80, 50]);
    rect(d, 0, 13, 16, 3, [90, 80, 50]);
    rect(d, 5, 4, 6, 8, [40, 90, 70]);
  }));
  addTile("end_portal_frame_top", drawTile((d) => {
    fillNoise(d, rng, [180, 170, 120], [150, 140, 90]);
    rect(d, 4, 4, 8, 8, [30, 50, 40]);
    rect(d, 6, 6, 4, 4, [20, 70, 50]);
  }));
  addTile("end_portal_frame_eye", drawTile((d) => {
    fillNoise(d, rng, [180, 170, 120], [150, 140, 90]);
    rect(d, 3, 3, 10, 10, [20, 80, 50]);
    rect(d, 5, 5, 6, 6, [80, 255, 120]);
    rect(d, 7, 7, 2, 2, [220, 255, 180]);
  }));
  addTile("end_portal", drawTile((d) => {
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        const w = Math.sin((x * 0.8 + y * 0.35) + rng() * 0.5);
        px(d, x, y, 40 + w * 30, 8, 70 + w * 50, 230);
      }
    }
  }));
  addTile("chorus_plant", drawTile((d) => {
    clearTile(d);
    fillNoise(d, rng, [90, 50, 90], [70, 30, 80]);
    rect(d, 4, 0, 8, 16, [110, 60, 120]);
    overlayPixels(d, rng, [160, 90, 170], 0.12);
  }));
  addTile("chorus_flower", drawTile((d) => {
    clearTile(d);
    fillNoise(d, rng, [180, 140, 190], [140, 90, 160]);
    rect(d, 3, 3, 10, 10, [210, 170, 220]);
    rect(d, 6, 6, 4, 4, [240, 220, 255]);
  }));
  addTile("purpur_block", drawTile((d) => fillNoise(d, rng, [170, 120, 170], [150, 100, 155], [190, 140, 185])));
  addTile("end_rod", drawTile((d) => {
    clearTile(d);
    rect(d, 6, 0, 4, 16, [230, 220, 200]);
    rect(d, 5, 12, 6, 4, [255, 250, 230]);
  }));
  addTile("dragon_egg", drawTile((d) => {
    fillNoise(d, rng, [20, 10, 28], [8, 4, 16], [60, 20, 80]);
    rect(d, 5, 2, 6, 12, [30, 12, 40]);
    rect(d, 7, 4, 2, 2, [180, 80, 220]);
  }));
  addTile("quartz_block", drawTile((d) => fillNoise(d, rng, [235, 230, 225], [220, 215, 210], [250, 248, 245])));
  addTile("jack_front", drawTile((d) => {
    fillNoise(d, rng, [210, 120, 20], [180, 90, 10]);
    rect(d, 3, 4, 3, 3, [255, 200, 40]);
    rect(d, 10, 4, 3, 3, [255, 200, 40]);
    rect(d, 5, 10, 6, 2, [255, 180, 20]);
  }));
  addTile("jack_o_lantern", TILE_CANVASES[TILE_INDEX.jack_front]);
  addTile("bed_top", drawTile((d) => {
    fillNoise(d, rng, [170, 40, 40], [150, 25, 25]);
    rect(d, 0, 0, 16, 4, [230, 220, 200]);
    rect(d, 1, 5, 14, 9, [190, 50, 50]);
  }));
  addTile("bed_side", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [130, 100, 55]);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < TILE; x++) px(d, x, y, 170, 40, 40);
    }
  }));
  addTile("red_bed", TILE_CANVASES[TILE_INDEX.bed_top]);
  addTile("door_lower", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [120, 90, 50]);
    rect(d, 0, 0, 16, 16, [140, 108, 58]);
    rect(d, 1, 1, 14, 14, [168, 132, 72]);
    rect(d, 3, 3, 10, 7, [90, 70, 40]);
    rect(d, 4, 4, 8, 5, [160, 200, 220]);
    rect(d, 11, 11, 2, 2, [40, 30, 16]);
  }));
  addTile("door_upper", drawTile((d) => {
    fillNoise(d, rng, [157, 128, 73], [120, 90, 50]);
    rect(d, 0, 0, 16, 16, [140, 108, 58]);
    rect(d, 1, 1, 14, 14, [168, 132, 72]);
    rect(d, 3, 4, 10, 8, [90, 70, 40]);
    rect(d, 4, 5, 8, 6, [170, 210, 230]);
  }));
  addTile("oak_door", TILE_CANVASES[TILE_INDEX.door_lower]);
  addTile("oak_door_top", TILE_CANVASES[TILE_INDEX.door_upper]);
  addTile("oak_door_open", TILE_CANVASES[TILE_INDEX.door_lower]);
  addTile("oak_door_open_top", TILE_CANVASES[TILE_INDEX.door_upper]);
  addTile("ladder", drawTile((d) => {
    clearTile(d);
    for (let y of [2, 6, 10, 14]) rect(d, 2, y, 12, 2, [150, 110, 55]);
    rect(d, 2, 0, 2, 16, [120, 85, 40]);
    rect(d, 12, 0, 2, 16, [120, 85, 40]);
  }));
  addTile("oak_fence", drawTile((d) => {
    fillNoise(d, rng, [176, 142, 85], [154, 122, 70]);
    rect(d, 2, 0, 3, 16, [124, 86, 42]);
    rect(d, 11, 0, 3, 16, [124, 86, 42]);
    rect(d, 0, 4, 16, 3, [168, 118, 62]);
    rect(d, 0, 10, 16, 3, [168, 118, 62]);
  }));
  addTile("oak_fence_gate", drawTile((d) => {
    fillNoise(d, rng, [176, 142, 85], [154, 122, 70]);
    rect(d, 1, 0, 3, 16, [124, 86, 42]);
    rect(d, 12, 0, 3, 16, [124, 86, 42]);
    rect(d, 1, 3, 14, 4, [168, 118, 62]);
    rect(d, 1, 9, 14, 4, [168, 118, 62]);
  }));
  addTile("sponge", drawTile((d) => fillNoise(d, rng, [200, 200, 70], [180, 175, 40], [220, 215, 90])));
  addTile("note_block", drawTile((d) => {
    fillNoise(d, rng, [90, 55, 35], [70, 40, 25]);
    rect(d, 3, 3, 10, 10, [40, 20, 10]);
    rect(d, 6, 6, 4, 4, [200, 180, 40]);
  }));
  addTile("sugar_cane", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let y = 0; y < TILE; y++) {
      rect(d, 5, y, 2, 1, [70, 160, 50]);
      rect(d, 9, y, 2, 1, [50, 140, 35]);
    }
    overlayPixels(d, rng, [90, 190, 60], 0.08);
  }));
  addTile("dandelion", drawTile((d) => {
    clearTile(d);
    stamp(d, [
      "................",
      "......yyyy......",
      ".....yyyyyy.....",
      "....yyyooyyy....",
      ".....yyyyyy.....",
      "......yyyy......",
      ".......g........",
      ".......g........",
      ".......g........",
      "......gg........",
      ".......g........",
      ".......g........",
      ".......g........",
      "......ggg.......",
      "................",
      "................",
    ], { y: [250, 220, 40], o: [210, 170, 20], g: [46, 140, 36] });
  }));
  addTile("poppy", drawTile((d) => {
    clearTile(d);
    stamp(d, [
      "................",
      ".....rr.rr......",
      "....rrrrrrr.....",
      "....rrrkr.rr....",
      ".....rrkrr......",
      "......rrr.......",
      ".......g........",
      ".......g........",
      ".......g........",
      "......gg........",
      ".......g........",
      ".......g........",
      ".......g........",
      "......gg........",
      "................",
      "................",
    ], { r: [200, 28, 28], k: [20, 12, 8], g: [40, 130, 32] });
  }));
  addTile("red_mushroom", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    rect(d, 7, 8, 2, 8, [220, 210, 190]);
    rect(d, 4, 3, 8, 6, [180, 30, 30]);
    px(d, 6, 5, 240, 230, 220);
    px(d, 9, 6, 240, 230, 220);
  }));
  addTile("brown_mushroom", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    rect(d, 7, 8, 2, 8, [220, 210, 190]);
    rect(d, 4, 3, 8, 6, [150, 110, 70]);
  }));
  addTile("torch", drawTile((d) => {
    clearTile(d);
    stamp(d, [
      "................",
      ".......yy.......",
      "......yYYy......",
      "......yYYy......",
      ".......oo.......",
      ".......wu.......",
      ".......wu.......",
      ".......wu.......",
      ".......wu.......",
      ".......wu.......",
      ".......wu.......",
      ".......wu.......",
      ".......uv.......",
      "................",
      "................",
      "................",
    ], {
      Y: [255, 255, 180],
      y: [255, 200, 40],
      o: [230, 120, 20],
      w: [176, 122, 62],
      u: [130, 86, 42],
      v: [88, 54, 24],
    });
  }));
  addTile("oak_sapling", drawTile((d) => {
    clearTile(d);
    stamp(d, [
      "................",
      "......ggg.......",
      "....ggGGgg......",
      "...gGGGGGgg.....",
      "...ggGGggGg.....",
      "....ggwggg......",
      "......wG........",
      "......wu........",
      "......wu........",
      "......wu........",
      "......wu........",
      "......uv........",
      ".....g..g.......",
      "................",
      "................",
      "................",
    ], {
      G: [70, 170, 50],
      g: [46, 128, 36],
      w: [150, 102, 52],
      u: [110, 74, 36],
      v: [80, 52, 24],
    });
  }));
  addTile("cobweb", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let i = 0; i < 16; i++) {
      px(d, i, i, 230, 230, 235, 220);
      px(d, i, 15 - i, 220, 220, 228, 200);
      px(d, 8, i, 210, 210, 220, 180);
      px(d, i, 8, 210, 210, 220, 180);
    }
    for (let i = 2; i < 14; i += 3) {
      px(d, i, 3, 240, 240, 245, 160);
      px(d, 12, i, 240, 240, 245, 160);
    }
  }));
  addTile("short_grass", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let x = 2; x < 15; x += 3) {
      const h = 8 + ((x * 3) % 6);
      for (let y = 16 - h; y < 16; y++) px(d, x, y, 70 + (x % 3) * 10, 140, 40);
    }
  }));
  addTile("wheat_0", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let x = 4; x < 13; x += 4) for (let y = 12; y < 16; y++) px(d, x, y, 70, 130, 40);
  }));
  addTile("wheat_1", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let x = 4; x < 13; x += 4) for (let y = 8; y < 16; y++) px(d, x, y, 90, 150, 40);
  }));
  addTile("wheat_2", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let x = 3; x < 14; x += 3) for (let y = 4; y < 16; y++) px(d, x, y, 160, 160, 50);
  }));
  addTile("wheat_3", drawTile((d) => {
    for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
    for (let x = 3; x < 14; x += 3) {
      for (let y = 2; y < 16; y++) px(d, x, y, 200, 180, 50);
      px(d, x - 1, 3, 220, 190, 40);
      px(d, x + 1, 4, 220, 190, 40);
    }
  }));

  for (let s = 0; s < 10; s++) {
    addTile(`crack_${s}`, drawTile((d) => {
      for (let i = 0; i < TILE * TILE * 4; i++) d[i] = 0;
      const lines = 3 + s;
      for (let i = 0; i < lines; i++) {
        let x = (rng() * 16) | 0;
        let y = (rng() * 16) | 0;
        for (let k = 0; k < 8 + s; k++) {
          px(d, x, y, 20, 20, 20, 200);
          px(d, x + 1, y, 10, 10, 10, 160);
          x += (rng() * 3 - 1) | 0;
          y += (rng() * 3 - 1) | 0;
        }
      }
    }));
  }

  const atlasCols = ATLAS_COLS;
  const atlasRows = Math.ceil(TILE_CANVASES.length / atlasCols);
  const atlas = document.createElement("canvas");
  atlas.width = atlasCols * TILE;
  atlas.height = atlasRows * TILE;
  const ag = atlas.getContext("2d");
  ag.imageSmoothingEnabled = false;
  TILE_CANVASES.forEach((tile, i) => {
    const x = (i % atlasCols) * TILE;
    const y = Math.floor(i / atlasCols) * TILE;
    ag.drawImage(tile, x, y);
  });

  const itemIcons = createItemIcons(rng);

  const dirtBg = document.createElement("canvas");
  dirtBg.width = 16;
  dirtBg.height = 16;
  const dg = dirtBg.getContext("2d");
  dg.drawImage(TILE_CANVASES[TILE_INDEX.dirt], 0, 0);
  dg.fillStyle = "rgba(0,0,0,0.62)";
  dg.fillRect(0, 0, 16, 16);

  const btnBg = document.createElement("canvas");
  btnBg.width = 16;
  btnBg.height = 16;
  const bg = btnBg.getContext("2d");
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = ((x * 13 + y * 7) % 5) * 6;
      bg.fillStyle = `rgb(${110 - n},${110 - n},${110 - n})`;
      bg.fillRect(x, y, 1, 1);
    }
  }

  return {
    atlas,
    atlasCols,
    atlasRows,
    tileIndex: TILE_INDEX,
    tiles: TILE_CANVASES,
    itemIcons,
    dirtBg: dirtBg.toDataURL(),
    btnBg: btnBg.toDataURL(),
    uv(name) {
      const idx = TILE_INDEX[name] ?? 0;
      const col = idx % atlasCols;
      const row = Math.floor(idx / atlasCols);
      const u0 = col / atlasCols;
      const u1 = (col + 1) / atlasCols;
      const vTop = row / atlasRows;
      const vBot = (row + 1) / atlasRows;
      const p = 0.02 / atlasCols;
      return [u0 + p, vBot - p, u1 - p, vTop + p];
    },
  };
}

function iconArt(art, pal) {
  return drawTile((d) => {
    clearTile(d);
    stamp(d, art, pal);
  });
}

function createItemIcons(rng) {
  const icons = {};
  const wood = { w: [176, 122, 62], u: [124, 82, 40], v: [86, 54, 24] };

  function gem(c) {
    const pal = { o: shade(c, 50), "=": c, "-": shade(c, -45), k: shade(c, -70), w: [255, 255, 255] };
    return iconArt([
      ".......oo.......",
      "......o==o......",
      ".....o====o.....",
      "....o==ww==o....",
      "...o===ww===k...",
      "...o========k...",
      "....-======k....",
      ".....-====k.....",
      "......-==k......",
      ".......-k.......",
    ], pal);
  }

  function ingot(c) {
    const pal = { o: shade(c, 40), "=": c, "-": shade(c, -40), k: shade(c, -70) };
    return iconArt([
      "................",
      "................",
      "....oooooooo....",
      "...o========o...",
      "...==========-..",
      "...==========-..",
      "....-=======k...",
      ".....------k....",
    ], pal);
  }

  icons.stick = iconArt([
    ".........wo.....",
    "........wuw.....",
    ".......wuw......",
    "......wuw.......",
    ".....wuw........",
    "....wuw.........",
    "...wuw..........",
    "..wuw...........",
    ".wuw............",
    ".uv.............",
  ], { ...wood, o: [210, 160, 90] });

  icons.coal = iconArt([
    "................",
    ".....kkkk.......",
    "....kkooek......",
    "...kkoooeek.....",
    "...kooooeek.....",
    "...kooooekk.....",
    "....kooekk......",
    ".....kkkk.......",
  ], { k: [18, 18, 20], o: [42, 42, 46], e: [90, 90, 96] });
  icons.charcoal = iconArt([
    "................",
    ".....kkkk.......",
    "....kkooek......",
    "...kkoooeek.....",
    "...kooooeek.....",
    "...kooooekk.....",
    "....kooekk......",
    ".....kkkk.......",
  ], { k: [28, 20, 14], o: [58, 42, 28], e: [110, 88, 60] });

  icons.iron_ingot = ingot([210, 210, 216]);
  icons.gold_ingot = ingot([250, 212, 42]);
  icons.copper_ingot = ingot([196, 112, 78]);
  icons.diamond = gem([70, 220, 220]);
  icons.emerald = gem([36, 210, 88]);

  icons.lapis = iconArt([
    "................",
    ".....oooo.......",
    "....o==w==o.....",
    "...o===w===k....",
    "...o=======k....",
    "....-=====k.....",
    ".....-----......",
  ], { o: [70, 110, 230], "=": [30, 60, 190], w: [140, 180, 255], k: [16, 28, 110], "-": [20, 40, 140] });

  icons.redstone = drawTile((d) => {
    clearTile(d);
    for (let i = 0; i < 28; i++) {
      const x = 3 + ((rng() * 10) | 0);
      const y = 4 + ((rng() * 8) | 0);
      const c = rng() > 0.4 ? [220, 30, 30] : [160, 12, 12];
      px(d, x, y, c[0], c[1], c[2]);
      if (rng() > 0.5) px(d, x + 1, y, 255, 70, 50);
    }
  });

  icons.clay_ball = iconArt([
    "................",
    ".....oooo.......",
    "....o==w==o.....",
    "...o=======k....",
    "...o=======k....",
    "....-=====k.....",
    ".....-----......",
  ], { o: [176, 182, 194], "=": [158, 164, 176], w: [210, 214, 220], k: [120, 126, 140], "-": [130, 136, 148] });

  icons.flint = iconArt([
    ".........oo.....",
    "........o==.....",
    ".......o==k.....",
    "......o==k......",
    ".....o==k.......",
    "....o==k........",
    "...o==k.........",
    "...==k..........",
    "...-k...........",
  ], { o: [200, 200, 210], "=": [90, 90, 98], k: [48, 48, 54], "-": [30, 30, 34] });

  icons.wheat = iconArt([
    "....y..y..y.....",
    "...ygy.gy.gy....",
    "...ggg.gg.gg....",
    "....g..g..g.....",
    "....g..g..g.....",
    "....g.gg..g.....",
    ".....g.g.g......",
    ".....gg.g.......",
    "......gg........",
    "......u.........",
  ], { y: [230, 200, 55], g: [196, 168, 42], u: [110, 80, 36] });

  icons.wheat_seeds = iconArt([
    "................",
    "................",
    "....a..b..a.....",
    ".....b.a.b......",
    "...a...b...a....",
    ".....a.b.a......",
    "....b.....b.....",
  ], { a: [92, 148, 40], b: [140, 108, 42] });

  const applePal = (body, dark, light) => ({
    s: [96, 64, 28],
    l: [50, 160, 45],
    o: light,
    "=": body,
    "-": dark,
  });
  icons.apple = iconArt([
    ".......s.l......",
    "......ssll......",
    ".....======.....",
    "....==oo====....",
    "...===oo=====...",
    "...==========-..",
    "...==========-..",
    "....========-...",
    ".....======-....",
    "......----......",
  ], applePal([200, 32, 32], [140, 16, 16], [255, 90, 80]));
  icons.golden_apple = iconArt([
    ".......s.l......",
    "......ssll......",
    ".....======.....",
    "....==oo====....",
    "...===oo=====...",
    "...==========-..",
    "...==========-..",
    "....========-...",
    ".....======-....",
    "......----......",
  ], applePal([250, 210, 40], [190, 140, 16], [255, 245, 140]));

  icons.bread = iconArt([
    "................",
    "...oooooooooo...",
    "..o==========o..",
    "..============-.",
    "..====ww======-.",
    "...-=========-..",
    "....--------....",
  ], { o: [210, 160, 80], "=": [188, 132, 58], w: [230, 190, 120], "-": [140, 90, 36] });

  function chop(raw) {
    const pal = raw
      ? { o: [255, 200, 196], "=": [232, 150, 150], "-": [180, 90, 90], b: [240, 230, 210], k: [90, 40, 40] }
      : { o: [210, 150, 80], "=": [150, 82, 36], "-": [96, 48, 18], b: [230, 210, 170], k: [70, 32, 12] };
    return iconArt([
      "....bb..........",
      "...b==ooo.......",
      "...==========...",
      "..====kk======..",
      "..============-.",
      "...==========-..",
      "....-=======....",
      ".....-----......",
    ], pal);
  }
  icons.porkchop = chop(true);
  icons.cooked_porkchop = chop(false);
  icons.beef = iconArt([
    "................",
    "...oooooo.......",
    "..o======oo.....",
    "..====kk====....",
    "..============..",
    "...==========-..",
    "....-=======....",
    ".....-----......",
  ], { o: [255, 170, 170], "=": [210, 90, 90], k: [120, 30, 30], "-": [150, 50, 50] });
  icons.steak = iconArt([
    "................",
    "...oooooo.......",
    "..o======oo.....",
    "..====kk====....",
    "..============..",
    "...==========-..",
    "....-=======....",
    ".....-----......",
  ], { o: [180, 110, 50], "=": [120, 64, 24], k: [70, 30, 10], "-": [90, 44, 16] });
  icons.mutton = icons.porkchop;
  icons.cooked_mutton = icons.cooked_porkchop;

  icons.chicken = iconArt([
    "......oooo......",
    ".....o====o.....",
    "....========....",
    "...====kk====...",
    "...==========-..",
    "....========-...",
    ".....o====o.....",
    "......----......",
  ], { o: [250, 230, 210], "=": [230, 200, 175], k: [210, 160, 140], "-": [180, 140, 110] });
  icons.cooked_chicken = iconArt([
    "......oooo......",
    ".....o====o.....",
    "....========....",
    "...====kk====...",
    "...==========-..",
    "....========-...",
    ".....o====o.....",
    "......----......",
  ], { o: [210, 150, 70], "=": [170, 100, 40], k: [120, 60, 20], "-": [110, 55, 18] });

  icons.carrot = iconArt([
    "......g.g.......",
    ".....ggggg......",
    "......gog.......",
    "......ooo.......",
    "......===.......",
    "......===.......",
    ".......=-.......",
    ".......=-.......",
    "........-.......",
  ], { g: [46, 150, 36], o: [255, 150, 40], "=": [230, 110, 24], "-": [180, 70, 16] });
  icons.golden_carrot = iconArt([
    "......g.g.......",
    ".....ggggg......",
    "......gog.......",
    "......ooo.......",
    "......===.......",
    "......===.......",
    ".......=-.......",
    ".......=-.......",
    "........-.......",
  ], { g: [46, 150, 36], o: [255, 240, 120], "=": [250, 200, 40], "-": [190, 140, 16] });

  icons.potato = iconArt([
    "................",
    ".....oooo.......",
    "....o====oo.....",
    "...o===e===o....",
    "...========k....",
    "....-e====k.....",
    ".....-----......",
  ], { o: [210, 170, 90], "=": [180, 140, 70], e: [90, 60, 30], k: [120, 90, 40], "-": [140, 100, 45] });
  icons.baked_potato = iconArt([
    "................",
    ".....oooo.......",
    "....o====oo.....",
    "...o=======o....",
    "...========k....",
    "....-=====k.....",
    ".....-----......",
  ], { o: [200, 150, 70], "=": [160, 110, 48], k: [110, 70, 28], "-": [120, 80, 32] });

  icons.egg = iconArt([
    ".......oo.......",
    "......o==o......",
    ".....o====o.....",
    "....o==ww==o....",
    "....========k...",
    ".....======k....",
    "......-==k......",
    ".......--.......",
  ], { o: [250, 240, 210], "=": [236, 224, 196], w: [255, 255, 245], k: [180, 160, 120], "-": [200, 180, 140] });

  icons.feather = iconArt([
    ".........ww.....",
    "........wWWw....",
    ".......wWWWw....",
    "......wWWWw.....",
    ".....wWWWw......",
    "....wWWWw.......",
    "...wqWWw........",
    "...qqq..........",
    "..qq............",
  ], { W: [255, 255, 255], w: [220, 220, 225], q: [140, 110, 70] });

  icons.string = iconArt([
    "...s..s.........",
    "...ss.ss.s......",
    "....s..s.s......",
    "....ss.ss.......",
    ".....s..s.s.....",
    ".....ss.ss......",
    "......s..s......",
    "......ss.s......",
    ".......s........",
  ], { s: [232, 232, 220] });

  icons.bone = iconArt([
    "..oo......oo....",
    ".o==o....o==o...",
    ".o==oooooo==o...",
    "..o========o....",
    "...o======o.....",
    "...o======o.....",
    "..o========o....",
    ".o==oooooo==o...",
    ".o==o....o==o...",
    "..oo......oo....",
  ], { o: [250, 245, 220], "=": [230, 224, 198] });

  icons.sugar = iconArt([
    "................",
    "......oooo......",
    ".....o====o.....",
    "....o======o....",
    "....========k...",
    ".....======k....",
    "......----......",
  ], { o: [255, 255, 255], "=": [240, 240, 246], k: [190, 190, 200], "-": [210, 210, 218] });

  icons.shears = iconArt([
    "....mm......mm..",
    "....mm......mm..",
    ".....mm....mm...",
    "......mm..mm....",
    ".......mmmm.....",
    "......wwww......",
    ".....ww..ww.....",
    "....wu....uw....",
    "...wu......uw...",
    "..uv........vu..",
  ], { m: [210, 210, 220], w: [160, 110, 58], u: [124, 82, 40], v: [86, 54, 24] });

  icons.leather = iconArt([
    "................",
    "....oooooooo....",
    "...o========o...",
    "..o==========o..",
    "..====o=======-.",
    "..============-.",
    "...-========-...",
    "....--------....",
  ], { o: [186, 122, 70], "=": [150, 90, 50], "-": [100, 58, 28] });

  icons.paper = iconArt([
    "....oooooooo....",
    "...o========o...",
    "...==========o..",
    "...==========o..",
    "...==========o..",
    "...==========-..",
    "...==========-..",
    "....--------....",
  ], { o: [255, 255, 252], "=": [242, 242, 236], "-": [200, 200, 190] });

  icons.book = iconArt([
    "....kkkkkkkk....",
    "...kppppppppk...",
    "...kppppppppk...",
    "...kppppppppk...",
    "...kppppppppk...",
    "...kppppppppk...",
    "...kppppppppk...",
    "....kkkkkkkk....",
  ], { k: [92, 42, 18], p: [236, 224, 190] });

  icons.bowl = iconArt([
    "................",
    "................",
    "...w........w...",
    "...wwwwwwwwww...",
    "....uuuuuuuu....",
    ".....vvvvvv.....",
  ], wood);
  icons.mushroom_stew = iconArt([
    "................",
    ".....ssssss.....",
    "....srrBBrrs....",
    "...wssssssssw...",
    "...wwwwwwwwww...",
    "....uuuuuuuu....",
    ".....vvvvvv.....",
  ], { ...wood, s: [210, 120, 50], r: [180, 40, 30], B: [140, 90, 50] });

  icons.cookie = iconArt([
    "................",
    ".....oooooo.....",
    "....o==kk==o....",
    "...o========o...",
    "...===k======k..",
    "...o========o...",
    "....o======o....",
    ".....------.....",
  ], { o: [200, 140, 60], "=": [176, 114, 46], k: [50, 24, 10], "-": [120, 70, 28] });

  icons.pumpkin_pie = iconArt([
    "................",
    "....cccccccc....",
    "...c========c...",
    "..c==========c..",
    "..============k.",
    "...-========k...",
    "....--------....",
  ], { c: [250, 230, 180], "=": [220, 140, 36], k: [160, 90, 16], "-": [180, 110, 24] });

  icons.gunpowder = iconArt([
    "................",
    ".....kkkk.......",
    "....kkooek......",
    "...kkoooeek.....",
    "...kooooeek.....",
    "....kooekk......",
    ".....kkkk.......",
  ], { k: [36, 36, 40], o: [60, 60, 66], e: [110, 110, 118] });

  icons.bone_meal = drawTile((d) => {
    clearTile(d);
    for (let i = 0; i < 36; i++) {
      const x = 3 + ((rng() * 10) | 0);
      const y = 4 + ((rng() * 8) | 0);
      const c = rng() > 0.35 ? [250, 250, 240] : [220, 220, 205];
      px(d, x, y, c[0], c[1], c[2]);
    }
  });

  icons.brick = iconArt([
    "................",
    "................",
    "...oooooooooo...",
    "...==========-..",
    "...==========-..",
    "...==========-..",
    "....--------....",
  ], { o: [190, 100, 70], "=": [150, 70, 50], "-": [100, 40, 28] });

  function dye(c) {
    const pal = { o: shade(c, 40), "=": c, "-": shade(c, -40), k: shade(c, -70), w: [230, 230, 220] };
    return iconArt([
      ".......ww.......",
      "......w==w......",
      "......w==w......",
      ".....o====o.....",
      "....o======o....",
      "....========k...",
      "....========k...",
      ".....======k....",
      "......-==k......",
      ".......--.......",
    ], pal);
  }
  icons.yellow_dye = dye([240, 220, 40]);
  icons.red_dye = dye([200, 30, 30]);
  icons.blue_dye = dye([40, 50, 180]);
  icons.black_dye = dye([25, 25, 28]);
  icons.green_dye = dye([50, 130, 40]);
  icons.white_dye = dye([240, 240, 245]);
  icons.orange_dye = dye([230, 120, 30]);
  icons.pink_dye = dye([240, 150, 170]);
  icons.brown_dye = dye([110, 70, 40]);

  icons.bow = iconArt([
    ".....ww.........",
    "....wuu.s.......",
    "...wu...s.......",
    "...wu...s.......",
    "...wu...s.......",
    "...wu...s.......",
    "...wu...s.......",
    "...wu...s.......",
    "....wuu.s.......",
    ".....ww.........",
  ], { w: [176, 122, 62], u: [124, 82, 40], s: [230, 230, 220] });

  icons.arrow = iconArt([
    ".............ff.",
    "............fss.",
    "...........fss..",
    "..........ss....",
    ".........ss.....",
    "........ss......",
    ".......ss.......",
    "......ss........",
    "....tt..........",
    "...ttt..........",
    "..tt............",
  ], { t: [70, 70, 76], s: [176, 122, 62], f: [210, 40, 40] });

  icons.flint_and_steel = iconArt([
    ".........mmm....",
    "........mmmm....",
    ".......mm..m....",
    "......mm........",
    "....kkm.........",
    "...kkkk.........",
    "...kkk..........",
    "....kk..........",
  ], { m: [210, 210, 220], k: [56, 56, 62] });

  function bucket(fill) {
    const pal = {
      m: [186, 186, 192],
      "=": [140, 140, 148],
      "-": [80, 80, 88],
      k: [36, 36, 40],
      f: fill,
    };
    return iconArt([
      "..m..........m..",
      "...m........m...",
      "...mmmmmmmmmm...",
      "...mffffffffm...",
      "...mffffffffm...",
      "...mffffffffm...",
      "...m========m...",
      "....-======-....",
      ".....------.....",
    ], pal);
  }
  icons.bucket = bucket([36, 36, 40]);
  icons.water_bucket = bucket([40, 100, 210]);
  icons.lava_bucket = bucket([230, 90, 16]);

  icons.fishing_rod = iconArt([
    ".............ss.",
    "............s...",
    "...........s....",
    "..........w.....",
    ".........wu.....",
    "........wu......",
    ".......wu.......",
    "......wu........",
    ".....wu.........",
    "....wu..........",
    "...uv...........",
  ], { ...wood, s: [220, 220, 230] });

  icons.cooked_salmon = iconArt([
    "................",
    "....oooooo......",
    "...oOOOOOOo.....",
    "..oOOOOOOOOo....",
    "...oOOOOOOo.....",
    "....o....o......",
  ], { o: [180, 70, 50], O: [220, 110, 70] });

  icons.cod = iconArt([
    "................",
    ".....sssss......",
    "....sSSSSSs.....",
    "...sSSSSSSSs....",
    "....sSSSSSs.....",
    ".....s...s......",
  ], { s: [140, 150, 160], S: [180, 190, 200] });

  icons.salmon = iconArt([
    "................",
    ".....ooooo......",
    "....oOOOOOo.....",
    "...oOOOOOOOo....",
    "....oOOOOOo.....",
    ".....o...o......",
  ], { o: [160, 70, 55], O: [200, 100, 75] });

  icons.cooked_cod = iconArt([
    "................",
    ".....wwwww......",
    "....wWWWWWw.....",
    "...wWWWWWWWw....",
    "....wWWWWWw.....",
    ".....w...w......",
  ], { w: [180, 150, 90], W: [220, 190, 120] });

  icons.ender_pearl = iconArt([
    "................",
    "......oooo......",
    "....oo====oo....",
    "...o==ww====o...",
    "...o===ww===k...",
    "...o========k...",
    "....-======k....",
    ".....-====k.....",
    "......----......",
  ], { o: [40, 180, 140], "=": [20, 140, 110], w: [180, 255, 220], k: [10, 70, 60], "-": [8, 50, 44] });

  icons.ender_eye = iconArt([
    "................",
    "......gggg......",
    "....ggyyyygg....",
    "...gyywwyyyyg...",
    "...gyyykkyyyg...",
    "...gyyyyyyyyg...",
    "....-yyyyyyk....",
    "......----......",
  ], { g: [30, 160, 70], y: [80, 230, 90], w: [240, 255, 200], k: [20, 40, 20], "-": [10, 70, 30] });

  icons.chorus_fruit = iconArt([
    "................",
    ".....pppppp.....",
    "....pPPPPPpp....",
    "...pPPwwPPPp....",
    "...pPPPPPPPp....",
    "....pPPPPPp.....",
    ".....pppppp.....",
  ], { p: [140, 70, 150], P: [180, 100, 190], w: [230, 180, 240] });

  icons.quartz = iconArt([
    "................",
    "......wwww......",
    "....wwWWWWWw....",
    "...wWWWWWWWWw...",
    "...wWWWWkWWWw...",
    "....wWWWWWWw....",
    ".....wwwwww.....",
  ], { w: [230, 225, 220], W: [250, 248, 245], k: [190, 185, 180] });

  icons.nether_brick = iconArt([
    "................",
    "....rrrrrrrr....",
    "...rrRRRRkkrr...",
    "...rrRRRRkkrr...",
    "....rrrrrrrr....",
    "....rrrrrrrr....",
    "...rrRRRRkkrr...",
    "...rrRRRRkkrr...",
    "....rrrrrrrr....",
  ], { r: [70, 28, 32], R: [90, 36, 40], k: [42, 16, 18] });

  icons.blaze_rod = iconArt([
    ".............yy.",
    "............yoo.",
    "...........yoo..",
    "..........yoo...",
    ".........yoo....",
    "........yoo.....",
    ".......yoo......",
    "......yoo.......",
    ".....yoo........",
    "....yoo.........",
  ], { y: [255, 220, 80], o: [230, 140, 30] });

  icons.blaze_powder = iconArt([
    "................",
    "....y..o.y......",
    "...oyyooooy.....",
    "....oooooo......",
    "...yoooooyy.....",
    "....oo.oo.......",
  ], { y: [255, 220, 70], o: [230, 120, 20] });

  icons.ghast_tear = iconArt([
    "................",
    "......cccc......",
    "....ccwwwccc....",
    "...cwwwwwkwc....",
    "...cwwwwwwwc....",
    "....ccwwccc.....",
    "......cccc......",
  ], { c: [180, 220, 230], w: [230, 250, 255], k: [140, 180, 200] });

  icons.magma_cream = iconArt([
    "................",
    ".....oooooo.....",
    "....oOOyOOOo....",
    "...oOyyyyyOo....",
    "...oOyyyyyOo....",
    "....oOOOOOo.....",
    ".....oooooo.....",
  ], { o: [180, 70, 20], O: [220, 110, 30], y: [255, 200, 60] });

  icons.gold_nugget = iconArt([
    "................",
    "......gggg......",
    ".....gGGGGg.....",
    ".....gGGkGg.....",
    "......gggg......",
  ], { g: [200, 160, 30], G: [255, 220, 70], k: [160, 120, 20] });

  icons.oak_boat = iconArt([
    "................",
    "................",
    "...w..........w.",
    "..wuu........uw.",
    ".wuUUUUUUUUUUuw.",
    ".wUUUUUUUUUUUUw.",
    "..wuuuuuuuuuuw..",
    "...wwwwwwwwww...",
  ], { w: [92, 58, 28], u: [150, 102, 52], U: [176, 122, 62] });

  icons.compass = iconArt([
    ".....oooooo.....",
    "....o======o....",
    "...o===n===ko...",
    "...o==nwn==ko...",
    "...o===s===ko...",
    "....o======o....",
    ".....------.....",
  ], { o: [200, 50, 50], "=": [230, 230, 230], n: [200, 30, 30], s: [40, 40, 50], w: [20, 20, 24], k: [140, 30, 30], "-": [120, 24, 24] });

  icons.clock = iconArt([
    ".....oooooo.....",
    "....o======o....",
    "...o===hh==ko...",
    "...o===h===ko...",
    "...o=======ko...",
    "....o======o....",
    ".....------.....",
  ], { o: [250, 200, 40], "=": [255, 230, 120], h: [80, 50, 10], k: [180, 130, 20], "-": [160, 110, 16] });

  const handleArt = [
    "................",
    "................",
    "................",
    "........w.......",
    ".......wu.......",
    "......wu........",
    ".....wu.........",
    "....wu..........",
    "...wu...........",
    "..wu............",
    ".wu.............",
    ".uv.............",
  ];

  const heads = {
    wooden: [176, 142, 78],
    stone: [140, 140, 144],
    iron: [220, 220, 226],
    golden: [250, 210, 40],
    diamond: [70, 230, 230],
  };

  const pickHead = [
    "......=======...",
    ".....==ooo===...",
    "....==....==--..",
    "........==--....",
    "........=-......",
  ];
  const axeHead = [
    ".....========...",
    "....===ooo===...",
    "....===oo===....",
    "....=====-......",
    ".....====.......",
  ];
  const shovelHead = [
    ".......====.....",
    "......==oo==....",
    "......==oo==....",
    ".......====.....",
    "........==......",
  ];
  const hoeHead = [
    ".....=========..",
    "....=====.......",
    "........==......",
    "........==......",
  ];
  const swordArt = [
    "...........o=...",
    "..........o==-..",
    ".........o==-...",
    "........o==-....",
    ".......o==-.....",
    "......o==-......",
    ".....g==-.......",
    "....ggg.........",
    ".....w..........",
    ".....wu.........",
    "......u.........",
    "......v.........",
  ];

  for (const [tier, col] of Object.entries(heads)) {
    const hp = { o: shade(col, 40), "=": col, "-": shade(col, -40) };
    icons[`${tier}_pickaxe`] = drawTile((d) => {
      clearTile(d);
      stamp(d, handleArt, wood);
      stamp(d, pickHead, hp);
    });
    icons[`${tier}_axe`] = drawTile((d) => {
      clearTile(d);
      stamp(d, handleArt, wood);
      stamp(d, axeHead, hp);
    });
    icons[`${tier}_shovel`] = drawTile((d) => {
      clearTile(d);
      stamp(d, handleArt, wood);
      stamp(d, shovelHead, hp);
    });
    icons[`${tier}_hoe`] = drawTile((d) => {
      clearTile(d);
      stamp(d, handleArt, wood);
      stamp(d, hoeHead, hp);
    });
    icons[`${tier}_sword`] = iconArt(swordArt, {
      o: shade(col, 45),
      "=": col,
      "-": shade(col, -40),
      g: [86, 86, 92],
      ...wood,
    });
  }

  function armor(color, kind) {
    const pal = {
      o: shade(color, 35),
      "=": color,
      "-": shade(color, -40),
      k: [18, 18, 22],
    };
    if (kind === "helmet") {
      return iconArt([
        "................",
        "....oooooooo....",
        "...o========o...",
        "...==========-..",
        "...===kk===kk-..",
        "...==========-..",
        "....--....--....",
      ], pal);
    }
    if (kind === "chestplate") {
      return iconArt([
        "..oo........oo..",
        "..o==========o..",
        "...==========-..",
        "...==========-..",
        "...===----===-..",
        "...==========-..",
        "...==========-..",
        "....--------....",
      ], pal);
    }
    if (kind === "leggings") {
      return iconArt([
        "...oooooooooo...",
        "...==========-..",
        "...===-..-===-..",
        "...===....===-..",
        "...===....===-..",
        "...===....===-..",
        "...===....===-..",
        "....--....--....",
      ], pal);
    }
    return iconArt([
      "................",
      "................",
      "...ooo....ooo...",
      "...===-..-===-..",
      "...===-..-===-..",
      "...===-..-===-..",
      "....--....--....",
    ], pal);
  }
  for (const [mat, col] of [["leather", [120, 76, 42]], ["iron", [200, 200, 206]], ["diamond", [48, 210, 198]]]) {
    icons[`${mat}_helmet`] = armor(col, "helmet");
    icons[`${mat}_chestplate`] = armor(col, "chestplate");
    icons[`${mat}_leggings`] = armor(col, "leggings");
    icons[`${mat}_boots`] = armor(col, "boots");
  }

  return icons;
}

export function faceTile(block, face) {
  if (block.faces?.[face]) return block.faces[face];
  if (block.faces?.side && (face === "north" || face === "south" || face === "west" || face === "east")) {
    return block.faces.side;
  }
  if (face === "north" && block.faces?.front) return block.faces.front;
  return block.key;
}
