import { Noise, hash2 } from "../core/noise.js";
import {
  AIR, STONE, GRASS, DIRT, SAND, GRAVEL, WATER, LAVA, BEDROCK, LOG, LEAVES,
  COAL_ORE, IRON_ORE, GOLD_ORE, DIAMOND_ORE, SANDSTONE, CACTUS, CLAY, SNOW,
  PUMPKIN, MELON, PODZOL, GLOWSTONE, LAPIS_ORE, REDSTONE_ORE, CHEST,
  ANDESITE, DIORITE, GRANITE, BIRCH_LOG, BIRCH_LEAVES, SPRUCE_LOG, SPRUCE_LEAVES,
  JUNGLE_LOG, JUNGLE_LEAVES, EMERALD_ORE, COPPER_ORE, MYCELIUM, PACKED_ICE,
  TERRACOTTA, SUGAR_CANE, DANDELION, POPPY, MUSHROOM_RED, MUSHROOM_BROWN,
  PLANKS, TORCH, COBBLE, GLASS, CRAFTING, MOSSY, COBWEB, TALL_GRASS, ICE,
  OAK_DOOR, OAK_DOOR_TOP, FURNACE, FARMLAND, WHEAT_1, WHEAT_2, WHEAT_3,
  HAY, SPRUCE_PLANKS, IRON_BLOCK, BOOKSHELF, RED_TERRACOTTA, ORANGE_TERRACOTTA,
  YELLOW_TERRACOTTA, PRISMARINE, RED_WOOL, BROWN_WOOL, NETHERRACK, BRICKS,
  OBSIDIAN, GOLD_BLOCK, SOUL_SAND, NETHER_BRICKS, NETHER_QUARTZ_ORE, MAGMA_BLOCK,
  NETHER_WART, CRIMSON_NYLIUM, WARPED_NYLIUM, BLACKSTONE, CRIMSON_STEM, WARPED_STEM,
  CRIMSON_WART, WARPED_WART, NETHER_PORTAL, END_STONE, END_PORTAL_FRAME, CHORUS_PLANT,
  CHORUS_FLOWER, PURPUR, STONEBRICK,
} from "./blocks.js";

export const SIZE = 16;
export const HEIGHT = 96;
export const SEA = 42;

export const BIOME = {
  OCEAN: 0,
  BEACH: 1,
  PLAINS: 2,
  FOREST: 3,
  DESERT: 4,
  MOUNTAIN: 5,
  TAIGA: 6,
  SWAMP: 7,
  JUNGLE: 8,
  SNOW_MOUNTAIN: 9,
  SAVANNA: 10,
  BADLANDS: 11,
  BIRCH_FOREST: 12,
  MUSHROOM: 13,
  SNOWY_PLAINS: 14,
  FLOWER_FOREST: 15,
  WARM_OCEAN: 16,
  FROZEN_OCEAN: 17,
};

export const BIOME_NAMES = {
  [BIOME.OCEAN]: "ocean",
  [BIOME.BEACH]: "beach",
  [BIOME.PLAINS]: "plains",
  [BIOME.FOREST]: "forest",
  [BIOME.DESERT]: "desert",
  [BIOME.MOUNTAIN]: "mountains",
  [BIOME.TAIGA]: "taiga",
  [BIOME.SWAMP]: "swamp",
  [BIOME.JUNGLE]: "jungle",
  [BIOME.SNOW_MOUNTAIN]: "snowy_peaks",
  [BIOME.SAVANNA]: "savanna",
  [BIOME.BADLANDS]: "badlands",
  [BIOME.BIRCH_FOREST]: "birch_forest",
  [BIOME.MUSHROOM]: "mushroom_fields",
  [BIOME.SNOWY_PLAINS]: "snowy_plains",
  [BIOME.FLOWER_FOREST]: "flower_forest",
  [BIOME.WARM_OCEAN]: "warm_ocean",
  [BIOME.FROZEN_OCEAN]: "frozen_ocean",
};

export const NETHER_BIOME = {
  WASTES: 0,
  SOUL: 1,
  CRIMSON: 2,
  WARPED: 3,
  BASALT: 4,
};

export const NETHER_BIOME_NAMES = {
  [NETHER_BIOME.WASTES]: "nether_wastes",
  [NETHER_BIOME.SOUL]: "soul_sand_valley",
  [NETHER_BIOME.CRIMSON]: "crimson_forest",
  [NETHER_BIOME.WARPED]: "warped_forest",
  [NETHER_BIOME.BASALT]: "basalt_deltas",
};

export class TerrainGenerator {
  constructor(seed, worldType = "default") {
    this.seed = seed | 0;
    this.worldType = worldType;
    this.n = new Noise(this.seed);
    this.n2 = new Noise(this.seed ^ 0x9e3779b9);
    this.n3 = new Noise(this.seed ^ 0x85ebca6b);
    this.spawned = new Set();
    this.dim = "overworld";
    this.dragonDead = false;
  }

