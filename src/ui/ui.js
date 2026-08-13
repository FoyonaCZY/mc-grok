import { t, LANGS } from "./i18n.js";
import { itemIcon, pixelIcon, drawCrosshair, drawHotbarSel, drawLogo, randomSplash } from "./icons.js";
import { ITEMS, itemsInTab, CREATIVE_TABS, itemName, BLOCKS } from "../world/blocks.js";
import { craftResult, consumeCraft, canSmelt } from "../inventory/recipes.js";
import { listWorlds } from "../core/storage.js";

const TRADES = {
  farmer: [
    { buy: "wheat", buyN: 8, sell: "emerald", sellN: 1 },
    { buy: "emerald", buyN: 1, sell: "bread", sellN: 4 },
    { buy: "carrot", buyN: 12, sell: "emerald", sellN: 1 },
    { buy: "emerald", buyN: 2, sell: "pumpkin_pie", sellN: 1 },
  ],
  smith: [
    { buy: "coal", buyN: 12, sell: "emerald", sellN: 1 },
    { buy: "iron_ingot", buyN: 5, sell: "emerald", sellN: 1 },
    { buy: "emerald", buyN: 3, sell: "iron_pickaxe", sellN: 1 },
    { buy: "emerald", buyN: 4, sell: "iron_sword", sellN: 1 },
  ],
  cleric: [
    { buy: "redstone", buyN: 8, sell: "emerald", sellN: 1 },
    { buy: "book", buyN: 1, sell: "emerald", sellN: 1 },
    { buy: "emerald", buyN: 1, sell: "glowstone", sellN: 2 },
    { buy: "emerald", buyN: 8, sell: "golden_apple", sellN: 1 },
  ],
};

export class UI {
  constructor(root, audio) {
    this.root = root;
    this.audio = audio;
    this.lang = "zh_cn";
    this.screen = "boot";
    this.handlers = {};
    this.selectedWorld = null;
    this.creativeTab = "building";
    this.hearts = {
      full: pixelIcon("heart"),
      half: pixelIcon("heart_half"),
      empty: pixelIcon("heart_empty"),
    };
    this.food = {
      full: pixelIcon("food"),
      half: pixelIcon("food_half"),
      empty: pixelIcon("food_empty"),
    };
    this.armorIco = pixelIcon("armor");
    this.cross = drawCrosshair();
    this.sel = drawHotbarSel();
    this.logo = drawLogo();
    this.splash = randomSplash();
    this.itemNameTimer = 0;
    this.lastHeld = null;
    this.build();
  }

  on(name, fn) {
    this.handlers[name] = fn;
  }

  emit(name, ...a) {
    this.handlers[name]?.(...a);
  }

  tr(key) {
    return t(this.lang, key);
  }

  build() {
    this.root.innerHTML = `
      <div class="screen boot active" id="sc-boot"><div class="boot-logo">Minecrafts</div></div>
      <div class="screen" id="sc-title">
        <div class="panorama-dim" style="position:absolute;inset:0"></div>
        <div class="logo-wrap">
          <img class="mc-logo" alt="Minecrafts" />
          <div class="splash"></div>
        </div>
        <div class="menu-stack" id="title-btns"></div>
        <div class="footer-bar"><span class="ver"></span><span class="copy"></span></div>
      </div>
      <div class="screen dirt-bg" id="sc-worlds">
        <div class="screen-title" data-i18n="selectWorld"></div>
        <div class="world-list" id="world-list"></div>
        <div class="panel" id="world-btns"></div>
      </div>
      <div class="screen dirt-bg" id="sc-create">
        <div class="screen-title" data-i18n="createWorld"></div>
        <div class="panel" id="create-form"></div>
      </div>
      <div class="screen dirt-bg" id="sc-loading">
        <div class="loading-center">
          <div class="mc-text" id="load-text"></div>
          <div class="progress"><div id="load-bar"></div></div>
          <div class="hint" id="load-hint"></div>
        </div>
      </div>
      <div class="screen passthrough" id="sc-hud">
        <div class="boss-bar hidden" id="boss-bar">
          <div class="boss-name" id="boss-name"></div>
          <div class="boss-track"><div class="boss-fill" id="boss-fill"></div></div>
        </div>
        <img class="crosshair" />
        <div class="compass-hud hidden" id="compass-hud">
          <div class="compass-disk"></div>
          <div class="compass-needle" id="compass-needle"></div>
        </div>
        <div class="debug hidden" id="debug-l"></div>
        <div class="debug right hidden" id="debug-r"></div>
        <div class="chat-log" id="chat-log"></div>
        <div class="hotbar-wrap">
          <div class="item-name" id="item-name"></div>
          <div class="bars-row" id="status-bars">
            <div>
              <div class="icon-bar" id="armor-bar"></div>
              <div class="icon-bar" id="heart-bar"></div>
            </div>
            <div>
              <div class="icon-bar" id="food-bar" style="flex-direction:row-reverse"></div>
            </div>
          </div>
          <div class="xp-row" id="xp-row">
            <div class="xp-level" id="xp-level">0</div>
            <div class="xp-bar"><div class="xp-fill" id="xp-fill"></div></div>
          </div>
          <div class="hotbar" id="hotbar"></div>
        </div>
        <div class="chat-input-wrap" id="chat-wrap"><input id="chat-input" maxlength="256" /></div>
      </div>
      <div class="screen pause-overlay" id="sc-pause">
        <div class="screen-title" data-i18n="gameMenu"></div>
        <div class="menu-stack" id="pause-btns"></div>
      </div>
      <div class="screen" id="sc-inv">
        <div class="inv-dim"></div>
        <div class="inv-window" id="inv-window"></div>
      </div>
      <div class="screen dirt-bg" id="sc-options">
        <div class="screen-title" id="opt-title"></div>
        <div class="panel" id="opt-body"></div>
      </div>
      <div class="screen dirt-bg" id="sc-lang">
        <div class="screen-title" data-i18n="languageTitle"></div>
        <div class="lang-list" id="lang-list"></div>
        <div class="menu-row" style="margin-top:16px;z-index:1" id="lang-btns"></div>
      </div>
      <div class="screen dirt-bg" id="sc-mp">
        <div class="screen-title" data-i18n="multiplayerTitle"></div>
        <div class="server-list" id="server-list"></div>
        <div class="panel" id="mp-btns"></div>
      </div>
      <div class="screen dirt-bg" id="sc-death">
        <div class="death-title" data-i18n="youDied"></div>
        <div class="hint" id="death-score"></div>
        <div class="menu-stack" id="death-btns"></div>
      </div>
      <div class="screen dirt-bg" id="sc-alert">
        <div class="screen-title" id="alert-title"></div>
        <div class="hint" id="alert-body"></div>
        <div class="menu-stack" id="alert-btns"></div>
      </div>
      <img class="cursor-item" id="cursor-item" />
      <div class="tooltip" id="tooltip"></div>
    `;

    this.els = {};
    this.root.querySelectorAll("[id]").forEach((el) => { this.els[el.id] = el; });
    this.root.querySelector(".mc-logo").src = this.logo;
    this.root.querySelector(".crosshair").src = this.cross.toDataURL();
    this.buildHotbarSlots();
    this.bindStatic();
  }

