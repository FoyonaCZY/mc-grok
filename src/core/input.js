export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, dx: 0, dy: 0, left: false, right: false, middle: false };
    this.wheel = 0;
    this.locked = false;
    this.invertY = false;
    this.sensitivity = 1;
    this.onLockChange = null;
    this.captureBrowserKeys = false;

    window.addEventListener("keydown", (e) => {
      const typing = isTextEntry(e.target);
      if (this.shouldBlockBrowserShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (!typing && ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.code)) {
        if (this.locked || this.captureBrowserKeys) e.preventDefault();
      }
      if (!typing) {
        this.keys.add(e.code);
        this.lastKey = e.code;
      }
    }, true);
    window.addEventListener("keyup", (e) => {
      if (this.shouldBlockBrowserShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
      this.keys.delete(e.code);
    }, true);
    canvas.addEventListener("mousedown", (e) => {
      if (e.button === 2) e.preventDefault();
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 1) this.mouse.middle = true;
      if (e.button === 2) this.mouse.right = true;
    });
    window.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 1) this.mouse.middle = false;
      if (e.button === 2) this.mouse.right = false;
    });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      if (this.locked) {
        this.mouse.dx += e.movementX;
        this.mouse.dy += e.movementY;
      }
    });
    canvas.addEventListener("wheel", (e) => {
      this.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    const blockMenu = (e) => e.preventDefault();
    canvas.addEventListener("contextmenu", blockMenu);
    document.addEventListener("contextmenu", blockMenu, true);
    document.addEventListener("auxclick", (e) => {
      if (e.button === 2) e.preventDefault();
    }, true);
    document.addEventListener("pointerlockchange", () => {
      this.locked = document.pointerLockElement === canvas;
      this.onLockChange?.(this.locked);
    });
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.mouse.left = this.mouse.right = false;
    });
  }

  shouldBlockBrowserShortcut(e) {
    if (!this.captureBrowserKeys) return false;
    const ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && ["KeyW", "KeyT", "KeyN", "KeyR", "KeyS", "KeyP", "KeyD", "KeyF"].includes(e.code)) return true;
    if (e.altKey && (e.code === "F4" || e.code === "ArrowLeft" || e.code === "ArrowRight")) return true;
    return false;
  }

  async requestLock() {
    this.captureBrowserKeys = true;
    try {
      if (document.fullscreenElement !== document.documentElement) {
        await document.documentElement.requestFullscreen?.();
      }
    } catch {
      /* 用户拒绝全屏时仍继续锁鼠标 */
    }
    try {
      await navigator.keyboard?.lock?.([
        "KeyW", "KeyA", "KeyS", "KeyD",
        "ControlLeft", "ControlRight", "MetaLeft", "MetaRight",
        "Escape", "Tab", "KeyT", "KeyN", "KeyR", "KeyQ",
      ]);
    } catch {
      /* Keyboard Lock 通常需要全屏 */
    }
    this.canvas.requestPointerLock?.();
  }

  exitLock() {
    document.exitPointerLock?.();
  }

  releaseBrowserKeys() {
    this.captureBrowserKeys = false;
    try {
      navigator.keyboard?.unlock?.();
    } catch {
      /* ignore */
    }
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  consumeLook() {
    const inv = this.invertY ? -1 : 1;
    const s = this.sensitivity * 0.15;
    const dx = this.mouse.dx * s;
    const dy = this.mouse.dy * s * inv;
    this.mouse.dx = 0;
    this.mouse.dy = 0;
    return { dx, dy };
  }

  consumeWheel() {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  down(code) {
    return this.keys.has(code);
  }
}

function isTextEntry(el) {
  if (!el || el === document.body || el === document.documentElement) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag !== "INPUT") return false;
  const type = (el.type || "text").toLowerCase();
  return !["button", "checkbox", "radio", "range", "file", "submit", "reset", "color", "image", "hidden"].includes(type);
}