  voronoiNeighborhood(wx, wz) {
    const cell = this.worldType === "largeBiomes" ? 168 : 88;
    const gx = Math.floor(wx / cell);
    const gz = Math.floor(wz / cell);
    const sites = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const ix = gx + dx;
        const iz = gz + dz;
        const jx = (ix + 0.22 + hash2(ix, iz, this.seed) * 0.56) * cell;
        const jz = (iz + 0.22 + hash2(ix, iz, this.seed + 11) * 0.56) * cell;
        const ddx = wx - jx;
        const ddz = wz - jz;
        sites.push({
          b: this.landBiomeAtCell(ix, iz),
          d2: ddx * ddx + ddz * ddz,
          jx,
          jz,
          ix,
          iz,
        });
      }
    }
    return { cell, sites };
  }

  biome(wx, wz) {
    const cont = this.n.fbm2(wx * 0.00135, wz * 0.00135, 4);
    if (cont < -0.26) {
      const temp = this.n2.fbm2(wx * 0.00115, wz * 0.00115, 3);
      if (temp > 0.22) return BIOME.WARM_OCEAN;
      if (temp < -0.24) return BIOME.FROZEN_OCEAN;
      return BIOME.OCEAN;
    }
    if (cont < -0.15) return BIOME.BEACH;
    const { sites } = this.voronoiNeighborhood(wx, wz);
    let best = 1e15;
    let b = BIOME.PLAINS;
    for (const s of sites) {
      if (s.d2 < best) {
        best = s.d2;
        b = s.b;
      }
    }
    return b;
  }

  landBiomeAtCell(ix, iz) {
    const u = hash2(ix, iz, this.seed + 19);
    if (u < 0.16) return BIOME.PLAINS;
    if (u < 0.27) return BIOME.FOREST;
    if (u < 0.34) return BIOME.BIRCH_FOREST;
    if (u < 0.40) return BIOME.FLOWER_FOREST;
    if (u < 0.48) return BIOME.DESERT;
    if (u < 0.54) return BIOME.SAVANNA;
    if (u < 0.60) return BIOME.TAIGA;
    if (u < 0.65) return BIOME.SNOWY_PLAINS;
    if (u < 0.71) return BIOME.MOUNTAIN;
    if (u < 0.77) return BIOME.SNOW_MOUNTAIN;
    if (u < 0.82) return BIOME.BADLANDS;
    if (u < 0.88) return BIOME.JUNGLE;
    if (u < 0.94) return BIOME.SWAMP;
    return BIOME.MUSHROOM;
  }

  landBaseHeight(b, gentle, mid) {
    if (b === BIOME.DESERT) return SEA + 2 + Math.abs(mid) * 3.2;
    if (b === BIOME.TAIGA) return SEA + 5 + mid * 5;
    if (b === BIOME.SWAMP) return SEA - 1 + gentle * 1.6;
    if (b === BIOME.FOREST || b === BIOME.BIRCH_FOREST) return SEA + 4 + mid * 4.2;
    if (b === BIOME.FLOWER_FOREST) return SEA + 3 + mid * 3.4;
    if (b === BIOME.JUNGLE) return SEA + 5 + mid * 5.5;
    if (b === BIOME.MOUNTAIN || b === BIOME.SNOW_MOUNTAIN) return SEA + 4 + mid * 4.5;
    if (b === BIOME.SAVANNA) return SEA + 6 + Math.max(0, mid) * 4.5;
    if (b === BIOME.BADLANDS) return SEA + 7 + Math.abs(mid) * 9;
    if (b === BIOME.MUSHROOM) return SEA + 3 + gentle * 2.2;
    if (b === BIOME.SNOWY_PLAINS) return SEA + 3 + gentle * 1.2;
    return SEA + 2 + gentle * 1.6;
  }

  height(wx, wz) {
    if (this.worldType === "superflat") return 8;
    const cont = this.n.fbm2(wx * 0.0022, wz * 0.0022, 4);
    const gentle = this.n.fbm2(wx * 0.004, wz * 0.004, 2);
    if (cont < -0.26) {
      let depth = SEA - 8 - (cont + 0.3) * 14;
      const temp = this.n2.fbm2(wx * 0.00115, wz * 0.00115, 3);
      if (temp > 0.22) depth = Math.max(depth, SEA - 11);
      if (cont < -0.4) depth -= 7;
      return Math.max(2, Math.min(HEIGHT - 8, depth | 0));
    }
    if (cont < -0.15) {
      return Math.max(2, Math.min(HEIGHT - 8, (SEA + 1 + gentle * 1.2) | 0));
    }

    const mid = this.n.fbm2(wx * 0.006, wz * 0.006, 3);
    const warpX = this.n2.fbm2(wx * 0.0052, wz * 0.0052, 3) * 22;
    const warpZ = this.n3.fbm2(wx * 0.0052 + 28, wz * 0.0052, 3) * 22;
    const nibble = this.n.perlin2(wx * 0.027, wz * 0.027);
    const { cell, sites } = this.voronoiNeighborhood(wx, wz);
    const invBlend = 1 / ((cell * 0.32) * (cell * 0.32));
    let hSum = 0;
    let wSum = 0;
    let mountainMask = 0;
    let snowMask = 0;
    let peakScale = 20;
    for (const s of sites) {
      const w = Math.exp(-s.d2 * invBlend);
      hSum += w * this.landBaseHeight(s.b, gentle, mid);
      wSum += w;
      if (s.b !== BIOME.MOUNTAIN && s.b !== BIOME.SNOW_MOUNTAIN) continue;
      const ang = hash2(s.ix, s.iz, this.seed + 31) * Math.PI * 2;
      const stretch = 0.46 + hash2(s.ix, s.iz, this.seed + 32) * 1.2;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const dx = wx + warpX - s.jx;
      const dz = wz + warpZ - s.jz;
      const rx = dx * c + dz * sn;
      const rz = (-dx * sn + dz * c) * stretch;
      const d = Math.hypot(rx, rz);
      const reach = cell * (0.4 + hash2(s.ix, s.iz, this.seed + 33) * 0.4);
      let t = 1 - Math.min(1, d / Math.max(8, reach));
      t = t * t * (3 - 2 * t);
      t *= 0.8 + nibble * 0.32;
      t = Math.max(0, Math.min(1, t));
      const tall = 15 + hash2(s.ix, s.iz, this.seed + 34) * 17;
      if (s.b === BIOME.SNOW_MOUNTAIN) {
        if (t > snowMask) {
          snowMask = t;
          peakScale = tall + 4;
        }
      } else if (t > mountainMask) {
        mountainMask = t;
        peakScale = tall;
      }
    }
    let h = hSum / Math.max(1e-6, wSum) + cont * 4;
    const mask = Math.max(mountainMask, snowMask);
    if (mask > 0.002) {
      const snowish = snowMask >= mountainMask;
      const ridge = 1 - Math.abs(this.n2.fbm2((wx + warpX) * 0.0036, (wz + warpZ) * 0.0036, 5));
      const ridge2 = 1 - Math.abs(this.n3.fbm2(wx * 0.012, wz * 0.0055, 3));
      const crag = this.n.fbm2(wx * 0.03, wz * 0.03, 3);
      h += mask * (2 + mask * 4);
      h += mask * (ridge * ridge * ridge * 0.55 + ridge * ridge * 0.45) * (snowish ? peakScale + 3 : peakScale);
      h += mask * ridge2 * ridge2 * 11;
      h += mask * crag * 8;
    }
    if (mask < 0.22 && h > SEA - 2 && h < SEA + 16) {
      const rv = Math.abs(this.n3.fbm2(wx * 0.0035 + 90, wz * 0.0035 - 40, 4));
      const river = Math.max(0, (0.11 - rv) / 0.11);
      if (river > 0) {
        const bed = SEA - 1;
        const shore = SEA + 1;
        const target = bed + (1 - river) * (shore - bed + 0.35);
        const mix = Math.min(1, river * 1.25);
        h = h * (1 - mix) + target * mix;
      }
    }
    return Math.max(2, Math.min(HEIGHT - 8, h | 0));
  }

  fillChunk(chunk) {
    if (this.dim === "nether") {
      this.fillNether(chunk);
      return;
    }
    if (this.dim === "end") {
      this.fillEnd(chunk);
      return;
    }
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    if (this.worldType === "superflat") {
      for (let x = 0; x < SIZE; x++) {
        for (let z = 0; z < SIZE; z++) {
          set(blocks, x, 0, z, BEDROCK);
          set(blocks, x, 1, z, DIRT);
          set(blocks, x, 2, z, DIRT);
          set(blocks, x, 3, z, GRASS);
        }
      }
      this.placeStronghold(chunk);
      return;
    }

    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const wx = ox + x;
        const wz = oz + z;
        const b = this.biome(wx, wz);
        const h = this.height(wx, wz);
        const dirtDepth = 3 + (((this.n.perlin2(wx * 0.028, wz * 0.028) + 1) * 1.1) | 0);

        for (let y = 0; y < HEIGHT; y++) {
          if (y === 0) {
            set(blocks, x, y, z, BEDROCK);
            continue;
          }
          if (y > h) {
            if (y <= SEA) set(blocks, x, y, z, WATER);
            continue;
          }

          let id = STONE;
          if (y > h - dirtDepth) {
            if (b === BIOME.DESERT) id = (y === h && hash2(wx, wz, this.seed + 8) > 0.9) ? TERRACOTTA : SAND;
            else if (b === BIOME.BEACH) id = y > h - 2 ? SAND : SANDSTONE;
            else if (b === BIOME.OCEAN) id = y > h - 2 ? (hash2(wx, y, wz) > 0.4 ? SAND : GRAVEL) : DIRT;
            else if (b === BIOME.SWAMP) {
              if (y === h && hash2(wx, wz, this.seed + 17) > 0.82) id = MYCELIUM;
              else id = y === h ? GRASS : DIRT;
            } else if (b === BIOME.TAIGA) id = y === h ? SNOW : DIRT;
            else if (b === BIOME.SNOW_MOUNTAIN) {
              const ice = this.n2.perlin2(wx * 0.038, wz * 0.038);
              if (ice > 0.34 && y > h - 4) {
                id = ice > 0.48 || y < h ? PACKED_ICE : ICE;
              } else if (y === h) {
                if (h > SEA + 22 && hash2(wx, wz, this.seed + 8) > 0.76) id = STONE;
                else id = SNOW;
              } else id = DIRT;
            } else if (b === BIOME.MOUNTAIN && y === h) {
              const snowLine = SEA + 13 + this.n2.perlin2(wx * 0.022, wz * 0.022) * 9;
              const rock = this.n.perlin2(wx * 0.04, wz * 0.04);
              if (h > snowLine + 10 && rock > 0.18) id = STONE;
              else if (h > snowLine) id = SNOW;
              else if (rock > 0.42) id = STONE;
              else id = GRASS;
            } else if (b === BIOME.JUNGLE) id = y === h ? GRASS : DIRT;
            else if (b === BIOME.SAVANNA) {
              if (y === h) id = hash2(wx, wz, this.seed + 14) > 0.82 ? TERRACOTTA : GRASS;
              else id = DIRT;
            } else if (b === BIOME.BADLANDS) {
              const band = [TERRACOTTA, RED_TERRACOTTA, ORANGE_TERRACOTTA, YELLOW_TERRACOTTA, SANDSTONE, RED_TERRACOTTA];
              id = band[(((h - y) + ((wx / 5) | 0) + ((wz / 9) | 0)) % band.length + band.length) % band.length];
              if (y === h && hash2(wx, wz, this.seed + 8) > 0.55) id = SAND;
            } else if (b === BIOME.BIRCH_FOREST || b === BIOME.FLOWER_FOREST) id = y === h ? GRASS : DIRT;
            else if (b === BIOME.MUSHROOM) id = y === h ? MYCELIUM : DIRT;
            else if (b === BIOME.SNOWY_PLAINS) id = y === h ? SNOW : DIRT;
            else if (b === BIOME.WARM_OCEAN) id = y > h - 2 ? (hash2(wx, y, wz) > 0.55 ? SAND : PRISMARINE) : SAND;
            else if (b === BIOME.FROZEN_OCEAN) id = y > h - 2 ? (hash2(wx, wz, this.seed + 6) > 0.5 ? PACKED_ICE : GRAVEL) : DIRT;
            else if (b === BIOME.FOREST && this.n2.perlin2(wx * 0.038, wz * 0.038) > 0.22) id = y === h ? PODZOL : DIRT;
            else id = y === h ? (h < SEA ? DIRT : GRASS) : DIRT;
            if (y === h && h < SEA && b !== BIOME.WARM_OCEAN && b !== BIOME.FROZEN_OCEAN) id = DIRT;
          }
          if (y < 4 && hash2(wx, y, wz + this.seed) > 0.6) id = BEDROCK;
          set(blocks, x, y, z, id);
        }
        if (h < SEA - 2 && hash2(wx, wz, this.seed + 11) > 0.82) {
          set(blocks, x, Math.max(1, h - 2), z, CLAY);
          set(blocks, x, Math.max(1, h - 1), z, CLAY);
        }
        if (b === BIOME.OCEAN && h < SEA - 4 && hash2(wx, wz, this.seed + 44) > 0.96) {
          set(blocks, x, Math.max(1, h), z, PACKED_ICE);
        }
        if (b === BIOME.FROZEN_OCEAN) {
          const berg = this.n2.fbm2(wx * 0.018, wz * 0.018, 3);
          if (berg > 0.32) {
            const top = Math.min(HEIGHT - 4, SEA + 1 + (((berg - 0.32) * 16) | 0));
            for (let y = Math.max(h + 1, SEA - 3); y <= top; y++) {
              set(blocks, x, y, z, y > SEA + 3 && berg > 0.55 ? SNOW : PACKED_ICE);
            }
          } else if (h < SEA) {
            set(blocks, x, SEA, z, ICE);
          }
        }
        if (b === BIOME.WARM_OCEAN && h < SEA - 3 && hash2(wx, wz, this.seed + 61) > 0.93) {
          const ch = 1 + ((hash2(wx, wz, this.seed + 62) * 3) | 0);
          for (let i = 1; i <= ch && h + i < SEA; i++) set(blocks, x, h + i, z, PRISMARINE);
        }
      }
    }

    this.carveCaves(chunk);
    this.carveRavines(chunk);
    this.placeDirtGravel(chunk);
    this.placeOreVeins(chunk);
    this.placeStoneVariants(chunk);
    this.placeCaveLiquids(chunk);
    this.placeTrees(chunk);
    this.placeFeatures(chunk);
    this.placeHut(chunk);
    this.placeVillage(chunk);
    this.placeShipwreck(chunk);
    this.placeMineshaft(chunk);
    this.placeDungeon(chunk);
    this.placeRuinedPortal(chunk);
    this.placeStronghold(chunk);
  }

  canCarve(id) {
    return id === STONE || id === DIRT || id === GRAVEL || id === ANDESITE || id === DIORITE
      || id === GRANITE || id === SAND || id === SANDSTONE || id === TERRACOTTA || id === GRASS
      || id === PODZOL || id === SNOW || id === CLAY || id === COAL_ORE || id === IRON_ORE
      || id === COPPER_ORE || id === GOLD_ORE || id === MYCELIUM || id === ICE || id === PACKED_ICE
      || id === RED_TERRACOTTA || id === ORANGE_TERRACOTTA || id === YELLOW_TERRACOTTA || id === PRISMARINE;
  }

  carveCaves(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const wx = ox + x;
        const wz = oz + z;
        const h = this.height(wx, wz);
        const ocean = this.biome(wx, wz) === BIOME.OCEAN || this.biome(wx, wz) === BIOME.BEACH
          || this.biome(wx, wz) === BIOME.WARM_OCEAN || this.biome(wx, wz) === BIOME.FROZEN_OCEAN;
        const region = this.n.fbm2(wx * 0.0062, wz * 0.0062, 3);
        for (let y = 2; y < h; y++) {
          if (ocean && y >= h - 6) continue;
          const id = get(blocks, x, y, z);
          if (id === BEDROCK || id === WATER || id === LAVA) continue;
          if (!this.canCarve(id)) continue;

          const n1 = this.n3.perlin3(wx * 0.036, y * 0.048, wz * 0.036);
          const n2 = this.n2.perlin3(wx * 0.036 + 70, y * 0.048, wz * 0.036 + 25);
          const tube = Math.abs(n1) < 0.04 && Math.abs(n2) < 0.05;
          const spaghetti = region > -0.18 && region < 0.16 && tube && y > 4 && y < h - 5;

          const cheese = this.n3.fbm3(wx * 0.016, y * 0.024, wz * 0.016, 3);
          const cavern = region > 0.46 && cheese > 0.6 && y > 6 && y < Math.min(36, h - 12);

          const pocket = this.n.perlin3(wx * 0.11, y * 0.13, wz * 0.11) > 0.78
            && region < -0.22 && y > 8 && y < h - 8 && y < 40;

          if (!(spaghetti || cavern || pocket)) continue;
          if (cavern && y <= 7) set(blocks, x, y, z, LAVA);
          else set(blocks, x, y, z, AIR);
        }
      }
    }
  }

  carveRavines(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const region = 8;
    const rcx = Math.floor(chunk.cx / region);
    const rcz = Math.floor(chunk.cz / region);
    for (let drx = -1; drx <= 1; drx++) {
      for (let drz = -1; drz <= 1; drz++) {
        this.carveRavineRegion(chunk, ox, oz, rcx + drx, rcz + drz, region);
      }
    }
  }

  carveRavineRegion(chunk, ox, oz, rx, rz, region) {
    if (hash2(rx, rz, this.seed + 711) > 0.08) return;
    const yaw = hash2(rx, rz, this.seed + 2) * Math.PI * 2;
    const len = 42 + hash2(rx, rz, this.seed + 3) * 68;
    const cx = rx * region * SIZE + 8 + hash2(rx, rz, this.seed + 4) * (region * SIZE - 16);
    const cz = rz * region * SIZE + 8 + hash2(rx + 1, rz, this.seed + 5) * (region * SIZE - 16);
    const y0 = 16 + ((hash2(rx, rz, this.seed + 6) * 18) | 0);
    const depth = 10 + ((hash2(rx, rz, this.seed + 7) * 16) | 0);
    const width0 = 2.1 + hash2(rx, rz, this.seed + 8) * 2.2;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    const { blocks } = chunk;
    for (let lx = 0; lx < SIZE; lx++) {
      for (let lz = 0; lz < SIZE; lz++) {
        const wx = ox + lx;
        const wz = oz + lz;
        const dx = wx - cx;
        const dz = wz - cz;
        const along = dx * cos + dz * sin;
        const across = -dx * sin + dz * cos;
        if (along < 0 || along > len) continue;
        const t = along / len;
        const wiggle = Math.sin(along * 0.13 + rx) * 2.6;
        const dist = Math.abs(across - wiggle);
        const width = width0 * (0.5 + Math.sin(t * Math.PI) * 0.75);
        if (dist > width + 1.2) continue;
        const b = this.biome(wx, wz);
        if (b === BIOME.OCEAN || b === BIOME.WARM_OCEAN || b === BIOME.FROZEN_OCEAN) continue;
        const h = this.height(wx, wz);
        const top = Math.min(h + 1, y0 + 10);
        const bottom = Math.max(4, y0 - depth);
        const wall = Math.min(1, dist / (width + 0.05));
        const localBottom = bottom + wall * (top - bottom) * 0.42;
        for (let y = top; y >= localBottom; y--) {
          const slim = dist < width - Math.max(0, (h - y) * 0.06);
          if (!slim && y < h - 1) continue;
          const id = get(blocks, lx, y, lz);
          if (id === BEDROCK || id === WATER) continue;
          if (!this.canCarve(id) && id !== SNOW) continue;
          if (y <= 6) set(blocks, lx, y, lz, LAVA);
          else set(blocks, lx, y, lz, AIR);
        }
      }
    }
  }

  placeDirtGravel(chunk) {
    const specs = [
      { id: DIRT, tries: 6, size: 5, minY: 8, maxY: 60 },
      { id: GRAVEL, tries: 5, size: 5, minY: 5, maxY: 48 },
    ];
    this.placeBlobs(chunk, specs, (id) => id === STONE);
  }

  placeOreVeins(chunk) {
    const specs = [
      { id: COAL_ORE, tries: 6, size: 12, minY: 16, maxY: 68, scatter: 0.32 },
      { id: IRON_ORE, tries: 5, size: 8, minY: 8, maxY: 44, scatter: 0.30 },
      { id: COPPER_ORE, tries: 4, size: 7, minY: 12, maxY: 52, scatter: 0.30 },
      { id: GOLD_ORE, tries: 2, size: 6, minY: 4, maxY: 24, scatter: 0.26 },
      { id: REDSTONE_ORE, tries: 3, size: 6, minY: 2, maxY: 14, scatter: 0.26 },
      { id: LAPIS_ORE, tries: 2, size: 5, minY: 6, maxY: 26, scatter: 0.24 },
      { id: DIAMOND_ORE, tries: 1, size: 5, minY: 2, maxY: 13, scatter: 0.22 },
    ];
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    if (this.biome(ox + 8, oz + 8) === BIOME.MOUNTAIN || this.biome(ox + 8, oz + 8) === BIOME.SNOW_MOUNTAIN) {
      specs.push({ id: EMERALD_ORE, tries: 2, size: 3, minY: 32, maxY: 70, scatter: 0.2 });
    }
    this.placeVeins(chunk, specs);
  }

  placeVeins(chunk, specs) {
    const { blocks } = chunk;
    for (const spec of specs) {
      for (let t = 0; t < spec.tries; t++) {
        const hx = hash2(chunk.cx + t * 3, chunk.cz, this.seed + spec.minY + spec.id);
        const hz = hash2(chunk.cx, chunk.cz + t * 5, this.seed + 90 + spec.maxY);
        const hy = hash2(chunk.cx + spec.size, chunk.cz + t, this.seed + spec.id * 7);
        const yaw = hash2(chunk.cx + t, chunk.cz + spec.id, this.seed + 201) * Math.PI * 2;
        const pitch = (hash2(chunk.cx, chunk.cz + t + spec.id, this.seed + 202) - 0.5) * 0.85;
        let x = hx * (SIZE - 1);
        let z = hz * (SIZE - 1);
        let y = spec.minY + hy * (spec.maxY - spec.minY);
        const sx = Math.sin(yaw) * Math.cos(pitch);
        const sy = Math.sin(pitch);
        const sz = Math.cos(yaw) * Math.cos(pitch);
        for (let i = 0; i < spec.size; i++) {
          const px = (x + sx * i * 0.9) | 0;
          const py = (y + sy * i * 0.55) | 0;
          const pz = (z + sz * i * 0.9) | 0;
          for (let oy = -1; oy <= 1; oy++) {
            for (let ox = -1; ox <= 1; ox++) {
              for (let oz = -1; oz <= 1; oz++) {
                if (ox * ox + oy * oy + oz * oz > 2) continue;
                if (hash2(px + ox + i, pz + oz, this.seed + py + spec.id + t) > spec.scatter) continue;
                const bx = px + ox;
                const by = py + oy;
                const bz = pz + oz;
                if (bx < 0 || bz < 0 || bx >= SIZE || bz >= SIZE || by < 1 || by >= HEIGHT - 1) continue;
                if (get(blocks, bx, by, bz) === STONE) set(blocks, bx, by, bz, spec.id);
              }
            }
          }
        }
      }
    }
  }

  placeBlobs(chunk, specs, ok) {
    const { blocks } = chunk;
    for (const spec of specs) {
      for (let t = 0; t < spec.tries; t++) {
        const hx = hash2(chunk.cx + t * 3, chunk.cz, this.seed + spec.minY + spec.id);
        const hz = hash2(chunk.cx, chunk.cz + t * 5, this.seed + 90 + spec.maxY);
        const hy = hash2(chunk.cx + spec.size, chunk.cz + t, this.seed + spec.id * 7);
        const x = (hx * SIZE) | 0;
        const z = (hz * SIZE) | 0;
        const y = spec.minY + ((hy * (spec.maxY - spec.minY)) | 0);
        const r = 1.4 + spec.size / 7;
        const r2 = r * r;
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            for (let dz = -3; dz <= 3; dz++) {
              if (dx * dx + dy * dy + dz * dz > r2) continue;
              if (hash2(x + dx + t, z + dz, this.seed + y + spec.id) < 0.28) continue;
              const bx = x + dx;
              const by = y + dy;
              const bz = z + dz;
              if (bx < 0 || bz < 0 || bx >= SIZE || bz >= SIZE || by < 1 || by >= HEIGHT - 1) continue;
              if (ok(get(blocks, bx, by, bz))) set(blocks, bx, by, bz, spec.id);
            }
          }
        }
      }
    }
  }

  placeStoneVariants(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const h = this.height(ox + x, oz + z);
        for (let y = 1; y < h; y++) {
          if (get(blocks, x, y, z) !== STONE) continue;
          const stoneVar = hash2(ox + x + 3, y, oz + z + 9);
          if (stoneVar > 0.97) set(blocks, x, y, z, ANDESITE);
          else if (stoneVar > 0.94) set(blocks, x, y, z, DIORITE);
          else if (stoneVar > 0.91) set(blocks, x, y, z, GRANITE);
        }
      }
    }
  }

  placeCaveLiquids(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        for (let y = 8; y <= 16; y++) {
          if (get(blocks, x, y, z) !== AIR) continue;
          const below = get(blocks, x, y - 1, z);
          if (below === AIR || below === WATER || below === LAVA || below === BEDROCK) continue;
          if (get(blocks, x, y + 1, z) !== AIR) continue;
          if (hash2(ox + x, oz + z, this.seed + y + 66) > 0.985) {
            set(blocks, x, y, z, WATER);
            if (get(blocks, x, y + 1, z) === AIR && hash2(ox + x, y, oz + z) > 0.5) {
              set(blocks, x, y + 1, z, WATER);
            }
          }
        }
      }
    }
  }

  placeMineshaft(chunk) {
    const region = 7;
    const rcx = Math.floor(chunk.cx / region);
    const rcz = Math.floor(chunk.cz / region);
    for (let drx = -1; drx <= 1; drx++) {
      for (let drz = -1; drz <= 1; drz++) {
        this.mineshaftRegion(chunk, rcx + drx, rcz + drz, region);
      }
    }
  }

  mineshaftRegion(chunk, rx, rz, region) {
    if (hash2(rx, rz, this.seed + 880) > 0.08) return;
    const hubX = (rx * region * SIZE + 8 + ((hash2(rx, rz, this.seed + 10) * (region * SIZE - 16)) | 0)) | 0;
    const hubZ = (rz * region * SIZE + 8 + ((hash2(rx + 3, rz, this.seed + 11) * (region * SIZE - 16)) | 0)) | 0;
    const y = 10 + ((hash2(rx, rz, this.seed + 12) * 16) | 0);
    const lenX = 28 + ((hash2(rx, rz, this.seed + 13) * 36) | 0);
    const lenZ = 28 + ((hash2(rx, rz, this.seed + 14) * 36) | 0);
    this.mineshaftCorridor(chunk, hubX, hubZ, y, lenX, true);
    this.mineshaftCorridor(chunk, hubX, hubZ, y, lenZ, false);
    this.mineshaftRoom(chunk, hubX, hubZ, y);
  }

  mineshaftCorridor(chunk, hubX, hubZ, y, len, alongX) {
    const { blocks } = chunk;
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const a0 = alongX ? hubX - len : hubZ - len;
    const a1 = alongX ? hubX + len : hubZ + len;
    for (let a = a0; a <= a1; a++) {
      for (let s = -1; s <= 1; s++) {
        const wx = alongX ? a : hubX + s;
        const wz = alongX ? hubZ + s : a;
        const x = wx - ox;
        const z = wz - oz;
        if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
        const h = this.height(wx, wz);
        if (y + 4 >= h) continue;
        for (let dy = 0; dy <= 2; dy++) {
          const id = get(blocks, x, y + dy, z);
          if (id !== BEDROCK && id !== CHEST) set(blocks, x, y + dy, z, AIR);
        }
        const along = a - a0;
        const support = along % 5 === 0;
        if (support && s !== 0) {
          set(blocks, x, y, z, LOG);
          set(blocks, x, y + 1, z, LOG);
          set(blocks, x, y + 2, z, PLANKS);
        }
        if (support && s === 0) set(blocks, x, y + 2, z, PLANKS);
        if (s !== 0 && hash2(wx, wz, this.seed + 19) > 0.78) set(blocks, x, y + 2, z, COBWEB);
        if (s === 0 && support && hash2(wx, wz, this.seed + 21) > 0.88) {
          set(blocks, x, y, z, TORCH);
        }
        if (s === 0 && support && hash2(wx, wz, this.seed + 23) > 0.93) {
          const cx = alongX ? x : Math.min(SIZE - 1, x + 1);
          const cz = alongX ? Math.min(SIZE - 1, z + 1) : z;
          if (get(blocks, cx, y, cz) === AIR || get(blocks, cx, y, cz) === COBWEB) {
            set(blocks, cx, y, cz, CHEST);
            chunk.loot.push({ x: cx, y, z: cz, kind: "mineshaft" });
          }
        }
      }
    }
  }

  mineshaftRoom(chunk, hubX, hubZ, y) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const x = hubX + dx - ox;
        const z = hubZ + dz - oz;
        if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
        for (let dy = 0; dy <= 2; dy++) {
          const id = get(chunk.blocks, x, y + dy, z);
          if (id !== BEDROCK && id !== CHEST) set(chunk.blocks, x, y + dy, z, AIR);
        }
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        if (edge) {
          set(chunk.blocks, x, y, z, LOG);
          set(chunk.blocks, x, y + 2, z, PLANKS);
        }
        if (Math.abs(dx) === 2 && Math.abs(dz) === 2) set(chunk.blocks, x, y + 1, z, COBWEB);
      }
    }
    const lx = hubX + 1 - ox;
    const lz = hubZ - oz;
    if (lx >= 0 && lz >= 0 && lx < SIZE && lz < SIZE) {
      set(chunk.blocks, lx, y, lz, CHEST);
      chunk.loot.push({ x: lx, y, z: lz, kind: "mineshaft" });
    }
  }

  placeDungeon(chunk) {
    if (hash2(chunk.cx, chunk.cz, this.seed + 440) > 0.12) return;
    const x = 4 + ((hash2(chunk.cx, 1, this.seed + 41) * 8) | 0);
    const z = 4 + ((hash2(chunk.cz, 2, this.seed + 42) * 8) | 0);
    const y = 6 + ((hash2(chunk.cx, chunk.cz, this.seed + 43) * 18) | 0);
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    if (y + 5 >= this.height(ox + x, oz + z) - 2) return;
    let solid = 0;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 4; dy++) {
          const id = get(chunk.blocks, x + dx, y + dy, z + dz);
          if (id === STONE || id === ANDESITE || id === DIORITE || id === GRANITE || id === DIRT) solid++;
        }
      }
    }
    if (solid < 55) return;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        const moss = hash2(ox + x + dx, oz + z + dz, this.seed + 8) > 0.45 ? MOSSY : COBBLE;
        set(chunk.blocks, x + dx, y, z + dz, moss);
        for (let dy = 1; dy <= 3; dy++) {
          if (edge) set(chunk.blocks, x + dx, y + dy, z + dz, moss);
          else set(chunk.blocks, x + dx, y + dy, z + dz, AIR);
        }
        set(chunk.blocks, x + dx, y + 4, z + dz, moss);
      }
    }
    set(chunk.blocks, x, y + 1, z - 2, AIR);
    set(chunk.blocks, x, y + 2, z - 2, AIR);
    set(chunk.blocks, x, y + 1, z, CHEST);
    chunk.loot.push({ x, y: y + 1, z, kind: "dungeon" });
    set(chunk.blocks, x + 1, y + 1, z, hash2(x, z, this.seed) > 0.5 ? MUSHROOM_BROWN : MUSHROOM_RED);
    set(chunk.blocks, x - 1, y + 3, z - 1, COBWEB);
    set(chunk.blocks, x + 1, y + 3, z + 1, COBWEB);
    set(chunk.blocks, x - 1, y + 3, z + 1, COBWEB);
  }

  placeFeatures(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const cacti = [];
    for (let x = 2; x < SIZE - 2; x++) {
      for (let z = 2; z < SIZE - 2; z++) {
        const wx = ox + x;
        const wz = oz + z;
        const b = this.biome(wx, wz);
        const y = surface(chunk.blocks, x, z);
        if (y <= 0) continue;
        const top = get(chunk.blocks, x, y, z);
        const r = hash2(wx, wz, this.seed + 99);

        if (b === BIOME.DESERT && top === SAND && r > 0.993) {
          if (!cacti.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < 64)) {
            const ch = 2 + ((hash2(wx, wz, this.seed + 5) * 3) | 0);
            for (let i = 1; i <= ch && y + i < HEIGHT - 1; i++) set(chunk.blocks, x, y + i, z, CACTUS);
            cacti.push({ x, z });
          }
        }

        if (get(chunk.blocks, x, y + 1, z) === AIR) {
          if (b === BIOME.PLAINS && top === GRASS && r > 0.86 && r < 0.93) {
            set(chunk.blocks, x, y + 1, z, hash2(wx, wz, this.seed + 3) > 0.5 ? DANDELION : POPPY);
          }
          if (b === BIOME.FOREST && top === GRASS && r > 0.82 && r < 0.88) {
            set(chunk.blocks, x, y + 1, z, hash2(wx, wz, this.seed + 3) > 0.5 ? DANDELION : POPPY);
          }
          if (b === BIOME.PLAINS && top === GRASS && r > 0.55 && r < 0.84) {
            set(chunk.blocks, x, y + 1, z, TALL_GRASS);
          }
          if (b === BIOME.FOREST && top === GRASS && r > 0.7 && r < 0.8) {
            set(chunk.blocks, x, y + 1, z, TALL_GRASS);
          }
          if (b === BIOME.JUNGLE && top === GRASS && r > 0.48 && r < 0.78) {
            set(chunk.blocks, x, y + 1, z, TALL_GRASS);
          }
          if (b === BIOME.SWAMP && (top === GRASS || top === MYCELIUM) && r > 0.85 && r < 0.9) {
            set(chunk.blocks, x, y + 1, z, hash2(wx, wz, 7) > 0.5 ? MUSHROOM_RED : MUSHROOM_BROWN);
          }
          if (b === BIOME.PLAINS && r > 0.992 && top === GRASS) set(chunk.blocks, x, y + 1, z, PUMPKIN);
          if (b === BIOME.FOREST && r > 0.994 && top === GRASS) set(chunk.blocks, x, y + 1, z, MELON);
          if (b === BIOME.FLOWER_FOREST && top === GRASS && r > 0.42) {
            set(chunk.blocks, x, y + 1, z, hash2(wx, wz, this.seed + 4) > 0.5 ? DANDELION : POPPY);
          }
          if (b === BIOME.SAVANNA && top === GRASS && r > 0.62 && r < 0.88) {
            set(chunk.blocks, x, y + 1, z, TALL_GRASS);
          }
          if (b === BIOME.BIRCH_FOREST && top === GRASS && r > 0.72 && r < 0.86) {
            set(chunk.blocks, x, y + 1, z, TALL_GRASS);
          }
          if (b === BIOME.MUSHROOM && top === MYCELIUM && r > 0.7 && r < 0.82) {
            set(chunk.blocks, x, y + 1, z, hash2(wx, wz, 7) > 0.5 ? MUSHROOM_RED : MUSHROOM_BROWN);
          }
          if (b === BIOME.MUSHROOM && top === MYCELIUM && r > 0.985) {
            this.hugeMushroom(chunk, x, y + 1, z, wx, wz);
          }
          if (b === BIOME.SNOWY_PLAINS && (top === SNOW || top === PACKED_ICE) && r > 0.988) {
            this.iceSpike(chunk, x, y + 1, z, wx, wz);
          }
        }

        if (y >= SEA - 1 && y <= SEA + 1 && (top === GRASS || top === SAND || top === DIRT) && r > 0.9) {
          let nearWater = false;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (get(chunk.blocks, x + dx, y, z + dz) === WATER) nearWater = true;
          }
          if (nearWater && get(chunk.blocks, x, y + 1, z) === AIR) {
            const ch = 2 + ((hash2(wx, wz, this.seed + 31) * 2) | 0);
            for (let i = 1; i <= ch && y + i < HEIGHT - 1; i++) set(chunk.blocks, x, y + i, z, SUGAR_CANE);
          }
        }

      }
    }
  }

  placeHut(chunk) {
    const region = 6;
    const rx = Math.floor(chunk.cx / region);
    const rz = Math.floor(chunk.cz / region);
    if (hash2(rx, rz, this.seed + 903) > 0.1) return;
    const pickX = (hash2(rx, rz, this.seed + 501) * region) | 0;
    const pickZ = (hash2(rx + 9, rz, this.seed + 502) * region) | 0;
    const lx = ((chunk.cx % region) + region) % region;
    const lz = ((chunk.cz % region) + region) % region;
    if (lx !== pickX || lz !== pickZ) return;
    const x = 6 + ((hash2(chunk.cx, 1, this.seed + 17) * 4) | 0);
    const z = 6 + ((hash2(chunk.cz, 2, this.seed + 19) * 4) | 0);
    const wx = chunk.cx * SIZE + x;
    const wz = chunk.cz * SIZE + z;
    if (this.biome(wx, wz) !== BIOME.PLAINS) return;
    const y = surface(chunk.blocks, x, z);
    if (y < SEA) return;
    if (get(chunk.blocks, x, y, z) !== GRASS) return;
    this.hut(chunk, x, y, z);
  }

  placeTrees(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const placed = [];
    const cfg = {
      [BIOME.FOREST]: { p: 0.4, groveMin: -0.05, groveBoost: 0.22, minDist: 6, kind: "forest" },
      [BIOME.BIRCH_FOREST]: { p: 0.52, groveMin: -0.12, groveBoost: 0.22, minDist: 5, kind: "birch" },
      [BIOME.FLOWER_FOREST]: { p: 0.28, groveMin: 0.08, groveBoost: 0.14, minDist: 9, kind: "oak" },
      [BIOME.TAIGA]: { p: 0.34, groveMin: -0.02, groveBoost: 0.2, minDist: 8, kind: "spruce" },
      [BIOME.JUNGLE]: { p: 0.48, groveMin: -0.16, groveBoost: 0.2, minDist: 7, kind: "jungle" },
      [BIOME.PLAINS]: { p: 0.22, groveMin: 0.34, groveBoost: 0.12, minDist: 11, kind: "oak" },
      [BIOME.SAVANNA]: { p: 0.2, groveMin: 0.12, groveBoost: 0.1, minDist: 12, kind: "acacia" },
      [BIOME.SWAMP]: { p: 0.2, groveMin: 0.1, groveBoost: 0.12, minDist: 11, kind: "oak" },
      [BIOME.MOUNTAIN]: { p: 0.16, groveMin: 0.16, groveBoost: 0.1, minDist: 12, kind: "spruce" },
      [BIOME.SNOW_MOUNTAIN]: { p: 0.12, groveMin: 0.22, groveBoost: 0.08, minDist: 14, kind: "spruce" },
      [BIOME.SNOWY_PLAINS]: { p: 0.08, groveMin: 0.28, groveBoost: 0.08, minDist: 16, kind: "spruce" },
    };
    for (let t = 0; t < 10; t++) {
      const x = 2 + ((hash2(chunk.cx * 17 + t, chunk.cz, this.seed + 41) * (SIZE - 5)) | 0);
      const z = 2 + ((hash2(chunk.cx, chunk.cz * 19 + t, this.seed + 73) * (SIZE - 5)) | 0);
      const wx = ox + x;
      const wz = oz + z;
      const b = this.biome(wx, wz);
      const spec = cfg[b];
      if (!spec) continue;
      const grove = this.n2.fbm2(wx * 0.0072, wz * 0.0072, 3);
      if (grove < spec.groveMin) continue;
      if (hash2(wx, wz, this.seed + 99) > spec.p + grove * spec.groveBoost) continue;
      if (placed.some((p) => (p.x - x) ** 2 + (p.z - z) ** 2 < spec.minDist * spec.minDist)) continue;
      const y = surface(chunk.blocks, x, z);
      if (y < SEA - 1) continue;
      if (b === BIOME.SNOW_MOUNTAIN && y > SEA + 18) continue;
      const slope = Math.max(
        Math.abs(y - surface(chunk.blocks, x - 1, z)),
        Math.abs(y - surface(chunk.blocks, x + 1, z)),
        Math.abs(y - surface(chunk.blocks, x, z - 1)),
        Math.abs(y - surface(chunk.blocks, x, z + 1)),
      );
      if (slope > 2) continue;
      const top = get(chunk.blocks, x, y, z);
      if (top !== GRASS && top !== PODZOL && top !== MYCELIUM && top !== DIRT && top !== SNOW) continue;
      const above = get(chunk.blocks, x, y + 1, z);
      if (above !== AIR && above !== SNOW) continue;
      const mix = hash2(wx, wz, this.seed + 17);
      if (spec.kind === "forest") {
        if (mix < 0.28) this.birchTree(chunk, x, y + 1, z, wx, wz);
        else this.oakTree(chunk, x, y + 1, z, wx, wz);
      } else if (spec.kind === "birch") this.birchTree(chunk, x, y + 1, z, wx, wz);
      else if (spec.kind === "spruce") this.spruceTree(chunk, x, y + 1, z, wx, wz);
      else if (spec.kind === "jungle") this.jungleTree(chunk, x, y + 1, z, wx, wz);
      else if (spec.kind === "acacia") this.acaciaTree(chunk, x, y + 1, z, wx, wz);
      else this.oakTree(chunk, x, y + 1, z, wx, wz);
      placed.push({ x, z });
    }
  }

  oakTree(chunk, x, y, z, wx, wz) {
    this.tree(chunk, x, y, z, wx, wz, LOG, LEAVES, 4, 3);
  }

  birchTree(chunk, x, y, z, wx, wz) {
    this.tree(chunk, x, y, z, wx, wz, BIRCH_LOG, BIRCH_LEAVES, 5, 3);
  }

  spruceTree(chunk, x, y, z, wx, wz) {
    const h = 5 + ((hash2(wx, wz, this.seed + 21) * 5) | 0);
    if (y + h + 2 >= HEIGHT) return;
    for (let i = 0; i < h; i++) set(chunk.blocks, x, y + i, z, SPRUCE_LOG);
    const layers = 3 + ((hash2(wx, wz, this.seed + 22) * 3) | 0);
    for (let dy = 0; dy <= layers; dy++) {
      const r = dy === layers ? 0 : Math.max(1, Math.ceil((layers - dy) / 2));
      const ty = y + h - layers + dy;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && r > 0) continue;
          if (hash2(wx + dx, wz + dz + dy, this.seed + 23) < 0.18) continue;
          const tx = x + dx, tz = z + dz;
          if (tx < 0 || tz < 0 || tx >= SIZE || tz >= SIZE || ty >= HEIGHT) continue;
          const cur = get(chunk.blocks, tx, ty, tz);
          if (cur === AIR || cur === SNOW) set(chunk.blocks, tx, ty, tz, SPRUCE_LEAVES);
        }
      }
    }
    set(chunk.blocks, x, y + h, z, SPRUCE_LEAVES);
  }

  jungleTree(chunk, x, y, z, wx, wz) {
    this.tree(chunk, x, y, z, wx, wz, JUNGLE_LOG, JUNGLE_LEAVES, 7, 4);
  }

  acaciaTree(chunk, x, y, z, wx, wz) {
    const h = 4 + ((hash2(wx, wz, this.seed + 21) * 3) | 0);
    if (y + h + 2 >= HEIGHT) return;
    for (let i = 0; i < h; i++) set(chunk.blocks, x, y + i, z, JUNGLE_LOG);
    const lean = hash2(wx, wz, this.seed + 24) > 0.5 ? 1 : -1;
    const bx = x + lean;
    if (bx >= 0 && bx < SIZE) set(chunk.blocks, bx, y + h - 1, z, JUNGLE_LOG);
    const top = y + h;
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 4) continue;
        if (hash2(wx + dx, wz + dz, this.seed + 8) < 0.2) continue;
        const tx = (lean > 0 ? bx : x) + dx;
        const tz = z + dz;
        if (tx < 0 || tz < 0 || tx >= SIZE || tz >= SIZE || top >= HEIGHT) continue;
        if (get(chunk.blocks, tx, top, tz) === AIR) set(chunk.blocks, tx, top, tz, JUNGLE_LEAVES);
        if (Math.abs(dx) + Math.abs(dz) <= 2 && top + 1 < HEIGHT && get(chunk.blocks, tx, top + 1, tz) === AIR) {
          set(chunk.blocks, tx, top + 1, tz, JUNGLE_LEAVES);
        }
      }
    }
  }

  hugeMushroom(chunk, x, y, z, wx, wz) {
    const red = hash2(wx, wz, this.seed + 19) > 0.45;
    const cap = red ? RED_WOOL : BROWN_WOOL;
    const h = 4 + ((hash2(wx, wz, this.seed + 21) * 3) | 0);
    if (y + h + 2 >= HEIGHT) return;
    for (let i = 0; i < h; i++) set(chunk.blocks, x, y + i, z, BROWN_WOOL);
    const top = y + h - 1;
    const rad = red ? 2 : 1;
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        if (Math.abs(dx) === rad && Math.abs(dz) === rad) continue;
        const tx = x + dx, tz = z + dz;
        if (tx < 0 || tz < 0 || tx >= SIZE || tz >= SIZE) continue;
        set(chunk.blocks, tx, top, tz, cap);
        if (red && (Math.abs(dx) === rad || Math.abs(dz) === rad)) {
          for (let dy = 1; dy <= 2 && top - dy > y; dy++) {
            if (get(chunk.blocks, tx, top - dy, tz) === AIR) set(chunk.blocks, tx, top - dy, tz, cap);
          }
        }
      }
    }
  }

  iceSpike(chunk, x, y, z, wx, wz) {
    const h = 8 + ((hash2(wx, wz, this.seed + 21) * 12) | 0);
    for (let i = 0; i < h && y + i < HEIGHT - 2; i++) {
      const r = i < h - 3 ? (i < 2 ? 1 : 0) : 0;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          const tx = x + dx, tz = z + dz;
          if (tx < 0 || tz < 0 || tx >= SIZE || tz >= SIZE) continue;
          set(chunk.blocks, tx, y + i, tz, PACKED_ICE);
        }
      }
    }
  }

  tree(chunk, x, y, z, wx, wz, log, leaves, minH, extra) {
    const h = minH + ((hash2(wx, wz, this.seed + 21) * extra) | 0);
    if (y + h + 2 >= HEIGHT) return;
    for (let i = 0; i < h; i++) set(chunk.blocks, x, y + i, z, log);
    const top = y + h - 1;
    const fat = hash2(wx, wz, this.seed + 55) > 0.74;
    const sparse = 0.22 + hash2(wx, wz, this.seed + 56) * 0.28;
    for (let dy = -2; dy <= 2; dy++) {
      let r = dy >= 1 ? 1 : 2;
      if (fat && dy <= 0) r += 1;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && hash2(wx + dx, wz + dz, this.seed) < 0.58) continue;
          if (hash2(wx + dx * 3, wz + dz * 5 + dy, this.seed + 8) < sparse) continue;
          const tx = x + dx, ty = top + dy, tz = z + dz;
          if (tx < 0 || tz < 0 || tx >= SIZE || tz >= SIZE || ty >= HEIGHT) continue;
          if (get(chunk.blocks, tx, ty, tz) === AIR) set(chunk.blocks, tx, ty, tz, leaves);
        }
      }
    }
    set(chunk.blocks, x, y + h, z, leaves);
  }

  hut(chunk, x, y, z) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        const corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
        const door = dx === 0 && dz === -2;
        const window = edge && !corner && !door && dz === 0;
        set(chunk.blocks, x + dx, y, z + dz, COBBLE);
        for (let dy = 1; dy <= 2; dy++) {
          if (!edge || door) continue;
          if (window && dy === 2) set(chunk.blocks, x + dx, y + dy, z + dz, GLASS);
          else set(chunk.blocks, x + dx, y + dy, z + dz, corner ? COBBLE : PLANKS);
        }
        set(chunk.blocks, x + dx, y + 3, z + dz, PLANKS);
      }
    }
    set(chunk.blocks, x, y + 2, z, TORCH);
    set(chunk.blocks, x, y + 1, z - 2, OAK_DOOR);
    set(chunk.blocks, x, y + 2, z - 2, OAK_DOOR_TOP);
    set(chunk.blocks, x + 1, y + 1, z, CHEST);
    set(chunk.blocks, x - 1, y + 1, z, CRAFTING);
    chunk.loot.push({ x: x + 1, y: y + 1, z, kind: "hut" });
  }

  stamp(chunk, wx, y, wz, id) {
    const x = wx - chunk.cx * SIZE;
    const z = wz - chunk.cz * SIZE;
    if (x < 0 || z < 0 || x >= SIZE || z >= SIZE || y < 1 || y >= HEIGHT - 1) return false;
    set(chunk.blocks, x, y, z, id);
    return true;
  }

  stampChest(chunk, wx, y, wz, kind) {
    if (!this.stamp(chunk, wx, y, wz, CHEST)) return;
    chunk.loot.push({ x: wx - chunk.cx * SIZE, y, z: wz - chunk.cz * SIZE, kind });
  }

  spawnAt(chunk, type, x, y, z, job) {
    const cx = Math.floor(Math.floor(x) / SIZE);
    const cz = Math.floor(Math.floor(z) / SIZE);
    if (cx !== chunk.cx || cz !== chunk.cz) return;
    const key = `${type}:${x | 0}:${z | 0}`;
    if (this.spawned.has(key)) return;
    this.spawned.add(key);
    chunk.spawns.push({ type, x, y, z, job, spawnKey: key });
  }

  placeVillage(chunk) {
    const region = 7;
    const rcx = Math.floor(chunk.cx / region);
    const rcz = Math.floor(chunk.cz / region);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.villageRegion(chunk, rcx + dx, rcz + dz, region);
      }
    }
  }

  villagePlan(rx, rz, region = 7) {
    if (hash2(rx, rz, this.seed + 707) > 0.4) return null;
    const span = region * SIZE;
    const cx = (rx * span + 18 + ((hash2(rx, rz, this.seed + 71) * (span - 36)) | 0)) | 0;
    const cz = (rz * span + 18 + ((hash2(rx + 5, rz, this.seed + 72) * (span - 36)) | 0)) | 0;
    const b = this.biome(cx, cz);
    if (
      b !== BIOME.PLAINS && b !== BIOME.DESERT && b !== BIOME.TAIGA && b !== BIOME.FOREST
      && b !== BIOME.SAVANNA && b !== BIOME.SNOWY_PLAINS && b !== BIOME.BIRCH_FOREST
      && b !== BIOME.FLOWER_FOREST
    ) return null;
    const y = this.height(cx, cz);
    if (y < SEA || y > SEA + 18) return null;
    return { cx, cz, y, b };
  }

  nearestVillage(wx, wz, maxRegions = 14) {
    const region = 7;
    const rcx = Math.floor(Math.floor(wx / SIZE) / region);
    const rcz = Math.floor(Math.floor(wz / SIZE) / region);
    let best = null;
    for (let r = 0; r <= maxRegions; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const plan = this.villagePlan(rcx + dx, rcz + dz, region);
          if (!plan) continue;
          const dist = Math.hypot(plan.cx + 0.5 - wx, plan.cz + 0.5 - wz);
          if (!best || dist < best.dist) best = { ...plan, dist };
        }
      }
      if (best && r >= 2) return best;
    }
    return best;
  }

  placeStronghold(chunk) {
    const region = 16;
    const rcx = Math.floor(chunk.cx / region);
    const rcz = Math.floor(chunk.cz / region);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.strongholdRegion(chunk, rcx + dx, rcz + dz, region);
      }
    }
  }

  strongholdPlan(rx, rz, region = 16) {
    if (hash2(rx, rz, this.seed + 919) > 0.22) return null;
    const span = region * SIZE;
    const cx = (rx * span + 28 + ((hash2(rx, rz, this.seed + 91) * (span - 56)) | 0)) | 0;
    const cz = (rz * span + 28 + ((hash2(rx + 3, rz, this.seed + 92) * (span - 56)) | 0)) | 0;
    const surf = this.worldType === "superflat" ? 3 : this.height(cx, cz);
    const y = Math.max(8, Math.min(38, surf - 16));
    return { cx, cz, y };
  }

  nearestStronghold(wx, wz, maxRegions = 22) {
    const region = 16;
    const rcx = Math.floor(Math.floor(wx / SIZE) / region);
    const rcz = Math.floor(Math.floor(wz / SIZE) / region);
    let best = null;
    for (let r = 0; r <= maxRegions; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const plan = this.strongholdPlan(rcx + dx, rcz + dz, region);
          if (!plan) continue;
          const dist = Math.hypot(plan.cx + 0.5 - wx, plan.cz + 0.5 - wz);
          if (!best || dist < best.dist) best = { ...plan, dist };
        }
      }
      if (best && r >= 2) return best;
    }
    return best;
  }

  strongholdRegion(chunk, rx, rz, region) {
    const plan = this.strongholdPlan(rx, rz, region);
    if (!plan) return;
    const { cx, cz, y } = plan;
    const brick = (wx, wy, wz) => (hash2(wx, wy + wz, this.seed + 4) > 0.78 ? MOSSY : STONEBRICK);
    for (let dx = -6; dx <= 6; dx++) {
      for (let dz = -6; dz <= 6; dz++) {
        for (let dy = 0; dy <= 6; dy++) {
          const edge = Math.abs(dx) === 6 || Math.abs(dz) === 6 || dy === 0 || dy === 6;
          this.stamp(chunk, cx + dx, y + dy, cz + dz, edge ? brick(cx + dx, y + dy, cz + dz) : AIR);
        }
      }
    }
    for (let i = 7; i <= 18; i++) {
      for (let dz = -1; dz <= 1; dz++) {
        for (let dy = 0; dy <= 4; dy++) {
          const edge = Math.abs(dz) === 1 || dy === 0 || dy === 4;
          this.stamp(chunk, cx + i, y + dy, cz + dz, edge ? brick(cx + i, y + dy, cz + dz) : AIR);
        }
      }
    }
    const fy = y + 1;
    const spots = [
      [-1, -2], [0, -2], [1, -2],
      [-1, 2], [0, 2], [1, 2],
      [-2, -1], [-2, 0], [-2, 1],
      [2, -1], [2, 0], [2, 1],
    ];
    for (const [sx, sz] of spots) this.stamp(chunk, cx + sx, fy, cz + sz, END_PORTAL_FRAME);
    for (let ix = -1; ix <= 1; ix++) {
      for (let iz = -1; iz <= 1; iz++) this.stamp(chunk, cx + ix, fy, cz + iz, AIR);
    }
    this.stamp(chunk, cx - 4, y + 2, cz - 4, TORCH);
    this.stamp(chunk, cx + 4, y + 2, cz + 4, TORCH);
    this.stamp(chunk, cx - 5, y + 1, cz + 3, BOOKSHELF);
    this.stamp(chunk, cx - 5, y + 2, cz + 3, BOOKSHELF);
    this.stampChest(chunk, cx + 4, y + 1, cz - 3, "stronghold");
  }

  villageRegion(chunk, rx, rz, region) {
    const plan = this.villagePlan(rx, rz, region);
    if (!plan) return;
    const { cx, cz, y, b } = plan;
    this.villagePad(chunk, cx, cz, y, b);
    this.villageWell(chunk, cx, cz, y, b);
    this.villageFarm(chunk, cx + 7, cz + 1, y, b);
    const spots = [
      [12, 3, "farmer"],
      [8, -11, "farmer"],
      [-11, -7, "cleric"],
      [-2, 13, "farmer"],
      [-13, 6, "smith"],
    ];
    for (let i = 0; i < spots.length; i++) {
      const [dx, dz, job] = spots[i];
      const hx = cx + dx;
      const hz = cz + dz;
      this.stampPath(chunk, cx, cz, hx, hz, b);
      if (job === "smith") this.villageSmith(chunk, hx, hz, y, b);
      else this.villageHouse(chunk, hx, hz, y, b, job);
      this.spawnAt(chunk, "villager", hx + 0.5, y + 1.1, hz + 0.5, job);
    }
    this.spawnAt(chunk, "pig", cx + 4.5, y + 1.1, cz + 6.5);
    this.spawnAt(chunk, "cow", cx - 5.5, y + 1.1, cz + 4.5);
    this.spawnAt(chunk, "chicken", cx + 6.5, y + 1.1, cz - 4.5);
    this.spawnAt(chunk, "sheep", cx - 6.5, y + 1.1, cz - 5.5);
    this.spawnAt(chunk, "iron_golem", cx + 2.5, y + 1.1, cz - 2.5);
  }

  villagePad(chunk, cx, cz, y, b) {
    const top = b === BIOME.DESERT ? SAND : b === BIOME.SNOWY_PLAINS ? SNOW : GRASS;
    const fill = b === BIOME.DESERT ? SAND : DIRT;
    for (let dx = -16; dx <= 16; dx++) {
      for (let dz = -16; dz <= 16; dz++) {
        if (dx * dx + dz * dz > 16 * 16) continue;
        this.stamp(chunk, cx + dx, y, cz + dz, top);
        this.stamp(chunk, cx + dx, y - 1, cz + dz, fill);
        this.stamp(chunk, cx + dx, y - 2, cz + dz, fill);
        for (let dy = 1; dy <= 5; dy++) this.stamp(chunk, cx + dx, y + dy, cz + dz, AIR);
      }
    }
  }

  villageWell(chunk, cx, cz, y, b) {
    const rim = b === BIOME.DESERT ? SANDSTONE : COBBLE;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.stamp(chunk, cx + dx, y, cz + dz, rim);
        this.stamp(chunk, cx + dx, y - 1, cz + dz, rim);
        if (dx === 0 && dz === 0) {
          this.stamp(chunk, cx, y, cz, WATER);
          this.stamp(chunk, cx, y - 1, cz, WATER);
        }
        if (Math.abs(dx) === 1 && Math.abs(dz) === 1) {
          this.stamp(chunk, cx + dx, y + 1, cz + dz, rim);
          this.stamp(chunk, cx + dx, y + 2, cz + dz, rim);
        } else {
          this.stamp(chunk, cx + dx, y + 1, cz + dz, AIR);
          this.stamp(chunk, cx + dx, y + 2, cz + dz, AIR);
        }
        this.stamp(chunk, cx + dx, y + 3, cz + dz, rim);
      }
    }
    this.stamp(chunk, cx, y + 2, cz, TORCH);
  }

  villageHouse(chunk, ox, oz, y, b, job) {
    const wall = b === BIOME.DESERT ? SANDSTONE : (b === BIOME.TAIGA || b === BIOME.SNOWY_PLAINS) ? SPRUCE_PLANKS : PLANKS;
    const floor = b === BIOME.DESERT ? SANDSTONE : COBBLE;
    const roof = (b === BIOME.TAIGA || b === BIOME.SNOWY_PLAINS) ? SPRUCE_LOG : b === BIOME.DESERT ? SANDSTONE : LOG;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 3; dz++) {
        const edge = Math.abs(dx) === 2 || dz === -2 || dz === 3;
        const door = dx === 0 && dz === -2;
        const win = (Math.abs(dx) === 2 && dz === 1) || (dz === 3 && dx === 0);
        this.stamp(chunk, ox + dx, y, oz + dz, floor);
        this.stamp(chunk, ox + dx, y - 1, oz + dz, DIRT);
        this.stamp(chunk, ox + dx, y + 1, oz + dz, AIR);
        this.stamp(chunk, ox + dx, y + 2, oz + dz, AIR);
        if (edge && !door) {
          this.stamp(chunk, ox + dx, y + 1, oz + dz, wall);
          this.stamp(chunk, ox + dx, y + 2, oz + dz, win ? GLASS : wall);
        }
        this.stamp(chunk, ox + dx, y + 3, oz + dz, roof);
        if (b === BIOME.TAIGA || b === BIOME.SNOWY_PLAINS) this.stamp(chunk, ox + dx, y + 4, oz + dz, SNOW);
      }
    }
    this.stamp(chunk, ox, y + 1, oz - 2, OAK_DOOR);
    this.stamp(chunk, ox, y + 2, oz - 2, OAK_DOOR_TOP);
    this.stamp(chunk, ox, y + 2, oz, TORCH);
    if (job === "cleric") this.stamp(chunk, ox + 1, y + 1, oz + 1, BOOKSHELF);
    else this.stamp(chunk, ox + 1, y + 1, oz + 1, CRAFTING);
    this.stampChest(chunk, ox - 1, y + 1, oz + 1, "village");
    if (job === "farmer") this.stamp(chunk, ox + 1, y + 1, oz + 2, HAY);
  }

  villageSmith(chunk, ox, oz, y, b) {
    const wall = COBBLE;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const edge = Math.abs(dx) === 2 || Math.abs(dz) === 2;
        const door = dx === 0 && dz === -2;
        this.stamp(chunk, ox + dx, y, oz + dz, wall);
        this.stamp(chunk, ox + dx, y - 1, oz + dz, wall);
        this.stamp(chunk, ox + dx, y + 1, oz + dz, AIR);
        this.stamp(chunk, ox + dx, y + 2, oz + dz, AIR);
        if (edge && !door) {
          this.stamp(chunk, ox + dx, y + 1, oz + dz, wall);
          this.stamp(chunk, ox + dx, y + 2, oz + dz, wall);
        }
        this.stamp(chunk, ox + dx, y + 3, oz + dz, wall);
      }
    }
    this.stamp(chunk, ox, y + 1, oz - 2, OAK_DOOR);
    this.stamp(chunk, ox, y + 2, oz - 2, OAK_DOOR_TOP);
    this.stamp(chunk, ox + 1, y + 1, oz, FURNACE);
    this.stamp(chunk, ox - 1, y, oz + 1, LAVA);
    this.stampChest(chunk, ox + 1, y + 1, oz + 1, "village_smith");
    this.stamp(chunk, ox, y + 2, oz, TORCH);
    this.stamp(chunk, ox + 2, y + 1, oz, IRON_BLOCK);
  }

  villageFarm(chunk, ox, oz, y, b) {
    if (b === BIOME.DESERT) {
      for (let dx = 0; dx < 6; dx++) {
        for (let dz = 0; dz < 4; dz++) {
          this.stamp(chunk, ox + dx, y, oz + dz, SAND);
          if ((dx + dz) % 5 === 0) this.stamp(chunk, ox + dx, y + 1, oz + dz, CACTUS);
        }
      }
      return;
    }
    for (let dx = 0; dx < 7; dx++) {
      for (let dz = 0; dz < 5; dz++) {
        const water = dx === 3;
        this.stamp(chunk, ox + dx, y, oz + dz, water ? WATER : FARMLAND);
        if (!water) {
          const st = hash2(ox + dx, oz + dz, this.seed + 9);
          const crop = st > 0.7 ? WHEAT_3 : st > 0.4 ? WHEAT_2 : WHEAT_1;
          this.stamp(chunk, ox + dx, y + 1, oz + dz, crop);
        } else {
          this.stamp(chunk, ox + dx, y + 1, oz + dz, AIR);
        }
      }
    }
    this.stamp(chunk, ox + 7, y + 1, oz + 1, HAY);
    this.stamp(chunk, ox + 7, y + 1, oz + 2, HAY);
  }

  stampPath(chunk, x0, z0, x1, z1, b) {
    const mat = b === BIOME.DESERT ? SANDSTONE : GRAVEL;
    const n = Math.max(1, Math.abs(x1 - x0), Math.abs(z1 - z0));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const wx = Math.round(x0 + (x1 - x0) * t);
      const wz = Math.round(z0 + (z1 - z0) * t);
      const gy = this.height(wx, wz);
      if (gy < SEA) continue;
      this.stamp(chunk, wx, gy, wz, mat);
      this.stamp(chunk, wx, gy + 1, wz, AIR);
      if (i % 6 === 3) {
        this.stamp(chunk, wx + 1, gy + 1, wz, COBBLE);
        this.stamp(chunk, wx + 1, gy + 2, wz, TORCH);
      }
    }
  }

  placeShipwreck(chunk) {
    const region = 9;
    const rcx = Math.floor(chunk.cx / region);
    const rcz = Math.floor(chunk.cz / region);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        this.shipwreckRegion(chunk, rcx + dx, rcz + dz, region);
      }
    }
  }

  shipwreckRegion(chunk, rx, rz, region) {
    if (hash2(rx, rz, this.seed + 919) > 0.08) return;
    const ox = (rx * region * SIZE + 6 + ((hash2(rx, rz, this.seed + 81) * (region * SIZE - 12)) | 0)) | 0;
    const oz = (rz * region * SIZE + 6 + ((hash2(rx, rz + 3, this.seed + 82) * (region * SIZE - 12)) | 0)) | 0;
    if (this.biome(ox, oz) !== BIOME.OCEAN) return;
    const h = this.height(ox, oz);
    if (h > SEA - 3) return;
    const y = Math.max(h + 1, SEA - 6);
    const alongZ = hash2(rx, rz, this.seed + 83) > 0.5;
    for (let i = 0; i < 10; i++) {
      for (let s = -1; s <= 1; s++) {
        if (hash2(ox + i, oz + s, this.seed + 4) < 0.12) continue;
        const wx = alongZ ? ox + s : ox + i;
        const wz = alongZ ? oz + i : oz + s;
        this.stamp(chunk, wx, y, wz, PLANKS);
        if (s !== 0) this.stamp(chunk, wx, y + 1, wz, PLANKS);
        if (s === 0 && (i === 0 || i === 9)) this.stamp(chunk, wx, y + 1, wz, LOG);
      }
    }
    const mx = alongZ ? ox : ox + 3;
    const mz = alongZ ? oz + 3 : oz;
    this.stamp(chunk, mx, y + 2, mz, LOG);
    this.stamp(chunk, mx, y + 3, mz, LOG);
    this.stampChest(chunk, alongZ ? ox : ox + 5, y + 1, alongZ ? oz + 5 : oz, "shipwreck");
  }

  netherBiome(wx, wz) {
    const u = this.n.fbm2(wx * 0.0042, wz * 0.0042, 4);
    const v = this.n2.fbm2(wx * 0.0055 + 40, wz * 0.0055, 3);
    if (v > 0.26) return NETHER_BIOME.SOUL;
    if (u > 0.2) return NETHER_BIOME.CRIMSON;
    if (u < -0.22) return NETHER_BIOME.WARPED;
    if (v < -0.28) return NETHER_BIOME.BASALT;
    return NETHER_BIOME.WASTES;
  }

  fillEnd(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const wx = ox + x;
        const wz = oz + z;
        const d = Math.hypot(wx, wz);
        const n = this.n.fbm2(wx * 0.02, wz * 0.02, 4);
        let h = -1;
        if (d < 94) {
          h = 46 + n * 7 - Math.max(0, d - 70) * 0.55;
        } else {
          const isle = this.n2.fbm2(wx * 0.011, wz * 0.011, 3);
          if (isle > 0.4) h = 40 + (isle - 0.4) * 38 + n * 5;
        }
        if (h < 4) continue;
        const top = Math.max(4, Math.min(HEIGHT - 6, h | 0));
        const thick = d < 94 ? 14 : 8;
        for (let y = Math.max(1, top - thick); y <= top; y++) {
          set(blocks, x, y, z, END_STONE);
        }
        if (get(blocks, x, top, z) === END_STONE && get(blocks, x, top + 1, z) === AIR) {
          if (d > 18 && hash2(wx, wz, this.seed + 77) > 0.965) {
            const ch = 2 + ((hash2(wx, wz, this.seed + 78) * 4) | 0);
            for (let i = 1; i <= ch; i++) set(blocks, x, top + i, z, CHORUS_PLANT);
            set(blocks, x, top + ch + 1, z, CHORUS_FLOWER);
          } else if (d > 50 && hash2(wx, wz, this.seed + 81) > 0.988) {
            set(blocks, x, top, z, PURPUR);
          }
        }
      }
    }
    this.placeEndPillars(chunk);
  }

  placeEndPillars(chunk) {
    for (let i = 0; i < 10; i++) {
      const ang = i * ((Math.PI * 2) / 10) + 0.18;
      const r = 28 + (i % 3) * 5;
      const px = Math.round(Math.cos(ang) * r);
      const pz = Math.round(Math.sin(ang) * r);
      const h = 11 + (i % 5) * 2;
      const lx = px - chunk.cx * SIZE;
      const lz = pz - chunk.cz * SIZE;
      if (lx < 0 || lz < 0 || lx >= SIZE || lz >= SIZE) continue;
      let base = 40;
      for (let y = 70; y >= 8; y--) {
        if (get(chunk.blocks, lx, y, lz) === END_STONE) {
          base = y + 1;
          break;
        }
      }
      for (let dy = 0; dy < h; dy++) set(chunk.blocks, lx, base + dy, lz, OBSIDIAN);
      if (!this.dragonDead) {
        this.spawnAt(chunk, "end_crystal", px + 0.5, base + h + 0.4, pz + 0.5);
      }
    }
  }

  fillNether(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const { blocks } = chunk;
    const lavaY = 12;
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        const wx = ox + x;
        const wz = oz + z;
        const nb = this.netherBiome(wx, wz);
        const floor = 17 + (this.n.fbm2(wx * 0.016, wz * 0.016, 4) * 0.5 + 0.5) * 18;
        const roof = 86 - (this.n2.fbm2(wx * 0.018, wz * 0.018, 3) * 0.5 + 0.5) * 8;
        for (let y = 0; y < HEIGHT; y++) {
          if (y === 0 || y >= HEIGHT - 1) {
            set(blocks, x, y, z, BEDROCK);
            continue;
          }
          if (y < 4 && hash2(wx, y, wz + this.seed) > 0.52) {
            set(blocks, x, y, z, BEDROCK);
            continue;
          }
          if (y > HEIGHT - 5 && hash2(wx, y, wz + this.seed) > 0.52) {
            set(blocks, x, y, z, BEDROCK);
            continue;
          }
          const cave = this.n.fbm3(wx * 0.032, y * 0.038, wz * 0.032, 3);
          const inBand = y <= floor || y >= roof;
          let id = AIR;
          if (inBand && cave < 0.3) {
            id = NETHERRACK;
            if (nb === NETHER_BIOME.SOUL && y <= floor && y > floor - 4) id = SOUL_SAND;
            else if (nb === NETHER_BIOME.BASALT) {
              id = hash2(wx, y, wz) > 0.52 ? BLACKSTONE : ANDESITE;
            }
            if (y < 9 && hash2(wx, y, wz + 9) > 0.82) id = MAGMA_BLOCK;
            if (id === NETHERRACK && y > 14 && y < 72 && hash2(wx, y, wz + 77) > 0.968) {
              id = NETHER_QUARTZ_ORE;
            }
          }
          if (y <= lavaY && id === AIR) id = LAVA;
          if (nb === NETHER_BIOME.SOUL && id === LAVA && hash2(wx, wz, this.seed + 3) > 0.45) {
            id = MAGMA_BLOCK;
          }
          set(blocks, x, y, z, id);
        }
        const fy = Math.max(1, Math.min(HEIGHT - 2, floor | 0));
        const top = get(blocks, x, fy, z);
        if (top === NETHERRACK && get(blocks, x, fy + 1, z) === AIR) {
          if (nb === NETHER_BIOME.CRIMSON) set(blocks, x, fy, z, CRIMSON_NYLIUM);
          else if (nb === NETHER_BIOME.WARPED) set(blocks, x, fy, z, WARPED_NYLIUM);
          else if (nb === NETHER_BIOME.SOUL) set(blocks, x, fy, z, SOUL_SAND);
          else if (nb === NETHER_BIOME.WASTES && hash2(wx, wz, this.seed + 8) > 0.93) {
            set(blocks, x, fy, z, MAGMA_BLOCK);
          }
        }
      }
    }
    this.placeNetherDecor(chunk);
    this.placeGlowstone(chunk);
    this.placeFortress(chunk);
  }

  placeNetherDecor(chunk) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    for (let t = 0; t < 14; t++) {
      const x = 1 + ((hash2(chunk.cx * 19 + t, chunk.cz, this.seed + 301) * (SIZE - 3)) | 0);
      const z = 1 + ((hash2(chunk.cx, chunk.cz * 23 + t, this.seed + 302) * (SIZE - 3)) | 0);
      const wx = ox + x;
      const wz = oz + z;
      const nb = this.netherBiome(wx, wz);
      const y = netherSurface(chunk.blocks, x, z);
      if (y < 8 || y > 78) continue;
      const ground = get(chunk.blocks, x, y, z);
      if (nb === NETHER_BIOME.CRIMSON && (ground === CRIMSON_NYLIUM || ground === NETHERRACK)) {
        this.netherFungus(chunk, x, y + 1, z, true);
      } else if (nb === NETHER_BIOME.WARPED && (ground === WARPED_NYLIUM || ground === NETHERRACK)) {
        this.netherFungus(chunk, x, y + 1, z, false);
      } else if (nb === NETHER_BIOME.SOUL && ground === SOUL_SAND && hash2(wx, wz, this.seed + 44) > 0.55) {
        if (get(chunk.blocks, x, y + 1, z) === AIR) set(chunk.blocks, x, y + 1, z, NETHER_WART);
      } else if (nb === NETHER_BIOME.BASALT && hash2(wx, wz, this.seed + 51) > 0.4) {
        const h = 2 + ((hash2(wx, wz, this.seed + 52) * 6) | 0);
        for (let i = 1; i <= h && y + i < HEIGHT - 2; i++) {
          if (get(chunk.blocks, x, y + i, z) === AIR || get(chunk.blocks, x, y + i, z) === LAVA) {
            set(chunk.blocks, x, y + i, z, hash2(wx, y + i, wz) > 0.5 ? BLACKSTONE : ANDESITE);
          }
        }
      }
    }
  }

  netherFungus(chunk, x, y, z, crimson) {
    const h = 4 + ((hash2(x + chunk.cx, z, this.seed + 88) * 5) | 0);
    const stem = crimson ? CRIMSON_STEM : WARPED_STEM;
    const hat = crimson ? CRIMSON_WART : WARPED_WART;
    for (let i = 0; i < h; i++) {
      const id = get(chunk.blocks, x, y + i, z);
      if (id === AIR || id === LAVA) set(chunk.blocks, x, y + i, z, stem);
    }
    const top = y + h - 1;
    for (let dy = -1; dy <= 1; dy++) {
      const r = dy === 1 ? 1 : 2;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && hash2(x + dx, z + dz, this.seed) > 0.55) continue;
          const cur = get(chunk.blocks, x + dx, top + dy, z + dz);
          if (cur === AIR) set(chunk.blocks, x + dx, top + dy, z + dz, hat);
        }
      }
    }
  }

  placeGlowstone(chunk) {
    for (let t = 0; t < 8; t++) {
      const x = 1 + ((hash2(chunk.cx + t, chunk.cz, this.seed + 401) * (SIZE - 2)) | 0);
      const z = 1 + ((hash2(chunk.cx, chunk.cz + t * 3, this.seed + 402) * (SIZE - 2)) | 0);
      let y = HEIGHT - 4;
      while (y > 40 && get(chunk.blocks, x, y, z) === AIR) y--;
      if (get(chunk.blocks, x, y, z) !== NETHERRACK && get(chunk.blocks, x, y, z) !== BLACKSTONE) continue;
      const n = 1 + ((hash2(x, z, this.seed + 403) * 3) | 0);
      for (let i = 0; i < n; i++) {
        const yy = y - 1 - i;
        if (yy < 20) break;
        if (get(chunk.blocks, x, yy, z) === AIR) set(chunk.blocks, x, yy, z, GLOWSTONE);
      }
    }
  }

  placeFortress(chunk) {
    const region = 8;
    const rx = Math.floor(chunk.cx / region);
    const rz = Math.floor(chunk.cz / region);
    if (hash2(rx, rz, this.seed + 1301) > 0.28) return;
    const y = 46 + ((hash2(rx, rz, this.seed + 9) * 12) | 0);
    const hubX = rx * region * SIZE + 10 + ((hash2(rx, 1, this.seed + 11) * (region * SIZE - 20)) | 0);
    const hubZ = rz * region * SIZE + 10 + ((hash2(rz, 2, this.seed + 12) * (region * SIZE - 20)) | 0);
    this.fortressCorridor(chunk, hubX, hubZ, y, 20, true);
    this.fortressCorridor(chunk, hubX, hubZ, y, 16, false);
    this.fortressRoom(chunk, hubX, hubZ, y);
  }

  fortressCorridor(chunk, hubX, hubZ, y, len, alongX) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    const a0 = alongX ? hubX - len : hubZ - len;
    const a1 = alongX ? hubX + len : hubZ + len;
    for (let a = a0; a <= a1; a++) {
      for (let s = -1; s <= 1; s++) {
        const wx = alongX ? a : hubX + s;
        const wz = alongX ? hubZ + s : a;
        const x = wx - ox;
        const z = wz - oz;
        if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
        for (let dy = 0; dy <= 4; dy++) {
          const edge = s !== 0 || dy === 0 || dy === 4;
          const id = get(chunk.blocks, x, y + dy, z);
          if (id === BEDROCK) continue;
          if (edge) set(chunk.blocks, x, y + dy, z, NETHER_BRICKS);
          else set(chunk.blocks, x, y + dy, z, AIR);
        }
        if (s === 0 && (a - a0) % 7 === 0 && hash2(wx, wz, this.seed + 21) > 0.82) {
          set(chunk.blocks, x, y + 1, z, CHEST);
          chunk.loot.push({ x, y: y + 1, z, kind: "nether_fortress" });
        }
        if (s === 0 && (a - a0) % 11 === 3) {
          this.spawnAt(chunk, hash2(wx, wz, this.seed + 33) > 0.45 ? "blaze" : "wither_skeleton", wx + 0.5, y + 1.1, wz + 0.5);
        }
      }
    }
  }

  fortressRoom(chunk, hubX, hubZ, y) {
    const ox = chunk.cx * SIZE;
    const oz = chunk.cz * SIZE;
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const x = hubX + dx - ox;
        const z = hubZ + dz - oz;
        if (x < 0 || z < 0 || x >= SIZE || z >= SIZE) continue;
        for (let dy = 0; dy <= 5; dy++) {
          const edge = Math.abs(dx) === 3 || Math.abs(dz) === 3 || dy === 0 || dy === 5;
          const id = get(chunk.blocks, x, y + dy, z);
          if (id === BEDROCK || id === CHEST) continue;
          set(chunk.blocks, x, y + dy, z, edge ? NETHER_BRICKS : AIR);
        }
      }
    }
    const lx = hubX + 1 - ox;
    const lz = hubZ - oz;
    if (lx >= 0 && lz >= 0 && lx < SIZE && lz < SIZE) {
      set(chunk.blocks, lx, y + 1, lz, CHEST);
      chunk.loot.push({ x: lx, y: y + 1, z: lz, kind: "nether_fortress" });
    }
    this.spawnAt(chunk, "blaze", hubX + 0.5, y + 1.2, hubZ + 0.5);
    this.spawnAt(chunk, "wither_skeleton", hubX - 1.5, y + 1.2, hubZ + 1.5);
  }

  placeRuinedPortal(chunk) {
    const region = 7;
    const rx = Math.floor(chunk.cx / region);
    const rz = Math.floor(chunk.cz / region);
    if (hash2(rx, rz, this.seed + 1603) > 0.14) return;
    const pickX = (hash2(rx, rz, this.seed + 611) * region) | 0;
    const pickZ = (hash2(rx + 3, rz, this.seed + 612) * region) | 0;
    const lx = ((chunk.cx % region) + region) % region;
    const lz = ((chunk.cz % region) + region) % region;
    if (lx !== pickX || lz !== pickZ) return;
    const x = 5 + ((hash2(chunk.cx, 1, this.seed + 27) * 5) | 0);
    const z = 5 + ((hash2(chunk.cz, 2, this.seed + 29) * 5) | 0);
    const wx = chunk.cx * SIZE + x;
    const wz = chunk.cz * SIZE + z;
    const b = this.biome(wx, wz);
    if (b === BIOME.OCEAN || b === BIOME.WARM_OCEAN || b === BIOME.FROZEN_OCEAN) return;
    const y = surface(chunk.blocks, x, z);
    if (y < SEA - 1 || y > SEA + 18) return;
    for (let dx = -2; dx <= 3; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const id = hash2(wx + dx, wz + dz, this.seed + 70) > 0.55 ? NETHERRACK : MAGMA_BLOCK;
        set(chunk.blocks, x + dx, y, z + dz, id);
        for (let dy = 1; dy <= 5; dy++) {
          const cur = get(chunk.blocks, x + dx, y + dy, z + dz);
          if (cur !== BEDROCK) set(chunk.blocks, x + dx, y + dy, z + dz, AIR);
        }
      }
    }
    const frame = [
      [0, 0], [1, 0], [2, 0], [3, 0],
      [0, 1], [3, 1], [0, 2], [3, 2], [0, 3], [3, 3],
      [0, 4], [1, 4], [2, 4], [3, 4],
    ];
    for (let i = 0; i < frame.length; i++) {
      if (hash2(wx, wz + i, this.seed + 81) < 0.28) continue;
      set(chunk.blocks, x + frame[i][0], y + 1 + frame[i][1], z, OBSIDIAN);
    }
    if (hash2(wx, wz, this.seed + 90) > 0.35) set(chunk.blocks, x - 1, y + 1, z, GOLD_BLOCK);
    if (hash2(wx, wz, this.seed + 91) > 0.4) set(chunk.blocks, x + 4, y + 1, z + 1, LAVA);
    set(chunk.blocks, x + 1, y + 1, z + 1, CHEST);
    chunk.loot.push({ x: x + 1, y: y + 1, z: z + 1, kind: "ruined_portal" });
  }

  spawnPos() {
    for (let i = 0; i < 80; i++) {
      const x = ((hash2(i, 1, this.seed) - 0.5) * 80) | 0;
      const z = ((hash2(i, 2, this.seed) - 0.5) * 80) | 0;
      const b = this.biome(x, z);
      if (b === BIOME.OCEAN || b === BIOME.WARM_OCEAN || b === BIOME.FROZEN_OCEAN || b === BIOME.SNOW_MOUNTAIN) continue;
      const y = this.height(x, z);
      if (y > SEA + 2 && y < SEA + 16) return { x: x + 0.5, y: y + 2, z: z + 0.5 };
    }
    return { x: 0.5, y: this.height(0, 0) + 3, z: 0.5 };
  }
}

