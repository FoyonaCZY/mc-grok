import * as THREE from "three";
import { BLOCKS, AIR, WATER, LAVA } from "./blocks.js";
import { SIZE, HEIGHT, idx } from "./generator.js";
import { faceTile } from "./textures.js";

const FACES = [
  { dir: [0, 1, 0], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]], name: "top" },
  { dir: [0, -1, 0], corners: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], name: "bottom" },
  { dir: [0, 0, 1], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], name: "south" },
  { dir: [0, 0, -1], corners: [[1, 0, 0], [0, 0, 0], [0, 1, 0], [1, 1, 0]], name: "north" },
  { dir: [1, 0, 0], corners: [[1, 0, 1], [1, 0, 0], [1, 1, 0], [1, 1, 1]], name: "east" },
  { dir: [-1, 0, 0], corners: [[0, 0, 0], [0, 0, 1], [0, 1, 1], [0, 1, 0]], name: "west" },
];

export class Chunk {
  constructor(cx, cz) {
    this.cx = cx;
    this.cz = cz;
    this.blocks = new Uint8Array(SIZE * HEIGHT * SIZE);
    this.light = new Uint8Array(SIZE * HEIGHT * SIZE);
    this.dirty = true;
    this.mesh = null;
    this.transMesh = null;
    this.group = new THREE.Group();
    this.group.position.set(cx * SIZE, 0, cz * SIZE);
    this.modified = false;
    this.loot = [];
    this.spawns = [];
  }

  get(x, y, z) {
    if (x < 0 || z < 0 || y < 0 || x >= SIZE || z >= SIZE || y >= HEIGHT) return AIR;
    return this.blocks[idx(x, y, z)];
  }

  set(x, y, z, id) {
    if (x < 0 || z < 0 || y < 0 || x >= SIZE || z >= SIZE || y >= HEIGHT) return;
    this.blocks[idx(x, y, z)] = id;
    this.dirty = true;
    this.modified = true;
  }

  computeLight(world) {
    this.light.fill(0);
    const q = [];
    for (let x = 0; x < SIZE; x++) {
      for (let z = 0; z < SIZE; z++) {
        let sky = world?.dim === "nether" ? 4 : world?.dim === "end" ? 12 : 15;
        for (let y = HEIGHT - 1; y >= 0; y--) {
          const id = this.get(x, y, z);
          const b = BLOCKS[id];
          if (opaqueLight(b)) sky = 0;
          else if (id === WATER) sky = Math.max(0, sky - 2);
          else if (b?.cutout) sky = Math.max(0, sky - 1);
          let l = sky;
          if (b?.light) l = Math.max(l, b.light);
          this.light[idx(x, y, z)] = l;
          if (l > 1 && !opaqueLight(b)) q.push(x, y, z);
        }
      }
    }
    if (world) {
      for (let y = 0; y < HEIGHT; y++) {
        for (let i = 0; i < SIZE; i++) {
          seedEdge(this, world, q, 0, y, i);
          seedEdge(this, world, q, SIZE - 1, y, i);
          seedEdge(this, world, q, i, y, 0);
          seedEdge(this, world, q, i, y, SIZE - 1);
        }
      }
    }
    const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    let qi = 0;
    while (qi < q.length) {
      const x = q[qi++];
      const y = q[qi++];
      const z = q[qi++];
      const lv = this.light[idx(x, y, z)];
      if (lv <= 1) continue;
      for (const [dx, dy, dz] of dirs) {
        const nx = x + dx;
        const ny = y + dy;
        const nz = z + dz;
        if (ny < 0 || ny >= HEIGHT) continue;
        if (nx < 0 || nz < 0 || nx >= SIZE || nz >= SIZE) {
          if (!world || lv <= 2) continue;
          const wx = this.cx * SIZE + nx;
          const wz = this.cz * SIZE + nz;
          const nid = world.getBlock(wx, ny, wz);
          const nb = BLOCKS[nid];
          if (opaqueLight(nb)) continue;
          const nl = lv - (nid === WATER ? 2 : 1);
          if (nl > world.getLight(wx, ny, wz)) {
            const ncx = Math.floor(wx / SIZE);
            const ncz = Math.floor(wz / SIZE);
            if (world.chunkAt(ncx, ncz)) world.dirtyChunk(ncx, ncz);
          }
          continue;
        }
        const nid = this.get(nx, ny, nz);
        const nb = BLOCKS[nid];
        if (opaqueLight(nb)) continue;
        const nl = lv - (nid === WATER ? 2 : 1);
        const i2 = idx(nx, ny, nz);
        if (nl > this.light[i2]) {
          this.light[i2] = nl;
          if (nl > 1) q.push(nx, ny, nz);
        }
      }
    }
  }

