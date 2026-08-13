import * as THREE from "three";
import { BLOCKS, ITEMS, WATER, LAVA } from "../world/blocks.js";
import { faceTile } from "../world/textures.js";
import { itemIcon, isSpriteItem } from "../ui/icons.js";
import { BIOME, NETHER_BIOME } from "../world/generator.js";

const HOSTILE = new Set([
  "zombie", "creeper", "spider", "skeleton", "drowned", "husk", "stray", "witch",
  "enderman", "polar_bear", "ghast", "blaze", "wither_skeleton", "piglin",
  "magma_cube", "zombified_piglin",
]);

const BREED_FOOD = {
  pig: ["carrot", "potato"],
  cow: ["wheat"],
  mooshroom: ["wheat"],
  sheep: ["wheat"],
  chicken: ["wheat_seeds"],
  rabbit: ["carrot", "golden_carrot"],
  horse: ["golden_carrot", "apple", "wheat"],
  wolf: ["porkchop", "beef", "chicken", "mutton", "cooked_porkchop", "steak", "cooked_chicken", "cooked_mutton"],
};

function isHostileType(type, agro = false) {
  if (type === "zombified_piglin") return !!agro;
  return HOSTILE.has(type);
}

let eid = 1;

const HP = {
  pig: 10,
  cow: 10,
  sheep: 8,
  chicken: 4,
  squid: 10,
  zombie: 20,
  creeper: 20,
  spider: 16,
  skeleton: 20,
  villager: 20,
  boat: 20,
  wolf: 8,
  horse: 22,
  rabbit: 3,
  parrot: 6,
  mooshroom: 10,
  drowned: 20,
  husk: 20,
  stray: 20,
  witch: 26,
  enderman: 40,
  polar_bear: 30,
  ghast: 10,
  piglin: 16,
  zombified_piglin: 20,
  magma_cube: 16,
  blaze: 20,
  wither_skeleton: 20,
  iron_golem: 100,
  ender_dragon: 200,
  end_crystal: 4,
  pearl: 1,
  fireball: 1,
  eye: 1,
};

const WOOL_COLORS = ["white_wool", "red_wool", "blue_wool", "yellow_wool", "black_wool", "green_wool", "orange_wool", "brown_wool", "pink_wool"];

export class EntityWorld {
  constructor(scene, world, textures) {
    this.scene = scene;
    this.world = world;
    this.textures = textures;
    this.list = [];
  }

