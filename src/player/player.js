import * as THREE from "three";
import { voxelRaycast, resolveCollisions } from "./physics.js";
import { BLOCKS, ITEMS, AIR, WATER, LAVA, TNT, BEDROCK } from "../world/blocks.js";

const TICK = 1 / 20;
const WIDTH = 0.6;
const HEIGHT_STAND = 1.8;
const HEIGHT_SNEAK = 1.5;

export class Player {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.pos = new THREE.Vector3(0, 80, 0);
    this.prevPos = new THREE.Vector3(0, 80, 0);
    this.renderPos = new THREE.Vector3(0, 80, 0);
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.flying = false;
    this.flyToggled = false;
    this.lastJump = 0;
    this.lastForward = 0;
    this.sprinting = false;
    this.sneaking = false;
    this.inFluid = false;
    this.inLava = false;
    this.gamemode = "survival";
    this.health = 20;
    this.hunger = 20;
    this.saturation = 5;
    this.xp = 0;
    this.xpLevel = 0;
    this.invuln = 0;
    this.bob = 0;
    this.prevBob = 0;
    this.renderBob = 0;
    this.walkDist = 0;
    this.swing = 0;
    this.breakTime = 0;
    this.breakTarget = null;
    this.look = null;
    this.selected = 0;
    this.hotbar = Array.from({ length: 9 }, () => null);
    this.inv = Array.from({ length: 27 }, () => null);
    this.armor = [null, null, null, null];
    this.offhand = null;
    this.cursor = null;
    this.craft = Array.from({ length: 4 }, () => null);
    this.craft3 = Array.from({ length: 9 }, () => null);
    this.usingTable = false;
    this.usingFurnace = false;
    this.usingChest = null;
    this.chests = new Map();
    this.eatTime = 0;
    this.dead = false;
    this.score = 0;
    this.fallStart = 0;
    this.spawn = new THREE.Vector3();
    this.perspective = 0;
    this.acc = 0;
    this.stepDist = 0;
    this.hurtYaw = 0;
    this.fireTicks = 0;
    this.vehicleId = 0;
    this.wishX = 0;
    this.wishZ = 0;
    this.tradingJob = "farmer";
  }

  eyeHeight() {
    if (this.vehicleId) return 1.05;
    return this.sneaking && !this.flying ? 1.27 : 1.62;
  }

  onClimb() {
    return !!(
      BLOCKS[this.world.getBlock(this.pos.x, this.pos.y, this.pos.z)]?.climb
      || BLOCKS[this.world.getBlock(this.pos.x, this.pos.y + 0.9, this.pos.z)]?.climb
    );
  }

  height() {
    return this.sneaking && !this.flying ? HEIGHT_SNEAK : HEIGHT_STAND;
  }

  held() {
    return this.hotbar[this.selected];
  }

  setSpawn(p) {
    this.spawn.copy(p);
    this.pos.copy(p);
    this.prevPos.copy(p);
    this.renderPos.copy(p);
  }

  updateLook() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const origin = this.camera.position.clone();
    this.look = voxelRaycast(this.world, origin, dir, this.gamemode === "creative" ? 8 : 5);
  }

  tickLook(dt, input, creativeInstant, onBreak, onPlace, onUse) {
    this.updateLook();
    if (this.dead) return;
    if (this.swing > 0) this.swing = Math.max(0, this.swing - dt * 4);

    if (input.mouse.left) {
      this.swing = 1;
      if (this.look) {
        const key = `${this.look.x},${this.look.y},${this.look.z}`;
        if (!this.breakTarget || this.breakTarget.key !== key) {
          this.breakTarget = { key, ...this.look, progress: 0 };
        }
        const insta = this.gamemode === "creative" || creativeInstant;
        if (insta) {
          onBreak(this.look);
          this.breakTarget = null;
        } else if (this.gamemode !== "adventure") {
          const speed = this.mineSpeed(this.look.id);
          this.breakTarget.progress += dt * speed;
          if (this.breakTarget.progress >= 1) {
            onBreak(this.look);
            this.breakTarget = null;
          }
        }
      }
    } else {
      this.breakTarget = null;
    }
  }

  mineSpeed(blockId) {
    const b = BLOCKS[blockId];
    if (!b || b.hardness < 0) return 0;
    if (b.hardness === 0) return 100;
    let speed = 1;
    const held = this.held();
    const tool = held ? ITEMS[held.id] : null;
    if (tool?.tool && (tool.tool === b.tool || b.tool === "any")) {
      speed = tool.speed || 1;
      if ((tool.harvest || 0) < (b.harvest || 0)) speed = 1;
    } else if (b.tool === "pickaxe" && b.harvest > 0) {
      speed = 0.3;
    }
    if (this.inFluid && !this.onGround) speed *= 0.2;
    if (!this.onGround && !this.flying) speed *= 0.2;
    return speed / Math.max(0.05, b.hardness);
  }

  canHarvest(blockId) {
    const b = BLOCKS[blockId];
    if (!b) return false;
    if (!b.harvest) return true;
    const tool = this.held() ? ITEMS[this.held().id] : null;
    return !!(tool && tool.tool === b.tool && (tool.harvest || 0) >= b.harvest);
  }

  applyInput(dt, input, settings) {
    const look = input.consumeLook();
    this.yaw -= look.dx * 0.15 * (Math.PI / 180);
    this.pitch -= look.dy * 0.15 * (Math.PI / 180);
    this.pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, this.pitch));

    if (this.dead) return { stepped: false };
    this.acc += dt;
    let stepped = false;
    while (this.acc >= TICK) {
      this.prevPos.copy(this.pos);
      this.prevBob = this.bob;
      this.acc -= TICK;
      stepped = this.physicsTick(input, settings) || stepped;
      if (this.invuln > 0) this.invuln -= TICK;
      if (this.fireTicks > 0) {
        this.fireTicks -= TICK;
        if (this.gamemode === "survival" && this.invuln <= 0) this.hurt(1);
      }
    }
    this.applyCamera(settings);
    return { stepped };
  }

  physicsTick(input, settings) {
    this.sneaking = input.down("ShiftLeft") || input.down("ShiftRight");
    const jump = input.down("Space");
    const now = performance.now();
    if (jump && !this._jumpHeld) {
      if (this.gamemode === "creative" && now - this.lastJump < 280) {
        this.flying = !this.flying;
        this.vel.y = 0;
      }
      this.lastJump = now;
    }
    this._jumpHeld = jump;

    const wantForward = input.down("KeyW");
    if (wantForward && !this._wHeld) {
      if (now - this.lastForward < 280) this.sprinting = true;
      this.lastForward = now;
    }
    this._wHeld = wantForward;
    if (input.down("ControlLeft") || input.down("ControlRight")) this.sprinting = true;
    if (!wantForward || this.sneaking) this.sprinting = false;

    const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    let ix = 0, iz = 0;
    if (input.down("KeyW")) { ix += fwd.x; iz += fwd.z; }
    if (input.down("KeyS")) { ix -= fwd.x; iz -= fwd.z; }
    if (input.down("KeyD")) { ix += right.x; iz += right.z; }
    if (input.down("KeyA")) { ix -= right.x; iz -= right.z; }
    const len = Math.hypot(ix, iz) || 1;
    ix /= len; iz /= len;
    this.wishX = ix;
    this.wishZ = iz;

    if (this.vehicleId) {
      this.sprinting = false;
      this.vel.set(0, 0, 0);
      this.onGround = true;
      if (this.sneaking) {
        this.vehicleId = 0;
        this.pos.y += 0.85;
      }
      this.bob += 0.02;
      return false;
    }

    let speed = 0.1;
    if (this.sneaking && !this.flying) speed = 0.03;
    if (this.sprinting && this.onGround) speed = 0.13;
    if (this.flying) speed = this.sprinting ? 0.25 : 0.15;
    if (this.inFluid && !this.flying) speed *= 0.3;
    if (this.hunger <= 6 && this.sprinting) this.sprinting = false;

    if (this.flying) {
      this.vel.x = ix * speed * 4.2;
      this.vel.z = iz * speed * 4.2;
      this.vel.y *= 0.6;
      if (jump) this.vel.y = 0.5 * (this.sprinting ? 1.4 : 1);
      if (this.sneaking) this.vel.y = -0.5;
    } else if (this.inFluid) {
      const eyeId = this.world.getBlock(this.pos.x, this.pos.y + 1.5, this.pos.z);
      const headFree = eyeId !== WATER && eyeId !== LAVA;
      this.vel.x += ix * (headFree ? 0.055 : 0.026);
      this.vel.z += iz * (headFree ? 0.055 : 0.026);
      this.vel.x *= headFree ? 0.86 : 0.8;
      this.vel.z *= headFree ? 0.86 : 0.8;
      this.vel.y = (this.vel.y - (headFree ? 0.006 : 0.02)) * 0.8;
      if (jump) this.vel.y += headFree ? 0.085 : 0.06;
      if (ix || iz) {
        const nx = this.pos.x + ix * 0.6;
        const nz = this.pos.z + iz * 0.6;
        let wall = false;
        for (let dy = 0.1; dy <= 2.6; dy += 0.5) {
          if (this.world.isSolid(nx, this.pos.y + dy, nz)) {
            wall = true;
            break;
          }
        }
        const headroom = !this.world.isSolid(this.pos.x, this.pos.y + 2.35, this.pos.z)
          && !this.world.isSolid(nx, this.pos.y + 2.35, nz);
        if (wall && headroom) this.vel.y = Math.max(this.vel.y, headFree ? 0.52 : 0.4);
      }
    } else if (this.onClimb()) {
      this.vel.x += ix * 0.04;
      this.vel.z += iz * 0.04;
      this.vel.x *= 0.7;
      this.vel.z *= 0.7;
      if (jump) this.vel.y = 0.18;
      else if (this.sneaking) this.vel.y = -0.12;
      else this.vel.y = ix || iz ? 0.1 : 0;
    } else {
      const slip = this.onGround ? 0.6 : 0.91;
      this.vel.x *= slip;
      this.vel.z *= slip;
      const accel = this.onGround ? speed * 0.9 : speed * 0.1;
      this.vel.x += ix * accel;
      this.vel.z += iz * accel;
      this.vel.y = (this.vel.y - 0.08) * 0.98;
      if (jump && this.onGround) {
        this.vel.y = 0.42;
        if (this.sprinting) {
          this.vel.x += ix * 0.2;
          this.vel.z += iz * 0.2;
        }
        if (this.gamemode === "survival") this.exhaust(0.05);
      }
      if (settings.autoJump && this.onGround && (ix || iz)) {
        const nx = this.pos.x + ix * 0.6;
        const nz = this.pos.z + iz * 0.6;
        if (this.world.isSolid(nx, this.pos.y, nz) && !this.world.isSolid(nx, this.pos.y + 1, nz)) {
          this.vel.y = 0.42;
        }
      }
    }

    const wasGround = this.onGround;
    const stepUp = this.flying ? 0 : (this.inFluid ? 2.2 : 0.6);
    const res = resolveCollisions(this.world, this.pos, this.vel, WIDTH, this.height(), this.sneaking && this.onGround, stepUp);
    this.onGround = res.onGround;
    this.inFluid = res.inFluid;
    this.inLava = res.inLava;
    if (this.onClimb()) {
      this.onGround = true;
      this.fallStart = this.pos.y;
    }

    const web = BLOCKS[this.world.getBlock(this.pos.x, this.pos.y + 0.4, this.pos.z)]?.web
      || BLOCKS[this.world.getBlock(this.pos.x, this.pos.y + 1.1, this.pos.z)]?.web;
    if (web && !this.flying) {
      this.vel.x *= 0.35;
      this.vel.z *= 0.35;
      this.vel.y *= 0.12;
    }

    if (!wasGround && this.onGround && this.gamemode === "survival") {
      const fall = this.fallStart - this.pos.y;
      if (fall > 3 && !this.inFluid) {
        const dmg = Math.floor(fall - 3);
        if (dmg > 0) this.hurt(dmg);
      }
    }
    if (!this.onGround) {
      if (wasGround) this.fallStart = this.pos.y;
      this.fallStart = Math.max(this.fallStart, this.pos.y);
    } else this.fallStart = this.pos.y;

    if (this.inLava && this.gamemode === "survival") {
      this.fireTicks = 4;
      if (this.invuln <= 0) this.hurt(2);
    }

    const below = BLOCKS[this.world.getBlock(this.pos.x, this.pos.y - 0.08, this.pos.z)];
    if (below?.slow && !this.flying) {
      this.vel.x *= 0.42;
      this.vel.z *= 0.42;
    }
    if (below?.magma && this.onGround && !this.sneaking && this.gamemode === "survival" && !this.flying) {
      this._magmaAcc = (this._magmaAcc || 0) + TICK;
      if (this._magmaAcc > 0.5) {
        this._magmaAcc = 0;
        this.hurt(1);
        this.fireTicks = Math.max(this.fireTicks, 1.2);
      }
    } else this._magmaAcc = 0;

    const moved = Math.hypot(this.vel.x, this.vel.z);
    if (this.onGround && moved > 0.03) {
      this.walkDist += moved;
      this.stepDist += moved;
      if (this.sprinting && this.gamemode === "survival") this.exhaust(0.01);
    }
    this.bob += moved * 1.6;

    if (this.pos.y < -8 && !this.dead) this.hurt(100);

    if (this.stepDist > 1.4) {
      this.stepDist = 0;
      return true;
    }
    return false;
  }

  applyCamera(settings) {
    const alpha = Math.min(1, this.acc / TICK);
    this.renderPos.lerpVectors(this.prevPos, this.pos, alpha);
    this.renderBob = this.prevBob + (this.bob - this.prevBob) * alpha;
    const eye = this.eyeHeight();
    let x = this.renderPos.x;
    let y = this.renderPos.y + eye;
    let z = this.renderPos.z;
    if (settings.viewBobbing && this.onGround && !this.flying) {
      y += Math.sin(this.renderBob * 2) * 0.04;
      x += Math.cos(this.renderBob) * 0.02;
    }
    if (this.perspective === 1) {
      const back = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
      x += back.x * 4;
      z += back.z * 4;
      y += 1;
    } else if (this.perspective === 2) {
      const fwd = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      x += fwd.x * 4;
      z += fwd.z * 4;
      y += 1;
    }
    this.camera.position.set(x, y, z);
    this.camera.up.set(0, 1, 0);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  exhaust(n) {
    if (this.gamemode !== "survival") return;
    this.saturation = Math.max(0, this.saturation - n);
    if (this.saturation <= 0) {
      this.hunger = Math.max(0, this.hunger - n * 0.4);
    }
  }

  hungerTick(dt, difficulty) {
    if (this.gamemode !== "survival" || this.dead) return;
    if (difficulty === "peaceful") {
      this.hunger = 20;
      if (this.health < 20) this.health = Math.min(20, this.health + dt * 0.5);
      return;
    }
    if (this.hunger >= 18 && this.health < 20 && this.saturation > 0) {
      this.health = Math.min(20, this.health + dt * 0.4);
      this.exhaust(dt * 0.3);
    }
    if (this.hunger <= 0) {
      const rate = difficulty === "hard" ? 1 : difficulty === "normal" ? 0.5 : 0;
      if (rate && this.health > (difficulty === "hard" ? 0 : 1)) {
        this._starve = (this._starve || 0) + dt;
        if (this._starve > 4) {
          this.hurt(1);
          this._starve = 0;
        }
      }
    }
  }

  hurt(n, src = null) {
    if (this.dead || this.gamemode === "creative") return;
    if (this.invuln > 0 && n < 50) return;
    let dmg = n;
    const armor = this.armorPoints();
    dmg *= 1 - Math.min(20, armor) / 25;
    this.health = Math.max(0, this.health - dmg);
    this.invuln = 0.5;
    this.hurtYaw = 1;
    if (src && n < 50) {
      const dx = this.pos.x - src.x;
      const dz = this.pos.z - src.z;
      const len = Math.hypot(dx, dz) || 1;
      this.vel.x += (dx / len) * 6.4;
      this.vel.z += (dz / len) * 6.4;
      this.vel.y = Math.max(this.vel.y, 3.5);
    }
    if (this.health <= 0) {
      this.dead = true;
      this.vehicleId = 0;
    }
  }

  armorPoints() {
    let a = 0;
    for (const s of this.armor) {
      if (s && ITEMS[s.id]?.armor) a += ITEMS[s.id].armor;
    }
    return a;
  }

  eatHeld() {
    const h = this.held();
    if (!h) return false;
    const it = ITEMS[h.id];
    if (!it?.food) return false;
    const chorus = h.id === "chorus_fruit";
    if (this.hunger >= 20 && h.id !== "golden_apple" && !chorus) return false;
    this.hunger = Math.min(20, this.hunger + it.food);
    this.saturation = Math.min(this.hunger, this.saturation + (it.sat || 0));
    if (h.id === "golden_apple") this.health = Math.min(20, this.health + 4);
    if (h.id === "mushroom_stew") this.give("bowl", 1);
    if (chorus) this.chorusTeleport();
    this.removeFromSlot("hotbar", this.selected, 1);
    return true;
  }

  chorusTeleport() {
    for (let i = 0; i < 24; i++) {
      const nx = this.pos.x + (Math.random() - 0.5) * 16;
      const nz = this.pos.z + (Math.random() - 0.5) * 16;
      const ny = this.pos.y + (Math.random() - 0.5) * 8;
      if (this.world.isSolid(nx, ny, nz) || this.world.isSolid(nx, ny + 1, nz)) continue;
      if (!this.world.isSolid(nx, ny - 1, nz) && !this.world.isSolid(nx, ny - 2, nz)) continue;
      this.pos.set(nx, ny, nz);
      this.prevPos.copy(this.pos);
      this.renderPos.copy(this.pos);
      this.vel.set(0, 0, 0);
      return;
    }
  }

  give(id, count = 1) {
    const it = ITEMS[id];
    if (!it) return false;
    const stack = it.stack || 64;
    const places = [...this.hotbar.map((s, i) => ["hotbar", i, s]), ...this.inv.map((s, i) => ["inv", i, s])];
    let left = count;
    for (const [which, i, s] of places) {
      if (s && s.id === id && s.count < stack) {
        const add = Math.min(stack - s.count, left);
        s.count += add;
        left -= add;
        if (!left) return true;
      }
    }
    for (const [which, i, s] of places) {
      if (!s) {
        const add = Math.min(stack, left);
        const slot = { id, count: add };
        if (which === "hotbar") this.hotbar[i] = slot;
        else this.inv[i] = slot;
        left -= add;
        if (!left) return true;
      }
    }
    return left < count;
  }

  countId(id) {
    let n = 0;
    for (const s of [...this.hotbar, ...this.inv]) {
      if (s?.id === id) n += s.count;
    }
    return n;
  }

  consumeId(id, n = 1) {
    if (this.gamemode === "creative") return true;
    const places = [...this.hotbar.map((s, i) => ["hotbar", i, s]), ...this.inv.map((s, i) => ["inv", i, s])];
    let have = 0;
    for (const [, , s] of places) if (s?.id === id) have += s.count;
    if (have < n) return false;
    let left = n;
    for (const [which, i, s] of places) {
      if (!s || s.id !== id) continue;
      const take = Math.min(s.count, left);
      this.removeFromSlot(which, i, take);
      left -= take;
      if (!left) return true;
    }
    return true;
  }

  removeFromSlot(which, i, n = 1) {
    const arr = which === "hotbar" ? this.hotbar : which === "inv" ? this.inv : which === "armor" ? this.armor : null;
    if (!arr || !arr[i]) return null;
    arr[i].count -= n;
    const id = arr[i].id;
    if (arr[i].count <= 0) arr[i] = null;
    return id;
  }

  dropHeld(all = false) {
    const h = this.held();
    if (!h) return null;
    const n = all ? h.count : 1;
    const id = h.id;
    this.removeFromSlot("hotbar", this.selected, n);
    return { id, count: n };
  }

  serialize() {
    return {
      pos: [this.pos.x, this.pos.y, this.pos.z],
      yaw: this.yaw,
      pitch: this.pitch,
      flying: this.flying,
      gamemode: this.gamemode,
      health: this.health,
      hunger: this.hunger,
      saturation: this.saturation,
      xp: this.xp,
      xpLevel: this.xpLevel,
      selected: this.selected,
      hotbar: this.hotbar,
      inv: this.inv,
      armor: this.armor,
      offhand: this.offhand,
      spawn: [this.spawn.x, this.spawn.y, this.spawn.z],
      score: this.score,
      chests: [...this.chests.entries()].map(([k, v]) => [k, v.slots]),
    };
  }

  deserialize(d) {
    if (!d) return;
    this.pos.set(d.pos[0], d.pos[1], d.pos[2]);
    this.prevPos.copy(this.pos);
    this.renderPos.copy(this.pos);
    this.yaw = d.yaw;
    this.pitch = d.pitch;
    this.flying = d.flying;
    this.gamemode = d.gamemode;
    this.health = d.health;
    this.hunger = d.hunger;
    this.saturation = d.saturation ?? 5;
    this.xp = d.xp;
    this.xpLevel = d.xpLevel;
    this.selected = d.selected;
    this.hotbar = d.hotbar;
    this.inv = d.inv;
    this.armor = d.armor || [null, null, null, null];
    this.offhand = d.offhand;
    this.spawn.set(d.spawn[0], d.spawn[1], d.spawn[2]);
    this.score = d.score || 0;
    this.chests = new Map((d.chests || []).map(([k, slots]) => [k, { slots }]));
    this.dead = this.health <= 0;
  }
}