  neighborLight(world, x, y, z) {
    const wx = this.cx * SIZE + x;
    const wz = this.cz * SIZE + z;
    if (y < 0) return 0;
    if (y >= HEIGHT) return world?.dim === "nether" ? 4 : world?.dim === "end" ? 12 : 15;
    if (x >= 0 && z >= 0 && x < SIZE && z < SIZE) return this.light[idx(x, y, z)];
    return world.getLight(wx, y, wz);
  }

  neighbor(world, x, y, z) {
    const wx = this.cx * SIZE + x;
    const wz = this.cz * SIZE + z;
    if (y < 0 || y >= HEIGHT) return AIR;
    if (x >= 0 && z >= 0 && x < SIZE && z < SIZE) return this.get(x, y, z);
    return world.getBlock(wx, y, wz);
  }

  buildMesh(world, textures, opaqueMat, cutoutMat, transMat) {
    this.computeLight(world);
    const opaque = emptyGeom();
    const cutout = emptyGeom();
    const trans = emptyGeom();

    for (let y = 0; y < HEIGHT; y++) {
      for (let z = 0; z < SIZE; z++) {
        for (let x = 0; x < SIZE; x++) {
          const id = this.get(x, y, z);
          if (id === AIR) continue;
          const block = BLOCKS[id];
          if (!block) continue;
          if (block.plant) {
            const tileName = faceTile(block, "side");
            const uv = textures.uv(TILE_SAFE(textures, tileName, block.key));
            const light = (this.neighborLight(world, x, y, z) ?? 0) / 15;
            pushCross(cutout, x, y, z, uv, light);
            continue;
          }
          if (block.doorOpen) {
            const tileName = faceTile(block, "front");
            const uv = textures.uv(TILE_SAFE(textures, tileName, block.key));
            const light = (this.neighborLight(world, x, y, z) ?? 0) / 15;
            pushDoorPanel(cutout, x, y, z, uv, light);
            continue;
          }
          const bucket = block.fluid || (block.transparent && !block.cutout) ? trans : block.cutout ? cutout : opaque;
          for (const face of FACES) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];
            const nid = this.neighbor(world, nx, ny, nz);
            const nb = BLOCKS[nid] || BLOCKS[0];
            if (!shouldDrawFace(block, nb, id, nid)) continue;
            const tileName = faceTile(block, face.name);
            const uv = textures.uv(TILE_SAFE(textures, tileName, block.key));
            const shade = faceShade(face.name);
            const ao = vertexAO(this, world, x, y, z, face);
            pushFace(bucket, x, y, z, face, uv, shade, ao, (lx, ly, lz) => this.neighborLight(world, lx, ly, lz));
          }
        }
      }
    }

    this.disposeMesh();
    this.mesh = makeMesh(opaque, opaqueMat);
    this.cutoutMesh = makeMesh(cutout, cutoutMat);
    this.transMesh = makeMesh(trans, transMat);
    if (this.mesh) this.group.add(this.mesh);
    if (this.cutoutMesh) this.group.add(this.cutoutMesh);
    if (this.transMesh) {
      this.transMesh.renderOrder = 1;
      this.group.add(this.transMesh);
    }
    this.dirty = false;
  }

  disposeMesh() {
    for (const m of [this.mesh, this.cutoutMesh, this.transMesh]) {
      if (!m) continue;
      this.group.remove(m);
      m.geometry.dispose();
    }
    this.mesh = this.cutoutMesh = this.transMesh = null;
  }
}

function opaqueLight(b) {
  return !!(b && b.solid && !b.transparent && !b.cutout && !b.fluid && !b.plant);
}

function seedEdge(chunk, world, q, x, y, z) {
  const l = chunk.light[idx(x, y, z)];
  const wx = chunk.cx * SIZE + x;
  const wz = chunk.cz * SIZE + z;
  const around = Math.max(
    world.getLight(wx + 1, y, wz),
    world.getLight(wx - 1, y, wz),
    world.getLight(wx, y, wz + 1),
    world.getLight(wx, y, wz - 1),
    y + 1 < HEIGHT ? world.getLight(wx, y + 1, wz) : 0,
    y > 0 ? world.getLight(wx, y - 1, wz) : 0,
  );
  const nl = around - 1;
  if (nl > l) {
    const id = chunk.get(x, y, z);
    if (opaqueLight(BLOCKS[id])) return;
    chunk.light[idx(x, y, z)] = nl;
    q.push(x, y, z);
  }
}

function TILE_SAFE(textures, name, fallback) {
  if (textures.tileIndex[name] != null) return name;
  if (textures.tileIndex[fallback] != null) return fallback;
  return "stone";
}

function shouldDrawFace(block, nb, id, nid) {
  if (nid === AIR) return true;
  if (block.fluid && nid === id) return false;
  if (nb.transparent || nb.cutout || nb.fluid) {
    if (block.transparent && !block.fluid && nid === id) return false;
    if (block.fluid && nb.fluid) return false;
    return nid !== id || block.fluid;
  }
  return false;
}

