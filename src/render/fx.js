import * as THREE from "three";
import { BLOCKS, ITEMS } from "../world/blocks.js";
import { faceTile } from "../world/textures.js";
import { itemIcon, isSpriteItem } from "../ui/icons.js";

export class Particles {
  constructor(scene) {
    this.scene = scene;
    this.items = [];
    this.pool = [];
    this.geo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    this.max = 96;
  }

  alloc(color) {
    let p = this.pool.pop();
    if (!p) {
      const mat = new THREE.MeshBasicMaterial({ color });
      const mesh = new THREE.Mesh(this.geo, mat);
      p = { mesh, vel: new THREE.Vector3(), life: 0 };
    }
    p.mesh.material.color.setHex(color);
    p.mesh.visible = true;
    this.scene.add(p.mesh);
    return p;
  }

  burst(x, y, z, color, n = 12) {
    this.burstAt(x + 0.5, y + 0.5, z + 0.5, color, n);
  }

  burstAt(x, y, z, color, n = 12) {
    const room = this.max - this.items.length;
    n = Math.min(n, Math.max(0, room));
    for (let i = 0; i < n; i++) {
      const p = this.alloc(color);
      p.mesh.position.set(x, y, z);
      p.vel.set((Math.random() - 0.5) * 3, Math.random() * 3 + 1, (Math.random() - 0.5) * 3);
      p.life = 0.45 + Math.random() * 0.4;
      this.items.push(p);
    }
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.vel.y -= 12 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.mesh.rotation.x += dt * 4;
      p.mesh.rotation.y += dt * 6;
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        p.mesh.visible = false;
        this.pool.push(p);
        this.items.splice(i, 1);
      }
    }
  }

  dispose() {
    for (const p of [...this.items, ...this.pool]) {
      this.scene.remove(p.mesh);
      p.mesh.material.dispose();
    }
    this.items = [];
    this.pool = [];
    this.geo.dispose();
  }
}

export class BreakOverlay {
  constructor(scene, textures) {
    this.textures = textures;
    this.mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.002, 1.002, 1.002),
      new THREE.MeshBasicMaterial({
        map: null,
        transparent: true,
        depthWrite: false,
        alphaTest: 0.05,
      }),
    );
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.maps = [];
    for (let i = 0; i < 10; i++) {
      const t = new THREE.CanvasTexture(textures.tiles[textures.tileIndex[`crack_${i}`]]);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      this.maps.push(t);
    }
  }

  show(x, y, z, progress) {
    if (progress <= 0) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    this.mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
    const i = Math.min(9, Math.floor(progress * 10));
    this.mesh.material.map = this.maps[i];
    this.mesh.material.needsUpdate = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}

export class BlockHighlight {
  constructor(scene) {
    const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.002, 1.002, 1.002));
    this.line = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x000000 }));
    this.line.visible = false;
    scene.add(this.line);
  }

  show(x, y, z) {
    this.line.visible = true;
    this.line.position.set(x + 0.5, y + 0.5, z + 0.5);
  }

  hide() {
    this.line.visible = false;
  }
}

function canvasTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

export function makeHand(textures) {
  const group = new THREE.Group();
  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.72, 0.22),
    new THREE.MeshLambertMaterial({ color: 0xc1966a, emissive: 0x3a2418 }),
  );
  const sleeve = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.32, 0.26),
    new THREE.MeshLambertMaterial({ color: 0x3b6ea5 }),
  );
  sleeve.position.y = -0.22;
  arm.add(sleeve);
  arm.position.set(0.34, -0.42, -0.58);
  arm.rotation.x = 0.42;
  arm.rotation.y = 0.12;
  arm.rotation.z = -0.22;

  const heldRoot = new THREE.Group();
  heldRoot.position.set(0.02, 0.34, 0.02);
  arm.add(heldRoot);

  const heldCube = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 0.24),
    new THREE.MeshLambertMaterial({ color: 0xffffff }),
  );
  heldCube.visible = false;
  const heldSprite = new THREE.Mesh(
    new THREE.PlaneGeometry(0.38, 0.38),
    new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.12,
      side: THREE.DoubleSide,
      color: 0xffffff,
    }),
  );
  heldSprite.visible = false;
  heldRoot.add(heldCube, heldSprite);

  group.add(arm);
  const fill = new THREE.PointLight(0xfff0dd, 0.4, 1.8);
  fill.position.set(0.1, -0.1, 0.05);
  group.add(fill);
  group.arm = arm;
  group.heldRoot = heldRoot;
  group.heldCube = heldCube;
  group.heldSprite = heldSprite;
  group.held = heldCube;
  group.textures = textures;
  group._heldId = null;
  group._texCache = new Map();
  group._idle = 0;
  return group;
}