export function idx(x, y, z) {
  return x + z * SIZE + y * SIZE * SIZE;
}

export function set(blocks, x, y, z, id) {
  if (x < 0 || z < 0 || y < 0 || x >= SIZE || z >= SIZE || y >= HEIGHT) return;
  blocks[idx(x, y, z)] = id;
}

export function get(blocks, x, y, z) {
  if (x < 0 || z < 0 || y < 0 || x >= SIZE || z >= SIZE || y >= HEIGHT) return AIR;
  return blocks[idx(x, y, z)];
}

function netherSurface(blocks, x, z) {
  for (let y = 70; y >= 8; y--) {
    const id = get(blocks, x, y, z);
    if (id === AIR || id === LAVA || id === NETHER_WART || id === NETHER_PORTAL) continue;
    return y;
  }
  return 16;
}

function surface(blocks, x, z) {
  for (let y = HEIGHT - 1; y >= 0; y--) {
    const id = get(blocks, x, y, z);
    if (id === AIR || id === WATER || id === LAVA) continue;
    if (id === DANDELION || id === POPPY || id === SUGAR_CANE || id === MUSHROOM_RED || id === MUSHROOM_BROWN) continue;
    if (id === WHEAT_1 || id === WHEAT_2 || id === WHEAT_3) continue;
    if (id === CHORUS_PLANT || id === CHORUS_FLOWER) continue;
    return y;
  }
  return 0;
}

