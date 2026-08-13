import * as THREE from "three";
import { Input } from "./core/input.js";
import { AudioSys } from "./core/audio.js";
import { loadSettings, saveSettings, getWorld, upsertWorld, deleteWorld, newWorldMeta } from "./core/storage.js";
import { createTextures } from "./world/textures.js";
import { World } from "./world/world.js";
import { BLOCKS, ITEMS, AIR, WATER, LAVA, TNT, CRAFTING, FURNACE, CHEST, SPONGE, NOTE_BLOCK, GRASS, DIRT, FARMLAND, WHEAT_0, WHEAT_1, WHEAT_2, WHEAT_3, OAK_SAPLING, TALL_GRASS, DANDELION, POPPY, LEAVES, OAK_DOOR, OAK_DOOR_TOP, OAK_DOOR_OPEN, OAK_DOOR_OPEN_TOP, NETHER_PORTAL, SOUL_SAND, NETHER_WART, OBSIDIAN, IRON_BLOCK, PUMPKIN, JACK_LANTERN, OAK_FENCE_GATE, OAK_FENCE_GATE_OPEN, END_PORTAL_FRAME, END_PORTAL_FRAME_EYE } from "./world/blocks.js";
import { placeBonusChest, BIOME_NAMES, BIOME, SEA, HEIGHT, rollChestLoot, NETHER_BIOME_NAMES } from "./world/generator.js";
import { Player } from "./player/player.js";
import { Sky, timeOfDayLabel } from "./render/sky.js";
import { Particles, BreakOverlay, BlockHighlight, makeHand, updateHand } from "./render/fx.js";
import { EntityWorld } from "./entities/mobs.js";
import { UI } from "./ui/ui.js";
import { t } from "./ui/i18n.js";
import { itemName } from "./world/blocks.js";
import { SMELT, canSmelt } from "./inventory/recipes.js";