function faceShade(name) {
  if (name === "top") return 1;
  if (name === "bottom") return 0.5;
  if (name === "north" || name === "south") return 0.8;
  return 0.6;
}

function pushDoorPanel(g, x, y, z, uv, light) {
  const [u0, v0, u1, v1] = uv;
  const a = 0.22 + 0.78 * Math.max(light, 0.05);
  const t = 0.12;
  const planes = [
    [[t, 0, 0], [t, 0, 1], [t, 1, 1], [t, 1, 0]],
    [[t, 0, 1], [t, 0, 0], [t, 1, 0], [t, 1, 1]],
  ];
  const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  for (const corners of planes) {
    for (let i = 0; i < 4; i++) {
      g.pos.push(x + corners[i][0], y + corners[i][1], z + corners[i][2]);
      g.nrm.push(0, 1, 0);
      g.uv.push(uvs[i][0], uvs[i][1]);
      g.col.push(a, a, a);
    }
    const v = g.v;
    g.idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
    g.v += 4;
  }
}

function emptyGeom() {
  return { pos: [], nrm: [], uv: [], col: [], idx: [], v: 0 };
}

function pushCross(g, x, y, z, uv, light) {
  const [u0, v0, u1, v1] = uv;
  const a = 0.22 + 0.78 * Math.max(light, 0.05);
  const planes = [
    [[0.15, 0, 0.15], [0.85, 0, 0.85], [0.85, 1, 0.85], [0.15, 1, 0.15]],
    [[0.85, 0, 0.15], [0.15, 0, 0.85], [0.15, 1, 0.85], [0.85, 1, 0.15]],
  ];
  const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  for (const corners of planes) {
    for (let i = 0; i < 4; i++) {
      g.pos.push(x + corners[i][0], y + corners[i][1], z + corners[i][2]);
      g.nrm.push(0, 1, 0);
      g.uv.push(uvs[i][0], uvs[i][1]);
      g.col.push(a, a, a);
    }
    const v = g.v;
    g.idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
    g.v += 4;
  }
}

function pushFace(g, x, y, z, face, uv, shade, ao, lightAt) {
  const [u0, v0, u1, v1] = uv;
  const uvs = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const [dx, dy, dz] = face.dir;
  const lx = x + (dx > 0 ? 1 : 0);
  const ly = y + (dy > 0 ? 1 : 0);
  const lz = z + (dz > 0 ? 1 : 0);
  const light = (lightAt(x + dx, y + dy, z + dz) ?? 0) / 15;
  const base = 0.18 + 0.82 * Math.max(light, 0.05);
  for (let i = 0; i < 4; i++) {
    const c = face.corners[i];
    g.pos.push(x + c[0], y + c[1], z + c[2]);
    g.nrm.push(dx, dy, dz);
    g.uv.push(uvs[i][0], uvs[i][1]);
    const a = base * shade * ao[i];
    g.col.push(a, a, a);
  }
  const v = g.v;
  g.idx.push(v, v + 1, v + 2, v, v + 2, v + 3);
  g.v += 4;
}

function vertexAO(chunk, world, x, y, z, face) {
  const [dx, dy, dz] = face.dir;
  const out = [1, 1, 1, 1];
  for (let i = 0; i < 4; i++) {
    const c = face.corners[i];
    const sx = c[0] === 1 ? 1 : -1;
    const sy = c[1] === 1 ? 1 : -1;
    const sz = c[2] === 1 ? 1 : -1;
    let s1, s2, cnr;
    if (dy !== 0) {
      s1 = solid(chunk, world, x + sx, y + dy, z);
      s2 = solid(chunk, world, x, y + dy, z + sz);
      cnr = solid(chunk, world, x + sx, y + dy, z + sz);
    } else if (dx !== 0) {
      s1 = solid(chunk, world, x + dx, y + sy, z);
      s2 = solid(chunk, world, x + dx, y, z + sz);
      cnr = solid(chunk, world, x + dx, y + sy, z + sz);
    } else {
      s1 = solid(chunk, world, x + sx, y, z + dz);
      s2 = solid(chunk, world, x, y + sy, z + dz);
      cnr = solid(chunk, world, x + sx, y + sy, z + dz);
    }
    const side = (s1 && s2) ? 0 : 3 - (s1 + s2 + cnr);
    out[i] = [0.55, 0.7, 0.85, 1][side];
  }
  return out;
}

function solid(chunk, world, x, y, z) {
  const id = chunk.neighbor(world, x, y, z);
  const b = BLOCKS[id];
  return !!(b && b.solid && !b.transparent);
}

function makeMesh(g, mat) {
  if (!g.idx.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(g.pos, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(g.nrm, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(g.uv, 2));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(g.col, 3));
  geo.setIndex(g.idx);
  geo.computeBoundingSphere();
  return new THREE.Mesh(geo, mat);
}