export function placeBonusChest(world, spawn) {
  const x = Math.floor(spawn.x) + 1;
  const z = Math.floor(spawn.z);
  let y = HEIGHT - 2;
  while (y > 1 && world.getBlock(x, y, z) === AIR) y--;
  world.setBlock(x, y + 1, z, CHEST);
  return { x, y: y + 1, z };
}

export function rollChestLoot(kind, seed, x, y, z) {
  const pools = LOOT[kind] || LOOT.hut;
  const slots = Array.from({ length: 27 }, () => null);
  for (let i = 0; i < pools.length; i++) {
    const p = pools[i];
    if (hash2(x + i * 13, z + i, seed + y) > p.p) continue;
    let slot = (hash2(x, z + i * 17, seed + 11) * 27) | 0;
    for (let k = 0; k < 27 && slots[slot]; k++) slot = (slot + 1) % 27;
    const n = p.n[0] + ((hash2(x + 7, z, seed + i + y) * (p.n[1] - p.n[0] + 1)) | 0);
    if (!slots[slot]) slots[slot] = { id: p.id, count: n };
  }
  return slots;
}

export function rollHutLoot(seed, x, y, z) {
  return rollChestLoot("hut", seed, x, y, z);
}

const LOOT = {
  hut: [
    { id: "bread", n: [1, 4], p: 0.85 },
    { id: "apple", n: [1, 3], p: 0.55 },
    { id: "oak_planks", n: [4, 12], p: 0.7 },
    { id: "stick", n: [2, 8], p: 0.55 },
    { id: "wheat_seeds", n: [2, 6], p: 0.55 },
    { id: "wheat", n: [1, 3], p: 0.35 },
    { id: "coal", n: [1, 4], p: 0.4 },
    { id: "iron_ingot", n: [1, 2], p: 0.2 },
    { id: "string", n: [1, 3], p: 0.35 },
    { id: "book", n: [1, 1], p: 0.12 },
  ],
  dungeon: [
    { id: "bread", n: [1, 4], p: 0.7 },
    { id: "coal", n: [1, 8], p: 0.55 },
    { id: "iron_ingot", n: [1, 4], p: 0.42 },
    { id: "gold_ingot", n: [1, 2], p: 0.22 },
    { id: "redstone", n: [4, 16], p: 0.4 },
    { id: "bone", n: [1, 6], p: 0.6 },
    { id: "string", n: [1, 6], p: 0.5 },
    { id: "gunpowder", n: [1, 4], p: 0.35 },
    { id: "leather", n: [1, 3], p: 0.28 },
    { id: "golden_apple", n: [1, 1], p: 0.06 },
    { id: "diamond", n: [1, 1], p: 0.07 },
    { id: "iron_sword", n: [1, 1], p: 0.1 },
  ],
  mineshaft: [
    { id: "oak_planks", n: [4, 16], p: 0.7 },
    { id: "torch", n: [2, 8], p: 0.55 },
    { id: "iron_ingot", n: [1, 6], p: 0.45 },
    { id: "coal", n: [3, 12], p: 0.5 },
    { id: "string", n: [1, 8], p: 0.45 },
    { id: "golden_apple", n: [1, 1], p: 0.08 },
    { id: "diamond", n: [1, 1], p: 0.05 },
    { id: "cobweb", n: [1, 4], p: 0.3 },
    { id: "bread", n: [1, 3], p: 0.4 },
    { id: "iron_pickaxe", n: [1, 1], p: 0.12 },
  ],
  village: [
    { id: "bread", n: [1, 5], p: 0.85 },
    { id: "apple", n: [1, 4], p: 0.55 },
    { id: "wheat", n: [2, 8], p: 0.7 },
    { id: "emerald", n: [1, 3], p: 0.45 },
    { id: "iron_ingot", n: [1, 3], p: 0.28 },
    { id: "oak_sapling", n: [1, 4], p: 0.4 },
    { id: "string", n: [1, 4], p: 0.35 },
    { id: "book", n: [1, 2], p: 0.22 },
    { id: "oak_boat", n: [1, 1], p: 0.18 },
  ],
  village_smith: [
    { id: "iron_ingot", n: [2, 8], p: 0.85 },
    { id: "coal", n: [4, 12], p: 0.8 },
    { id: "iron_pickaxe", n: [1, 1], p: 0.35 },
    { id: "iron_sword", n: [1, 1], p: 0.28 },
    { id: "gold_ingot", n: [1, 3], p: 0.3 },
    { id: "emerald", n: [1, 2], p: 0.22 },
    { id: "lava_bucket", n: [1, 1], p: 0.12 },
  ],
  shipwreck: [
    { id: "oak_planks", n: [4, 16], p: 0.8 },
    { id: "iron_ingot", n: [1, 6], p: 0.5 },
    { id: "emerald", n: [1, 4], p: 0.4 },
    { id: "paper", n: [2, 8], p: 0.55 },
    { id: "fishing_rod", n: [1, 1], p: 0.28 },
    { id: "oak_boat", n: [1, 1], p: 0.35 },
    { id: "gold_ingot", n: [1, 3], p: 0.25 },
    { id: "coal", n: [2, 8], p: 0.45 },
    { id: "wheat", n: [2, 6], p: 0.4 },
    { id: "golden_apple", n: [1, 1], p: 0.06 },
  ],
  nether_fortress: [
    { id: "gold_ingot", n: [1, 4], p: 0.7 },
    { id: "gold_nugget", n: [2, 8], p: 0.65 },
    { id: "nether_wart", n: [2, 6], p: 0.7 },
    { id: "diamond", n: [1, 1], p: 0.12 },
    { id: "iron_ingot", n: [1, 4], p: 0.4 },
    { id: "blaze_rod", n: [1, 2], p: 0.18 },
    { id: "quartz", n: [2, 8], p: 0.45 },
    { id: "obsidian", n: [1, 2], p: 0.2 },
  ],
  ruined_portal: [
    { id: "obsidian", n: [1, 4], p: 0.8 },
    { id: "flint_and_steel", n: [1, 1], p: 0.55 },
    { id: "gold_ingot", n: [2, 8], p: 0.7 },
    { id: "golden_apple", n: [1, 1], p: 0.18 },
    { id: "gold_nugget", n: [4, 16], p: 0.6 },
    { id: "flint", n: [1, 4], p: 0.4 },
    { id: "netherrack", n: [4, 12], p: 0.5 },
  ],
  stronghold: [
    { id: "ender_pearl", n: [1, 2], p: 0.7 },
    { id: "iron_ingot", n: [1, 6], p: 0.65 },
    { id: "bread", n: [1, 4], p: 0.7 },
    { id: "apple", n: [1, 3], p: 0.45 },
    { id: "ender_eye", n: [1, 1], p: 0.22 },
    { id: "diamond", n: [1, 1], p: 0.1 },
    { id: "book", n: [1, 3], p: 0.4 },
    { id: "gold_ingot", n: [1, 3], p: 0.28 },
    { id: "iron_sword", n: [1, 1], p: 0.12 },
  ],
};