function cachedTex(hand, key, canvas) {
  if (hand._texCache.has(key)) return hand._texCache.get(key);
  const tex = canvasTex(canvas);
  hand._texCache.set(key, tex);
  return tex;
}

function likeTool(id) {
  const it = ITEMS[id];
  if (!it) return false;
  if (it.isTool || it.tool) return true;
  return id === "bow" || id === "fishing_rod" || id === "stick" || id === "arrow" || id === "bone" || id === "shears" || id === "shield";
}

export function setHeldItem(hand, itemId) {
  const cube = hand.heldCube;
  const sprite = hand.heldSprite;
  if (!itemId) {
    cube.visible = false;
    sprite.visible = false;
    hand._heldId = null;
    return;
  }
  if (hand._heldId === itemId) return;
  hand._heldId = itemId;
  const spriteItem = isSpriteItem(itemId);
  if (!spriteItem) {
    sprite.visible = false;
    cube.visible = true;
    const block = BLOCKS[ITEMS[itemId].blockId];
    const name = faceTile(block, "south") || faceTile(block, "side") || block.key;
    const idx = hand.textures.tileIndex[name] ?? hand.textures.tileIndex.stone ?? 0;
    cube.material.map = cachedTex(hand, "tile:" + name, hand.textures.tiles[idx]);
    cube.material.emissive.setHex(0x333333);
    cube.material.transparent = !!(block.transparent || block.cutout);
    cube.material.alphaTest = block.cutout ? 0.2 : 0;
    cube.material.needsUpdate = true;
    cube.rotation.set(0.15, 0.45, 0.12);
    cube.position.set(0, 0.02, 0.04);
    return;
  }
  cube.visible = false;
  sprite.visible = true;
  const icon = itemIcon(hand.textures, itemId, 16);
  sprite.material.map = cachedTex(hand, "icon:" + itemId, icon);
  sprite.material.needsUpdate = true;
  if (likeTool(itemId)) {
    sprite.rotation.set(0.2, 0.95, 1.15);
    sprite.position.set(0.04, 0.1, 0.08);
  } else {
    sprite.rotation.set(0.05, 0.35, 0.15);
    sprite.position.set(0.02, 0.04, 0.05);
  }
}

export function updateHand(hand, player, swing, dt) {
  hand._idle += dt;
  const punch = Math.sin(Math.max(0, swing) * Math.PI);
  const block = player.blocking ? 1 : 0;
  const spd = Math.hypot(player.vel.x, player.vel.z);
  const moving = player.onGround && !player.flying && spd > 0.03;
  const target = moving ? Math.min(16, 7 + spd * 80) : 0;
  hand._walkSpeed = (hand._walkSpeed ?? 0) + (target - (hand._walkSpeed ?? 0)) * Math.min(1, dt * 14);
  hand._walk = (hand._walk || 0) + dt * hand._walkSpeed;
  const walkAmt = Math.min(1, (hand._walkSpeed || 0) / 8) * (1 - block * 0.7);
  const bob = hand._walk;
  hand.arm.rotation.x = 0.42 + Math.sin(bob) * 0.34 * walkAmt - punch * 1.45 - block * 0.85;
  hand.arm.rotation.y = 0.12 + punch * 0.7 + block * 0.55;
  hand.arm.rotation.z = -0.22 - Math.cos(bob) * 0.06 * walkAmt - punch * 0.18 - block * 0.35;
  const idle = Math.sin(hand._idle * 1.8) * 0.012;
  hand.position.x = Math.sin(bob) * 0.05 * walkAmt + punch * 0.07 + block * 0.08;
  hand.position.y = -Math.abs(Math.sin(bob)) * 0.045 * walkAmt - punch * 0.16 + idle + block * 0.12;
  hand.position.z = -punch * 0.1 - block * 0.06;
  setHeldItem(hand, player.held()?.id);
}
