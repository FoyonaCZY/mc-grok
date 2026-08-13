const KEY = "minecrafts.worlds.v1";
const SETTINGS = "minecrafts.settings.v1";

export function loadSettings() {
  try {
    return {
      lang: "zh_cn",
      fov: 70,
      sensitivity: 50,
      renderDistance: 6,
      music: 40,
      sound: 80,
      invertMouse: false,
      viewBobbing: true,
      graphics: "fancy",
      guiScale: 0,
      clouds: true,
      particles: "all",
      autoJump: false,
      ...JSON.parse(localStorage.getItem(SETTINGS) || "{}"),
    };
  } catch {
    return { lang: "zh_cn", fov: 70, sensitivity: 50, renderDistance: 6, music: 40, sound: 80, invertMouse: false, viewBobbing: true, graphics: "fancy", guiScale: 0, clouds: true, particles: "all", autoJump: false };
  }
}

export function saveSettings(s) {
  localStorage.setItem(SETTINGS, JSON.stringify(s));
}

export function listWorlds() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY) || "[]");
    return all.sort((a, b) => (b.playedAt || 0) - (a.playedAt || 0));
  } catch {
    return [];
  }
}

export function getWorld(id) {
  return listWorlds().find((w) => w.id === id) || null;
}

export function upsertWorld(world) {
  const all = listWorlds().filter((w) => w.id !== world.id);
  all.push(world);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteWorld(id) {
  const all = listWorlds().filter((w) => w.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}

function rleEncode(u8) {
  const out = [];
  for (let i = 0; i < u8.length; ) {
    const v = u8[i];
    let n = 1;
    while (i + n < u8.length && u8[i + n] === v && n < 255) n++;
    out.push(n, v);
    i += n;
  }
  return bytesToB64(out);
}

function rleDecode(b64, size) {
  const bytes = b64ToBytes(b64);
  const u8 = new Uint8Array(size);
  let o = 0;
  for (let i = 0; i + 1 < bytes.length && o < size; i += 2) {
    const n = bytes[i];
    const v = bytes[i + 1];
    u8.fill(v, o, o + n);
    o += n;
  }
  return u8;
}

function bytesToB64(arr) {
  const u8 = arr instanceof Uint8Array ? arr : new Uint8Array(arr);
  let s = "";
  const step = 0x8000;
  for (let i = 0; i < u8.length; i += step) {
    s += String.fromCharCode(...u8.subarray(i, i + step));
  }
  return btoa(s);
}

function b64ToBytes(b64) {
  const s = atob(b64);
  const u8 = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
  return u8;
}

export function encodeChunk(blocks) {
  return rleEncode(blocks);
}

export function decodeChunk(b64, size) {
  return rleDecode(b64, size);
}

export function newWorldMeta({ name, seed, gamemode, difficulty, cheats, worldType, bonusChest }) {
  return {
    id: "w_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
    name,
    seed: seed == null || seed === "" ? (Math.random() * 0x7fffffff) | 0 : Number(seed) || hashSeed(String(seed)),
    gamemode,
    difficulty,
    cheats: !!cheats,
    worldType: worldType || "default",
    bonusChest: !!bonusChest,
    createdAt: Date.now(),
    playedAt: Date.now(),
    time: 1000,
    spawn: null,
    player: null,
    patches: {},
    icon: null,
  };
}

function hashSeed(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