  setTextures(textures) {
    this.textures = textures;
    document.documentElement.style.setProperty("--dirt-bg", `url(${textures.dirtBg})`);
    document.documentElement.style.setProperty("--btn-bg", `url(${textures.btnBg})`);
  }

  setScale(px) {
    document.documentElement.style.setProperty("--s", `${px}px`);
  }

  btn(labelKey, cls, fn, disabled = false) {
    const b = document.createElement("button");
    b.className = "mc-btn " + (cls || "wide");
    b.dataset.i18n = labelKey;
    b.textContent = typeof labelKey === "string" && !labelKey.includes(" ") ? this.tr(labelKey) : labelKey;
    if (typeof labelKey === "string" && this.tr(labelKey) === labelKey && labelKey.length > 24) {
      b.textContent = labelKey;
      delete b.dataset.i18n;
    }
    b.disabled = disabled;
    b.addEventListener("click", () => {
      if (b.disabled) return;
      this.audio.click();
      fn?.();
    });
    b.addEventListener("mouseenter", () => { if (!b.disabled) this.audio.hover(); });
    return b;
  }

  btnText(text, cls, fn, disabled = false) {
    const b = document.createElement("button");
    b.className = "mc-btn " + (cls || "wide");
    b.textContent = text;
    b.disabled = disabled;
    b.addEventListener("click", () => { if (!b.disabled) { this.audio.click(); fn?.(); } });
    b.addEventListener("mouseenter", () => { if (!b.disabled) this.audio.hover(); });
    return b;
  }