  spawnItem(x, y, z, id, count = 1) {
    const mesh = makeItemMesh(this.textures, id);
    mesh.position.set(x + 0.5, y + 0.35, z + 0.5);
    this.scene.add(mesh);
    this.list.push({
      type: "item",
      id: eid++,
      item: id,
      count,
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 2, 2 + Math.random(), (Math.random() - 0.5) * 2),
      age: 0,
      pickupDelay: 0.6,
    });
  }

  spawnArrow(x, y, z, dir, dmg = 6, fromPlayer = false) {
    const mesh = box(0.08, 0.08, 0.5, 0xd2b48c);
    mesh.position.set(x, y, z);
    const d = dir.clone().normalize();
    mesh.lookAt(x + d.x, y + d.y, z + d.z);
    this.scene.add(mesh);
    this.list.push({
      type: "arrow",
      id: eid++,
      mesh,
      vel: d.multiplyScalar(38),
      dmg,
      fromPlayer,
      age: 0,
    });
  }

  spawnFireball(x, y, z, dir, from = "ghast") {
    const mesh = box(from === "blaze" ? 0.28 : 0.55, from === "blaze" ? 0.28 : 0.55, from === "blaze" ? 0.28 : 0.55, 0xff6622);
    mesh.position.set(x, y, z);
    const d = dir.clone().normalize();
    this.scene.add(mesh);
    this.list.push({
      type: "fireball",
      id: eid++,
      mesh,
      vel: d.multiplyScalar(from === "blaze" ? 14 : 16),
      from,
      age: 0,
      power: from === "blaze" ? 1.2 : from === "dragon" ? 1.5 : 2.4,
    });
  }

  spawnPearl(x, y, z, dir) {
    const mesh = box(0.22, 0.22, 0.22, 0x1ec8a0);
    mesh.position.set(x, y, z);
    const d = dir.clone().normalize();
    this.scene.add(mesh);
    this.list.push({
      type: "pearl",
      id: eid++,
      mesh,
      vel: d.multiplyScalar(24),
      age: 0,
    });
  }

  spawnEye(x, y, z, target) {
    const mesh = box(0.22, 0.22, 0.22, 0x44ee66);
    mesh.position.set(x, y, z);
    const tx = target ? target.cx + 0.5 : x;
    const tz = target ? target.cz + 0.5 : z;
    const dir = new THREE.Vector3(tx - x, 8, tz - z);
    if (dir.lengthSq() < 0.2) dir.set(0, 1, 1);
    dir.normalize();
    this.scene.add(mesh);
    this.list.push({
      type: "eye",
      id: eid++,
      mesh,
      vel: dir.multiplyScalar(9.5),
      age: 0,
      life: 1.2 + Math.random() * 0.55,
      drop: Math.random() > 0.32,
    });
  }

  spawnXp(x, y, z, value = 0.2) {
    const mesh = box(0.16, 0.16, 0.16, 0x88ff44);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.list.push({
      type: "xp",
      id: eid++,
      mesh,
      vel: new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3),
      age: 0,
      value,
    });
  }

  clearAll() {
    while (this.list.length) this.removeAt(0);
  }

  spawnBobber(x, y, z, dir) {
    this.clearType("bobber");
    const mesh = box(0.14, 0.14, 0.14, 0xf4f4f4);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const d = dir.clone().normalize();
    this.list.push({
      type: "bobber",
      id: eid++,
      mesh,
      vel: new THREE.Vector3(d.x * 14, d.y * 14 + 3.5, d.z * 14),
      age: 0,
      wait: 2.2 + Math.random() * 5,
      bite: false,
      biteT: 0,
      inWater: false,
    });
  }

  getFirst(type) {
    return this.list.find((e) => e.type === type) || null;
  }

  clearType(type) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (this.list[i].type === type) this.removeAt(i);
    }
  }

  spawnMob(type, x, y, z, extra = {}) {
    const mesh = makeMob(type, extra.job);
    mesh.position.set(x, y, z);
    if (extra.baby) mesh.scale.setScalar(0.55);
    this.scene.add(mesh);
    const wool = extra.wool || WOOL_COLORS[(Math.random() * WOOL_COLORS.length) | 0];
    if (type === "sheep") tintSheep(mesh, wool, extra.sheared);
    if (type === "wolf" && extra.tamed) {
      const collar = mesh.getObjectByName("collar");
      if (collar) collar.visible = true;
    }
    this.list.push({
      type,
      id: eid++,
      mesh,
      vel: new THREE.Vector3(),
      hp: extra.baby ? Math.max(4, (HP[type] || 10) * 0.5) : (HP[type] || 10),
      age: 0,
      cooldown: 0,
      fuse: 0,
      yaw: Math.random() * Math.PI * 2,
      kb: 0,
      wool,
      sheared: !!extra.sheared,
      egg: 8 + Math.random() * 20,
      job: extra.job || "farmer",
      spawnKey: extra.spawnKey,
      tamed: !!extra.tamed,
      sitting: !!extra.sitting,
      baby: !!extra.baby,
      grow: extra.baby ? (extra.grow ?? 80) : 0,
      inLove: 0,
      loveCool: extra.loveCool || 0,
      targetId: 0,
      owner: extra.owner || false,
    });
  }

  spawnBoat(x, y, z) {
    const mesh = makeBoat();
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    const e = {
      type: "boat",
      id: eid++,
      mesh,
      vel: new THREE.Vector3(),
      hp: 20,
      age: 0,
      yaw: 0,
    };
    this.list.push(e);
    return e;
  }

  getById(id) {
    return this.list.find((e) => e.id === id) || null;
  }

  update(dt, player, difficulty, audio) {
    const day = ((this.world.time % 24000) + 24000) % 24000 < 12000;
    const px = player.pos.x;
    const pz = player.pos.z;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const e = this.list[i];
      e.age += dt;
      const mx = e.mesh.position.x;
      const mz = e.mesh.position.z;
      const d2 = (mx - px) * (mx - px) + (mz - pz) * (mz - pz);
      const riding = e.type === "boat" && player.vehicleId === e.id;
      if (d2 > 36 * 36 && e.type !== "ender_dragon" && e.type !== "end_crystal" && e.type !== "ghast") {
        e.mesh.visible = d2 < 64 * 64;
      } else if (e.mesh) e.mesh.visible = true;
      if (!riding && e.type !== "item" && e.type !== "arrow" && e.type !== "bobber" && e.type !== "fireball" && e.type !== "pearl" && e.type !== "xp" && e.type !== "eye") {
        if (d2 > 84 * 84 && e.type !== "ender_dragon" && e.type !== "end_crystal") {
          if (e.spawnKey || e.tamed || e.baby) {
            this.world.pendingMobs.push({
              type: e.type,
              x: e.mesh.position.x,
              y: e.mesh.position.y,
              z: e.mesh.position.z,
              job: e.job,
              spawnKey: e.spawnKey,
              tamed: e.tamed,
              sitting: e.sitting,
              baby: e.baby,
              grow: e.grow,
              wool: e.wool,
              sheared: e.sheared,
              owner: e.owner,
            });
          }
          this.removeAt(i);
          continue;
        }
        if (d2 > 70 * 70 && e.type !== "ghast" && e.type !== "ender_dragon" && e.type !== "end_crystal") continue;
      }

      if (e.type === "xp") {
        const to = player.pos.clone().add(new THREE.Vector3(0, 0.9, 0)).sub(e.mesh.position);
        const d = to.length();
        if (d < 10 && d > 0.01) e.vel.add(to.multiplyScalar((22 * dt) / d));
        e.vel.y -= 8 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        e.vel.multiplyScalar(0.9);
        e.mesh.rotation.y += dt * 8;
        if (d < 1.15 && !player.dead) {
          player.xp += e.value || 0.2;
          while (player.xp >= 1) {
            player.xp -= 1;
            player.xpLevel++;
          }
          audio.pop();
          this.removeAt(i);
        } else if (e.age > 45) this.removeAt(i);
        continue;
      }

      if (e.type === "arrow") {
        e.vel.y -= 18 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        const p = e.mesh.position;
        if (e.vel.lengthSq() > 0.01) e.mesh.lookAt(p.x + e.vel.x, p.y + e.vel.y, p.z + e.vel.z);
        if (this.world.isSolid(p.x, p.y, p.z) || e.age > 8) {
          this.removeAt(i);
          continue;
        }
        if (!(e.fromPlayer && e.age < 0.12) && p.distanceTo(player.pos) < 1.1 && !player.dead) {
          player.hurt(e.dmg, p);
          audio.hurt();
          this.removeAt(i);
          continue;
        }
        if (e.fromPlayer) {
          let hitMob = false;
          for (const o of this.list) {
            if (o === e || o.type === "item" || o.type === "arrow" || o.type === "bobber" || o.type === "boat" || o.type === "xp" || o.type === "fireball" || o.type === "pearl" || o.type === "eye") continue;
            const rad = o.type === "ender_dragon" ? 4.2 : 0.9;
            if (o.mesh.position.distanceTo(p) < rad) {
              o.hp -= e.dmg;
              this.knockback(o, p, e.vel, 0.85);
              hitMob = true;
              break;
            }
          }
          if (hitMob) {
            audio.hit();
            this.removeAt(i);
            continue;
          }
        }
        continue;
      }

      if (e.type === "fireball") {
        e.mesh.position.addScaledVector(e.vel, dt);
        const p = e.mesh.position;
        e.mesh.rotation.y += dt * 8;
        const hitPlayer = p.distanceTo(player.pos) < 1.35 && !player.dead;
        if (this.world.isSolid(p.x, p.y, p.z) || e.age > 6 || hitPlayer) {
          if (hitPlayer) {
            player.hurt(e.from === "blaze" ? 4 : e.from === "dragon" ? 7 : 8, p, { fire: true });
            player.fireTicks = Math.max(player.fireTicks, 4);
            audio.hurt();
          }
          this.world.explode(p.x, p.y, p.z, e.power || 2.2);
          audio.explode();
          this.removeAt(i);
          continue;
        }
        continue;
      }

      if (e.type === "pearl") {
        e.vel.y -= 16 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        const p = e.mesh.position;
        if (this.world.isSolid(p.x, p.y, p.z) || e.age > 5) {
          player.pos.set(p.x, Math.max(2, p.y + 0.4), p.z);
          player.prevPos.copy(player.pos);
          player.renderPos.copy(player.pos);
          player.vel.set(0, 0, 0);
          if (player.gamemode === "survival") player.hurt(2);
          this.removeAt(i);
          continue;
        }
        continue;
      }

      if (e.type === "eye") {
        e.vel.y -= 4.5 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        e.mesh.rotation.y += dt * 10;
        const p = e.mesh.position;
        if (e.age > (e.life || 1.4) || this.world.isSolid(p.x, p.y, p.z)) {
          if (e.drop) this.spawnItem(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z), "ender_eye");
          this.removeAt(i);
          continue;
        }
        continue;
      }

      if (e.type === "bobber") {
        e.vel.y -= 16 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        e.vel.x *= 0.98;
        e.vel.z *= 0.98;
        const p = e.mesh.position;
        const bid = this.world.getBlock(p.x, p.y, p.z);
        if (bid === WATER) {
          e.inWater = true;
          e.vel.set(0, 0, 0);
          const floatY = Math.floor(p.y) + (e.bite ? 0.55 : 0.88);
          e.mesh.position.y += (floatY - p.y) * Math.min(1, dt * 8);
          e.wait -= dt;
          if (!e.bite && e.wait <= 0) {
            e.bite = true;
            e.biteT = 1.15;
            audio.splash();
          }
          if (e.bite) {
            e.biteT -= dt;
            if (e.biteT <= 0) {
              e.bite = false;
              e.wait = 2 + Math.random() * 5;
            }
          }
        } else if (this.world.isSolid(p.x, p.y, p.z)) {
          e.vel.set(0, 0, 0);
          e.mesh.position.y = Math.floor(p.y) + 0.2;
        }
        if (e.age > 30) this.removeAt(i);
        continue;
      }

      if (e.type === "boat") {
        this.tickBoat(e, dt, player);
        if (e.hp <= 0) {
          this.spawnItem(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, "oak_boat");
          if (player.vehicleId === e.id) player.vehicleId = 0;
          this.removeAt(i);
        }
        continue;
      }

      if (e.type === "item") {
        e.vel.y -= 18 * dt;
        e.mesh.position.addScaledVector(e.vel, dt);
        e.vel.x *= 0.96;
        e.vel.z *= 0.96;
        const y = e.mesh.position.y;
        const gx = e.mesh.position.x;
        const gz = e.mesh.position.z;
        if (this.world.isSolid(gx, y - 0.15, gz)) {
          e.mesh.position.y = Math.floor(y) + 0.2;
          e.vel.y = 0;
          e.vel.x *= 0.6;
          e.vel.z *= 0.6;
        }
        e.mesh.rotation.y += dt * 2;
        e.mesh.position.y += Math.sin(e.age * 3) * 0.002;
        e.pickupDelay -= dt;
        const d = e.mesh.position.distanceTo(player.pos);
        if (e.pickupDelay <= 0 && d < 1.6 && !player.dead) {
          if (player.give(e.item, e.count)) {
            audio.pop();
            this.removeAt(i);
            continue;
          }
        }
        if (e.age > 300) this.removeAt(i);
        continue;
      }

      const toPlayer = player.pos.clone().sub(e.mesh.position);
      const dist = toPlayer.length();
      const hostile = isHostileType(e.type, e.agro);
      if (hostile && difficulty === "peaceful") {
        this.removeAt(i);
        continue;
      }

      if (e.type === "end_crystal") {
        e.mesh.rotation.y += dt * 2;
        if (e.hp <= 0) {
          this.world.explode(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 2.2);
          audio.explode();
          this.removeAt(i);
        }
        continue;
      }

      if (e.type === "ender_dragon") {
        e.orbit = (e.orbit || 0) + dt * 0.42;
        e.cooldown = (e.cooldown || 0) - dt;
        const perch = (((e.age / 14) | 0) % 2) === 1;
        if (perch) {
          e.mesh.position.set(0, 52, 0);
          e.yaw = Math.atan2(-player.pos.x, -player.pos.z);
        } else {
          const r = 36;
          e.mesh.position.set(Math.cos(e.orbit) * r, 58 + Math.sin(e.orbit * 2) * 3, Math.sin(e.orbit) * r);
          e.yaw = e.orbit + Math.PI / 2;
        }
        e.mesh.rotation.y = e.yaw;
        if (this.list.some((o) => o.type === "end_crystal")) e.hp = Math.min(200, e.hp + dt * 2);
        if (e.cooldown <= 0 && dist < 64 && !player.dead) {
          const aim = player.pos.clone().add(new THREE.Vector3(0, 1.1, 0)).sub(e.mesh.position);
          this.spawnFireball(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, aim, "dragon");
          e.cooldown = 2.35;
        }
        if (dist < 3.4 && e.cooldown < 0.5 && !player.dead) {
          player.hurt(8, e.mesh.position);
          audio.hurt();
        }
        if (e.hp <= 0) {
          this.world.placeEndFountain();
          this.world.dragonDead = true;
          this.world.gen.dragonDead = true;
          for (let k = 0; k < 18; k++) {
            this.spawnXp(
              e.mesh.position.x + (Math.random() - 0.5) * 3,
              e.mesh.position.y,
              e.mesh.position.z + (Math.random() - 0.5) * 3,
              0.85,
            );
          }
          this.removeAt(i);
        }
        continue;
      }

      if ((e.type === "zombie" || e.type === "skeleton") && day) {
        const light = this.world.getLight(e.mesh.position.x, e.mesh.position.y + 1, e.mesh.position.z);
        if (light > 12) e.hp -= dt * 4;
      }

      let wish = new THREE.Vector3();
      const flyingMob = e.type === "ghast" || e.type === "blaze";
      if (e.type === "squid") {
        const inWater = this.world.getBlock(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z) === WATER;
        if (Math.random() < 0.02) e.yaw += (Math.random() - 0.5) * 1.4;
        wish.set(-Math.sin(e.yaw), inWater ? (Math.random() - 0.45) * 0.4 : -0.2, -Math.cos(e.yaw));
        if ((e.kb || 0) > 0) {
          e.kb -= dt;
          e.vel.x *= Math.exp(-5.5 * dt);
          e.vel.z *= Math.exp(-5.5 * dt);
          e.vel.y = inWater ? e.vel.y * Math.exp(-4 * dt) : e.vel.y - 18 * dt;
        } else {
          e.vel.x = wish.x * 1.2;
          e.vel.z = wish.z * 1.2;
          e.vel.y = inWater ? wish.y : e.vel.y - 18 * dt;
        }
      } else if (flyingMob) {
        if (hostile && dist < 48 && dist > 0.01) {
          wish.copy(toPlayer).normalize();
          e.yaw = Math.atan2(-wish.x, -wish.z);
        } else {
          if (Math.random() < 0.02) e.yaw += (Math.random() - 0.5) * 1.2;
          wish.set(-Math.sin(e.yaw), (Math.random() - 0.5) * 0.3, -Math.cos(e.yaw));
        }
        const hover = e.type === "ghast" ? (player.pos.y + 8) : (player.pos.y + 2.2);
        if ((e.kb || 0) > 0) {
          e.kb -= dt;
          e.vel.x *= Math.exp(-4.2 * dt);
          e.vel.z *= Math.exp(-4.2 * dt);
          e.vel.y *= Math.exp(-3.2 * dt);
        } else {
          e.vel.x = wish.x * (e.type === "ghast" ? 2.2 : 2.8);
          e.vel.z = wish.z * (e.type === "ghast" ? 2.2 : 2.8);
          e.vel.y = (hover - e.mesh.position.y) * 0.6;
          if (e.mesh.position.y < 8) e.vel.y = Math.max(e.vel.y, 2);
        }
      } else {
        if (e.inLove) e.inLove = Math.max(0, e.inLove - dt);
        if (e.loveCool) e.loveCool = Math.max(0, e.loveCool - dt);
        if (e.baby) {
          e.grow = (e.grow || 80) - dt;
          if (e.grow <= 0) {
            e.baby = false;
            e.mesh.scale.setScalar(1);
            e.hp = HP[e.type] || e.hp;
          }
        }
        let steered = false;
        if (e.type === "wolf" && e.tamed) {
          steered = true;
          if (e.sitting) {
            wish.set(0, 0, 0);
          } else {
            const tgt = e.targetId ? this.getById(e.targetId) : null;
            if (tgt && tgt.hp > 0 && tgt.type !== "item") {
              wish.copy(tgt.mesh.position).sub(e.mesh.position).setY(0);
              const td = wish.length();
              if (td > 0.01) wish.multiplyScalar(1 / td);
              e.yaw = Math.atan2(-wish.x, -wish.z);
              if (td < 1.25 && e.cooldown <= 0) {
                tgt.hp -= 4;
                this.knockback(tgt, e.mesh.position, wish, 1.1);
                e.cooldown = 0.7;
                if (tgt.hp <= 0) e.targetId = 0;
              }
            } else {
              e.targetId = 0;
              if (dist > 22) {
                e.mesh.position.set(player.pos.x + (Math.random() - 0.5) * 2, player.pos.y + 0.2, player.pos.z + (Math.random() - 0.5) * 2);
                e.vel.set(0, 0, 0);
              } else if (dist > 3.2) {
                wish.copy(toPlayer).setY(0);
                if (wish.length() > 0.01) wish.normalize();
                e.yaw = Math.atan2(-wish.x, -wish.z);
              } else wish.set(0, 0, 0);
            }
          }
        } else if (e.type === "iron_golem") {
          steered = true;
          let best = null;
          let bestD = 16;
          for (const o of this.list) {
            if (o === e || !isHostileType(o.type, o.agro)) continue;
            const d = o.mesh.position.distanceTo(e.mesh.position);
            if (d < bestD) {
              bestD = d;
              best = o;
            }
          }
          if (best) {
            wish.copy(best.mesh.position).sub(e.mesh.position).setY(0);
            if (wish.length() > 0.01) wish.normalize();
            e.yaw = Math.atan2(-wish.x, -wish.z);
            if (bestD < 1.7 && e.cooldown <= 0) {
              best.hp -= 9;
              this.knockback(best, e.mesh.position, wish, 1.6);
              e.cooldown = 1.05;
            }
          } else if (Math.random() < 0.008) e.yaw += (Math.random() - 0.5) * 1.1;
          else wish.set(-Math.sin(e.yaw), 0, -Math.cos(e.yaw)).multiplyScalar(0.25);
        }
        if (!steered) {
          if (hostile && (e.type !== "polar_bear" || dist < 11) && dist < 24 && dist > 0.01) {
            wish.copy(toPlayer).setY(0).normalize();
            e.yaw = Math.atan2(-wish.x, -wish.z);
          } else {
            if (Math.random() < 0.01) e.yaw += (Math.random() - 0.5) * 1.2;
            wish.set(-Math.sin(e.yaw), 0, -Math.cos(e.yaw)).multiplyScalar(0.4);
          }
        }
        const speed = e.type === "spider" ? 3.1
          : e.type === "zombie" || e.type === "husk" ? 2.4
          : e.type === "drowned" ? 1.9
          : e.type === "skeleton" || e.type === "stray" ? 2.2
          : e.type === "creeper" ? 2.1
          : e.type === "enderman" ? 3.4
          : e.type === "witch" ? 1.6
          : e.type === "polar_bear" ? 2.6
          : e.type === "horse" ? 3.2
          : e.type === "wolf" ? 2.8
          : e.type === "rabbit" ? 2.8
          : e.type === "parrot" ? 2.2
          : e.type === "chicken" ? 1.8
          : e.type === "villager" ? 1.05
          : e.type === "piglin" || e.type === "zombified_piglin" ? 2.5
          : e.type === "wither_skeleton" ? 2.3
          : e.type === "magma_cube" ? 1.8
          : e.type === "iron_golem" ? 2.4
          : 1.4;
        if ((e.kb || 0) > 0) {
          e.kb -= dt;
          e.vel.x *= Math.exp(-5.4 * dt);
          e.vel.z *= Math.exp(-5.4 * dt);
        } else if (e.type === "wolf" && e.sitting) {
          e.vel.x = 0;
          e.vel.z = 0;
        } else {
          e.vel.x = wish.x * speed * (e.baby ? 0.7 : 1);
          e.vel.z = wish.z * speed * (e.baby ? 0.7 : 1);
        }
        e.vel.y -= 22 * dt;
      }

      e.mesh.position.x += e.vel.x * dt;
      e.mesh.position.z += e.vel.z * dt;
      e.mesh.position.y += e.vel.y * dt;
      if (this.world.isSolid(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z)) {
        e.mesh.position.y = Math.floor(e.mesh.position.y) + 1.01;
        e.vel.y = 0;
        if (this.world.isSolid(e.mesh.position.x + wish.x, e.mesh.position.y, e.mesh.position.z + wish.z)
          && !this.world.isSolid(e.mesh.position.x + wish.x, e.mesh.position.y + 1, e.mesh.position.z + wish.z)) {
          e.vel.y = e.type === "spider" ? 8 : e.type === "magma_cube" ? 10 : 6;
        }
      }
      e.mesh.rotation.y = e.yaw;
      e.cooldown -= dt;

      if (e.type === "chicken") {
        e.egg -= dt;
        if (e.egg <= 0) {
          e.egg = 20 + Math.random() * 40;
          this.spawnItem(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, "egg");
        }
      }

      if (e.type === "creeper" && dist < 3 && !player.dead) {
        e.fuse += dt;
        e.mesh.scale.setScalar(1 + Math.sin(e.fuse * 20) * 0.08);
        if (e.fuse > 1.4) {
          this.world.explode(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, 3);
          audio.explode();
          if (dist < 5) player.hurt(12 - dist * 2, e.mesh.position);
          this.removeAt(i);
          continue;
        }
      } else if (e.type === "creeper") e.fuse = Math.max(0, e.fuse - dt);

      if (e.type === "zombie" && dist < 1.2 && e.cooldown <= 0 && !player.dead) {
        player.hurt(3, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 1;
      }
      if ((e.type === "husk" || e.type === "drowned") && dist < 1.25 && e.cooldown <= 0 && !player.dead) {
        player.hurt(e.type === "husk" ? 4 : 3, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 1;
      }
      if (e.type === "witch" && dist < 1.4 && e.cooldown <= 0 && !player.dead) {
        player.hurt(5, e.mesh.position);
        player.addEffect("poison", 6);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 1.2;
      }
      if (e.type === "enderman" && dist < 1.5 && e.cooldown <= 0 && !player.dead) {
        player.hurt(6, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 0.9;
      }
      if (e.type === "polar_bear" && dist < 1.5 && e.cooldown <= 0 && !player.dead) {
        player.hurt(5, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 1;
      }
      if (e.type === "spider" && dist < 1.15 && e.cooldown <= 0 && !player.dead) {
        player.hurt(2, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 0.8;
      }
      if ((e.type === "skeleton" || e.type === "stray") && dist < 16 && dist > 2.5 && e.cooldown <= 0 && !player.dead) {
        const aim = player.pos.clone().add(new THREE.Vector3(0, 1.4, 0)).sub(e.mesh.position).normalize();
        this.spawnArrow(e.mesh.position.x, e.mesh.position.y + 1.4, e.mesh.position.z, aim, 4, false);
        audio.hit();
        e.cooldown = 1.8;
      }
      if (e.type === "ghast" && dist < 40 && dist > 4 && e.cooldown <= 0 && !player.dead) {
        const aim = player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(e.mesh.position).normalize();
        this.spawnFireball(e.mesh.position.x, e.mesh.position.y, e.mesh.position.z, aim, "ghast");
        audio.hit();
        e.cooldown = 2.8;
      }
      if (e.type === "blaze" && dist < 18 && dist > 2 && e.cooldown <= 0 && !player.dead) {
        const aim = player.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(e.mesh.position).normalize();
        this.spawnFireball(e.mesh.position.x, e.mesh.position.y + 1.2, e.mesh.position.z, aim, "blaze");
        audio.hit();
        e.cooldown = 1.6;
      }
      if ((e.type === "piglin" || (e.type === "zombified_piglin" && e.agro)) && dist < 1.3 && e.cooldown <= 0 && !player.dead) {
        player.hurt(4, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 0.9;
      }
      if (e.type === "wither_skeleton" && dist < 1.4 && e.cooldown <= 0 && !player.dead) {
        player.hurt(6, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 0.85;
      }
      if (e.type === "magma_cube" && dist < 1.2 && e.cooldown <= 0 && !player.dead) {
        player.hurt(3, e.mesh.position);
        audio.hurt();
        this.alertPack(e);
        e.cooldown = 0.7;
      }

      if (hostile && dist < 4 && Math.random() < 0.01) audio.zombie();

      if (e.hp <= 0) {
        this.dropLoot(e);
        const n = isHostileType(e.type, e.agro) ? 2 + ((Math.random() * 2) | 0) : 1 + ((Math.random() * 2) | 0);
        const val = isHostileType(e.type, e.agro) ? 0.28 : 0.12;
        for (let k = 0; k < n; k++) {
          this.spawnXp(e.mesh.position.x + (Math.random() - 0.5) * 0.4, e.mesh.position.y + 0.4, e.mesh.position.z + (Math.random() - 0.5) * 0.4, val);
        }
        this.removeAt(i);
        continue;
      }
      if (e.mesh.position.y < -10) this.removeAt(i);
    }

    this.trySpawn(player, difficulty, day);
  }

  dropLoot(e) {
    const x = e.mesh.position.x;
    const y = e.mesh.position.y;
    const z = e.mesh.position.z;
    if (e.type === "pig") this.spawnItem(x, y, z, "porkchop");
    if (e.type === "cow") {
      this.spawnItem(x, y, z, "beef");
      this.spawnItem(x, y, z, "leather");
    }
    if (e.type === "creeper") this.spawnItem(x, y, z, "gunpowder");
    if (e.type === "sheep") {
      this.spawnItem(x, y, z, "mutton");
      this.spawnItem(x, y, z, e.wool || "white_wool");
    }
    if (e.type === "chicken") {
      this.spawnItem(x, y, z, "chicken");
      this.spawnItem(x, y, z, "feather");
    }
    if (e.type === "spider") this.spawnItem(x, y, z, "string");
    if (e.type === "skeleton") this.spawnItem(x, y, z, "bone");
    if (e.type === "zombie" && Math.random() > 0.7) this.spawnItem(x, y, z, "iron_ingot");
    if (e.type === "husk" && Math.random() > 0.65) this.spawnItem(x, y, z, "iron_ingot");
    if (e.type === "drowned" && Math.random() > 0.6) this.spawnItem(x, y, z, "cod");
    if (e.type === "stray") this.spawnItem(x, y, z, "bone");
    if (e.type === "witch") this.spawnItem(x, y, z, Math.random() > 0.5 ? "redstone" : "glowstone");
    if (e.type === "enderman") this.spawnItem(x, y, z, "ender_pearl");
    if (e.type === "wolf" && Math.random() > 0.5) this.spawnItem(x, y, z, "bone");
    if (e.type === "horse") this.spawnItem(x, y, z, "leather");
    if (e.type === "mooshroom") {
      this.spawnItem(x, y, z, "beef");
      this.spawnItem(x, y, z, "red_mushroom");
    }
    if (e.type === "parrot") this.spawnItem(x, y, z, "feather");
    if (e.type === "polar_bear") this.spawnItem(x, y, z, Math.random() > 0.5 ? "cod" : "salmon");
    if (e.type === "villager" && Math.random() > 0.5) this.spawnItem(x, y, z, "emerald");
    if (e.type === "boat") this.spawnItem(x, y, z, "oak_boat");
    if (e.type === "ghast") this.spawnItem(x, y, z, "ghast_tear");
    if (e.type === "blaze") this.spawnItem(x, y, z, "blaze_rod");
    if (e.type === "magma_cube") this.spawnItem(x, y, z, "magma_cream");
    if (e.type === "wither_skeleton") {
      this.spawnItem(x, y, z, "bone");
      if (Math.random() > 0.55) this.spawnItem(x, y, z, "coal");
    }
    if (e.type === "piglin") this.spawnItem(x, y, z, Math.random() > 0.4 ? "gold_nugget" : "gold_ingot");
    if (e.type === "zombified_piglin" && Math.random() > 0.4) this.spawnItem(x, y, z, "gold_nugget");
    if (e.type === "iron_golem") {
      this.spawnItem(x, y, z, "iron_ingot", 3 + ((Math.random() * 3) | 0));
      if (Math.random() > 0.5) this.spawnItem(x, y, z, "poppy");
    }
  }

  trySpawn(player, difficulty, day) {
    const nearby = this.list.filter((e) => {
      if (e.type === "item" || e.type === "arrow" || e.type === "bobber" || e.type === "boat" || e.type === "fireball" || e.type === "pearl" || e.type === "xp" || e.type === "eye") return false;
      const dx = e.mesh.position.x - player.pos.x;
      const dz = e.mesh.position.z - player.pos.z;
      return dx * dx + dz * dz < 48 * 48;
    }).length;
    if (nearby > 20) return;
    if (Math.random() > 0.14) return;
    const a = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 22;
    const x = player.pos.x + Math.cos(a) * r;
    const z = player.pos.z + Math.sin(a) * r;
    const cx = Math.floor(x / 16);
    const cz = Math.floor(z / 16);
    if (!this.world.chunkAt(cx, cz)) return;
    let y = 90;
    while (y > 1) {
      const id = this.world.getBlock(x, y, z);
      const b = BLOCKS[id];
      if (id === 0 || b?.plant || b?.fluid || (b?.transparent && b?.cutout)) {
        y--;
        continue;
      }
      break;
    }
    const ground = BLOCKS[this.world.getBlock(x, y, z)];
    if (!ground?.solid || ground.transparent || ground.plant || ground.fluid) return;
    y += 1;
    const feet = this.world.getBlock(x, y, z);
    const head = this.world.getBlock(x, y + 1, z);
    const fb = BLOCKS[feet];
    const hb = BLOCKS[head];
    if (feet !== 0 && !fb?.plant) return;
    if (head !== 0 && hb?.solid) return;
    if (this.world.dim === "end") {
      if (difficulty === "peaceful") return;
      this.spawnMob("enderman", x, y, z);
      return;
    }
    if (this.world.dim === "nether") {
      if (difficulty === "peaceful") return;
      if (this.world.getBlock(x, y, z) === LAVA || this.world.getBlock(x, y - 1, z) === LAVA) return;
      const nb = this.world.gen.netherBiome(x, z);
      const open = y > 40 && this.world.getBlock(x, y + 2, z) === 0;
      const roll = Math.random();
      if (open && roll > 0.62) this.spawnMob("ghast", x, y + 6, z);
      else if (nb === NETHER_BIOME.WARPED) this.spawnMob("enderman", x, y, z);
      else if (nb === NETHER_BIOME.BASALT) this.spawnMob("magma_cube", x, y, z);
      else if (nb === NETHER_BIOME.CRIMSON || nb === NETHER_BIOME.WASTES) {
        this.spawnMob(roll > 0.5 ? "piglin" : "zombified_piglin", x, y, z);
      } else this.spawnMob("zombified_piglin", x, y, z);
      return;
    }
    const light = this.world.getLight(x, y, z);
    const biome = this.world.gen.biome(x, z);
    const inWater = this.world.getBlock(x, y, z) === WATER || this.world.getBlock(x, y - 1, z) === WATER;
    if (inWater) {
      if (biome === BIOME.FROZEN_OCEAN && Math.random() > 0.55) {
        this.spawnMob("polar_bear", x, y, z);
        return;
      }
      if (difficulty !== "peaceful" && Math.random() > 0.42) {
        this.spawnMob("drowned", x, y, z);
        return;
      }
      this.spawnMob("squid", x, y, z);
      return;
    }
    if (biome === BIOME.MUSHROOM) {
      if (day && light > 8) this.spawnMob("mooshroom", x, y, z);
      return;
    }
    const surface = y >= 8;
    if (light < 7 && difficulty !== "peaceful") {
      if (biome === BIOME.DESERT || biome === BIOME.BADLANDS) this.spawnMob("husk", x, y, z);
      else if (biome === BIOME.SNOWY_PLAINS || biome === BIOME.SNOW_MOUNTAIN) {
        this.spawnMob(Math.random() > 0.45 ? "stray" : "skeleton", x, y, z);
      } else if (biome === BIOME.SWAMP && Math.random() > 0.5) this.spawnMob("witch", x, y, z);
      else if (Math.random() > 0.9) this.spawnMob("enderman", x, y, z);
      else {
        const roll = Math.random();
        const type = roll > 0.72 ? "creeper" : roll > 0.48 ? "skeleton" : roll > 0.28 ? "spider" : "zombie";
        this.spawnMob(type, x, y, z);
      }
    } else if (day && light > 8 && surface && Math.random() > 0.22) {
      if (biome === BIOME.TAIGA && Math.random() > 0.35) this.spawnMob("wolf", x, y, z);
      else if ((biome === BIOME.PLAINS || biome === BIOME.SAVANNA) && Math.random() > 0.4) {
        this.spawnMob(Math.random() > 0.45 ? "horse" : "rabbit", x, y, z);
      } else if (biome === BIOME.JUNGLE && Math.random() > 0.4) this.spawnMob("parrot", x, y, z);
      else if ((biome === BIOME.SNOWY_PLAINS || biome === BIOME.SNOW_MOUNTAIN) && Math.random() > 0.4) {
        this.spawnMob(Math.random() > 0.55 ? "rabbit" : "polar_bear", x, y, z);
      } else if (biome === BIOME.FLOWER_FOREST) this.spawnMob("rabbit", x, y, z);
      else {
        const roll = Math.random();
        const type = roll > 0.75 ? "chicken" : roll > 0.5 ? "sheep" : roll > 0.25 ? "pig" : "cow";
        this.spawnMob(type, x, y, z);
      }
    }
  }

  hitMobs(origin, dir, range, dmg) {
    let hit = false;
    for (const e of this.list) {
      if (e.type === "item" || e.type === "arrow" || e.type === "bobber" || e.type === "boat" || e.type === "fireball" || e.type === "pearl" || e.type === "xp" || e.type === "eye") continue;
      const to = e.mesh.position.clone().sub(origin);
      const reach = e.type === "ender_dragon" ? 8 : range;
      if (to.length() > reach) continue;
      if (to.normalize().dot(dir) > 0.72) {
        e.hp -= dmg;
        this.knockback(e, origin, dir, dmg > 6 ? 1.35 : 1);
        this.alertPack(null, e);
        if (e.type === "enderman") {
          const a = Math.random() * Math.PI * 2;
          const d = 6 + Math.random() * 8;
          e.mesh.position.x += Math.cos(a) * d;
          e.mesh.position.z += Math.sin(a) * d;
          e.mesh.position.y += 1;
        }
        if (e.type === "zombified_piglin") {
          for (const o of this.list) {
            if (o.type === "zombified_piglin") o.agro = true;
          }
        }
        hit = true;
      }
    }
    return hit;
  }

  knockback(e, from, lookDir, scale = 1) {
    if (!e?.vel || e.type === "enderman" || e.type === "ender_dragon" || e.type === "end_crystal") return;
    const away = e.mesh.position.clone().sub(from);
    away.y = 0;
    if (away.lengthSq() < 0.04 && lookDir) away.set(lookDir.x, 0, lookDir.z);
    if (away.lengthSq() < 1e-6) away.set(0, 0, 1);
    away.normalize();
    const h = 3.8 * scale;
    e.vel.x = away.x * h;
    e.vel.z = away.z * h;
    e.vel.y = Math.max(e.vel.y, 2.1 * scale);
    e.kb = 0.26;
  }

  alertPack(fromEnt, against) {
    if (against?.type === "wolf" && against.tamed) return;
    for (const w of this.list) {
      if (w.type !== "wolf" || !w.tamed || w.sitting) continue;
      if (against && against !== w) w.targetId = against.id;
      else if (fromEnt && fromEnt !== w) w.targetId = fromEnt.id;
    }
  }

  interact(player, origin, dir) {
    const held = player.held();
    for (let i = 0; i < this.list.length; i++) {
      const e = this.list[i];
      const to = e.mesh.position.clone().sub(origin);
      if (to.length() > 3.6) continue;
      if (to.normalize().dot(dir) < 0.48) continue;

      if (e.type === "boat") {
        if (player.sneaking && player.vehicleId !== e.id) {
          if (player.give("oak_boat", 1) || player.gamemode === "creative") {
            if (player.vehicleId === e.id) player.vehicleId = 0;
            this.removeAt(i);
            return true;
          }
        }
        player.vehicleId = e.id;
        player.flying = false;
        return true;
      }

      if (e.type === "villager") {
        player.tradingJob = e.job || "farmer";
        return "trade";
      }

      if (e.type === "wolf") {
        if (held?.id === "bone" && !e.tamed) {
          if (player.gamemode !== "creative") player.consumeId("bone", 1);
          if (Math.random() < 0.4 || player.gamemode === "creative") {
            e.tamed = true;
            e.owner = true;
            e.hp = 20;
            const collar = e.mesh.getObjectByName("collar");
            if (collar) collar.visible = true;
            this._sparkPos = e.mesh.position.clone();
            return "tame";
          }
          this._sparkPos = e.mesh.position.clone();
          return "love";
        }
        if (e.tamed && held && (BREED_FOOD.wolf || []).includes(held.id) && !e.baby) {
          return this.tryBreed(player, e, held.id);
        }
        if (e.tamed) {
          e.sitting = !e.sitting;
          e.targetId = 0;
          return true;
        }
      }

      const foods = BREED_FOOD[e.type];
      if (foods && held && foods.includes(held.id) && !e.baby) {
        return this.tryBreed(player, e, held.id);
      }

      if (e.type === "piglin" && held?.id === "gold_ingot") {
        if (player.gamemode !== "creative") player.consumeId("gold_ingot", 1);
        const loot = ["gravel", "quartz", "glowstone", "leather", "ender_pearl", "nether_wart", "soul_sand", "obsidian", "string"];
        const id = loot[(Math.random() * loot.length) | 0];
        const n = 1 + ((Math.random() * 3) | 0);
        this.spawnItem(e.mesh.position.x, e.mesh.position.y + 0.6, e.mesh.position.z, id, n);
        return true;
      }

      if (e.type === "sheep" && !e.sheared && held?.id === "shears") {
        e.sheared = true;
        tintSheep(e.mesh, "white_wool", true);
        this.spawnItem(e.mesh.position.x, e.mesh.position.y + 0.4, e.mesh.position.z, e.wool || "white_wool", 1 + (Math.random() > 0.5 ? 1 : 0));
        return true;
      }
    }
    return false;
  }

  tryBreed(player, e, foodId) {
    this._sparkPos = e.mesh.position.clone();
    if (player.gamemode !== "creative") player.consumeId(foodId, 1);
    if ((e.loveCool || 0) > 0) return "love";
    e.inLove = 8;
    for (const o of this.list) {
      if (o === e || o.type !== e.type || o.baby) continue;
      if ((o.inLove || 0) <= 0 || (o.loveCool || 0) > 0) continue;
      if (o.mesh.position.distanceTo(e.mesh.position) > 4.8) continue;
      e.inLove = 0;
      o.inLove = 0;
      e.loveCool = 90;
      o.loveCool = 90;
      const mid = e.mesh.position.clone().lerp(o.mesh.position, 0.5);
      this._sparkPos = mid.clone();
      this.spawnMob(e.type, mid.x, mid.y, mid.z, {
        baby: true,
        wool: e.wool,
        job: e.job,
        tamed: !!(e.tamed && o.tamed),
      });
      break;
    }
    return "love";
  }

  tickBoat(e, dt, player) {
    const p = e.mesh.position;
    const riding = player.vehicleId === e.id && !player.dead;
    const water = this.world.getBlock(p.x, p.y, p.z) === WATER
      || this.world.getBlock(p.x, p.y - 0.2, p.z) === WATER
      || this.world.getBlock(p.x, p.y + 0.4, p.z) === WATER;
    const ix = riding ? (player.wishX || 0) : 0;
    const iz = riding ? (player.wishZ || 0) : 0;
    const speed = water ? 8.8 : 1.15;
    e.vel.x = ix * speed;
    e.vel.z = iz * speed;
    if (water) {
      let sy = Math.floor(p.y);
      while (sy < 94 && this.world.getBlock(p.x, sy + 1, p.z) === WATER) sy++;
      const floatY = this.world.getBlock(p.x, sy, p.z) === WATER ? sy + 0.28 : p.y;
      e.vel.y = (floatY - p.y) * 10;
    } else {
      e.vel.y -= 22 * dt;
    }
    const nx = p.x + e.vel.x * dt;
    const ny = p.y + e.vel.y * dt;
    const nz = p.z + e.vel.z * dt;
    if (!this.world.isSolid(nx, ny + 0.35, nz) && !this.world.isSolid(nx, ny + 0.85, nz)) {
      p.x = nx;
      p.z = nz;
    }
    if (!this.world.isSolid(p.x, ny, p.z)) p.y = ny;
    else {
      p.y = Math.floor(p.y) + 0.02;
      e.vel.y = 0;
    }
    if (ix || iz) e.yaw = Math.atan2(-ix, -iz);
    e.mesh.rotation.y = e.yaw;
    if (riding) {
      player.pos.set(p.x, p.y + 0.42, p.z);
      player.vel.set(0, 0, 0);
      player.onGround = true;
      player.inFluid = water;
      player.fallStart = player.pos.y;
    }
  }

  nearbyHostile(player, r = 8) {
    for (const e of this.list) {
      if (e.type === "zombie" || e.type === "creeper" || e.type === "spider" || e.type === "skeleton"
        || e.type === "drowned" || e.type === "husk" || e.type === "stray" || e.type === "witch"
        || e.type === "enderman" || e.type === "blaze" || e.type === "wither_skeleton"
        || e.type === "ghast" || e.type === "piglin" || e.type === "magma_cube") {
        if (e.mesh.position.distanceTo(player.pos) < r) return true;
      }
    }
    return false;
  }

  removeAt(i) {
    const e = this.list[i];
    this.scene.remove(e.mesh);
    e.mesh.traverse?.((c) => {
      c.geometry?.dispose?.();
      if (c.material && !c.material.map) c.material.dispose?.();
    });
    this.list.splice(i, 1);
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

function dropTex(textures, key, canvas) {
  textures._dropTex = textures._dropTex || new Map();
  if (textures._dropTex.has(key)) return textures._dropTex.get(key);
  const tex = canvasTex(canvas);
  textures._dropTex.set(key, tex);
  return tex;
}

function makeItemMesh(textures, id) {
  if (!isSpriteItem(id)) {
    const b = BLOCKS[ITEMS[id].blockId];
    const name = faceTile(b, "south") || faceTile(b, "side") || b.key;
    const canvas = textures.tiles[textures.tileIndex[name] ?? 0];
    const mat = new THREE.MeshLambertMaterial({
      map: dropTex(textures, "tile:" + name, canvas),
      emissive: 0x222222,
    });
    if (b.transparent || b.cutout) {
      mat.transparent = true;
      mat.alphaTest = 0.15;
    }
    return new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), mat);
  }
  const icon = itemIcon(textures, id, 16);
  const mat = new THREE.MeshBasicMaterial({
    map: dropTex(textures, "icon:" + id, icon),
    transparent: true,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), mat);
}

function box(w, h, d, color) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ color }));
}

