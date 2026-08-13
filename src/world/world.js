import * as THREE from "three";
import { Chunk } from "./chunk.js";
import { TerrainGenerator, SIZE, HEIGHT, SEA, idx } from "./generator.js";
import { BLOCKS, AIR, WATER, LAVA, BEDROCK, TNT, LOG, LEAVES, FARMLAND, WHEAT_0, WHEAT_1, WHEAT_2, WHEAT_3, OAK_SAPLING, OBSIDIAN, NETHER_PORTAL, NETHERRACK, END_PORTAL, END_PORTAL_FRAME, END_PORTAL_FRAME_EYE, DRAGON_EGG } from "./blocks.js";
import { encodeChunk, decodeChunk } from "../core/storage.js";

export class World {
  constructor({ seed, worldType, textures, scene }) {
    this.seed = seed;
    this.gen = new TerrainGenerator(seed, worldType);
    this.textures = textures;
    this.scene = scene;
    this.chunks = new Map();
    this.group = new THREE.Group();
    scene.add(this.group);
    this.meshQueue = [];
    this.dim = "overworld";
    this.gen.dim = "overworld";
    this.overworldPatches = {};
    this.netherPatches = {};
    this.endPatches = {};
    this.patches = this.overworldPatches;
    this.dragonDead = false;
    this.time = 1000;
    this.tickAcc = 0;
    this.weather = "clear";
    this.weatherTimer = 0;
    this._lastChunkKey = "";
    this.chestLoot = new Map();
    this.pendingMobs = [];
    this.fastGfx = false;

    const atlasTex = new THREE.CanvasTexture(textures.atlas);
    atlasTex.magFilter = THREE.NearestFilter;
    atlasTex.minFilter = THREE.NearestFilter;
    atlasTex.colorSpace = THREE.SRGBColorSpace;
    atlasTex.flipY = false;
    atlasTex.needsUpdate = true;
    this.atlasTex = atlasTex;

    this.opaqueMat = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
    });
    this.cutoutMat = new THREE.MeshBasicMaterial({
      map: atlasTex,
      vertexColors: true,
      alphaTest: 0.4,
      transparent: false,
      side: THREE.DoubleSide,
    });
    this.transMat = new THREE.MeshLambertMaterial({
      map: atlasTex,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  dispose() {
    for (const c of this.chunks.values()) {
      c.disposeMesh();
      this.group.remove(c.group);
    }
    this.chunks.clear();
    this.scene.remove(this.group);
    this.opaqueMat.dispose();
    this.cutoutMat.dispose();
    this.transMat.dispose();
    this.atlasTex.dispose();
  }

  key(cx, cz) {
    return `${cx},${cz}`;
  }

  chunkAt(cx, cz) {
    return this.chunks.get(this.key(cx, cz));
  }

  ensureChunk(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (c) return c;
    c = new Chunk(cx, cz);
    this.gen.fillChunk(c);
    const patch = this.patches[k];
    if (patch) c.blocks = decodeChunk(patch, c.blocks.length);
    for (const l of c.loot) {
      this.chestLoot.set(`${this.dim}:${cx * SIZE + l.x},${l.y},${cz * SIZE + l.z}`, l.kind);
    }
    if (c.spawns?.length) {
      this.pendingMobs.push(...c.spawns);
      c.spawns = [];
    }
    this.chunks.set(k, c);
    this.group.add(c.group);
    this.enqueueMesh(c);
    return c;
  }

  enqueueMesh(c) {
    if (!c) return;
    c.dirty = true;
    this.meshQueue.push(c);
  }

  getBlock(x, y, z) {
    y = Math.floor(y);
    if (y < 0 || y >= HEIGHT) return AIR;
    const cx = Math.floor(x / SIZE);
    const cz = Math.floor(z / SIZE);
    const c = this.chunkAt(cx, cz);
    if (!c) return AIR;
    const lx = ((Math.floor(x) % SIZE) + SIZE) % SIZE;
    const lz = ((Math.floor(z) % SIZE) + SIZE) % SIZE;
    return c.get(lx, y, lz);
  }

  getLight(x, y, z) {
    y = Math.floor(y);
    if (y < 0) return 0;
    if (y >= HEIGHT) return this.dim === "nether" ? 4 : this.dim === "end" ? 12 : 15;
    const cx = Math.floor(x / SIZE);
    const cz = Math.floor(z / SIZE);
    const c = this.chunkAt(cx, cz);
    if (!c) return 0;
    const lx = ((Math.floor(x) % SIZE) + SIZE) % SIZE;
    const lz = ((Math.floor(z) % SIZE) + SIZE) % SIZE;
    return c.light[idx(lx, y, lz)] ?? 12;
  }

  setBlock(x, y, z, id) {
    y = Math.floor(y);
    if (y < 0 || y >= HEIGHT) return false;
    const wx = Math.floor(x);
    const wz = Math.floor(z);
    const cx = Math.floor(wx / SIZE);
    const cz = Math.floor(wz / SIZE);
    const c = this.ensureChunk(cx, cz);
    const lx = ((wx % SIZE) + SIZE) % SIZE;
    const lz = ((wz % SIZE) + SIZE) % SIZE;
    const prev = c.get(lx, y, lz);
    if (prev === BEDROCK && id === AIR) return false;
    c.set(lx, y, lz, id);
    this.markDirty(cx, cz, lx, lz);
    this.patches[this.key(cx, cz)] = encodeChunk(c.blocks);
    return true;
  }

  markDirty(cx, cz, lx, lz) {
    this.enqueueMesh(this.chunkAt(cx, cz));
    if (lx === 0) this.dirtyChunk(cx - 1, cz);
    if (lx === SIZE - 1) this.dirtyChunk(cx + 1, cz);
    if (lz === 0) this.dirtyChunk(cx, cz - 1);
    if (lz === SIZE - 1) this.dirtyChunk(cx, cz + 1);
  }

  dirtyChunk(cx, cz) {
    this.enqueueMesh(this.chunkAt(cx, cz));
  }

  isSolid(x, y, z) {
    y = Math.floor(y);
    if (y < 0 || y >= HEIGHT) return false;
    const cx = Math.floor(x / SIZE);
    const cz = Math.floor(z / SIZE);
    if (!this.chunkAt(cx, cz)) return true;
    const b = BLOCKS[this.getBlock(x, y, z)];
    return !!(b && b.solid);
  }

  isFluid(x, y, z) {
    const id = this.getBlock(x, y, z);
    return id === WATER || id === LAVA;
  }

  updateChunks(px, pz, dist, genBudget = 2) {
    const pcx = Math.floor(px / SIZE);
    const pcz = Math.floor(pz / SIZE);
    const missing = [];
    for (let dz = -dist; dz <= dist; dz++) {
      for (let dx = -dist; dx <= dist; dx++) {
        if (dx * dx + dz * dz > dist * dist + 1) continue;
        const cx = pcx + dx;
        const cz = pcz + dz;
        if (!this.chunks.has(this.key(cx, cz))) missing.push([cx, cz, dx * dx + dz * dz]);
      }
    }
    missing.sort((a, b) => a[2] - b[2]);
    const n = Math.max(1, genBudget | 0);
    for (let i = 0; i < missing.length && i < n; i++) this.ensureChunk(missing[i][0], missing[i][1]);

    const unloadR = (dist + 1) * (dist + 1) + 2;
    for (const [k, c] of this.chunks) {
      const dx = c.cx - pcx;
      const dz = c.cz - pcz;
      if (dx * dx + dz * dz > unloadR) {
        c.disposeMesh();
        this.group.remove(c.group);
        this.chunks.delete(k);
      }
    }
  }

  processMeshQueue(budget = 2, px = 0, pz = 0) {
    const seen = new Set();
    const unique = [];
    for (const c of this.meshQueue) {
      const k = this.key(c.cx, c.cz);
      if (seen.has(k) || !this.chunks.has(k) || !c.dirty) continue;
      seen.add(k);
      unique.push(c);
    }
    unique.sort((a, b) => {
      const ax = a.cx * SIZE + 8 - px;
      const az = a.cz * SIZE + 8 - pz;
      const bx = b.cx * SIZE + 8 - px;
      const bz = b.cz * SIZE + 8 - pz;
      return ax * ax + az * az - (bx * bx + bz * bz);
    });
    const opts = { ao: !this.fastGfx, fancyLight: !this.fastGfx };
    let n = 0;
    const rest = [];
    for (const c of unique) {
      if (n < budget) {
        c.buildMesh(this, this.textures, this.opaqueMat, this.cutoutMat, this.transMat, opts);
        n++;
      } else rest.push(c);
    }
    this.meshQueue = rest;
    return n;
  }

  preload(px, pz, dist, onProgress) {
    const pcx = Math.floor(px / SIZE);
    const pcz = Math.floor(pz / SIZE);
    const list = [];
    for (let dz = -dist; dz <= dist; dz++) {
      for (let dx = -dist; dx <= dist; dx++) {
        if (dx * dx + dz * dz > dist * dist + 1) continue;
        list.push([pcx + dx, pcz + dz]);
      }
    }
    list.sort((a, b) => a[0] * a[0] + a[1] * a[1] - (b[0] * b[0] + b[1] * b[1]));
    let i = 0;
    const step = () => {
      const start = performance.now();
      while (i < list.length && performance.now() - start < 12) {
        this.ensureChunk(list[i][0], list[i][1]);
        i++;
      }
      this.processMeshQueue(6);
      onProgress(i / list.length);
      if (i < list.length || this.meshQueue.length) requestAnimationFrame(step);
      else onProgress(1);
    };
    return new Promise((resolve) => {
      const wrap = (p) => {
        onProgress(p);
        if (p >= 1 && this.meshQueue.length === 0) resolve();
        else if (p >= 1) {
          const pump = () => {
            this.processMeshQueue(8);
            if (this.meshQueue.length) requestAnimationFrame(pump);
            else resolve();
          };
          pump();
        }
      };
      const run = () => {
        const start = performance.now();
        while (i < list.length && performance.now() - start < 14) {
          this.ensureChunk(list[i][0], list[i][1]);
          i++;
        }
        this.processMeshQueue(8);
        wrap(Math.min(0.99, i / list.length));
        if (i < list.length) requestAnimationFrame(run);
        else wrap(1);
      };
      run();
    });
  }

  collideAABB(box) {
    const minX = Math.floor(box.min.x + 1e-8);
    const minY = Math.floor(box.min.y + 1e-8);
    const minZ = Math.floor(box.min.z + 1e-8);
    const maxX = Math.floor(box.max.x - 1e-8);
    const maxY = Math.floor(box.max.y - 1e-8);
    const maxZ = Math.floor(box.max.z - 1e-8);
    const hits = [];
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          if (this.isSolid(x, y, z)) {
            hits.push(new THREE.Box3(new THREE.Vector3(x, y, z), new THREE.Vector3(x + 1, y + 1, z + 1)));
          }
        }
      }
    }
    return hits;
  }

  applyGravityBlocks(x, y, z) {
    const id = this.getBlock(x, y, z);
    const b = BLOCKS[id];
    if (!b?.gravity) return;
    if (y > 0 && this.getBlock(x, y - 1, z) === AIR) {
      this.setBlock(x, y, z, AIR);
      this.setBlock(x, y - 1, z, id);
      this.applyGravityBlocks(x, y - 1, z);
      this.applyGravityBlocks(x, y + 1, z);
    }
  }

  tickGrowth(pos) {
    const px = Math.floor(pos.x);
    const py = Math.floor(pos.y);
    const pz = Math.floor(pos.z);
    for (let i = 0; i < 56; i++) {
      const x = px + ((Math.random() * 21) | 0) - 10;
      const y = py + ((Math.random() * 7) | 0) - 3;
      const z = pz + ((Math.random() * 21) | 0) - 10;
      const id = this.getBlock(x, y, z);
      if (id === WHEAT_0 || id === WHEAT_1 || id === WHEAT_2) {
        if (this.getBlock(x, y - 1, z) !== FARMLAND) continue;
        if (Math.random() > 0.28) continue;
        this.setBlock(x, y, z, id === WHEAT_0 ? WHEAT_1 : id === WHEAT_1 ? WHEAT_2 : WHEAT_3);
      } else if (id === OAK_SAPLING && Math.random() < 0.08) {
        this.growOakTree(x, y, z);
      }
    }
  }

  growOakTree(x, y, z) {
    const h = 4 + ((Math.random() * 3) | 0);
    if (y + h + 2 >= HEIGHT) return false;
    for (let i = 1; i <= 3; i++) {
      const above = this.getBlock(x, y + i, z);
      if (above !== AIR && above !== OAK_SAPLING && above !== LEAVES) return false;
    }
    this.setBlock(x, y, z, LOG);
    for (let i = 1; i < h; i++) this.setBlock(x, y + i, z, LOG);
    const top = y + h - 1;
    for (let dy = -2; dy <= 2; dy++) {
      const r = dy >= 1 ? 1 : 2;
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r && Math.abs(dz) === r && Math.random() < 0.4) continue;
          const tx = x + dx;
          const ty = top + dy;
          const tz = z + dz;
          const cur = this.getBlock(tx, ty, tz);
          if (cur === AIR || cur === OAK_SAPLING) this.setBlock(tx, ty, tz, LEAVES);
        }
      }
    }
    this.setBlock(x, y + h, z, LEAVES);
    return true;
  }

  patchesFor(dim) {
    if (dim === "nether") return this.netherPatches || {};
    if (dim === "end") return this.endPatches || {};
    return this.overworldPatches || {};
  }

  stashPatches() {
    if (this.dim === "nether") this.netherPatches = this.patches;
    else if (this.dim === "end") this.endPatches = this.patches;
    else this.overworldPatches = this.patches;
  }

  switchDim(dim) {
    if (dim !== "nether" && dim !== "overworld" && dim !== "end") return;
    this.stashPatches();
    for (const c of this.chunks.values()) {
      c.disposeMesh();
      this.group.remove(c.group);
    }
    this.chunks.clear();
    this.meshQueue = [];
    this.chestLoot.clear();
    this.pendingMobs = [];
    this.gen.spawned = new Set();
    this.dim = dim;
    this.gen.dim = dim;
    this.gen.dragonDead = this.dragonDead;
    this.patches = this.patchesFor(dim);
    if (dim === "nether") this.netherPatches = this.patches;
    else if (dim === "end") this.endPatches = this.patches;
    else this.overworldPatches = this.patches;
    this._lastChunkKey = "";
    if (dim === "nether" || dim === "end") this.weather = "clear";
  }

  isPortalSpace(id) {
    return id === AIR || id === NETHER_PORTAL;
  }

  tryLightPortal(wx, wy, wz) {
    wx = Math.floor(wx);
    wy = Math.floor(wy);
    wz = Math.floor(wz);
    return this.fillPortalAxis(wx, wy, wz, true) || this.fillPortalAxis(wx, wy, wz, false);
  }

  fillPortalAxis(wx, wy, wz, alongX) {
    const getA = (a, y) => (alongX ? this.getBlock(a, y, wz) : this.getBlock(wx, y, a));
    const startA = alongX ? wx : wz;
    if (!this.isPortalSpace(getA(startA, wy)) && getA(startA, wy) !== OBSIDIAN) return false;
    let y0 = wy;
    while (y0 > 1 && this.isPortalSpace(getA(startA, y0 - 1))) y0--;
    let y1 = wy;
    while (y1 < HEIGHT - 2 && this.isPortalSpace(getA(startA, y1 + 1))) y1++;
    if (getA(startA, wy) === OBSIDIAN) {
      if (this.isPortalSpace(getA(startA, wy + 1))) {
        y0 = wy + 1;
        y1 = y0;
        while (y1 < HEIGHT - 2 && this.isPortalSpace(getA(startA, y1 + 1))) y1++;
      } else return false;
    }
    let a0 = startA;
    while (this.isPortalSpace(getA(a0 - 1, y0))) a0--;
    let a1 = startA;
    while (this.isPortalSpace(getA(a1 + 1, y0))) a1++;
    const innerW = a1 - a0 + 1;
    const innerH = y1 - y0 + 1;
    if (innerW < 2 || innerW > 21 || innerH < 3 || innerH > 21) return false;
    for (let y = y0; y <= y1; y++) {
      for (let a = a0; a <= a1; a++) {
        if (!this.isPortalSpace(getA(a, y))) return false;
      }
    }
    for (let a = a0 - 1; a <= a1 + 1; a++) {
      if (getA(a, y0 - 1) !== OBSIDIAN) return false;
      if (getA(a, y1 + 1) !== OBSIDIAN) return false;
    }
    for (let y = y0; y <= y1; y++) {
      if (getA(a0 - 1, y) !== OBSIDIAN) return false;
      if (getA(a1 + 1, y) !== OBSIDIAN) return false;
    }
    for (let y = y0; y <= y1; y++) {
      for (let a = a0; a <= a1; a++) {
        if (alongX) this.setBlock(a, y, wz, NETHER_PORTAL);
        else this.setBlock(wx, y, a, NETHER_PORTAL);
      }
    }
    return true;
  }

  findPortalNear(wx, wy, wz, r = 10) {
    wx = Math.floor(wx);
    wy = Math.floor(wy);
    wz = Math.floor(wz);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (this.getBlock(wx + dx, wy + dy, wz + dz) === NETHER_PORTAL) {
            return { x: wx + dx + 0.5, y: wy + dy, z: wz + dz + 0.5 };
          }
        }
      }
    }
    return null;
  }

  placeExitPortal(wx, wz) {
    wx = Math.floor(wx);
    wz = Math.floor(wz);
    const pcx = Math.floor(wx / SIZE);
    const pcz = Math.floor(wz / SIZE);
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) this.ensureChunk(pcx + dx, pcz + dz);
    }
    let y = 48;
    if (this.dim === "nether") {
      for (let ty = 72; ty > 14; ty--) {
        const id = this.getBlock(wx, ty, wz);
        const above = this.getBlock(wx, ty + 1, wz);
        if (BLOCKS[id]?.solid && (above === AIR || above === LAVA)) {
          y = ty + 1;
          break;
        }
      }
    } else {
      y = Math.max(4, Math.min(HEIGHT - 8, this.gen.height(wx, wz) + 1));
    }
    y = Math.max(4, Math.min(HEIGHT - 8, y));
    const near = this.findPortalNear(wx, y, wz, 8);
    if (near) return near;
    for (let dx = -2; dx <= 3; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const px = wx + dx;
        const pz = wz + dz;
        this.setBlock(px, y - 1, pz, this.dim === "nether" ? NETHERRACK : OBSIDIAN);
        for (let dy = 0; dy < 5; dy++) {
          const cur = this.getBlock(px, y + dy, pz);
          if (cur === LAVA || (BLOCKS[cur]?.solid && cur !== OBSIDIAN && cur !== BEDROCK)) {
            this.setBlock(px, y + dy, pz, AIR);
          }
        }
      }
    }
    const ox = wx - 1;
    const oz = wz;
    for (let i = 0; i < 4; i++) {
      this.setBlock(ox + i, y, oz, OBSIDIAN);
      this.setBlock(ox + i, y + 4, oz, OBSIDIAN);
    }
    for (let i = 1; i < 4; i++) {
      this.setBlock(ox, y + i, oz, OBSIDIAN);
      this.setBlock(ox + 3, y + i, oz, OBSIDIAN);
    }
    for (let i = 1; i <= 2; i++) {
      for (let j = 1; j <= 3; j++) this.setBlock(ox + i, y + j, oz, NETHER_PORTAL);
    }
    return { x: ox + 1.5, y: y + 1, z: oz + 0.5 };
  }

  placeEndSpawn() {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) this.ensureChunk(dx, dz);
    }
    const y = 48;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(dx, y, dz, OBSIDIAN);
        for (let dy = 1; dy <= 4; dy++) {
          const id = this.getBlock(dx, y + dy, dz);
          if (id !== BEDROCK) this.setBlock(dx, y + dy, dz, AIR);
        }
      }
    }
    return { x: 0.5, y: y + 1.1, z: 0.5 };
  }

  placeEndFountain() {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) this.ensureChunk(dx, dz);
    }
    const y = 49;
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        this.setBlock(dx, y, dz, BEDROCK);
        for (let dy = 1; dy <= 5; dy++) this.setBlock(dx, y + dy, dz, AIR);
      }
    }
    this.setBlock(0, y, 0, END_PORTAL);
    this.setBlock(1, y + 1, 0, BEDROCK);
    this.setBlock(1, y + 2, 0, DRAGON_EGG);
  }

  tryActivateEndPortal(wx, wy, wz) {
    wx = Math.floor(wx);
    wy = Math.floor(wy);
    wz = Math.floor(wz);
    const spots = [
      [-1, -2], [0, -2], [1, -2],
      [-1, 2], [0, 2], [1, 2],
      [-2, -1], [-2, 0], [-2, 1],
      [2, -1], [2, 0], [2, 1],
    ];
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const cx = wx + dx;
        const cz = wz + dz;
        if (!spots.some(([sx, sz]) => wx === cx + sx && wz === cz + sz)) continue;
        let eyes = 0;
        let frames = 0;
        for (const [sx, sz] of spots) {
          const id = this.getBlock(cx + sx, wy, cz + sz);
          if (id === END_PORTAL_FRAME || id === END_PORTAL_FRAME_EYE) frames++;
          if (id === END_PORTAL_FRAME_EYE) eyes++;
        }
        if (frames === 12 && eyes === 12) {
          for (let ix = -1; ix <= 1; ix++) {
            for (let iz = -1; iz <= 1; iz++) this.setBlock(cx + ix, wy, cz + iz, END_PORTAL);
          }
          return true;
        }
      }
    }
    return false;
  }

  explode(cx, cy, cz, power = 3) {
    const r = power;
    for (let y = -r; y <= r; y++) {
      for (let z = -r; z <= r; z++) {
        for (let x = -r; x <= r; x++) {
          if (x * x + y * y + z * z > r * r) continue;
          const bx = Math.floor(cx + x);
          const by = Math.floor(cy + y);
          const bz = Math.floor(cz + z);
          const id = this.getBlock(bx, by, bz);
          if (id === BEDROCK || id === AIR) continue;
          if (power < 4 && (id === OBSIDIAN || id === NETHER_PORTAL || id === END_PORTAL
            || id === END_PORTAL_FRAME || id === END_PORTAL_FRAME_EYE)) continue;
          this.setBlock(bx, by, bz, AIR);
        }
      }
    }
  }
}

export { SIZE, HEIGHT, SEA };