  applyLang() {
    this.root.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = this.tr(el.dataset.i18n);
    });
    this.root.querySelector(".ver").textContent = this.tr("version");
    this.root.querySelector(".copy").textContent = this.tr("copyright");
    this.root.querySelector(".splash").textContent = this.splash;
  }

  show(name) {
    this.screen = name;
    this.root.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = this.root.querySelector("#sc-" + name);
    if (el) el.classList.add("active");
    this.els["cursor-item"].style.display = name === "inv" ? "block" : "none";
    if (name !== "inv") this.els.tooltip.style.display = "none";
  }

  refreshTitle() {
    const wrap = this.els["title-btns"] || this.root.querySelector("#title-btns");
    wrap.innerHTML = "";
    wrap.append(this.btn("singleplayer", "wide", () => this.emit("singleplayer")));
    wrap.append(this.btn("multiplayer", "wide", () => this.emit("multiplayer")));
    wrap.append(this.btn("realms", "wide", () => this.alert(this.tr("realms"), this.tr("realmsUnavailable"), () => this.show("title"))));
    const row = document.createElement("div");
    row.className = "menu-row";
    row.append(this.btn("options", "half", () => this.emit("options", "title")));
    row.append(this.btn("quit", "half", () => this.alert(this.tr("quit"), this.tr("cannotQuit"), () => this.show("title"))));
    wrap.append(row);
    const row2 = document.createElement("div");
    row2.className = "menu-row";
    row2.append(this.btnText("A", "tiny", () => this.emit("accessibility")));
    row2.append(this.btnText("L", "tiny", () => this.emit("language")));
    wrap.append(row2);
    this.applyLang();
    this.splash = randomSplash();
    this.root.querySelector(".splash").textContent = this.splash;
  }

  refreshWorlds() {
    const worlds = listWorlds();
    const list = this.els["world-list"];
    list.innerHTML = "";
    worlds.forEach((w) => {
      const row = document.createElement("div");
      row.className = "world-item" + (this.selectedWorld === w.id ? " selected" : "");
      const icon = document.createElement("canvas");
      icon.className = "world-icon";
      icon.width = 64;
      icon.height = 64;
      const g = icon.getContext("2d");
      g.imageSmoothingEnabled = false;
      if (this.textures) {
        g.drawImage(this.textures.tiles[this.textures.tileIndex.grass_top], 0, 0, 64, 40);
        g.drawImage(this.textures.tiles[this.textures.tileIndex.dirt], 0, 40, 64, 24);
      }
      const meta = document.createElement("div");
      meta.className = "world-meta";
      const mode = w.gamemode === "creative" ? this.tr("creative") : w.gamemode === "adventure" ? this.tr("adventure") : this.tr("survival");
      meta.innerHTML = `<div class="name">${esc(w.name)}</div><div class="sub">${new Date(w.playedAt).toLocaleString()} ${this.lang === "zh_cn" ? "生存模式, " : ""}${mode}<br>${this.lang === "zh_cn" ? "版本：Minecrafts 1.21.8" : "Version: Minecrafts 1.21.8"}</div>`;
      row.append(icon, meta);
      row.addEventListener("click", () => {
        this.selectedWorld = w.id;
        this.refreshWorlds();
      });
      row.addEventListener("dblclick", () => this.emit("playWorld", w.id));
      list.append(row);
    });
    const btns = this.els["world-btns"];
    btns.innerHTML = "";
    const r1 = document.createElement("div");
    r1.className = "menu-row";
    r1.append(this.btn("playSelected", "half", () => this.selectedWorld && this.emit("playWorld", this.selectedWorld), !this.selectedWorld));
    r1.append(this.btn("createNew", "half", () => this.emit("createWorld")));
    const r2 = document.createElement("div");
    r2.className = "menu-row";
    r2.append(this.btn("edit", "half", () => this.selectedWorld && this.emit("editWorld", this.selectedWorld), !this.selectedWorld));
    r2.append(this.btn("delete", "half", () => this.selectedWorld && this.emit("deleteWorld", this.selectedWorld), !this.selectedWorld));
    r2.append(this.btn("reCreate", "half", () => this.selectedWorld && this.emit("recreateWorld", this.selectedWorld), !this.selectedWorld));
    const r3 = document.createElement("div");
    r3.className = "menu-row";
    r3.append(this.btn("cancel", "wide", () => this.emit("title")));
    btns.append(r1, r2, r3);
    this.applyLang();
  }

  refreshCreate(state) {
    const f = this.els["create-form"];
    f.innerHTML = "";
    const name = field(this.tr("worldName"), "text", state.name);
    name.input.id = "world-name";
    const seed = field(this.tr("seed"), "text", state.seed);
    seed.input.id = "world-seed";
    f.append(name.wrap, seed.wrap);
    const modeBtn = this.btnText(`${this.tr("gameMode")}: ${this.tr(state.gamemode)}`, "wide", () => {
      const order = ["survival", "creative", "adventure"];
      state.gamemode = order[(order.indexOf(state.gamemode) + 1) % 3];
      this.refreshCreate(state);
    });
    const diffBtn = this.btnText(`${this.tr("difficulty")}: ${this.tr(state.difficulty)}`, "wide", () => {
      const order = ["peaceful", "easy", "normal", "hard"];
      state.difficulty = order[(order.indexOf(state.difficulty) + 1) % 4];
      this.refreshCreate(state);
    });
    const cheatBtn = this.btnText(state.cheats ? this.tr("cheatsOn") : this.tr("cheatsOff"), "wide", () => {
      state.cheats = !state.cheats;
      this.refreshCreate(state);
    });
    const typeBtn = this.btnText(`${this.tr("worldType")}: ${this.tr(state.worldType === "superflat" ? "superflat" : state.worldType === "largeBiomes" ? "largeBiomes" : "defaultType")}`, "wide", () => {
      const order = ["default", "superflat", "largeBiomes"];
      state.worldType = order[(order.indexOf(state.worldType) + 1) % 3];
      this.refreshCreate(state);
    });
    const bonusBtn = this.btnText(`${this.tr("bonusChest")}: ${state.bonusChest ? this.tr("on") : this.tr("off")}`, "wide", () => {
      state.bonusChest = !state.bonusChest;
      this.refreshCreate(state);
    });
    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent = state.gamemode === "creative" ? this.tr("creativeHint") : state.gamemode === "adventure" ? this.tr("adventureHint") : this.tr("survivalHint");
    const row = document.createElement("div");
    row.className = "menu-row";
    row.append(this.btn("create", "half", () => {
      state.name = name.input.value || this.tr("defaultWorld");
      state.seed = seed.input.value;
      this.emit("confirmCreate", state);
    }));
    row.append(this.btn("cancel", "half", () => this.emit("singleplayer")));
    f.append(modeBtn, diffBtn, cheatBtn, typeBtn, bonusBtn, hint, row);
  }

  refreshPause() {
    const w = this.els["pause-btns"];
    w.innerHTML = "";
    w.append(this.btn("backToGame", "wide", () => this.emit("resume")));
    w.append(this.btn("advancements", "wide", () => {}, true));
    w.append(this.btn("giveFeedback", "half", () => window.open("https://www.minecraft.net", "_blank")));
    const r = document.createElement("div");
    r.className = "menu-row";
    r.append(this.btn("options", "half", () => this.emit("options", "pause")));
    r.append(this.btn("openToLan", "half", () => this.alert(this.tr("lanTitle"), this.tr("lanFail"), () => this.show("pause"))));
    w.append(r);
    w.append(this.btn("saveAndQuit", "wide", () => this.emit("quitTitle")));
    this.applyLang();
  }

  refreshDeath(score) {
    this.els["death-score"].textContent = `${this.tr("score")}: ${score | 0}`;
    const w = this.els["death-btns"];
    w.innerHTML = "";
    w.append(this.btn("respawn", "wide", () => this.emit("respawn")));
    w.append(this.btn("titleScreen", "wide", () => this.emit("quitTitle")));
    this.applyLang();
  }

  refreshOptions(settings, back) {
    this.els["opt-title"].textContent = this.tr("optionsTitle");
    const b = this.els["opt-body"];
    b.innerHTML = "";
    b.append(slider(this, `${this.tr("fov")}: ${fovLabel(this, settings.fov)}`, 30, 110, settings.fov, (v) => {
      settings.fov = v;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(slider(this, `${this.tr("mouseSens")}: ${settings.sensitivity}%`, 1, 200, settings.sensitivity, (v) => {
      settings.sensitivity = v;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(slider(this, `${this.tr("renderDistance")}: ${settings.renderDistance} ${this.tr("chunks")}`, 2, 12, settings.renderDistance, (v) => {
      settings.renderDistance = v;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(slider(this, `${this.tr("music")}: ${settings.music}%`, 0, 100, settings.music, (v) => {
      settings.music = v;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(slider(this, `${this.tr("sound")}: ${settings.sound}%`, 0, 100, settings.sound, (v) => {
      settings.sound = v;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btnText(`${this.tr("invertMouse")}: ${settings.invertMouse ? this.tr("on") : this.tr("off")}`, "wide", () => {
      settings.invertMouse = !settings.invertMouse;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btnText(`${this.tr("viewBobbing")}: ${settings.viewBobbing ? this.tr("on") : this.tr("off")}`, "wide", () => {
      settings.viewBobbing = !settings.viewBobbing;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btnText(`${this.tr("graphics")}: ${settings.graphics === "fancy" ? this.tr("fancy") : this.tr("fast")}`, "wide", () => {
      settings.graphics = settings.graphics === "fancy" ? "fast" : "fancy";
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btnText(`${this.tr("clouds")}: ${settings.clouds ? this.tr("on") : this.tr("off")}`, "wide", () => {
      settings.clouds = !settings.clouds;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btnText(`${this.tr("autoJump")}: ${settings.autoJump ? this.tr("on") : this.tr("off")}`, "wide", () => {
      settings.autoJump = !settings.autoJump;
      this.emit("settings", settings);
      this.refreshOptions(settings, back);
    }));
    b.append(this.btn("language", "wide", () => this.emit("language")));
    b.append(this.btn("credits", "wide", () => this.alert(this.tr("credits"), this.tr("titleCredits"), () => this.refreshOptions(settings, back) || this.show("options"))));
    b.append(this.btn("done", "wide", () => this.emit("optionsBack", back)));
  }

  refreshLang(current) {
    const list = this.els["lang-list"];
    list.innerHTML = "";
    LANGS.forEach((l) => {
      const d = document.createElement("div");
      d.className = "lang-item" + (l.id === current ? " selected" : "");
      d.textContent = l.label;
      d.addEventListener("click", () => {
        this.lang = l.id;
        this.emit("lang", l.id);
        this.refreshLang(l.id);
        this.applyLang();
      });
      list.append(d);
    });
    const btns = this.els["lang-btns"];
    btns.innerHTML = "";
    btns.append(this.btn("done", "wide", () => this.emit("langDone")));
    this.applyLang();
  }

  refreshMultiplayer() {
    const list = this.els["server-list"];
    list.innerHTML = "";
    const row = document.createElement("div");
    row.className = "server-item selected";
    row.innerHTML = `<div><div>${this.tr("unknownServer")}</div><div class="hint">${this.tr("motd")}</div></div><div class="hint">∞</div>`;
    list.append(row);
    const b = this.els["mp-btns"];
    b.innerHTML = "";
    b.append(this.btn("joinServer", "wide", () => this.alert(this.tr("connecting"), this.tr("connectFail"), () => this.show("mp"))));
    const r = document.createElement("div");
    r.className = "menu-row";
    r.append(this.btn("directConnect", "half", () => this.alert(this.tr("directConnect"), this.tr("outdated"), () => this.show("mp"))));
    r.append(this.btn("addServer", "half", () => this.alert(this.tr("addServer"), this.tr("outdated"), () => this.show("mp"))));
    b.append(r);
    b.append(this.btn("refresh", "wide", () => this.refreshMultiplayer()));
    b.append(this.btn("cancel", "wide", () => this.show("title")));
    this.applyLang();
  }

  alert(title, body, back) {
    this.els["alert-title"].textContent = title;
    this.els["alert-body"].textContent = body;
    const w = this.els["alert-btns"];
    w.innerHTML = "";
    w.append(this.btn("done", "wide", () => { back?.(); }));
    this.show("alert");
  }

  confirm(title, body, yes, no) {
    this.els["alert-title"].textContent = title;
    this.els["alert-body"].textContent = body;
    const w = this.els["alert-btns"];
    w.innerHTML = "";
    const r = document.createElement("div");
    r.className = "menu-row";
    r.append(this.btn("yes", "half", () => yes?.()));
    r.append(this.btn("no", "half", () => no?.()));
    w.append(r);
    this.show("alert");
  }

  setLoading(p, text) {
    this.els["load-text"].textContent = text || this.tr("buildingTerrain");
    this.els["load-bar"].style.width = `${Math.floor(p * 100)}%`;
    this.els["load-hint"].textContent = `${Math.floor(p * 100)}%`;
  }

  buildHotbarSlots() {
    const hb = this.els.hotbar;
    hb.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("div");
      s.className = "slot";
      s.dataset.i = i;
      hb.append(s);
    }
    const sel = document.createElement("img");
    sel.className = "hotbar-sel";
    sel.src = this.sel.toDataURL();
    sel.id = "hotbar-sel";
    hb.append(sel);
  }

  renderHotbar(player) {
    if (!this.textures) return;
    const sig = JSON.stringify({
      h: player.hotbar,
      s: player.selected,
      hp: player.health | 0,
      hg: player.hunger | 0,
      a: player.armorPoints(),
      x: player.xpLevel,
      xp: Math.round((player.xp % 1) * 20),
      gm: player.gamemode,
    });
    const held = player.held();
    const name = held ? itemName(held.id, this.lang) : "";
    if (held?.id !== this.lastHeld) {
      this.lastHeld = held?.id;
      this.itemNameTimer = 2.2;
      this.els["item-name"].textContent = name;
    }
    this.els["item-name"].classList.toggle("show", this.itemNameTimer > 0 && !!name);

    if (sig !== this._hotSig) {
      this._hotSig = sig;
      const slots = this.els.hotbar.querySelectorAll(".slot");
      slots.forEach((el, i) => {
        const it = player.hotbar[i];
        el.innerHTML = "";
        if (it) {
          const img = itemIcon(this.textures, it.id, 48);
          const im = document.createElement("img");
          im.className = "icon";
          im.src = img.toDataURL();
          el.append(im);
          if (it.count > 1) {
            const c = document.createElement("span");
            c.className = "count";
            c.textContent = it.count;
            el.append(c);
          }
        }
      });
      const sel = this.els.hotbar.querySelector(".hotbar-sel") || this.root.querySelector("#hotbar-sel");
      if (sel) sel.style.left = `calc(var(--s) * ${player.selected * 6.66 - 0.5})`;
      const creative = player.gamemode === "creative";
      this.els["status-bars"].style.visibility = creative ? "hidden" : "visible";
      this.els["xp-row"].style.visibility = creative ? "hidden" : "visible";
      if (!creative) this.renderBars(player);
      this.els["xp-level"].textContent = player.xpLevel | 0;
      this.els["xp-fill"].style.width = `${(player.xp % 1) * 100}%`;
    }
  }

  renderBars(player) {
    paintBar(this.els["heart-bar"], player.health, 20, this.hearts);
    paintBar(this.els["food-bar"], player.hunger, 20, this.food);
    const armor = player.armorPoints();
    const ab = this.els["armor-bar"];
    ab.innerHTML = "";
    if (armor <= 0) return;
    for (let i = 0; i < 10; i++) {
      const img = document.createElement("img");
      img.src = this.armorIco.toDataURL();
      img.style.opacity = i < armor / 2 ? "1" : "0.15";
      img.style.width = "calc(var(--s) * 3)";
      img.style.height = "calc(var(--s) * 3)";
      ab.append(img);
    }
  }

  tickHud(dt, player) {
    if (this.itemNameTimer > 0) this.itemNameTimer -= dt;
    const hud = this.els["compass-hud"];
    const needle = this.els["compass-needle"];
    if (hud && needle) {
      const show = player?.held()?.id === "compass";
      hud.classList.toggle("hidden", !show);
      if (show && player) {
        const ang = Math.atan2(player.spawn.x - player.pos.x, player.spawn.z - player.pos.z) - player.yaw;
        needle.style.transform = `rotate(${ang}rad)`;
      }
    }
  }

  setBossBar(ratio, name) {
    const bar = this.els["boss-bar"];
    if (!bar) return;
    const on = ratio > 0;
    bar.classList.toggle("hidden", !on);
    if (on) {
      if (this.els["boss-name"]) this.els["boss-name"].textContent = name || "";
      if (this.els["boss-fill"]) this.els["boss-fill"].style.width = `${Math.max(0, Math.min(1, ratio)) * 100}%`;
    }
  }

  setDebug(left, right, on) {
    this.els["debug-l"].classList.toggle("hidden", !on);
    this.els["debug-r"].classList.toggle("hidden", !on);
    if (on) {
      this.els["debug-l"].textContent = left;
      this.els["debug-r"].textContent = right;
    }
  }

  chat(msg) {
    const line = document.createElement("div");
    line.className = "chat-line";
    line.textContent = msg;
    this.els["chat-log"].append(line);
    this.els["chat-log"].scrollTop = 9999;
    setTimeout(() => line.remove(), 10000);
  }

  openChat() {
    this.els["chat-wrap"].classList.add("open");
    const input = this.els["chat-input"];
    input.value = "";
    input.placeholder = this.tr("chatHint");
    setTimeout(() => input.focus(), 0);
  }

  closeChat() {
    this.els["chat-wrap"].classList.remove("open");
    this.els["chat-input"].blur();
  }

  chatOpen() {
    return this.els["chat-wrap"].classList.contains("open");
  }

  renderInventory(player, kind = "survival") {
    const win = this.els["inv-window"];
    win.innerHTML = "";
    if (player.gamemode === "creative" && kind !== "table" && kind !== "furnace" && kind !== "chest" && kind !== "trade") {
      this.renderCreative(win, player);
      return;
    }
    const title = document.createElement("div");
    title.className = "inv-title";
    title.textContent = kind === "table" ? this.tr("crafting") : kind === "furnace" ? this.tr("furnace") || "熔炉" : kind === "chest" ? this.tr("chest") || "箱子" : kind === "trade" ? this.tr("trade") : this.tr("inventory");
    win.append(title);

    const layout = document.createElement("div");
    layout.style.display = "flex";
    layout.style.gap = "calc(var(--s) * 2)";
    if (kind === "survival" || kind === "table") {
      const left = document.createElement("div");
      if (kind === "survival") {
        const armor = document.createElement("div");
        armor.className = "grid";
        armor.style.gridTemplateColumns = "repeat(1, auto)";
        for (let i = 0; i < 4; i++) armor.append(this.slotEl(player, "armor", i));
        left.append(armor);
        const doll = document.createElement("canvas");
        doll.className = "paper-doll";
        doll.width = 48;
        doll.height = 72;
        drawSteve(doll.getContext("2d"));
        left.append(doll);
        const off = this.slotEl(player, "offhand", 0);
        left.append(off);
      }
      const craftWrap = document.createElement("div");
      const size = kind === "table" ? 3 : 2;
      const grid = document.createElement("div");
      grid.className = "grid";
      grid.style.gridTemplateColumns = `repeat(${size}, auto)`;
      const slots = kind === "table" ? player.craft3 : player.craft;
      for (let i = 0; i < size * size; i++) grid.append(this.slotEl(player, kind === "table" ? "craft3" : "craft", i));
      const out = this.slotEl(player, "craftOut", 0);
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.alignItems = "center";
      row.style.gap = "calc(var(--s) * 2)";
      row.append(grid, arrow(), out);
      craftWrap.append(row);
      layout.append(left, craftWrap);
    } else if (kind === "furnace") {
      const fu = player.furnace || { in: null, fuel: null, out: null, cook: 0, burn: 0 };
      player.furnace = fu;
      const col = document.createElement("div");
      col.append(this.slotEl(player, "furnaceIn", 0));
      col.append(this.slotEl(player, "furnaceFuel", 0));
      layout.append(col, arrow(), this.slotEl(player, "furnaceOut", 0));
    } else if (kind === "chest") {
      const g = document.createElement("div");
      g.className = "grid";
      g.style.gridTemplateColumns = "repeat(9, auto)";
      const chest = player.usingChest;
      for (let i = 0; i < 27; i++) g.append(this.slotEl(player, "chest", i, chest));
      layout.append(g);
    } else if (kind === "trade") {
      layout.append(this.renderTrades(player));
    }
    win.append(layout);

    const invTitle = document.createElement("div");
    invTitle.className = "inv-title";
    invTitle.style.marginTop = "calc(var(--s) * 2)";
    invTitle.textContent = this.tr("inventory");
    win.append(invTitle);
    const inv = document.createElement("div");
    inv.className = "grid";
    inv.style.gridTemplateColumns = "repeat(9, auto)";
    for (let i = 0; i < 27; i++) inv.append(this.slotEl(player, "inv", i));
    win.append(inv);
    const hot = document.createElement("div");
    hot.className = "grid";
    hot.style.gridTemplateColumns = "repeat(9, auto)";
    hot.style.marginTop = "calc(var(--s) * 1.2)";
    for (let i = 0; i < 9; i++) hot.append(this.slotEl(player, "hotbar", i));
    win.append(hot);
    this.bindInvClicks(player, kind);
  }

  renderTrades(player) {
    const wrap = document.createElement("div");
    wrap.className = "trade-list";
    const job = player.tradingJob || "farmer";
    const jobTitle = document.createElement("div");
    jobTitle.className = "hint";
    jobTitle.style.marginBottom = "calc(var(--s) * 1)";
    jobTitle.textContent = this.tr("villager_" + job);
    wrap.append(jobTitle);
    const list = TRADES[job] || TRADES.farmer;
    for (const offer of list) {
      const row = document.createElement("div");
      row.className = "trade-row";
      row.append(this.tradeItem(offer.buy, offer.buyN));
      const arrowEl = document.createElement("div");
      arrowEl.className = "mc-text";
      arrowEl.textContent = "→";
      row.append(arrowEl);
      row.append(this.tradeItem(offer.sell, offer.sellN));
      const have = player.gamemode === "creative" || player.countId(offer.buy) >= offer.buyN;
      const btn = document.createElement("button");
      btn.className = "mc-btn";
      btn.textContent = this.tr("tradeBtn");
      btn.disabled = !have;
      btn.addEventListener("click", () => {
        if (player.gamemode !== "creative") {
          if (player.countId(offer.buy) < offer.buyN) return;
          if (!player.consumeId(offer.buy, offer.buyN)) return;
        }
        player.give(offer.sell, offer.sellN);
        this.renderInventory(player, "trade");
      });
      row.append(btn);
      wrap.append(row);
    }
    return wrap;
  }

  tradeItem(id, n) {
    const box = document.createElement("div");
    box.className = "trade-item";
    const img = document.createElement("img");
    img.src = itemIcon(this.textures, id, 48).toDataURL();
    const label = document.createElement("span");
    label.className = "count";
    label.textContent = String(n);
    box.append(img, label);
    box.title = itemName(id, this.lang);
    return box;
  }

  renderCreative(win, player) {
    const tabs = document.createElement("div");
    tabs.className = "creative-tabs";
    CREATIVE_TABS.forEach((tab) => {
      const b = document.createElement("div");
      b.className = "tab" + (this.creativeTab === tab.id ? " active" : "");
      const ico = itemIcon(this.textures, tab.icon, 32);
      const c = document.createElement("canvas");
      c.width = 32;
      c.height = 32;
      c.getContext("2d").drawImage(ico, 0, 0);
      b.append(c);
      b.title = this.tr("tab" + cap(tab.id)) || tab.id;
      b.addEventListener("click", () => {
        this.creativeTab = tab.id;
        this.renderInventory(player, "creative");
      });
      tabs.append(b);
    });
    win.append(tabs);
    if (this.creativeTab === "survival") {
      this.creativeTab = "building";
    }
    const search = document.createElement("input");
    search.className = "mc-input";
    search.placeholder = this.tr("searchItems");
    search.style.width = "100%";
    search.style.marginBottom = "calc(var(--s) * 1)";
    search.value = this._q || "";
    search.addEventListener("input", () => {
      this._q = search.value;
      this.renderInventory(player, "creative");
    });
    win.append(search);
    const items = itemsInTab(this.creativeTab).filter((it) => {
      if (!this._q) return true;
      return itemName(it.id, this.lang).toLowerCase().includes(this._q.toLowerCase()) || it.id.includes(this._q.toLowerCase());
    });
    const g = document.createElement("div");
    g.className = "grid";
    g.style.gridTemplateColumns = "repeat(9, auto)";
    g.style.maxHeight = "calc(var(--s) * 40)";
    g.style.overflow = "auto";
    items.forEach((it) => g.append(this.slotEl(player, "creative", it.id)));
    win.append(g);
    const dest = this.slotEl(player, "destroy", 0);
    dest.title = this.tr("destroyItem");
    win.append(dest);
    const hot = document.createElement("div");
    hot.className = "grid";
    hot.style.gridTemplateColumns = "repeat(9, auto)";
    hot.style.marginTop = "calc(var(--s) * 1)";
    for (let i = 0; i < 9; i++) hot.append(this.slotEl(player, "hotbar", i));
    win.append(hot);
    this.bindInvClicks(player, "creative");
  }

  slotEl(player, where, index, extra) {
    const el = document.createElement("div");
    el.className = "inv-slot";
    el.dataset.where = where;
    el.dataset.index = String(index);
    const stack = getStack(player, where, index, extra);
    if (stack) {
      const img = document.createElement("img");
      img.className = "icon";
      img.src = itemIcon(this.textures, stack.id, 48).toDataURL();
      el.append(img);
      if (stack.count > 1) {
        const c = document.createElement("span");
        c.className = "count";
        c.textContent = stack.count;
        el.append(c);
      }
    }
    el.addEventListener("mouseenter", () => {
      el.classList.add("hover");
      const s = getStack(player, where, index, extra);
      if (s) this.showTip(itemName(s.id, this.lang), ITEMS[s.id]?.rare);
    });
    el.addEventListener("mouseleave", () => {
      el.classList.remove("hover");
      this.els.tooltip.style.display = "none";
    });
    return el;
  }

  showTip(text, rare) {
    const ttip = this.els.tooltip;
    ttip.style.display = "block";
    ttip.innerHTML = `<div class="${rare ? "rare" : ""}">${esc(text)}</div>`;
  }

  bindInvClicks(player, kind) {
    const win = this.els["inv-window"];
    win.onmousedown = (e) => {
      const slot = e.target.closest(".inv-slot");
      if (!slot) return;
      e.preventDefault();
      const where = slot.dataset.where;
      const index = slot.dataset.index;
      this.clickSlot(player, where, index, e.button, e.shiftKey, kind);
      this.renderInventory(player, kind === "creative" ? "creative" : kind);
      this.renderHotbar(player);
      this.updateCursor(player);
    };
    win.oncontextmenu = (e) => e.preventDefault();
  }

  clickSlot(player, where, index, button, shift, kind) {
    if (where === "creative") {
      const id = index;
      if (button === 0) player.cursor = { id, count: ITEMS[id]?.stack || 64 };
      else player.cursor = { id, count: 1 };
      return;
    }
    if (where === "destroy") {
      player.cursor = null;
      return;
    }
    if (where === "craftOut") {
      const size = kind === "table" ? 3 : 2;
      const slots = kind === "table" ? player.craft3 : player.craft;
      const res = craftResult(slots, size);
      if (!res) return;
      if (!player.cursor) player.cursor = { id: res.id, count: res.count };
      else if (player.cursor.id === res.id) player.cursor.count += res.count;
      else return;
      consumeCraft(slots, size);
      return;
    }
    const stack = getStack(player, where, index, player.usingChest);
    const cursor = player.cursor;
    if (button === 0) {
      if (!cursor && stack) {
        player.cursor = { ...stack };
        setStack(player, where, index, null);
      } else if (cursor && !stack) {
        setStack(player, where, index, { ...cursor });
        player.cursor = null;
      } else if (cursor && stack && cursor.id === stack.id) {
        const max = ITEMS[cursor.id]?.stack || 64;
        const add = Math.min(max - stack.count, cursor.count);
        stack.count += add;
        cursor.count -= add;
        if (cursor.count <= 0) player.cursor = null;
        setStack(player, where, index, stack);
      } else if (cursor && stack) {
        setStack(player, where, index, { ...cursor });
        player.cursor = { ...stack };
      }
    } else if (button === 2) {
      if (!cursor && stack) {
        const half = Math.ceil(stack.count / 2);
        player.cursor = { id: stack.id, count: half };
        stack.count -= half;
        setStack(player, where, index, stack.count ? stack : null);
      } else if (cursor && !stack) {
        setStack(player, where, index, { id: cursor.id, count: 1 });
        cursor.count--;
        if (cursor.count <= 0) player.cursor = null;
      } else if (cursor && stack && cursor.id === stack.id) {
        const max = ITEMS[cursor.id]?.stack || 64;
        if (stack.count < max) {
          stack.count++;
          cursor.count--;
          if (cursor.count <= 0) player.cursor = null;
          setStack(player, where, index, stack);
        }
      }
    }
  }

  updateCursor(player) {
    const el = this.els["cursor-item"];
    if (!player.cursor) {
      el.style.display = "none";
      return;
    }
    el.style.display = "block";
    el.src = itemIcon(this.textures, player.cursor.id, 48).toDataURL();
  }

  bindStatic() {
    window.addEventListener("mousemove", (e) => {
      const el = this.els["cursor-item"];
      el.style.left = e.clientX + 4 + "px";
      el.style.top = e.clientY + 4 + "px";
      const tip = this.els.tooltip;
      if (tip.style.display === "block") {
        tip.style.left = e.clientX + 14 + "px";
        tip.style.top = e.clientY + 14 + "px";
      }
    });
    this.els["chat-input"].addEventListener("keydown", (e) => {
      if (e.code === "Enter") {
        this.emit("chat", this.els["chat-input"].value);
        this.closeChat();
      }
      if (e.code === "Escape") this.closeChat();
      e.stopPropagation();
    });
    this.root.querySelector(".inv-dim")?.addEventListener("mousedown", () => this.emit("closeInv"));
  }
}

function paintBar(el, value, max, icons) {
  el.innerHTML = "";
  const hearts = max / 2;
  for (let i = 0; i < hearts; i++) {
    const hp = value - i * 2;
    const img = document.createElement("img");
    img.width = 9;
    img.height = 9;
    img.src = (hp >= 2 ? icons.full : hp >= 1 ? icons.half : icons.empty).toDataURL();
    img.style.width = "calc(var(--s) * 3)";
    img.style.height = "calc(var(--s) * 3)";
    el.append(img);
  }
}

function field(label, type, value) {
  const wrap = document.createElement("div");
  wrap.className = "field";
  const l = document.createElement("label");
  l.textContent = label;
  const input = document.createElement("input");
  input.className = "mc-input";
  input.type = type;
  input.value = value ?? "";
  wrap.append(l, input);
  return { wrap, input };
}

function slider(ui, label, min, max, value, on) {
  const wrap = document.createElement("div");
  wrap.className = "slider-row";
  const l = document.createElement("div");
  l.className = "mc-text";
  l.style.fontSize = "calc(var(--s) * 2.7)";
  l.textContent = label;
  const s = document.createElement("input");
  s.type = "range";
  s.className = "mc-slider";
  s.min = min;
  s.max = max;
  s.value = value;
  s.addEventListener("change", () => on(Number(s.value)));
  wrap.append(l, s);
  return wrap;
}

function fovLabel(ui, fov) {
  if (fov === 70) return ui.tr("fovNormal");
  if (fov >= 110) return ui.tr("fovQuake");
  return String(fov);
}

function getStack(player, where, index, extra) {
  if (where === "hotbar") return player.hotbar[index];
  if (where === "inv") return player.inv[index];
  if (where === "armor") return player.armor[index];
  if (where === "offhand") return player.offhand;
  if (where === "craft") return player.craft[index];
  if (where === "craft3") return player.craft3[index];
  if (where === "furnaceIn") return player.furnace?.in;
  if (where === "furnaceFuel") return player.furnace?.fuel;
  if (where === "furnaceOut") return player.furnace?.out;
  if (where === "chest") return extra?.slots?.[index];
  if (where === "craftOut") {
    const size = player.usingTable ? 3 : 2;
    const slots = player.usingTable ? player.craft3 : player.craft;
    return craftResult(slots, size);
  }
  return null;
}

function setStack(player, where, index, stack) {
  if (where === "hotbar") player.hotbar[index] = stack;
  else if (where === "inv") player.inv[index] = stack;
  else if (where === "armor") player.armor[index] = stack;
  else if (where === "offhand") player.offhand = stack;
  else if (where === "craft") player.craft[index] = stack;
  else if (where === "craft3") player.craft3[index] = stack;
  else if (where === "furnaceIn") player.furnace.in = stack;
  else if (where === "furnaceFuel") player.furnace.fuel = stack;
  else if (where === "furnaceOut") player.furnace.out = stack;
  else if (where === "chest" && player.usingChest) player.usingChest.slots[index] = stack;
}

function arrow() {
  const s = document.createElement("div");
  s.textContent = "→";
  s.style.color = "#404040";
  s.style.fontSize = "calc(var(--s) * 4)";
  return s;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function drawSteve(g) {
  g.imageSmoothingEnabled = false;
  g.fillStyle = "#c1966a";
  g.fillRect(16, 4, 16, 16);
  g.fillStyle = "#3c2a1a";
  g.fillRect(16, 4, 16, 6);
  g.fillStyle = "#3a5aaa";
  g.fillRect(16, 20, 16, 20);
  g.fillStyle = "#2e3a6e";
  g.fillRect(16, 40, 16, 24);
  g.fillStyle = "#c1966a";
  g.fillRect(8, 20, 8, 20);
  g.fillRect(32, 20, 8, 20);
  g.fillStyle = "#222";
  g.fillRect(20, 12, 3, 3);
  g.fillRect(27, 12, 3, 3);
}