function faceCanvas(draw) {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  draw(g);
  return c;
}

function fill(g, col) {
  g.fillStyle = col;
  g.fillRect(0, 0, 8, 8);
}

function px8(g, x, y, col, w = 1, h = 1) {
  g.fillStyle = col;
  g.fillRect(x, y, w, h);
}

function headedBox(w, h, d, color, face) {
  const mk = () => new THREE.MeshLambertMaterial({ color });
  const mats = [mk(), mk(), mk(), mk(), mk(), mk()];
  if (face) {
    const t = canvasTex(face);
    mats[5] = new THREE.MeshLambertMaterial({ map: t });
  }
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
}

function legs4(g, color, y, zOff, xOff, w, h, d) {
  for (const [x, z] of [[xOff, zOff], [-xOff, zOff], [xOff, -zOff], [-xOff, -zOff]]) {
    const l = box(w, h, d, color);
    l.position.set(x, y, z);
    g.add(l);
  }
}

const WOOL_HEX = {
  white_wool: 0xf2f2f2,
  red_wool: 0xb02e26,
  blue_wool: 0x3c44aa,
  yellow_wool: 0xfcdc4c,
  black_wool: 0x1d1d21,
  green_wool: 0x5d7c15,
  orange_wool: 0xf9801d,
  brown_wool: 0x835432,
  pink_wool: 0xf38aaa,
};