export class Game {
  constructor() {
    this.canvas = document.getElementById("gl");
    this.audio = new AudioSys();
    this.ui = new UI(document.getElementById("ui"), this.audio);
    this.input = new Input(this.canvas);
    this.settings = loadSettings();
    this.textures = createTextures();
    this.ui.setTextures(this.textures);
    this.ui.lang = this.settings.lang;
    this.ui.applyLang();
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.settings.graphics === "fast" ? 1 : 1.5));
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 600);
    this.camera.rotation.order = "YXZ";
    this.camera.up.set(0, 1, 0);
    this.titleCamera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.1, 600);
    this.titleCamera.rotation.order = "YXZ";
    this.titleCamera.up.set(0, 1, 0);
    this.clock = new THREE.Clock();
    this.state = "boot";
    this.debug = false;
    this.hideHud = false;
    this.paused = false;
    this.invOpen = false;
    this.invMode = "survival";
    this.optBack = "title";
    this.createState = {
      name: "",
      seed: "",
      gamemode: "survival",
      difficulty: "normal",
      cheats: false,
      worldType: "default",
      bonusChest: false,
    };
    this.wasLeft = false;
    this.wasRight = false;
    this.fps = 0;
    this.frames = 0;
    this.fpsT = 0;
    this.handSwing = 0;
    this.bindUI();
    this.input.onLockChange = (locked) => {
      const lost = this._hadLock && !locked;
      this._hadLock = locked;
      if (lost && this.state === "play" && !this.paused && !this.invOpen && !this.ui.chatOpen() && !this.player?.dead) {
        this.pause();
      }
    };
    window.addEventListener("beforeunload", (e) => {
      if (this.state === "play" && this.meta) {
        this.save();
        e.preventDefault();
        e.returnValue = "";
      }
    });
    window.addEventListener("resize", () => this.resize());
    window.visualViewport?.addEventListener("resize", () => this.resize());
    document.addEventListener("fullscreenchange", () => {
      this.resize();
      setTimeout(() => this.resize(), 50);
      setTimeout(() => this.resize(), 250);
    });
    window.addEventListener("keydown", (e) => this.onKey(e));
    this.canvas.addEventListener("click", async () => {
      if (this.state === "play" && !this.paused && !this.invOpen && !this.ui.chatOpen() && !this.player?.dead) {
        await this.input.requestLock();
        this.resize();
      }
    });
    this.resize();
    this.applySettings();
    this.ui.show("boot");
    requestAnimationFrame(() => this.loop());
    setTimeout(() => this.showTitle(), 1000);
  }

  T(k) {
    return t(this.settings.lang, k);
  }

  resize() {
    const vv = window.visualViewport;
    const w = Math.max(1, Math.round(vv?.width || innerWidth));
    const h = Math.max(1, Math.round(vv?.height || innerHeight));
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.settings.graphics === "fast" ? 1 : 1.5));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.titleCamera.aspect = w / h;
    this.titleCamera.updateProjectionMatrix();
    const g = this.settings.guiScale || 0;
    const auto = Math.max(3, Math.min(6, Math.floor(Math.min(w / 320, h / 200))));
    this.ui.setScale(g || auto);
  }

  applySettings() {
    this.camera.fov = this.settings.fov;
    this.camera.updateProjectionMatrix();
    this.input.sensitivity = this.settings.sensitivity / 50;
    this.input.invertY = this.settings.invertMouse;
    this.audio.groups.music = this.settings.music / 100;
    this.audio.groups.master = this.settings.sound / 100;
    this.ui.lang = this.settings.lang;
    this.ui.applyLang();
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, this.settings.graphics === "fast" ? 1 : 1.5));
    saveSettings(this.settings);
  }

  bindUI() {
    const u = this.ui;
    u.on("title", () => this.showTitle());
    u.on("singleplayer", () => {
      u.selectedWorld = null;
      u.refreshWorlds();
      u.show("worlds");
    });
    u.on("multiplayer", () => {
      u.refreshMultiplayer();
      u.show("mp");
    });
    u.on("createWorld", () => {
      this.createState.name = this.T("defaultWorld");
      this.createState.seed = "";
      u.refreshCreate(this.createState);
      u.show("create");
    });
    u.on("confirmCreate", (state) => {
      const meta = newWorldMeta({
        name: state.name || this.T("defaultWorld"),
        seed: state.seed,
        gamemode: state.gamemode,
        difficulty: state.difficulty,
        cheats: state.cheats || state.gamemode === "creative",
        worldType: state.worldType,
        bonusChest: state.bonusChest,
      });
      upsertWorld(meta);
      this.playWorld(meta.id);
    });
    u.on("playWorld", (id) => this.playWorld(id));
    u.on("deleteWorld", (id) => {
      u.confirm(this.T("deleteWorld"), this.T("deleteConfirm") + "\n" + this.T("deleteWarn"), () => {
        deleteWorld(id);
        u.selectedWorld = null;
        u.refreshWorlds();
        u.show("worlds");
      }, () => {
        u.refreshWorlds();
        u.show("worlds");
      });
    });
    u.on("editWorld", () => {
      u.alert(this.T("editWorld"), this.T("openWorldFolder"), () => {
        u.refreshWorlds();
        u.show("worlds");
      });
    });
    u.on("recreateWorld", (id) => {
      const w = getWorld(id);
      if (!w) return;
      this.createState = {
        name: w.name,
        seed: String(w.seed),
        gamemode: w.gamemode,
        difficulty: w.difficulty,
        cheats: w.cheats,
        worldType: w.worldType || "default",
        bonusChest: !!w.bonusChest,
      };
      u.refreshCreate(this.createState);
      u.show("create");
    });
    u.on("options", (back) => {
      this.optBack = back;
      u.refreshOptions(this.settings, back);
      u.show("options");
    });
    u.on("optionsBack", (back) => {
      this.applySettings();
      if (back === "pause") {
        u.refreshPause();
        u.show("pause");
      } else this.showTitle();
    });
    u.on("settings", (s) => {
      Object.assign(this.settings, s);
      this.applySettings();
    });
    u.on("language", () => {
      u.refreshLang(this.settings.lang);
      u.show("lang");
    });
    u.on("lang", (id) => {
      this.settings.lang = id;
      this.applySettings();
    });
    u.on("langDone", () => {
      if (this.optBack === "pause" && this.state === "play") {
        u.refreshOptions(this.settings, "pause");
        u.show("options");
      } else this.showTitle();
    });
    u.on("accessibility", () => {
      u.refreshOptions(this.settings, this.state === "play" ? "pause" : "title");
      u.show("options");
    });
    u.on("resume", () => this.resume());
    u.on("quitTitle", () => this.quitToTitle());
    u.on("respawn", () => this.respawn());
    u.on("chat", (text) => this.handleChat(text));
    u.on("closeInv", () => this.closeInv());
  }

  async showTitle() {
    this.input.releaseBrowserKeys();
    this.state = "title";
    this.paused = false;
    this.invOpen = false;
    this.ui.refreshTitle();
    this.ui.show("title");
    this.audio.ensure();
    try {
      this.disposeWorld();
      this.scene = new THREE.Scene();
      this.sky = new Sky(this.scene);
      this.world = new World({ seed: 8675309, worldType: "default", textures: this.textures, scene: this.scene });
      this.titleCam = 0;
      await this.world.preload(8, 8, 2, () => {});
    } catch (err) {
      console.warn("title world failed", err);
      this.scene = null;
      this.world = null;
    }
  }

  async playWorld(id) {
    const meta = getWorld(id);
    if (!meta) return;
    this.meta = meta;
    this.state = "loading";
    this.ui.show("loading");
    this.ui.setLoading(0, this.T("loading"));
    this.disposeWorld();
    this.scene = new THREE.Scene();
    this.sky = new Sky(this.scene);
    this.world = new World({
      seed: meta.seed,
      worldType: meta.worldType || "default",
      textures: this.textures,
      scene: this.scene,
    });
    this.world.overworldPatches = meta.patches || {};
    this.world.netherPatches = meta.netherPatches || {};
    this.world.endPatches = meta.endPatches || {};
    this.world.dragonDead = !!meta.endDragonDead;
    this.world.gen.dragonDead = this.world.dragonDead;
    this.world.dim = meta.dim || "overworld";
    this.world.gen.dim = this.world.dim;
    this.world.patches = this.world.patchesFor(this.world.dim);
    this.world.time = meta.time ?? 1000;
    this.world.weather = meta.weather || "clear";
    this.player = new Player(this.camera, this.world);
    this.player.gamemode = meta.gamemode;
    this.player.furnace = { in: null, fuel: null, out: null, prog: 0, burn: 0 };
    this.player.craftOut = null;
    this.player.usingTable = false;
    this.player.usingChest = null;
    this.fx = new Particles(this.scene);
    this.breakFx = new BreakOverlay(this.scene, this.textures);
    this.hl = new BlockHighlight(this.scene);
    this.entities = new EntityWorld(this.scene, this.world, this.textures);
    this.hand = makeHand(this.textures);
    this.resetPlayerCamera();
    this.camera.add(this.hand);
    this.scene.add(this.camera);

    const spawn = meta.spawn
      ? Array.isArray(meta.spawn)
        ? { x: meta.spawn[0], y: meta.spawn[1], z: meta.spawn[2] }
        : meta.spawn
      : this.world.gen.spawnPos();
    if (!meta.player) {
      this.player.setSpawn(new THREE.Vector3(spawn.x, spawn.y, spawn.z));
      if (meta.gamemode === "creative") {
        this.player.flying = false;
        const starter = ["stone", "dirt", "grass_block", "oak_planks", "oak_log", "glass", "cobblestone", "crafting_table", "tnt"];
        starter.forEach((sid, i) => {
          if (ITEMS[sid]) this.player.hotbar[i] = { id: sid, count: 64 };
        });
      }
      if (meta.bonusChest) placeBonusChest(this.world, spawn);
    } else {
      this.player.deserialize(meta.player);
      this.player.furnace = this.player.furnace || { in: null, fuel: null, out: null, prog: 0, burn: 0 };
    }
    this.player.applyCamera(this.settings);

    this.ui.setLoading(0.05, this.T("buildingTerrain"));
    await this.world.preload(
      this.player.pos.x,
      this.player.pos.z,
      Math.min(4, this.settings.renderDistance),
      (p) => this.ui.setLoading(0.05 + p * 0.9, this.T("buildingTerrain")),
    );
    this.state = "play";
    this.paused = false;
    this.invOpen = false;
    this.ui._hotSig = null;
    this.ui.show("hud");
    this.ui.renderHotbar(this.player);
    this.input.requestLock();
    this.chat(this.T("mouseGrab"));
    this.chat(this.settings.lang === "zh_cn"
      ? "点击画面进入全屏。Ctrl+W 冲刺。聊天输入 /locate village 或 /locate stronghold 找村庄和要塞（要去还没生成过的区块）。W/A/S/D 移动 · 空格跳跃 · E 背包。"
      : "Click to enter fullscreen. Ctrl+W sprints. Type /locate village or /locate stronghold in chat (unexplored chunks). WASD move · Space jump · E inventory.");
  }

  resetPlayerCamera() {
    this.camera.up.set(0, 1, 0);
    this.camera.rotation.order = "YXZ";
    this.camera.rotation.set(0, 0, 0);
    this.camera.quaternion.setFromEuler(this.camera.rotation);
    this.camera.fov = this.settings.fov || 70;
    this.camera.updateProjectionMatrix();
  }

  disposeWorld() {
    if (this.hand) {
      this.camera.remove(this.hand);
      this.hand = null;
    }
    if (this.camera.parent) this.camera.parent.remove(this.camera);
    if (this.world) {
      this.world.chunks.forEach((c) => c.disposeMesh());
      this.world.group.parent?.remove(this.world.group);
    }
    this.world = null;
    this.scene = null;
    this.player = null;
    this.entities = null;
    this.fx = null;
    this.sky = null;
  }

  pause() {
    if (this.state !== "play" || this.player?.dead) return;
    this.paused = true;
    this.input.exitLock();
    this.ui.refreshPause();
    this.ui.show("pause");
    this.save();
  }

  async resume() {
    this.paused = false;
    this.ui.show("hud");
    await this.input.requestLock();
    this.resize();
  }

  save() {
    if (!this.meta || !this.player) return;
    this.meta.playedAt = Date.now();
    this.meta.time = this.world.time;
    this.meta.weather = this.world.weather;
    this.world.stashPatches();
    this.meta.patches = this.world.overworldPatches;
    this.meta.netherPatches = this.world.netherPatches;
    this.meta.endPatches = this.world.endPatches;
    this.meta.endDragonDead = !!this.world.dragonDead;
    this.meta.dim = this.world.dim;
    this.meta.player = this.player.serialize();
    this.meta.spawn = [this.player.spawn.x, this.player.spawn.y, this.player.spawn.z];
    try {
      upsertWorld(this.meta);
    } catch (e) {
      console.warn("save failed", e);
    }
  }

  async quitToTitle() {
    this.ui.show("loading");
    this.ui.setLoading(0.5, this.T("saving"));
    this.save();
    await new Promise((r) => setTimeout(r, 200));
    await this.showTitle();
  }

  respawn() {
    void this.respawnAsync();
  }

  async respawnAsync() {
    this.player.dead = false;
    this.player.health = 20;
    this.player.hunger = 20;
    this.player.fireTicks = 0;
    this.player.vehicleId = 0;
    this.player.vel.set(0, 0, 0);
    if (this.world.dim !== "overworld") {
      const leaving = this.world.dim === "end" ? this.T("leavingEnd") : this.T("leavingNether");
      this.state = "loading";
      this.ui.show("loading");
      this.ui.setLoading(0.2, leaving);
      this.entities.clearAll();
      this.world.switchDim("overworld");
      this.player.pos.copy(this.player.spawn);
      this.player.prevPos.copy(this.player.pos);
      this.player.renderPos.copy(this.player.pos);
      await this.world.preload(
        this.player.pos.x,
        this.player.pos.z,
        Math.min(4, this.settings.renderDistance),
        (p) => this.ui.setLoading(0.2 + p * 0.7, leaving),
      );
      this.state = "play";
    } else {
      this.player.pos.copy(this.player.spawn);
      this.player.prevPos.copy(this.player.pos);
      this.player.renderPos.copy(this.player.pos);
    }
    this.paused = false;
    this.ui.show("hud");
    this.ui.renderHotbar(this.player);
    this.input.requestLock();
  }

  openInv(mode = null) {
    if (this.player.gamemode === "creative" && !mode) mode = "creative";
    this.invMode = mode || "survival";
    this.player.usingTable = this.invMode === "table";
    this.invOpen = true;
    this.input.exitLock();
    this.ui.show("inv");
    this.ui.renderInventory(this.player, this.invMode);
    this.ui.updateCursor(this.player);
  }

  closeInv() {
    this.invOpen = false;
    this.player.usingTable = false;
    this.player.usingChest = null;
    this.ui.els.tooltip.style.display = "none";
    this.ui.show("hud");
    this.ui.renderHotbar(this.player);
    this.input.requestLock();
  }

  onKey(e) {
    if (this.ui.chatOpen() && e.code !== "Escape") return;
    if (this.state === "play" && !this.paused && !this.invOpen) {
      if (["Space", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyQ", "KeyT", "Slash", "F1", "F3", "F5"].includes(e.code) || (e.code >= "Digit1" && e.code <= "Digit9")) {
        e.preventDefault();
      }
      if (e.code === "Escape") this.pause();
      if (e.code === "KeyE") this.openInv();
      if (e.code === "KeyT" || e.code === "Slash") {
        this.ui.openChat();
        if (e.code === "Slash") this.ui.els["chat-input"].value = "/";
        this.input.exitLock();
      }
      if (e.code === "KeyQ") {
        const d = this.player.dropHeld(e.shiftKey);
        if (d) {
          const dir = new THREE.Vector3();
          this.camera.getWorldDirection(dir);
          this.entities.spawnItem(
            this.player.pos.x + dir.x,
            this.player.pos.y + 1.3,
            this.player.pos.z + dir.z,
            d.id,
            d.count,
          );
          this.ui.renderHotbar(this.player);
        }
      }
      if (e.code === "F3") this.debug = !this.debug;
      if (e.code === "F1") {
        this.hideHud = !this.hideHud;
        const hud = this.ui.root.querySelector("#sc-hud");
        if (hud) hud.style.opacity = this.hideHud ? "0" : "1";
      }
      if (e.code === "F5") this.player.perspective = (this.player.perspective + 1) % 3;
      if (e.code >= "Digit1" && e.code <= "Digit9") {
        this.player.selected = Number(e.code.slice(5)) - 1;
        this.ui.renderHotbar(this.player);
      }
    } else if (this.invOpen && (e.code === "Escape" || e.code === "KeyE")) {
      this.closeInv();
    } else if (this.paused && e.code === "Escape") this.resume();
  }

  chat(msg) {
    this.ui.chat(msg);
  }

  handleChat(text) {
    this.input.requestLock();
    if (!text) return;
    if (text.startsWith("/")) this.command(text.slice(1).trim());
    else this.chat(`<Player> ${text}`);
  }

  command(s) {
    const parts = s.trim().split(/\s+/).filter(Boolean);
    const cmd = (parts[0] || "").toLowerCase();
    const args = parts.slice(1);
    const free = new Set(["time", "seed", "help", "locate", "dim", "dimension"]);
    if (!free.has(cmd) && !this.meta.cheats && this.player.gamemode !== "creative") {
      this.chat(this.T("needCheats"));
      return;
    }
    if (cmd === "gamemode") {
      const m = args[0];
      if (["survival", "creative", "adventure"].includes(m)) {
        this.player.gamemode = m;
        if (m === "creative") this.player.flying = true;
        else this.player.flying = false;
        this.chat(`${this.T("gamemodeSet")} ${this.T(m)}`);
        this.ui.renderHotbar(this.player);
      }
    } else if (cmd === "give") {
      const id = args[0];
      const n = Number(args[1] || 1);
      if (ITEMS[id] && this.player.give(id, n)) this.chat(`${this.T("giveOk")} ${id} * ${n}`);
      else this.chat(this.T("unknownCmd"));
    } else if (cmd === "time") {
      if (args[0] === "set") {
        const map = { day: 1000, noon: 6000, night: 13000, midnight: 18000 };
        this.world.time = map[args[1]] ?? Number(args[1]) ?? this.world.time;
        this.chat(`${this.T("timeSet")} ${this.world.time | 0}`);
      }
    } else if (cmd === "tp") {
      this.player.pos.set(Number(args[0]) || 0, Number(args[1]) || 80, Number(args[2]) || 0);
      this.player.prevPos.copy(this.player.pos);
      this.player.renderPos.copy(this.player.pos);
      this.chat(this.T("tpOk"));
    } else if (cmd === "seed") {
      this.chat(`${this.T("seedIs")} ${this.meta.seed}`);
    } else if (cmd === "kill") {
      this.player.hurt(100);
    } else if (cmd === "difficulty") {
      if (["peaceful", "easy", "normal", "hard"].includes(args[0])) this.meta.difficulty = args[0];
    } else if (cmd === "weather") {
      const w = args[0];
      if (w === "rain" || w === "thunder") this.world.weather = "rain";
      else if (w === "clear" || w === "sun") this.world.weather = "clear";
      else {
        this.chat(this.T("unknownCmd"));
        return;
      }
      this.chat(`${this.T("weatherSet")} ${this.world.weather}`);
    } else if (cmd === "summon") {
      const type = args[0];
      const ok = ["pig", "cow", "sheep", "chicken", "squid", "zombie", "creeper", "spider", "skeleton",
        "ghast", "piglin", "zombified_piglin", "magma_cube", "blaze", "wither_skeleton", "enderman",
        "wolf", "iron_golem", "horse", "rabbit", "villager", "ender_dragon", "end_crystal"];
      if (!ok.includes(type)) {
        this.chat(this.T("unknownCmd"));
        return;
      }
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      this.entities.spawnMob(type, this.player.pos.x + dir.x * 3, this.player.pos.y, this.player.pos.z + dir.z * 3);
      this.chat(`${this.T("summoned")} ${type}`);
    } else if (cmd === "dim" || cmd === "dimension") {
      const raw = (args[0] || "").toLowerCase();
      const map = {
        nether: "nether",
        the_nether: "nether",
        hell: "nether",
        下界: "nether",
        地狱: "nether",
        end: "end",
        the_end: "end",
        末地: "end",
        overworld: "overworld",
        world: "overworld",
        the_overworld: "overworld",
        主世界: "overworld",
      };
      const d = raw ? map[raw] : (this.world.dim === "overworld" ? "nether" : "overworld");
      if (!d) {
        this.chat(this.T("unknownCmd"));
        return;
      }
      void this.travelDimension(d);
    } else if (cmd === "locate") {
      const what = (args[0] || "village").toLowerCase();
      if (what === "stronghold" || what === "endportal" || what === "要塞") {
        const v = this.world.gen.nearestStronghold(this.player.pos.x, this.player.pos.z);
        if (!v) this.chat(this.T("strongholdNone"));
        else {
          this.chat(
            this.settings.lang === "zh_cn"
              ? `最近的要塞约在 ${v.cx} ${v.y} ${v.cz}，距离 ${v.dist | 0} 格。往没走过的区块走才会生成。`
              : `Nearest stronghold at ${v.cx} ${v.y} ${v.cz} (${(v.dist | 0)} blocks). It generates in unexplored chunks.`,
          );
        }
      } else if (what === "village") {
        const v = this.world.gen.nearestVillage(this.player.pos.x, this.player.pos.z);
        if (!v) this.chat(this.T("villageNone"));
        else {
          this.chat(
            this.settings.lang === "zh_cn"
              ? `最近的村庄约在 ${v.cx} ${v.y} ${v.cz}，距离 ${v.dist | 0} 格。往没走过的区块走才会生成。`
              : `Nearest village at ${v.cx} ${v.y} ${v.cz} (${(v.dist | 0)} blocks). It generates in unexplored chunks.`,
          );
        }
      } else this.chat(this.T("unknownCmd"));
    } else if (cmd === "help") {
      this.chat("/gamemode /give /time /tp /seed /weather /summon /kill /difficulty /dim nether|end /locate village|stronghold");
    } else this.chat(this.T("unknownCmd"));
    this.ui.renderHotbar(this.player);
  }

  tryBreak(hit) {
    const id = this.world.getBlock(hit.x, hit.y, hit.z);
    const b = BLOCKS[id];
    if (!b || b.hardness < 0) return;
    if (this.player.gamemode === "adventure") return;
    const drop =
      this.player.gamemode === "creative"
        ? null
        : this.player.canHarvest(id)
          ? b.drop === null
            ? null
            : b.drop || b.key
          : null;
    this.world.setBlock(hit.x, hit.y, hit.z, AIR);
    if (b?.door) {
      const dy = b.door === "upper" ? -1 : 1;
      this.world.setBlock(hit.x, hit.y + dy, hit.z, AIR);
    }
    this.world.applyGravityBlocks(hit.x, hit.y + 1, hit.z);
    this.audio.break();
    this.fx.burst(hit.x, hit.y, hit.z, 0x8a5a32, this.settings.particles === "minimal" ? 4 : 14);
    if (drop && ITEMS[drop]) this.entities.spawnItem(hit.x, hit.y, hit.z, drop, 1);
    if (this.player.gamemode === "survival" && (b.key?.endsWith("leaves") || id === LEAVES)) {
      if (Math.random() < 0.06) this.entities.spawnItem(hit.x, hit.y, hit.z, "oak_sapling", 1);
      if (Math.random() < 0.05) this.entities.spawnItem(hit.x, hit.y, hit.z, "apple", 1);
    }
    if (this.player.gamemode === "survival" && id === WHEAT_3) {
      this.entities.spawnItem(hit.x, hit.y, hit.z, "wheat_seeds", 1 + ((Math.random() * 2) | 0));
    }
    if (this.player.gamemode === "survival") this.player.exhaust(0.005);
  }

  tryUse() {
    const p = this.player;
    const hit = p.look;
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    const used = this.entities.interact(p, this.camera.position, dir);
    if (used === "trade") {
      this.openInv("trade");
      return;
    }
    if (used === "love" || used === "tame") {
      const s = this.entities._sparkPos || p.pos;
      this.fx.burstAt(s.x, s.y + 0.85, s.z, used === "tame" ? 0xffee66 : 0xff6699, used === "tame" ? 14 : 10);
      this.audio.pop();
      this.ui.renderHotbar(p);
      return;
    }
    if (used) {
      this.audio.pop();
      this.ui.renderHotbar(p);
      return;
    }
    if (p.held()?.id === "oak_boat") {
      if (hit) {
        const x = hit.x + (hit.face?.[0] || 0) + 0.5;
        const y = hit.y + Math.max(0, hit.face?.[1] || 0) + 0.25;
        const z = hit.z + (hit.face?.[2] || 0) + 0.5;
        this.entities.spawnBoat(x, y, z);
        if (p.gamemode !== "creative") p.consumeId("oak_boat", 1);
        this.audio.place();
        this.ui.renderHotbar(p);
      }
      return;
    }
    if (p.held()?.id === "bow") {
      if (p.gamemode === "creative" || p.consumeId("arrow", 1)) {
        const origin = this.camera.position.clone();
        this.entities.spawnArrow(origin.x, origin.y, origin.z, dir, 7, true);
        this.audio.hit();
        this.handSwing = 1;
        this.ui.renderHotbar(p);
      }
      return;
    }
    if (p.held()?.id === "fishing_rod") {
      this.tryFish(dir);
      return;
    }
    if (p.held()?.id === "ender_pearl") {
      if (p.gamemode === "creative" || p.consumeId("ender_pearl", 1)) {
        const origin = this.camera.position.clone();
        this.entities.spawnPearl(origin.x, origin.y, origin.z, dir);
        this.handSwing = 1;
        this.ui.renderHotbar(p);
      }
      return;
    }
    if (p.held()?.id === "ender_eye") {
      if (hit && this.world.getBlock(hit.x, hit.y, hit.z) === END_PORTAL_FRAME) {
        if (p.gamemode === "creative" || p.consumeId("ender_eye", 1)) {
          this.world.setBlock(hit.x, hit.y, hit.z, END_PORTAL_FRAME_EYE);
          if (this.world.tryActivateEndPortal(hit.x, hit.y, hit.z)) this.chat(this.T("endPortalLit"));
          this.audio.place();
          this.handSwing = 1;
          this.ui.renderHotbar(p);
        }
        return;
      }
      if (p.gamemode === "creative" || p.consumeId("ender_eye", 1)) {
        const origin = this.camera.position.clone();
        const sh = this.world.gen.nearestStronghold(p.pos.x, p.pos.z);
        this.entities.spawnEye(origin.x, origin.y, origin.z, sh);
        this.handSwing = 1;
        this.ui.renderHotbar(p);
      }
      return;
    }
    if (hit) {
      const id = this.world.getBlock(hit.x, hit.y, hit.z);
      const b = BLOCKS[id];
      if (id === CRAFTING) {
        this.openInv("table");
        return;
      }
      if (id === FURNACE) {
        this.openInv("furnace");
        return;
      }
      if (id === CHEST) {
        const k = `${this.world.dim}:${hit.x},${hit.y},${hit.z}`;
        const old = `${hit.x},${hit.y},${hit.z}`;
        if (!p.chests.has(k) && this.world.dim === "overworld" && p.chests.has(old)) {
          p.chests.set(k, p.chests.get(old));
        }
        if (!p.chests.has(k)) {
          const kind = this.world.chestLoot.get(k) || (this.world.dim === "overworld" ? this.world.chestLoot.get(old) : null);
          const slots = kind
            ? rollChestLoot(kind, this.world.seed, hit.x, hit.y, hit.z)
            : Array.from({ length: 27 }, () => null);
          p.chests.set(k, { slots });
        }
        p.usingChest = p.chests.get(k);
        this.openInv("chest");
        return;
      }
      if (id === TNT && p.gamemode !== "adventure") {
        this.world.setBlock(hit.x, hit.y, hit.z, AIR);
        this.world.explode(hit.x, hit.y, hit.z, 3.2);
        this.audio.explode();
        return;
      }
      if (id === NOTE_BLOCK) {
        this.audio.note((hit.x + hit.y + hit.z) & 7);
        return;
      }
      if (b?.bed) {
        if (this.world.dim === "nether" || this.world.dim === "end") {
          this.world.setBlock(hit.x, hit.y, hit.z, AIR);
          this.world.explode(hit.x, hit.y, hit.z, 4.2);
          this.audio.explode();
          if (this.player.gamemode === "survival") this.player.hurt(8);
          this.chat(this.T("bedExplodes"));
          return;
        }
        this.trySleep(hit);
        return;
      }
      if (b?.door) {
        this.toggleDoor(hit.x, hit.y, hit.z, b);
        return;
      }
      if (b?.gate) {
        this.world.setBlock(hit.x, hit.y, hit.z, b.gateOpen ? OAK_FENCE_GATE : OAK_FENCE_GATE_OPEN);
        this.audio.click();
        return;
      }
      const heldTool = p.held();
      const toolIt = heldTool ? ITEMS[heldTool.id] : null;
      if (toolIt?.tool === "hoe" && (id === GRASS || id === DIRT)) {
        this.world.setBlock(hit.x, hit.y, hit.z, FARMLAND);
        this.audio.place();
        return;
      }
      if (heldTool?.id === "flint_and_steel" && p.gamemode !== "adventure") {
        if (id === TNT) {
          this.world.setBlock(hit.x, hit.y, hit.z, AIR);
          this.world.explode(hit.x, hit.y, hit.z, 3.2);
          this.audio.explode();
          return;
        }
        const ax = hit.x + (hit.face?.[0] || 0);
        const ay = hit.y + (hit.face?.[1] || 0);
        const az = hit.z + (hit.face?.[2] || 0);
        if (this.world.tryLightPortal(ax, ay, az) || this.world.tryLightPortal(hit.x, hit.y, hit.z)) {
          this.audio.place();
          this.chat(this.T("portalLit"));
          return;
        }
      }
      if (heldTool?.id === "bucket") {
        const wx = hit.x + hit.face[0];
        const wy = hit.y + hit.face[1];
        const wz = hit.z + hit.face[2];
        const fid = this.world.getBlock(wx, wy, wz);
        if (fid === WATER || fid === LAVA) {
          this.world.setBlock(wx, wy, wz, AIR);
          if (p.gamemode !== "creative") p.hotbar[p.selected] = { id: fid === LAVA ? "lava_bucket" : "water_bucket", count: 1 };
          this.audio.splash();
          this.ui.renderHotbar(p);
          return;
        }
      }
      if (heldTool?.id === "nether_wart" && id === SOUL_SAND) {
        const ay = hit.y + 1;
        if (this.world.getBlock(hit.x, ay, hit.z) === AIR) {
          this.world.setBlock(hit.x, ay, hit.z, NETHER_WART);
          if (p.gamemode !== "creative") p.consumeId("nether_wart", 1);
          this.audio.place();
          this.ui.renderHotbar(p);
        }
        return;
      }
      if (heldTool?.id === "wheat_seeds" && id === FARMLAND) {
        const ax = hit.x;
        const ay = hit.y + 1;
        const az = hit.z;
        if (this.world.getBlock(ax, ay, az) === AIR) {
          this.world.setBlock(ax, ay, az, WHEAT_0);
          if (p.gamemode !== "creative") p.consumeId("wheat_seeds", 1);
          this.audio.place();
          this.ui.renderHotbar(p);
        }
        return;
      }
      if (heldTool?.id === "bone_meal") {
        if (this.applyBoneMeal(hit.x, hit.y, hit.z)) {
          if (p.gamemode !== "creative") p.consumeId("bone_meal", 1);
          this.audio.pop();
          this.ui.renderHotbar(p);
        }
        return;
      }
      if (heldTool?.id === "water_bucket" || heldTool?.id === "lava_bucket") {
        if (heldTool.id === "water_bucket" && this.world.dim === "nether") {
          this.chat(this.T("waterEvaporates"));
          return;
        }
        const px = hit.x + hit.face[0];
        const py = hit.y + hit.face[1];
        const pz = hit.z + hit.face[2];
        const cur = this.world.getBlock(px, py, pz);
        if (cur === AIR || BLOCKS[cur]?.plant) {
          this.world.setBlock(px, py, pz, heldTool.id === "lava_bucket" ? LAVA : WATER);
          if (p.gamemode !== "creative") p.hotbar[p.selected] = { id: "bucket", count: 1 };
          this.audio.splash();
          this.ui.renderHotbar(p);
          return;
        }
      }
    }
    if (p.eatHeld()) {
      this.audio.eat();
      this.ui.renderHotbar(p);
      return;
    }
    if (p.gamemode === "adventure") return;
    const held = p.held();
    if (!held) return;
    const it = ITEMS[held.id];
    if (!it?.isBlock || !hit) return;
    const px = hit.x + hit.face[0];
    const py = hit.y + hit.face[1];
    const pz = hit.z + hit.face[2];
    const cur = this.world.getBlock(px, py, pz);
    const curB = BLOCKS[cur];
    if (cur !== AIR && cur !== WATER && !curB?.plant) return;
    const hw = 0.3;
    const hh = p.height();
    if (
      px + 1 > p.pos.x - hw &&
      px < p.pos.x + hw &&
      py + 1 > p.pos.y &&
      py < p.pos.y + hh &&
      pz + 1 > p.pos.z - hw &&
      pz < p.pos.z + hw
    ) {
      return;
    }
    if (held.id === "oak_sapling") {
      const soil = this.world.getBlock(px, py - 1, pz);
      if (soil !== DIRT && soil !== GRASS && soil !== FARMLAND) return;
    }
    if (held.id === "nether_wart") {
      const soil = this.world.getBlock(px, py - 1, pz);
      if (soil !== SOUL_SAND) return;
    }
    if (it.blockId === OAK_DOOR) {
      if (py + 1 >= HEIGHT) return;
      const above = this.world.getBlock(px, py + 1, pz);
      const ab = BLOCKS[above];
      if (above !== AIR && above !== WATER && !ab?.plant) return;
    }
    this.world.setBlock(px, py, pz, it.blockId);
    if (it.blockId === OAK_DOOR) this.world.setBlock(px, py + 1, pz, OAK_DOOR_TOP);
    this.world.applyGravityBlocks(px, py, pz);
    if (it.blockId === SPONGE) this.absorbWater(px, py, pz);
    if (it.blockId === PUMPKIN || it.blockId === JACK_LANTERN || it.blockId === IRON_BLOCK) {
      this.tryBuildGolem(px, py, pz);
    }
    this.audio.place();
    if (p.gamemode !== "creative") {
      held.count--;
      if (held.count <= 0) p.hotbar[p.selected] = null;
      this.ui.renderHotbar(p);
    }
  }

  toggleDoor(x, y, z, b) {
    const y0 = b.door === "upper" ? y - 1 : y;
    const open = !!b.doorOpen;
    this.world.setBlock(x, y0, z, open ? OAK_DOOR : OAK_DOOR_OPEN);
    this.world.setBlock(x, y0 + 1, z, open ? OAK_DOOR_TOP : OAK_DOOR_OPEN_TOP);
    this.audio.click();
  }

  tryBuildGolem(px, py, pz) {
    const iron = IRON_BLOCK;
    const heads = new Set([PUMPKIN, JACK_LANTERN]);
    for (let y = py - 2; y <= py + 2; y++) {
      for (let x = px - 2; x <= px + 2; x++) {
        for (let z = pz - 2; z <= pz + 2; z++) {
          if (!heads.has(this.world.getBlock(x, y, z))) continue;
          if (this.world.getBlock(x, y - 1, z) !== iron) continue;
          if (this.world.getBlock(x, y - 2, z) !== iron) continue;
          const xArms = this.world.getBlock(x - 1, y - 1, z) === iron && this.world.getBlock(x + 1, y - 1, z) === iron;
          const zArms = this.world.getBlock(x, y - 1, z - 1) === iron && this.world.getBlock(x, y - 1, z + 1) === iron;
          if (!xArms && !zArms) continue;
          this.world.setBlock(x, y, z, AIR);
          this.world.setBlock(x, y - 1, z, AIR);
          this.world.setBlock(x, y - 2, z, AIR);
          if (xArms) {
            this.world.setBlock(x - 1, y - 1, z, AIR);
            this.world.setBlock(x + 1, y - 1, z, AIR);
          } else {
            this.world.setBlock(x, y - 1, z - 1, AIR);
            this.world.setBlock(x, y - 1, z + 1, AIR);
          }
          this.entities.spawnMob("iron_golem", x + 0.5, y - 2, z + 0.5);
          this.audio.pop();
          return true;
        }
      }
    }
    return false;
  }

  tryFish(dir) {
    const bob = this.entities.getFirst("bobber");
    if (bob) {
      if (bob.bite) {
        const roll = Math.random();
        const loot = roll > 0.88 ? "salmon" : roll > 0.22 ? "cod" : roll > 0.12 ? "stick" : "bone";
        this.entities.spawnItem(bob.mesh.position.x, bob.mesh.position.y + 0.2, bob.mesh.position.z, loot, 1);
        this.player.xp += 0.15;
        while (this.player.xp >= 1) {
          this.player.xp -= 1;
          this.player.xpLevel++;
        }
        this.chat(`${this.T("caught")} ${itemName(loot, this.ui.lang)}`);
      }
      this.entities.clearType("bobber");
      this.handSwing = 1;
      this.audio.pop();
      return;
    }
    const origin = this.camera.position.clone();
    this.entities.spawnBobber(origin.x, origin.y, origin.z, dir);
    this.handSwing = 1;
    this.audio.place();
  }

  trySleep(hit) {
    const t = ((this.world.time % 24000) + 24000) % 24000;
    const night = t >= 12542 && t < 23460;
    if (!night && this.world.weather !== "rain") {
      this.chat(this.T("cannotSleep"));
      return;
    }
    if (this.entities.nearbyHostile(this.player, 8)) {
      this.chat(this.T("monstersNearby"));
      return;
    }
    this.player.spawn.set(hit.x + 0.5, hit.y + 1, hit.z + 0.5);
    this.world.time = 1000;
    this.world.weather = "clear";
    if (this.player.gamemode === "survival") {
      this.player.health = Math.min(20, this.player.health + 2);
      this.player.hunger = Math.min(20, this.player.hunger + 1);
    }
    this.chat(this.T("slept"));
  }

  async travelDimension(forceDim = null) {
    if (this._traveling || !this.world || !this.player) return;
    const from = this.world.dim;
    const to = forceDim || (from === "nether" ? "overworld" : "nether");
    if (to === from) return;
    this._traveling = true;
    this._portalCool = 5;
    this.state = "loading";
    this.ui.show("loading");
    const label = to === "end"
      ? this.T("enteringEnd")
      : from === "end"
        ? this.T("leavingEnd")
        : to === "nether"
          ? this.T("enteringNether")
          : this.T("leavingNether");
    this.ui.setLoading(0.08, label);
    this.save();
    this.entities.clearAll();
    this.player.vehicleId = 0;
    const x = this.player.pos.x;
    const z = this.player.pos.z;
    this.world.switchDim(to);
    let dest;
    if (to === "end") dest = this.world.placeEndSpawn();
    else if (from === "end") dest = { x: this.player.spawn.x, y: this.player.spawn.y, z: this.player.spawn.z };
    else dest = this.world.placeExitPortal(x, z);
    this.player.pos.set(dest.x, dest.y, dest.z);
    this.player.prevPos.copy(this.player.pos);
    this.player.renderPos.copy(this.player.pos);
    this.player.vel.set(0, 0, 0);
    this.resetPlayerCamera();
    this.player.applyCamera(this.settings);
    await this.world.preload(
      this.player.pos.x,
      this.player.pos.z,
      Math.min(4, this.settings.renderDistance),
      (p) => this.ui.setLoading(0.1 + p * 0.85, label),
    );
    this._traveling = false;
    this._portalCool = 5;
    this._portalTime = 0;
    this.state = "play";
    this.paused = false;
    this.ui.show("hud");
    this.ui.renderHotbar(this.player);
    this.chat(to === "end" ? this.T("enteredEnd") : to === "nether" ? this.T("enteredNether") : this.T("enteredOverworld"));
    this.input.requestLock();
    this.save();
  }

  applyBoneMeal(x, y, z) {
    const id = this.world.getBlock(x, y, z);
    if (id === WHEAT_0 || id === WHEAT_1 || id === WHEAT_2) {
      this.world.setBlock(x, y, z, id === WHEAT_0 ? WHEAT_2 : WHEAT_3);
      this.fx.burst(x, y, z, 0x7cfc00, 10);
      return true;
    }
    if (id === OAK_SAPLING) {
      if (this.world.growOakTree(x, y, z)) {
        this.fx.burst(x, y, z, 0x3cb043, 14);
        return true;
      }
      return false;
    }
    if (id === GRASS) {
      let n = 0;
      for (let i = 0; i < 12; i++) {
        const dx = ((Math.random() * 7) | 0) - 3;
        const dz = ((Math.random() * 7) | 0) - 3;
        const gx = x + dx;
        const gz = z + dz;
        if (this.world.getBlock(gx, y, gz) !== GRASS) continue;
        if (this.world.getBlock(gx, y + 1, gz) !== AIR) continue;
        const plant = Math.random() > 0.7 ? (Math.random() > 0.5 ? DANDELION : POPPY) : TALL_GRASS;
        this.world.setBlock(gx, y + 1, gz, plant);
        n++;
      }
      if (n) this.fx.burst(x, y + 1, z, 0x66cc44, 12);
      return n > 0;
    }
    return false;
  }

  isSnowyWeather() {
    if (this.world?.dim === "nether" || this.world?.dim === "end") return false;
    const p = this.player.renderPos || this.player.pos;
    const bx = Math.floor(p.x);
    const bz = Math.floor(p.z);
    const biome = this.world.gen.biome(bx, bz);
    if (biome === BIOME.TAIGA || biome === BIOME.SNOW_MOUNTAIN || biome === BIOME.SNOWY_PLAINS || biome === BIOME.FROZEN_OCEAN) return true;
    return biome === BIOME.MOUNTAIN && this.world.gen.height(bx, bz) > SEA + 16;
  }

  absorbWater(x, y, z) {
    let n = 0;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        for (let dz = -4; dz <= 4; dz++) {
          if (dx * dx + dy * dy + dz * dz > 20) continue;
          if (this.world.getBlock(x + dx, y + dy, z + dz) === WATER) {
            this.world.setBlock(x + dx, y + dy, z + dz, AIR);
            n++;
            if (n > 64) return;
          }
        }
      }
    }
  }

  fuelValue(id) {
    if (id === "coal" || id === "charcoal") return 8;
    if (id === "stick") return 0.5;
    if (id === "coal_block") return 80;
    if (id?.endsWith("_log") || id?.endsWith("_planks") || id === "note_block") return 1.5;
    return 0;
  }

  updateFurnace(dt) {
    const f = this.player.furnace;
    if (!f) return;
    if (f.burn <= 0 && f.fuel && this.fuelValue(f.fuel.id) && f.in && canSmelt(f.in.id)) {
      f.burn = this.fuelValue(f.fuel.id);
      f.fuel.count--;
      if (f.fuel.count <= 0) f.fuel = null;
    }
    if (f.burn > 0 && f.in && canSmelt(f.in.id)) {
      f.burn -= dt;
      f.prog += dt;
      if (f.prog >= 1) {
        const out = SMELT[f.in.id];
        f.prog = 0;
        f.in.count--;
        if (f.in.count <= 0) f.in = null;
        if (!f.out) f.out = { id: out.id, count: 1 };
        else if (f.out.id === out.id) f.out.count++;
        this.player.xp += out.xp;
        while (this.player.xp >= 1) {
          this.player.xp -= 1;
          this.player.xpLevel++;
        }
      }
    } else f.prog = 0;
  }

  loop = () => {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.frames++;
    this.fpsT += dt;
    if (this.fpsT >= 0.5) {
      this.fps = this.frames / this.fpsT;
      this.frames = 0;
      this.fpsT = 0;
    }

    if (this.state === "title" && this.world && this.scene) {
      this.titleCam += dt * 0.08;
      const x = Math.cos(this.titleCam) * 32;
      const y = 72;
      const z = Math.sin(this.titleCam) * 32;
      this.titleCamera.position.set(x, y, z);
      this.titleCamera.up.set(0, 1, 0);
      this.titleCamera.rotation.order = "YXZ";
      this.titleCamera.rotation.set(
        Math.atan2(-(58 - y), Math.hypot(8 - x, 8 - z)),
        Math.atan2(-(8 - x), -(8 - z)),
        0,
      );
      this.sky.update(4500, this.titleCamera.position, true, false, false, false, dt);
      this.world.processMeshQueue(1);
      this.renderer.render(this.scene, this.titleCamera);
      return;
    }

    if (this.state === "loading" && this.scene) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    if (this.state !== "play" || !this.player || !this.world || !this.scene) return;

    const playing = !this.paused && !this.invOpen && !this.player.dead && !this.ui.chatOpen();

    if (playing) {
      this.input.sensitivity = this.settings.sensitivity / 50;
      const { stepped } = this.player.applyInput(dt, this.input, this.settings);
      if (stepped) this.audio.step();
      this.player.hungerTick(dt, this.meta.difficulty);
      this.world.time += dt * 20;
      if (this.world.dim === "nether" || this.world.dim === "end") {
        this.world.weather = "clear";
      } else {
        this.world.weatherTimer = (this.world.weatherTimer || 0) + dt;
        if (this.world.weatherTimer > 90) {
          this.world.weatherTimer = 0;
          if (Math.random() < 0.22) {
            this.world.weather = this.world.weather === "rain" ? "clear" : "rain";
          }
        }
      }
      this._rainAcc = (this._rainAcc || 0) + dt;
      if (this.world.weather === "rain") {
        if (this._rainAcc > 0.55) {
          this._rainAcc = 0;
          this.audio.splash();
        }
      } else this._rainAcc = 0;
      this.world.updateChunks(this.player.pos.x, this.player.pos.z, this.settings.renderDistance);
      this.world.processMeshQueue(this.settings.graphics === "fast" ? 1 : 2);
      if (this.world.pendingMobs?.length) {
        const keep = [];
        const seen = new Set(this.entities.list.map((e) => e.spawnKey).filter(Boolean));
        for (const m of this.world.pendingMobs.splice(0)) {
          const dx = m.x - this.player.pos.x;
          const dz = m.z - this.player.pos.z;
          if (m.type === "end_crystal" && this.world.dragonDead) continue;
          if (dx * dx + dz * dz > 70 * 70) {
            keep.push(m);
            continue;
          }
          if (m.spawnKey && seen.has(m.spawnKey)) continue;
          this.entities.spawnMob(m.type, m.x, m.y, m.z, {
            job: m.job,
            spawnKey: m.spawnKey,
            tamed: m.tamed,
            sitting: m.sitting,
            baby: m.baby,
            grow: m.grow,
            wool: m.wool,
            sheared: m.sheared,
            owner: m.owner,
          });
          if (m.spawnKey) seen.add(m.spawnKey);
        }
        this.world.pendingMobs.push(...keep);
      }
      this.player.tickLook(dt, this.input, false, (h) => this.tryBreak(h));

      const left = this.input.mouse.left;
      const right = this.input.mouse.right;
      if (left && !this.wasLeft) {
        const dir = new THREE.Vector3();
        this.camera.getWorldDirection(dir);
        const dmg = ITEMS[this.player.held()?.id]?.damage || 1;
        if (this.entities.hitMobs(this.camera.position, dir, 4, dmg)) this.audio.hit();
        this.handSwing = 1;
      }
      if (right && !this.wasRight) this.tryUse();
      this.wasLeft = left;
      this.wasRight = right;

      const w = this.input.consumeWheel();
      if (w) {
        this.player.selected = (this.player.selected + w + 9) % 9;
        this.ui.renderHotbar(this.player);
      }

      this.entities.update(dt, this.player, this.meta.difficulty, this.audio);
      if (this.world.dim === "end" && !this.world.dragonDead
        && !this.entities.list.some((e) => e.type === "ender_dragon")) {
        this.entities.spawnMob("ender_dragon", 0, 62, 0);
      }
      if (this.world.dragonDead && this.meta && !this.meta.endDragonDead) {
        this.meta.endDragonDead = true;
        this.chat(this.T("dragonDefeated"));
      }
      const dragon = this.entities.list.find((e) => e.type === "ender_dragon");
      this.ui.setBossBar(dragon ? dragon.hp / 200 : 0, this.T("enderDragon"));
      if (this._portalCool > 0) this._portalCool -= dt;
      const feet = BLOCKS[this.world.getBlock(this.player.pos.x, this.player.pos.y + 0.2, this.player.pos.z)];
      const body = BLOCKS[this.world.getBlock(this.player.pos.x, this.player.pos.y + 1.0, this.player.pos.z)];
      const inEndPortal = !!(feet?.endPortal || body?.endPortal);
      const inNetherPortal = !!(feet?.portal || body?.portal) && !inEndPortal;
      if ((inEndPortal || inNetherPortal) && this._portalCool <= 0 && !this._traveling) {
        this._portalTime = (this._portalTime || 0) + dt;
        if (this._portalTime > 3) {
          this._portalTime = 0;
          if (inEndPortal) void this.travelDimension(this.world.dim === "end" ? "overworld" : "end");
          else void this.travelDimension();
        }
      } else if (!feet?.portal && !body?.portal) this._portalTime = 0;
      if (this.player.vehicleId) {
        if (!this.entities.getById(this.player.vehicleId)) this.player.vehicleId = 0;
        else {
          this.player.prevPos.copy(this.player.pos);
          this.player.applyCamera(this.settings);
        }
      }
      this.fx.update(dt);
      this.updateFurnace(dt);
      this._growAcc = (this._growAcc || 0) + dt;
      if (this._growAcc > 2.4) {
        this._growAcc = 0;
        this.world.tickGrowth(this.player.pos);
      }
      if (this.player.look) this.hl.show(this.player.look.x, this.player.look.y, this.player.look.z);
      else this.hl.hide();
      if (this.player.breakTarget) {
        this.breakFx.show(
          this.player.breakTarget.x,
          this.player.breakTarget.y,
          this.player.breakTarget.z,
          this.player.breakTarget.progress,
        );
      } else this.breakFx.hide();

      if (this.player.dead) {
        this.input.exitLock();
        if (this.player.gamemode === "survival") {
          [...this.player.hotbar, ...this.player.inv].forEach((s) => {
            if (s) this.entities.spawnItem(this.player.pos.x, this.player.pos.y + 1, this.player.pos.z, s.id, s.count);
          });
          this.player.hotbar = this.player.hotbar.map(() => null);
          this.player.inv = this.player.inv.map(() => null);
        }
        this.ui.refreshDeath(this.player.score);
        this.ui.show("death");
      }
    } else {
      this.input.mouse.dx = 0;
      this.input.mouse.dy = 0;
      this.ui.setBossBar?.(0);
    }

    this.sky.update(
      this.world.time,
      this.player.renderPos || this.player.pos,
      this.settings.clouds && this.settings.graphics === "fancy",
      this.world.weather === "rain" && this.world.dim !== "nether" && this.world.dim !== "end",
      this.isSnowyWeather(),
      this.world.dim === "nether",
      dt,
      this.world.dim === "end",
    );
    const fogNear = this.settings.renderDistance * 16;
    if (this.scene.fog) {
      const dim = this.world.dim;
      this.scene.fog.density = (dim === "nether" ? 2.6 : dim === "end" ? 2.2 : 1.6)
        / Math.max(dim === "nether" || dim === "end" ? 16 : 24, fogNear);
    }

    if (this.handSwing > 0) this.handSwing = Math.max(0, this.handSwing - dt * 5);
    if (this.hand) {
      this.hand.visible = this.player.perspective === 0 && !this.hideHud;
      if (this.hand.visible) updateHand(this.hand, this.player, this.handSwing, dt);
    }

    this.ui.tickHud(dt, this.player);
    this.ui.renderHotbar(this.player);
    if (this.debug) {
      const p = this.player.renderPos || this.player.pos;
      const look = this.player.look;
      const biomeId = this.world.dim === "nether"
        ? this.world.gen.netherBiome(Math.floor(p.x), Math.floor(p.z))
        : this.world.dim === "end"
          ? 0
          : this.world.gen.biome(Math.floor(p.x), Math.floor(p.z));
      const biome = this.world.dim === "nether"
        ? (NETHER_BIOME_NAMES[biomeId] || biomeId)
        : this.world.dim === "end"
          ? "the_end"
          : (BIOME_NAMES[biomeId] || biomeId);
      this.ui.setDebug(
        `Minecrafts 1.21.8 (web)\n${this.fps | 0} fps  (60hz interp)\n` +
          `XYZ: ${p.x.toFixed(3)} / ${p.y.toFixed(5)} / ${p.z.toFixed(3)}\n` +
          `Block: ${p.x | 0} ${p.y | 0} ${p.z | 0}\n` +
          `Chunk: ${Math.floor(p.x / 16)} ${Math.floor(p.z / 16)}\n` +
          `Facing: ${((this.player.yaw * 180) / Math.PI).toFixed(1)} / ${((this.player.pitch * 180) / Math.PI).toFixed(1)}\n` +
          `Target: ${look ? `${look.x} ${look.y} ${look.z} ${BLOCKS[look.id]?.key}` : "none"}`,
        `${this.T("seedIs")} ${this.meta.seed}\n${timeOfDayLabel(this.world.time)}\n` +
          `Game: ${this.player.gamemode} ${this.meta.difficulty}\n` +
          `Dim: ${this.world.dim}\n` +
          `Rendered: ${this.world.chunks.size} chunks\nBiome: ${biome}\n` +
          `Weather: ${this.world.weather}\n` +
          `Flying: ${this.player.flying}  OnGround: ${this.player.onGround}`,
        true,
      );
    } else this.ui.setDebug("", "", false);

    const sprintFov = this.player.sprinting && playing ? 6 : 0;
    this.camera.fov = this.settings.fov + sprintFov;
    this.camera.updateProjectionMatrix();
    this.renderer.render(this.scene, this.camera);
  };
}
