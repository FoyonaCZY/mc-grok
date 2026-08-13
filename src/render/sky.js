import * as THREE from "three";

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.hemi = new THREE.HemisphereLight(0x87ceeb, 0x3d2b1f, 0.7);
    scene.add(this.hemi);
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
    this.sunLight.position.set(80, 120, 40);
    scene.add(this.sunLight);
    scene.add(this.sunLight.target);

    this.sky = new THREE.Mesh(
      new THREE.SphereGeometry(400, 24, 16),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false }),
    );
    scene.add(this.sky);

    this.sun = new THREE.Mesh(
      new THREE.PlaneGeometry(18, 18),
      new THREE.MeshBasicMaterial({ color: 0xfff1a8, fog: false, depthWrite: false, side: THREE.DoubleSide }),
    );
    this.moon = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.MeshBasicMaterial({ color: 0xdde8ff, fog: false, depthWrite: false, side: THREE.DoubleSide }),
    );
    scene.add(this.sun);
    scene.add(this.moon);

    this.stars = this.makeStars();
    scene.add(this.stars);

    this.clouds = this.makeClouds();
    scene.add(this.clouds);

    this.rain = this.makeRain();
    scene.add(this.rain);

    this.fog = scene.fog = new THREE.FogExp2(0x87b8e8, 0.012);
  }

  makeStars() {
    const g = new THREE.BufferGeometry();
    const n = 600;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(Math.random() * 2 - 1);
      const r = 280;
      pos[i * 3] = r * Math.sin(v) * Math.cos(u);
      pos[i * 3 + 1] = r * Math.cos(v);
      pos[i * 3 + 2] = r * Math.sin(v) * Math.sin(u);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(
      g,
      new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, fog: false, depthWrite: false, transparent: true, opacity: 0 }),
    );
  }

  makeClouds() {
    const group = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    for (let i = 0; i < 28; i++) {
      const w = 12 + Math.random() * 28;
      const d = 8 + Math.random() * 16;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 2, d), mat);
      m.position.set((Math.random() - 0.5) * 260, 78 + Math.random() * 10, (Math.random() - 0.5) * 260);
      group.add(m);
    }
    return group;
  }

  makeRain() {
    const g = new THREE.BufferGeometry();
    const n = 900;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 48;
      pos[i * 3 + 1] = Math.random() * 28;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 48;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(
      g,
      new THREE.PointsMaterial({
        color: 0xa8c8ff,
        size: 0.12,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    );
    pts.visible = false;
    pts.frustumCulled = false;
    this._rainPos = pos;
    return pts;
  }

  update(time, playerPos, fancyClouds, raining = false, snowing = false, nether = false, dt = 1 / 60, end = false, brightness = 50, nightVision = false) {
    if (end) {
      const sky = new THREE.Color(0x100018);
      this.sky.material.color.copy(sky);
      this.scene.fog.color.copy(sky);
      this.hemi.color.set(0x6644aa);
      this.hemi.groundColor.set(0x1a1028);
      this.hemi.intensity = 0.42;
      this.sunLight.intensity = 0.16;
      this.sunLight.color.set(0xaa88ff);
      this.sun.visible = false;
      this.moon.visible = false;
      this.stars.material.opacity = 0.4;
      this.stars.position.copy(playerPos);
      this.clouds.visible = false;
      this.rain.visible = false;
      this.sky.position.copy(playerPos);
      this.applyMood(brightness, nightVision);
      return;
    }
    if (nether) {
      const sky = new THREE.Color(0x2a0808);
      this.sky.material.color.copy(sky);
      this.scene.fog.color.copy(sky);
      this.hemi.color.set(0xaa3322);
      this.hemi.groundColor.set(0x3a1010);
      this.hemi.intensity = 0.38;
      this.sunLight.intensity = 0.18;
      this.sunLight.color.set(0xff5522);
      this.sun.visible = false;
      this.moon.visible = false;
      this.stars.material.opacity = 0;
      this.clouds.visible = false;
      this.rain.visible = false;
      this.sky.position.copy(playerPos);
      this.applyMood(brightness, nightVision);
      return;
    }
    const t = ((time % 24000) + 24000) % 24000;
    const ang = (t / 24000) * Math.PI * 2;
    const sunH = Math.sin(ang);
    const day = clamp((sunH + 0.15) / 1.15, 0, 1);

    const daySky = new THREE.Color(0x78a7ff);
    const dawnSky = new THREE.Color(0xff9966);
    const nightSky = new THREE.Color(0x0b0b2a);
    let sky;
    if (day > 0.25) sky = daySky.clone().lerp(dawnSky, 1 - Math.min(1, (day - 0.25) / 0.4));
    else sky = nightSky.clone().lerp(dawnSky, Math.max(0, day / 0.25));
    if (day > 0.55) sky = daySky.clone();

    this.sky.material.color.copy(sky);
    this.scene.fog.color.copy(sky);
    this.hemi.color.copy(sky);
    this.hemi.groundColor.set(0x3d2b1f);
    this.hemi.intensity = 0.25 + day * 0.6;
    this.sunLight.intensity = 0.15 + day * 1.05;
    this.sunLight.color.set(day > 0.3 ? 0xfff5e0 : 0xff7744);

    const r = 220;
    this.sun.position.set(Math.cos(ang) * r, Math.sin(ang) * r, 40);
    this.moon.position.set(-Math.cos(ang) * r, -Math.sin(ang) * r, -40);
    this.sun.lookAt(0, 0, 0);
    this.moon.lookAt(0, 0, 0);
    this.sun.visible = sunH > -0.15;
    this.moon.visible = sunH < 0.15;
    this.stars.material.opacity = clamp(1 - day * 1.6, 0, 1);

    this.sky.position.copy(playerPos);
    this.stars.position.copy(playerPos);
    this.sun.position.add(playerPos);
    this.moon.position.add(playerPos);

    this.clouds.visible = fancyClouds;
    this.clouds.position.x = playerPos.x;
    this.clouds.position.z = playerPos.z;
    this.clouds.rotation.y += 0.00015;

    if (raining) {
      sky.lerp(new THREE.Color(snowing ? 0x8aa0b8 : 0x4a5a70), 0.45);
      this.sky.material.color.copy(sky);
      this.scene.fog.color.copy(sky);
      this.sunLight.intensity *= 0.45;
      this.hemi.intensity *= 0.7;
      this.rain.visible = true;
      this.rain.material.color.set(snowing ? 0xffffff : 0xa8c8ff);
      this.rain.material.size = snowing ? 0.07 : 0.12;
      this.rain.material.opacity = snowing ? 0.48 : 0.55;
      this.rain.position.copy(playerPos);
      const count = snowing ? 160 : 900;
      this.rain.geometry.setDrawRange(0, count);
      const arr = this._rainPos;
      const spread = snowing ? 64 : 48;
      const step = Math.max(0, dt);
      const rainRate = step * 60;
      for (let i = 0, n = count * 3; i < n; i += 3) {
        if (snowing) {
          arr[i] += Math.sin((i + arr[i + 1]) * 0.35) * 0.18 * step;
          arr[i + 2] += Math.cos((i * 0.11 + arr[i + 1]) * 0.22) * 0.08 * step;
          arr[i + 1] -= (1.15 + (i % 7) * 0.06) * step;
        } else {
          arr[i + 1] -= (0.9 + (i % 7) * 0.05) * rainRate;
        }
        if (arr[i + 1] < 0) {
          arr[i] = (Math.random() - 0.5) * spread;
          arr[i + 1] = snowing ? 14 + Math.random() * 18 : 18 + Math.random() * 10;
          arr[i + 2] = (Math.random() - 0.5) * spread;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    } else {
      this.rain.visible = false;
    }
    this.applyMood(brightness, nightVision);
  }

  applyMood(brightness = 50, nightVision = false) {
    const b = 0.42 + (Math.max(0, Math.min(100, brightness)) / 100) * 1.05;
    if (nightVision) {
      this.hemi.intensity = Math.max(this.hemi.intensity * b, 1.15);
      this.sunLight.intensity = Math.max(this.sunLight.intensity * b, 0.62);
    } else {
      this.hemi.intensity *= b;
      this.sunLight.intensity *= b;
    }
  }
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function timeOfDayLabel(time) {
  const t = ((time % 24000) + 24000) % 24000;
  const hours = (6 + (t / 24000) * 24) % 24;
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