function tintSheep(mesh, wool, sheared = false) {
  const body = mesh.children[0];
  if (body?.material) body.material.color.setHex(sheared ? 0xcccccc : (WOOL_HEX[wool] || 0xf2f2f2));
}

function makeMob(type, job) {
  const g = new THREE.Group();
  if (type === "iron_golem") {
    const body = box(1.2, 1.2, 0.58, 0xb8b8bc);
    body.position.y = 1.42;
    const hg = new THREE.Group();
    hg.position.y = 2.22;
    const head = headedBox(0.58, 0.58, 0.58, 0xc8c8cc, faceCanvas((c) => {
      fill(c, "#c8c8cc");
      px8(c, 1, 2, "#333344", 2, 2);
      px8(c, 5, 2, "#333344", 2, 2);
      px8(c, 3, 5, "#888899", 2, 2);
    }));
    const nose = box(0.12, 0.2, 0.18, 0xa8a8b0);
    nose.position.set(0, -0.04, -0.36);
    hg.add(head, nose);
    const armL = box(0.3, 1.25, 0.3, 0xb0b0b4);
    armL.position.set(-0.88, 1.5, 0);
    const armR = armL.clone();
    armR.position.x = 0.88;
    const legs = box(0.72, 0.9, 0.42, 0xa8a8ac);
    legs.position.y = 0.45;
    const vine = box(0.22, 0.14, 0.08, 0x3d9a3d);
    vine.position.set(0.28, 1.7, -0.32);
    g.add(body, hg, armL, armR, legs, vine);
    return g;
  }
  if (type === "villager") {
    const robe = job === "smith" ? 0x3a3a42 : job === "cleric" ? 0x6b3480 : 0x8b5a2b;
    const body = box(0.48, 0.85, 0.36, robe);
    body.position.y = 0.95;
    const hg = new THREE.Group();
    hg.position.y = 1.58;
    const head = headedBox(0.48, 0.5, 0.48, 0xc4a070, faceCanvas((c) => {
      fill(c, "#c4a070");
      px8(c, 1, 2, "#2a1810", 2, 2);
      px8(c, 5, 2, "#2a1810", 2, 2);
      px8(c, 3, 4, "#a07048", 2, 3);
      px8(c, 3, 5, "#8a5830", 2, 2);
    }));
    const nose = box(0.1, 0.16, 0.18, 0xb89058);
    nose.position.set(0, -0.02, -0.32);
    hg.add(head, nose);
    const brows = box(0.5, 0.12, 0.52, job === "cleric" ? 0x4a2060 : 0x5a3a18);
    brows.position.y = 0.22;
    hg.add(brows);
    const legs = box(0.4, 0.7, 0.28, robe);
    legs.position.y = 0.35;
    const armL = box(0.14, 0.5, 0.14, 0xc4a070);
    armL.position.set(-0.32, 1.05, 0);
    const armR = armL.clone();
    armR.position.x = 0.32;
    g.add(body, hg, legs, armL, armR);
    return g;
  }
  if (type === "wolf") {
    const body = box(0.7, 0.4, 1.05, 0xb8b8b8);
    body.position.y = 0.48;
    const hg = new THREE.Group();
    hg.position.set(0, 0.58, -0.58);
    const head = headedBox(0.38, 0.36, 0.4, 0xc8c8c8, faceCanvas((c) => {
      fill(c, "#c8c8c8");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 3, 5, "#222222", 2, 2);
    }));
    const earL = box(0.1, 0.16, 0.06, 0x888888);
    earL.position.set(-0.12, 0.22, 0);
    const earR = earL.clone();
    earR.position.x = 0.12;
    hg.add(head, earL, earR);
    const tail = box(0.1, 0.1, 0.45, 0xb0b0b0);
    tail.position.set(0, 0.55, 0.62);
    const collar = box(0.42, 0.08, 0.42, 0xcc2222);
    collar.position.set(0, 0.62, -0.32);
    collar.visible = false;
    collar.name = "collar";
    g.add(body, hg, tail, collar);
    legs4(g, 0x9a9a9a, 0.18, 0.32, 0.18, 0.12, 0.28, 0.12);
    return g;
  }
  if (type === "horse") {
    const body = box(0.7, 0.7, 1.4, 0x8a5a32);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.set(0, 1.25, -0.72);
    const head = headedBox(0.32, 0.38, 0.55, 0x8a5a32, faceCanvas((c) => {
      fill(c, "#8a5a32");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
    }));
    hg.add(head);
    const mane = box(0.12, 0.4, 0.5, 0x3a2818);
    mane.position.set(0, 0.12, 0.08);
    hg.add(mane);
    g.add(body, hg);
    legs4(g, 0x6e4520, 0.42, 0.42, 0.22, 0.14, 0.7, 0.14);
    return g;
  }
  if (type === "rabbit") {
    const body = box(0.32, 0.28, 0.42, 0xc8b090);
    body.position.y = 0.28;
    const head = headedBox(0.26, 0.24, 0.26, 0xc8b090, faceCanvas((c) => {
      fill(c, "#c8b090");
      px8(c, 1, 3, "#111111", 2, 2);
      px8(c, 5, 3, "#111111", 2, 2);
    }));
    head.position.set(0, 0.42, -0.2);
    const earL = box(0.06, 0.28, 0.06, 0xc8b090);
    earL.position.set(-0.08, 0.68, -0.18);
    const earR = earL.clone();
    earR.position.x = 0.08;
    g.add(body, head, earL, earR);
    return g;
  }
  if (type === "parrot") {
    const colors = [0xcc3333, 0x33aa44, 0x4488dd, 0xddaa22];
    const col = colors[(Math.random() * colors.length) | 0];
    const body = box(0.22, 0.28, 0.28, col);
    body.position.y = 0.32;
    const head = headedBox(0.2, 0.2, 0.2, col, faceCanvas((c) => {
      fill(c, "#dddddd");
      px8(c, 1, 3, "#111111", 2, 2);
      px8(c, 5, 3, "#111111", 2, 2);
    }));
    head.position.set(0, 0.52, -0.12);
    const beak = box(0.08, 0.08, 0.14, 0xf0a020);
    beak.position.set(0, 0.5, -0.26);
    g.add(body, head, beak);
    return g;
  }
  if (type === "mooshroom") {
    const body = box(0.9, 0.7, 1.2, 0xcc4444);
    body.position.y = 0.7;
    const hg = new THREE.Group();
    hg.position.set(0, 1.05, -0.7);
    const head = headedBox(0.5, 0.5, 0.5, 0xcc4444, faceCanvas((c) => {
      fill(c, "#cc4444");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 2, 5, "#f2f2cc", 4, 2);
    }));
    const shroom = box(0.28, 0.14, 0.28, 0xaa2222);
    shroom.position.set(0.12, 0.32, 0);
    hg.add(head, shroom);
    g.add(body, hg);
    legs4(g, 0xcc4444, 0.28, 0.38, 0.28, 0.16, 0.45, 0.16);
    return g;
  }
  if (type === "polar_bear") {
    const body = box(0.95, 0.75, 1.45, 0xf2f2f0);
    body.position.y = 0.78;
    const hg = new THREE.Group();
    hg.position.set(0, 0.95, -0.78);
    const head = headedBox(0.5, 0.42, 0.48, 0xf2f2f0, faceCanvas((c) => {
      fill(c, "#f2f2f0");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 3, 5, "#222222", 2, 2);
    }));
    hg.add(head);
    g.add(body, hg);
    legs4(g, 0xe8e8e4, 0.32, 0.42, 0.3, 0.2, 0.5, 0.2);
    return g;
  }
  if (type === "enderman") {
    const body = box(0.32, 1.2, 0.22, 0x101010);
    body.position.y = 1.4;
    const hg = new THREE.Group();
    hg.position.y = 2.2;
    const head = headedBox(0.36, 0.36, 0.36, 0x101010, faceCanvas((c) => {
      fill(c, "#101010");
      px8(c, 1, 3, "#cc44cc", 2, 1);
      px8(c, 5, 3, "#cc44cc", 2, 1);
    }));
    hg.add(head);
    const legs = box(0.28, 1.1, 0.18, 0x101010);
    legs.position.y = 0.55;
    const armL = box(0.1, 1.1, 0.1, 0x101010);
    armL.position.set(-0.28, 1.35, 0);
    const armR = armL.clone();
    armR.position.x = 0.28;
    g.add(body, hg, legs, armL, armR);
    return g;
  }
  if (type === "ender_dragon") {
    const body = box(2.8, 0.72, 1.15, 0x1a1020);
    body.position.y = 0.4;
    const neck = box(0.45, 0.4, 1.35, 0x221428);
    neck.position.set(0, 0.55, -1.3);
    const head = headedBox(0.72, 0.55, 0.82, 0x2a1830, faceCanvas((c) => {
      fill(c, "#2a1830");
      px8(c, 1, 2, "#cc44cc", 2, 2);
      px8(c, 5, 2, "#cc44cc", 2, 2);
      px8(c, 2, 5, "#111111", 4, 2);
    }));
    head.position.set(0, 0.65, -2.15);
    const wingL = box(2.15, 0.08, 1.15, 0x3a2450);
    wingL.position.set(-2.05, 0.7, 0);
    const wingR = wingL.clone();
    wingR.position.x = 2.05;
    const tail = box(0.28, 0.28, 1.85, 0x1a1020);
    tail.position.set(0, 0.35, 1.4);
    g.add(body, neck, head, wingL, wingR, tail);
    return g;
  }
  if (type === "end_crystal") {
    const base = box(0.72, 0.12, 0.72, 0x222228);
    const gem = box(0.46, 0.72, 0.46, 0xff66ee);
    gem.position.y = 0.55;
    g.add(base, gem);
    return g;
  }
  if (type === "witch") {
    const body = box(0.5, 0.9, 0.38, 0x3a2458);
    body.position.y = 0.95;
    const hg = new THREE.Group();
    hg.position.y = 1.6;
    const head = headedBox(0.48, 0.48, 0.48, 0xc4a070, faceCanvas((c) => {
      fill(c, "#c4a070");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 3, 5, "#8a5830", 2, 2);
    }));
    const hat = box(0.62, 0.16, 0.62, 0x2a1838);
    hat.position.y = 0.28;
    const brim = box(0.28, 0.32, 0.28, 0x2a1838);
    brim.position.y = 0.5;
    hg.add(head, hat, brim);
    const legs = box(0.4, 0.7, 0.28, 0x2a1838);
    legs.position.y = 0.35;
    g.add(body, hg, legs);
    return g;
  }
  if (type === "husk") {
    const body = box(0.5, 0.75, 0.28, 0xc2a36a);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.7;
    const head = headedBox(0.5, 0.5, 0.5, 0xd2b48c, faceCanvas((c) => {
      fill(c, "#d2b48c");
      px8(c, 1, 2, "#3a2a10", 2, 2);
      px8(c, 5, 2, "#3a2a10", 2, 2);
      px8(c, 3, 5, "#8a6a40", 2, 2);
    }));
    hg.add(head);
    const legs = box(0.42, 0.7, 0.24, 0xa88850);
    legs.position.y = 0.35;
    const armL = box(0.16, 0.55, 0.16, 0xd2b48c);
    armL.position.set(-0.34, 1.05, -0.18);
    armL.rotation.x = -1.05;
    const armR = armL.clone();
    armR.position.x = 0.34;
    g.add(body, hg, legs, armL, armR);
    return g;
  }
  if (type === "drowned") {
    const body = box(0.5, 0.75, 0.28, 0x2a6a62);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.7;
    const head = headedBox(0.5, 0.5, 0.5, 0x3a8a7a, faceCanvas((c) => {
      fill(c, "#3a8a7a");
      px8(c, 1, 2, "#0a2020", 2, 2);
      px8(c, 5, 2, "#0a2020", 2, 2);
      px8(c, 3, 5, "#1a4a42", 2, 2);
    }));
    hg.add(head);
    const legs = box(0.42, 0.7, 0.24, 0x245850);
    legs.position.y = 0.35;
    const armL = box(0.16, 0.55, 0.16, 0x3a8a7a);
    armL.position.set(-0.34, 1.05, -0.18);
    armL.rotation.x = -1.05;
    const armR = armL.clone();
    armR.position.x = 0.34;
    g.add(body, hg, legs, armL, armR);
    return g;
  }
  if (type === "stray") {
    const body = box(0.38, 0.7, 0.22, 0xc8d0d8);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.65;
    const head = headedBox(0.44, 0.44, 0.44, 0xd8e0e8, faceCanvas((c) => {
      fill(c, "#d8e0e8");
      px8(c, 1, 2, "#1a1a1a", 2, 3);
      px8(c, 5, 2, "#1a1a1a", 2, 3);
      px8(c, 3, 4, "#2a2a28", 2, 2);
      px8(c, 2, 6, "#88a0b0", 4, 1);
    }));
    hg.add(head);
    const legs = box(0.32, 0.7, 0.2, 0xc8d0d8);
    legs.position.y = 0.35;
    const bow = box(0.06, 0.42, 0.06, 0x8a6230);
    bow.position.set(0.34, 1.15, -0.18);
    g.add(body, hg, legs, bow);
    return g;
  }
  if (type === "ghast") {
    const body = box(2.1, 2.1, 2.1, 0xf4f4f0);
    body.position.y = 1.1;
    const face = headedBox(2.12, 2.12, 0.08, 0xf4f4f0, faceCanvas((c) => {
      fill(c, "#f4f4f0");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 2, 5, "#111111", 4, 2);
    }));
    face.position.set(0, 1.1, -1.08);
    g.add(body, face);
    return g;
  }
  if (type === "blaze") {
    const core = box(0.42, 0.7, 0.42, 0xffcc44);
    core.position.y = 1.2;
    const head = headedBox(0.5, 0.5, 0.5, 0xffaa22, faceCanvas((c) => {
      fill(c, "#ffaa22");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
    }));
    head.position.y = 1.7;
    for (let i = 0; i < 6; i++) {
      const rod = box(0.1, 0.85, 0.1, 0xff8800);
      const a = (i / 6) * Math.PI * 2;
      rod.position.set(Math.cos(a) * 0.45, 0.9, Math.sin(a) * 0.45);
      g.add(rod);
    }
    g.add(core, head);
    return g;
  }
  if (type === "wither_skeleton") {
    const body = box(0.42, 1.05, 0.26, 0x1a1a1a);
    body.position.y = 1.25;
    const hg = new THREE.Group();
    hg.position.y = 2.0;
    const head = headedBox(0.48, 0.52, 0.48, 0x222222, faceCanvas((c) => {
      fill(c, "#222222");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 3, 5, "#111111", 2, 1);
    }));
    hg.add(head);
    const legs = box(0.36, 0.9, 0.22, 0x151515);
    legs.position.y = 0.45;
    const sword = box(0.08, 0.7, 0.08, 0x888888);
    sword.position.set(0.32, 1.35, -0.15);
    g.add(body, hg, legs, sword);
    return g;
  }
  if (type === "piglin" || type === "zombified_piglin") {
    const pink = type === "piglin" ? 0xe8a090 : 0x6a8a58;
    const body = box(0.5, 0.75, 0.3, type === "piglin" ? 0xc48a3a : 0x4a6a3a);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.65;
    const head = headedBox(0.52, 0.48, 0.5, pink, faceCanvas((c) => {
      fill(c, type === "piglin" ? "#e8a090" : "#6a8a58");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 2, 5, "#c07070", 4, 2);
    }));
    const earL = box(0.12, 0.22, 0.06, pink);
    earL.position.set(-0.32, 0.18, 0);
    const earR = earL.clone();
    earR.position.x = 0.32;
    hg.add(head, earL, earR);
    const legs = box(0.42, 0.7, 0.24, pink);
    legs.position.y = 0.35;
    g.add(body, hg, legs);
    return g;
  }
  if (type === "magma_cube") {
    const body = box(0.95, 0.95, 0.95, 0xcc5522);
    body.position.y = 0.48;
    const band = box(0.97, 0.18, 0.97, 0xffaa33);
    band.position.y = 0.48;
    g.add(body, band);
    return g;
  }
  if (type === "pig") {
    const body = box(0.9, 0.65, 1.15, 0xf0a0a8);
    body.position.y = 0.62;
    const hg = new THREE.Group();
    hg.position.set(0, 0.78, -0.68);
    const head = headedBox(0.5, 0.48, 0.48, 0xf0a0a8, faceCanvas((c) => {
      fill(c, "#f0a0a8");
      px8(c, 1, 2, "#1a1a1a", 2, 2);
      px8(c, 5, 2, "#1a1a1a", 2, 2);
      px8(c, 2, 4, "#e09098", 4, 3);
      px8(c, 3, 5, "#6a3038", 1, 1);
      px8(c, 5, 5, "#6a3038", 1, 1);
    }));
    const snout = box(0.28, 0.2, 0.16, 0xe09098);
    snout.position.set(0, -0.04, -0.3);
    const earL = box(0.12, 0.14, 0.06, 0xe88890);
    earL.position.set(-0.22, 0.28, 0.05);
    const earR = earL.clone();
    earR.position.x = 0.22;
    hg.add(head, snout, earL, earR);
    g.add(body, hg);
    legs4(g, 0xe88890, 0.22, 0.38, 0.28, 0.18, 0.44, 0.18);
  } else if (type === "cow") {
    const body = box(0.95, 0.75, 1.35, 0x4a3322);
    body.position.y = 0.78;
    const spot = box(0.32, 0.32, 0.28, 0xf2f2f2);
    spot.position.set(0.22, 0.92, 0.05);
    const hg = new THREE.Group();
    hg.position.set(0, 1.02, -0.82);
    const head = headedBox(0.48, 0.48, 0.42, 0x4a3322, faceCanvas((c) => {
      fill(c, "#4a3322");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 2, 4, "#f0ead8", 4, 3);
      px8(c, 3, 6, "#e09098", 2, 1);
    }));
    const hornL = box(0.08, 0.16, 0.08, 0xf0ead8);
    hornL.position.set(-0.22, 0.3, 0.02);
    const hornR = hornL.clone();
    hornR.position.x = 0.22;
    hg.add(head, hornL, hornR);
    g.add(body, spot, hg);
    legs4(g, 0x3a2818, 0.28, 0.42, 0.3, 0.18, 0.55, 0.18);
  } else if (type === "sheep") {
    const body = box(0.95, 0.72, 1.2, 0xf2f2f2);
    body.position.y = 0.62;
    const hg = new THREE.Group();
    hg.position.set(0, 0.78, -0.7);
    const head = headedBox(0.38, 0.38, 0.38, 0xe8d0a8, faceCanvas((c) => {
      fill(c, "#e8d0a8");
      px8(c, 1, 2, "#1a1a1a", 2, 2);
      px8(c, 5, 2, "#1a1a1a", 2, 2);
      px8(c, 3, 5, "#c4a070", 2, 2);
    }));
    const earL = box(0.1, 0.14, 0.06, 0xd4b890);
    earL.position.set(-0.22, 0.08, 0.04);
    const earR = earL.clone();
    earR.position.x = 0.22;
    hg.add(head, earL, earR);
    g.add(body, hg);
    legs4(g, 0xe8d0a8, 0.2, 0.38, 0.28, 0.16, 0.4, 0.16);
  } else if (type === "chicken") {
    const body = box(0.42, 0.38, 0.5, 0xf0f0f0);
    body.position.y = 0.4;
    const hg = new THREE.Group();
    hg.position.set(0, 0.62, -0.28);
    const head = headedBox(0.22, 0.22, 0.22, 0xf0f0f0, faceCanvas((c) => {
      fill(c, "#f0f0f0");
      px8(c, 1, 3, "#111111", 2, 2);
      px8(c, 5, 3, "#111111", 2, 2);
    }));
    const beak = box(0.1, 0.08, 0.14, 0xf0a020);
    beak.position.set(0, -0.02, -0.16);
    const comb = box(0.06, 0.1, 0.14, 0xc62828);
    comb.position.set(0, 0.14, -0.02);
    const wattle = box(0.06, 0.08, 0.06, 0xc62828);
    wattle.position.set(0, -0.1, -0.12);
    hg.add(head, beak, comb, wattle);
    const wingL = box(0.08, 0.2, 0.28, 0xe8e8e8);
    wingL.position.set(-0.24, 0.4, 0);
    const wingR = wingL.clone();
    wingR.position.x = 0.24;
    g.add(body, hg, wingL, wingR);
    const legL = box(0.06, 0.22, 0.06, 0xf0a020);
    legL.position.set(-0.1, 0.12, 0.02);
    const legR = legL.clone();
    legR.position.x = 0.1;
    g.add(legL, legR);
  } else if (type === "spider") {
    const body = box(0.7, 0.4, 0.85, 0x2a1010);
    body.position.y = 0.42;
    const abdomen = box(0.85, 0.5, 0.7, 0x3a1212);
    abdomen.position.set(0, 0.45, 0.55);
    const hg = new THREE.Group();
    hg.position.set(0, 0.45, -0.55);
    const head = headedBox(0.42, 0.35, 0.4, 0x3a1212, faceCanvas((c) => {
      fill(c, "#3a1212");
      px8(c, 1, 2, "#cc2222", 2, 2);
      px8(c, 5, 2, "#cc2222", 2, 2);
      px8(c, 0, 4, "#aa1818", 1, 1);
      px8(c, 2, 4, "#aa1818", 1, 1);
      px8(c, 5, 4, "#aa1818", 1, 1);
      px8(c, 7, 4, "#aa1818", 1, 1);
    }));
    hg.add(head);
    g.add(body, abdomen, hg);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const leg = box(0.08, 0.08, 0.7, 0x1a0808);
        leg.position.set(side * 0.55, 0.28, -0.35 + i * 0.22);
        leg.rotation.z = side * 0.45;
        g.add(leg);
      }
    }
  } else if (type === "skeleton") {
    const body = box(0.38, 0.7, 0.22, 0xe8e4d4);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.65;
    const head = headedBox(0.44, 0.44, 0.44, 0xf0ead8, faceCanvas((c) => {
      fill(c, "#f0ead8");
      px8(c, 1, 2, "#1a1a1a", 2, 3);
      px8(c, 5, 2, "#1a1a1a", 2, 3);
      px8(c, 3, 4, "#2a2a28", 2, 2);
      px8(c, 2, 6, "#2a2a28", 4, 1);
      px8(c, 2, 7, "#f0ead8", 1, 1);
      px8(c, 4, 7, "#2a2a28", 1, 1);
    }));
    hg.add(head);
    const legs = box(0.32, 0.7, 0.2, 0xe8e4d4);
    legs.position.y = 0.35;
    const armL = box(0.12, 0.55, 0.12, 0xe8e4d4);
    armL.position.set(-0.28, 1.05, -0.08);
    const armR = armL.clone();
    armR.position.x = 0.28;
    const bow = box(0.06, 0.42, 0.06, 0x8a6230);
    bow.position.set(0.34, 1.15, -0.18);
    g.add(body, hg, legs, armL, armR, bow);
  } else if (type === "squid") {
    const body = headedBox(0.55, 0.7, 0.55, 0x335577, faceCanvas((c) => {
      fill(c, "#335577");
      px8(c, 1, 2, "#f0f0f0", 2, 2);
      px8(c, 5, 2, "#f0f0f0", 2, 2);
      px8(c, 2, 3, "#111111", 1, 1);
      px8(c, 5, 3, "#111111", 1, 1);
    }));
    body.position.y = 0.4;
    g.add(body);
    for (let i = 0; i < 4; i++) {
      const tent = box(0.1, 0.5, 0.1, 0x224466);
      const a = (i / 4) * Math.PI * 2;
      tent.position.set(Math.cos(a) * 0.16, -0.12, Math.sin(a) * 0.16);
      g.add(tent);
    }
  } else if (type === "zombie") {
    const body = box(0.5, 0.75, 0.28, 0x3a5a8a);
    body.position.y = 1.05;
    const hg = new THREE.Group();
    hg.position.y = 1.7;
    const head = headedBox(0.5, 0.5, 0.5, 0x5a8a4a, faceCanvas((c) => {
      fill(c, "#5a8a4a");
      px8(c, 1, 2, "#f2f2cc", 2, 2);
      px8(c, 5, 2, "#f2f2cc", 2, 2);
      px8(c, 2, 3, "#111111", 1, 1);
      px8(c, 5, 3, "#111111", 1, 1);
      px8(c, 3, 5, "#3a5a32", 2, 2);
    }));
    hg.add(head);
    const legs = box(0.42, 0.7, 0.24, 0x2e3a6e);
    legs.position.y = 0.35;
    const armL = box(0.16, 0.55, 0.16, 0x5a8a4a);
    armL.position.set(-0.34, 1.05, -0.22);
    armL.rotation.x = -1.15;
    const armR = armL.clone();
    armR.position.x = 0.34;
    g.add(body, hg, legs, armL, armR);
  } else {
    const feet = box(0.48, 0.24, 0.28, 0x3d9a3d);
    feet.position.y = 0.12;
    const body = box(0.5, 0.85, 0.32, 0x3d9a3d);
    body.position.y = 0.7;
    const hg = new THREE.Group();
    hg.position.y = 1.38;
    const head = headedBox(0.5, 0.5, 0.5, 0x4caf4c, faceCanvas((c) => {
      fill(c, "#4caf4c");
      px8(c, 1, 2, "#111111", 2, 2);
      px8(c, 5, 2, "#111111", 2, 2);
      px8(c, 3, 5, "#111111", 2, 1);
      px8(c, 2, 6, "#111111", 4, 2);
      px8(c, 2, 5, "#111111", 1, 1);
      px8(c, 5, 5, "#111111", 1, 1);
    }));
    hg.add(head);
    g.add(body, feet, hg);
  }
  return g;
}

function makeBoat() {
  const g = new THREE.Group();
  const hull = box(1.45, 0.22, 0.72, 0x8b5a2b);
  hull.position.y = 0.12;
  const sideL = box(1.45, 0.28, 0.1, 0x6e4520);
  sideL.position.set(0, 0.28, 0.36);
  const sideR = sideL.clone();
  sideR.position.z = -0.36;
  const bow = box(0.22, 0.28, 0.72, 0x6e4520);
  bow.position.set(0.72, 0.28, 0);
  const stern = bow.clone();
  stern.position.x = -0.72;
  g.add(hull, sideL, sideR, bow, stern);
  return g;
}
