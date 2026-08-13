import * as THREE from "three";
import { BLOCKS, AIR, WATER, LAVA } from "../world/blocks.js";

const EPS = 0.0001;

export function voxelRaycast(world, origin, direction, max = 6) {
  const dx = direction.x;
  const dy = direction.y;
  const dz = direction.z;
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);
  const stepX = dx >= 0 ? 1 : -1;
  const stepY = dy >= 0 ? 1 : -1;
  const stepZ = dz >= 0 ? 1 : -1;
  const tDeltaX = dx === 0 ? Infinity : Math.abs(1 / dx);
  const tDeltaY = dy === 0 ? Infinity : Math.abs(1 / dy);
  const tDeltaZ = dz === 0 ? Infinity : Math.abs(1 / dz);
  let tMaxX = tDeltaX < Infinity ? (dx > 0 ? x + 1 - origin.x : origin.x - x) * tDeltaX : Infinity;
  let tMaxY = tDeltaY < Infinity ? (dy > 0 ? y + 1 - origin.y : origin.y - y) * tDeltaY : Infinity;
  let tMaxZ = tDeltaZ < Infinity ? (dz > 0 ? z + 1 - origin.z : origin.z - z) * tDeltaZ : Infinity;

  let face = [0, 0, 0];
  let t = 0;
  for (let i = 0; i < max * 3 + 3; i++) {
    const id = world.getBlock(x, y, z);
    const b = BLOCKS[id];
    if (id !== AIR && b && !b.fluid) {
      return { x, y, z, id, face, t, px: origin.x + dx * t, py: origin.y + dy * t, pz: origin.z + dz * t };
    }
    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        x += stepX;
        t = tMaxX;
        tMaxX += tDeltaX;
        face = [-stepX, 0, 0];
      } else {
        z += stepZ;
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        face = [0, 0, -stepZ];
      }
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      face = [0, -stepY, 0];
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      face = [0, 0, -stepZ];
    }
    if (t > max) break;
  }
  return null;
}

export function resolveCollisions(world, pos, vel, w, h, sneak, stepUp = 0.6) {
  const hw = w / 2;
  const maxStep = 0.4;
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(vel.x), Math.abs(vel.y), Math.abs(vel.z)) / maxStep));
  let vx = vel.x / steps;
  let vy = vel.y / steps;
  let vz = vel.z / steps;
  let onGround = false;

  for (let i = 0; i < steps; i++) {
    const r = resolveOnce(world, pos, vx, vy, vz, hw, h, sneak, stepUp);
    if (r.onGround) onGround = true;
    vx = r.vx;
    vy = r.vy;
    vz = r.vz;
    if (vx === 0) vel.x = 0;
    if (vy === 0) vel.y = 0;
    if (vz === 0) vel.z = 0;
  }

  if (!onGround && vel.y <= 0) {
    const feet = aabb(pos, hw, 0.08);
    feet.min.y = pos.y - 0.08;
    feet.max.y = pos.y + 0.02;
    onGround = world.collideAABB(feet).length > 0;
  }

  const eye = world.getBlock(pos.x, pos.y + 1.4, pos.z);
  const feetId = world.getBlock(pos.x, pos.y + 0.2, pos.z);
  const inFluid = eye === WATER || feetId === WATER || eye === LAVA || feetId === LAVA;
  const inLava = eye === LAVA || feetId === LAVA;

  return { onGround, inFluid, inLava };
}

function resolveOnce(world, pos, vx, vy, vz, hw, h, sneak, stepUp) {
  let onGround = false;

  const prevY = pos.y;
  pos.y += vy;
  {
    let best = null;
    for (const b of world.collideAABB(aabb(pos, hw, h))) {
      if (vy < 0 && prevY >= b.max.y - 1e-4) {
        if (!best || b.max.y > best.max.y) best = b;
      } else if (vy > 0 && prevY + h <= b.min.y + 1e-4) {
        if (!best || b.min.y < best.min.y) best = b;
      }
    }
    if (best) {
      if (vy < 0) {
        pos.y = best.max.y + EPS;
        vy = 0;
        onGround = true;
      } else {
        pos.y = best.min.y - h - EPS;
        vy = 0;
      }
    }
  }

  const mx = moveAxis(world, pos, "x", vx, hw, h, stepUp);
  vx = mx.delta;
  if (mx.onGround) onGround = true;
  if (mx.stepped) vy = 0;

  if (sneak) {
    const next = pos.clone();
    next.z += vz;
    const feet = aabb(next, hw, h);
    feet.max.y = next.y + 0.1;
    feet.min.y = next.y - 0.2;
    if (world.collideAABB(feet).length === 0) vz = 0;
  }

  const mz = moveAxis(world, pos, "z", vz, hw, h, stepUp);
  vz = mz.delta;
  if (mz.onGround) onGround = true;
  if (mz.stepped) vy = 0;

  return { onGround, vx, vy, vz };
}

function moveAxis(world, pos, axis, delta, hw, h, stepUp) {
  const result = { delta, onGround: false, stepped: false };
  if (!delta) return result;
  const prev = pos[axis];
  pos[axis] += delta;
  const hits = world.collideAABB(aabb(pos, hw, h));
  if (!hits.length) return result;

  const opposing = [];
  for (const b of hits) {
    if (axis === "x") {
      if (delta > 0 && prev + hw <= b.min.x + 1e-4) opposing.push(b);
      else if (delta < 0 && prev - hw >= b.max.x - 1e-4) opposing.push(b);
    } else if (delta > 0 && prev + hw <= b.min.z + 1e-4) opposing.push(b);
    else if (delta < 0 && prev - hw >= b.max.z - 1e-4) opposing.push(b);
  }

  pos[axis] = prev;

  if (stepUp > 0 && opposing.length) {
    let rise = 0;
    for (const b of opposing) {
      const r = b.max.y - pos.y;
      if (r > 0.02 && r <= stepUp + 0.08) rise = Math.max(rise, r + EPS);
    }
    if (rise > 0) {
      const oldY = pos.y;
      pos.y += rise;
      if (world.collideAABB(aabb(pos, hw, h)).length === 0) {
        pos[axis] += delta;
        if (world.collideAABB(aabb(pos, hw, h)).length === 0) {
          result.stepped = true;
          result.onGround = true;
          return result;
        }
        pos[axis] = prev;
      }
      pos.y = oldY;
    }
  }

  pos[axis] += delta;
  let best = null;
  for (const b of world.collideAABB(aabb(pos, hw, h))) {
    if (axis === "x") {
      if (delta > 0 && prev + hw <= b.min.x + 1e-4) {
        if (!best || b.min.x < best.min.x) best = b;
      } else if (delta < 0 && prev - hw >= b.max.x - 1e-4) {
        if (!best || b.max.x > best.max.x) best = b;
      }
    } else if (delta > 0 && prev + hw <= b.min.z + 1e-4) {
      if (!best || b.min.z < best.min.z) best = b;
    } else if (delta < 0 && prev - hw >= b.max.z - 1e-4) {
      if (!best || b.max.z > best.max.z) best = b;
    }
  }
  if (best) {
    if (axis === "x") pos.x = delta > 0 ? best.min.x - hw - EPS : best.max.x + hw + EPS;
    else pos.z = delta > 0 ? best.min.z - hw - EPS : best.max.z + hw + EPS;
    result.delta = 0;
  }
  return result;
}

function aabb(pos, hw, h) {
  return new THREE.Box3(
    new THREE.Vector3(pos.x - hw, pos.y, pos.z - hw),
    new THREE.Vector3(pos.x + hw, pos.y + h, pos.z + hw),
  );
}
