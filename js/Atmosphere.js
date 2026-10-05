// Día y noche + clima: controla el cielo, las luces, el sol y la luna, las estrellas, la niebla,
// las nubes, la lluvia y el brillo de las farolas. El tiempo avanza solo, o se fija desde el menú de pausa.
import * as THREE from 'three';

// ---------- Hora ----------
const START_HOUR = 9.5;
const HOURS_PER_SEC_DAY = 1 / 14;     // de 6 a 18 h: 14 s por hora (un día completo dura ~4 minutos)
const HOURS_PER_SEC_NIGHT = 1 / 6;    // la noche pasa más rápido: es lo menos jugable

export const TIME_PRESETS = { amanecer: 6.4, dia: 12, atardecer: 17.5, noche: 23 };

// ---------- Clima ----------
export const WEATHERS = {
    despejado: { label: 'Despejado', icon: '☀️', cover: 0.0, fog: 1.0, gray: 0.0, sun: 1.0, rain: 0.0, wind: 1.0 },
    nublado: { label: 'Nublado', icon: '☁️', cover: 0.85, fog: 0.8, gray: 0.45, sun: 0.55, rain: 0.0, wind: 1.25 },
    camanchaca: { label: 'Camanchaca (niebla costera)', icon: '🌫️', cover: 0.5, fog: 0.2, gray: 0.8, sun: 0.4, rain: 0.0, wind: 0.5 },
    lluvia: { label: 'Lluvia', icon: '🌧️', cover: 1.0, fog: 0.5, gray: 0.7, sun: 0.3, rain: 1.0, wind: 1.4 }
};

const NIGHT_TOP = new THREE.Color(0x070b22), NIGHT_BOTTOM = new THREE.Color(0x1a2552);
const DUSK_TOP = new THREE.Color(0x5a4a8f), DUSK_BOTTOM = new THREE.Color(0xff8f5a);
const GREY_SKY = new THREE.Color(0x9aa3ad), GREY_FOG = new THREE.Color(0xc9ced4);
const NIGHT_HEMI_SKY = new THREE.Color(0x3b4a7a), NIGHT_HEMI_GROUND = new THREE.Color(0x232a40);
const SUN_WARM = new THREE.Color(0xffb27a), SUN_DAY = new THREE.Color(0xffffff), MOON = new THREE.Color(0x8fa8ff);

const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

function glowTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.35, 'rgba(255,215,120,0.45)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
}

export class Atmosphere {
    constructor(world, scene, camera) {
        this.world = world;
        this.scene = scene;
        this.camera = camera;

        this.hour = START_HOUR;
        this.timeMode = 'auto';
        this.weatherMode = 'auto';

        this.weather = 'despejado';
        this.target = 'despejado';
        this.cur = { ...WEATHERS.despejado };          // valores mezclados que se aplican
        this.nextChange = 50;                          // segundos hasta el próximo cambio automático

        // cielo (una sola textura que se redibuja)
        this.skyCanvas = document.createElement('canvas');
        this.skyCanvas.width = 2; this.skyCanvas.height = 256;
        this.skyTex = new THREE.CanvasTexture(this.skyCanvas);
        this.skyTex.colorSpace = THREE.SRGBColorSpace;
        this.skyTimer = 0;
        scene.background = this.skyTex;
        this.fog = new THREE.Fog(0xcfe3f5, 60, 200);
        scene.fog = this.fog;
        world.externalSky = true;

        this.def = null;
        this.baseFog = { near: 60, far: 200 };

        this.buildSkyObjects();
        this.buildRain();
        this.glow = null;

        this.top = new THREE.Color(); this.bottom = new THREE.Color();
        this.tmp = new THREE.Color();
        this.sunDir = new THREE.Vector3(); this.moonDir = new THREE.Vector3();
        this.daylight = 1;
    }

    // ---------- objetos del cielo ----------
    buildSkyObjects() {
        // estrellas
        const n = 700, pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const u = Math.random(), v = 0.04 + Math.random() * 0.96;      // solo hemisferio superior
            const a = u * Math.PI * 2, y = v, r = Math.sqrt(1 - y * y);
            pos.set([Math.cos(a) * r * 420, y * 420, Math.sin(a) * r * 420], i * 3);
        }
        const sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
        this.stars.frustumCulled = false;

        const disc = (r, color) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color, fog: false, transparent: true }));
        this.sun = disc(16, 0xfff1b0);
        this.sunHalo = disc(34, 0xffe28a); this.sunHalo.material.opacity = 0.22; this.sunHalo.material.depthWrite = false;
        this.moon = disc(11, 0xf3f0d8);
        this.moonHalo = disc(22, 0xbfd0ff); this.moonHalo.material.opacity = 0.16; this.moonHalo.material.depthWrite = false;
        this.sky = new THREE.Group();
        this.sky.add(this.stars, this.sun, this.sunHalo, this.moon, this.moonHalo);
        this.scene.add(this.sky);
    }

    buildRain() {
        this.rainCount = 1000;
        this.rainOff = new Float32Array(this.rainCount * 3);     // posición de cada gota relativa a la cámara
        this.rainSpeed = new Float32Array(this.rainCount);
        for (let i = 0; i < this.rainCount; i++) this.resetDrop(i, true);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.rainCount * 6), 3));
        this.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, opacity: 0.5, fog: false, depthWrite: false }));
        this.rain.frustumCulled = false;
        this.rain.visible = false;
        this.scene.add(this.rain);
    }

    resetDrop(i, anywhere = false) {
        const o = this.rainOff;
        o[i * 3] = (Math.random() - 0.5) * 56;
        o[i * 3 + 1] = anywhere ? Math.random() * 30 - 8 : 22 + Math.random() * 6;
        o[i * 3 + 2] = (Math.random() - 0.5) * 56;
        this.rainSpeed[i] = 26 + Math.random() * 10;
    }

    // ---------- escena ----------
    /** Se llama cada vez que se construye una escena nueva. */
    setScene(cur) {
        this.def = cur.def;
        this.baseFog = { near: cur.radius * 1.2, far: cur.radius * 3.6 };
        this.cloudLayer = cur.clouds || null;

        // brillo nocturno de las farolas: un solo Points aditivo
        if (this.glow) { this.scene.remove(this.glow); this.glow.geometry.dispose(); this.glow = null; }
        if (cur.glows && cur.glows.length) {
            const pos = new Float32Array(cur.glows.length * 3);
            cur.glows.forEach((g, i) => pos.set([g.x, g.y, g.z], i * 3));
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            this.glowMat ??= new THREE.PointsMaterial({ map: glowTexture(), size: 5.5, sizeAttenuation: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
            this.glow = new THREE.Points(geo, this.glowMat);
            this.glow.frustumCulled = false;
            this.scene.add(this.glow);
            cur.group.userData.glow = this.glow;
        }
        // Bahía Inglesa tiende a tener neblina costera
        this.coastal = cur.id === 'bahia';
        this.skyTimer = 99;
    }

    // ---------- control manual ----------
    setTimeMode(mode) {
        this.timeMode = mode;
        if (TIME_PRESETS[mode] !== undefined) this.hour = TIME_PRESETS[mode];
    }

    setWeatherMode(mode) {
        this.weatherMode = mode;
        if (WEATHERS[mode]) this.target = mode;
        else this.nextChange = 4;
    }

    get rainAmount() { return this.cur.rain; }
    get windFactor() { return this.cur.wind; }
    get isNight() { return this.daylight < 0.35; }

    label() {
        const h = Math.floor(this.hour) % 24, m = Math.floor((this.hour % 1) * 60);
        const w = WEATHERS[this.target];
        const icon = this.daylight < 0.3 ? '🌙' : this.daylight < 0.75 ? '🌅' : w.icon;
        return `${icon} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} · ${w.label}`;
    }

    // ---------- actualización ----------
    update(dt, player) {
        // hora
        if (this.timeMode === 'auto') {
            const night = this.hour < 6 || this.hour >= 18;
            this.hour = (this.hour + dt * (night ? HOURS_PER_SEC_NIGHT : HOURS_PER_SEC_DAY)) % 24;
        }
        // clima automático
        if (this.weatherMode === 'auto') {
            this.nextChange -= dt;
            if (this.nextChange <= 0) {
                this.nextChange = 70 + Math.random() * 60;
                const r = Math.random();
                const coastal = this.coastal;
                this.target = r < (coastal ? 0.4 : 0.58) ? 'despejado' : r < (coastal ? 0.55 : 0.82) ? 'nublado' : r < (coastal ? 0.9 : 0.92) ? 'camanchaca' : 'lluvia';
            }
        }
        // mezcla suave hacia el clima objetivo
        const goal = WEATHERS[this.target];
        const k = Math.min(1, dt * 0.45);
        for (const key of ['cover', 'fog', 'gray', 'sun', 'rain', 'wind']) this.cur[key] = lerp(this.cur[key], goal[key], k);
        this.weather = this.target;

        // posición del sol y la luna (este -> oeste)
        const ang = Math.PI * (this.hour - 6) / 12;
        const sunEl = Math.sin(ang);
        this.sunDir.set(Math.cos(ang), sunEl, 0.35).normalize();
        const mAng = Math.PI * (((this.hour + 12) % 24) - 6) / 12;
        this.moonDir.set(Math.cos(mAng), Math.sin(mAng), 0.35).normalize();

        const d = smoothstep(-0.12, 0.3, sunEl);                  // 0 = noche, 1 = día pleno
        const tw = Math.max(0, 1 - Math.abs(sunEl) / 0.3) * (sunEl > -0.25 ? 1 : 0); // crepúsculo
        this.daylight = d;
        const w = this.cur;

        // colores del cielo
        const dayTop = new THREE.Color(this.def ? this.def.sky[0] : 0x5aa6ea), dayBottom = new THREE.Color(this.def ? this.def.sky[1] : 0xd8edf7);
        this.top.copy(NIGHT_TOP).lerp(dayTop, d).lerp(DUSK_TOP, tw * 0.5).lerp(GREY_SKY, w.gray * 0.8 * (0.4 + 0.6 * d));
        this.bottom.copy(NIGHT_BOTTOM).lerp(dayBottom, d).lerp(DUSK_BOTTOM, tw * 0.75).lerp(GREY_FOG, w.gray * (0.4 + 0.6 * d));
        this.skyTimer += dt;
        if (this.skyTimer > 0.12) { this.skyTimer = 0; this.paintSky(); }

        // niebla
        this.fog.color.copy(this.bottom);
        this.fog.near = this.baseFog.near * w.fog * w.fog;
        this.fog.far = this.baseFog.far * w.fog;

        // luces
        const wd = this.world;
        wd.hemi.color.copy(NIGHT_HEMI_SKY).lerp(new THREE.Color(this.def?.hemiSky ?? 0xdcebff), d).lerp(GREY_SKY, w.gray * 0.5);
        wd.hemi.groundColor.copy(NIGHT_HEMI_GROUND).lerp(new THREE.Color(this.def?.hemiGround ?? 0xb98a5c), d);
        wd.hemi.intensity = lerp(0.62, 0.85, d) * lerp(1, 0.85, w.gray);

        const useSun = sunEl > -0.05;
        const dir = useSun ? this.sunDir : this.moonDir;
        wd.sunOffset.set(dir.x, Math.max(dir.y, 0.3), dir.z).normalize().multiplyScalar(62);
        if (useSun) {
            wd.sun.color.copy(SUN_WARM).lerp(SUN_DAY, smoothstep(0.05, 0.5, sunEl));
            wd.sun.intensity = 2.7 * smoothstep(-0.05, 0.25, sunEl) * lerp(1, w.sun, 1) + 0.5;
        } else {
            wd.sun.color.copy(MOON);
            wd.sun.intensity = 0.75 * lerp(1, 0.6, w.cover);
        }

        // sol, luna y estrellas siguen a la cámara
        const cam = this.camera.position;
        this.sky.position.copy(cam);
        this.sun.position.copy(this.sunDir).multiplyScalar(330);
        this.sunHalo.position.copy(this.sun.position);
        this.moon.position.copy(this.moonDir).multiplyScalar(330);
        this.moonHalo.position.copy(this.moon.position);
        const sunVis = (sunEl > -0.08 ? 1 : 0) * (1 - w.cover * 0.92);
        const moonVis = (this.moonDir.y > -0.05 ? 1 : 0) * (1 - w.cover * 0.9) * (1 - d);
        this.sun.visible = this.sunHalo.visible = sunVis > 0.02;
        this.sun.material.opacity = sunVis; this.sunHalo.material.opacity = 0.22 * sunVis;
        this.moon.visible = this.moonHalo.visible = moonVis > 0.02;
        this.moon.material.opacity = moonVis; this.moonHalo.material.opacity = 0.16 * moonVis;
        this.stars.material.opacity = (1 - d) * (1 - w.cover) * (w.fog > 0.5 ? 1 : 0.4);

        // farolas encendidas de noche
        if (this.glow) this.glow.material.opacity = smoothstep(0.55, 0.15, d) * 0.95;

        // nubes: más grandes y oscuras con mal tiempo, azuladas de noche
        const layer = this.cloudLayer;
        if (layer) {
            layer.cover = w.cover;
            const m = layer.mesh.material;
            m.color.set(0xffffff).lerp(new THREE.Color(0x6e7787), w.gray * 0.9).multiplyScalar(0.3 + 0.7 * d);
            m.emissive.set(0x4a5566).multiplyScalar(0.25 + 0.75 * d);
        }

        // lluvia
        this.updateRain(dt, cam, w.rain);
    }

    paintSky() {
        const x = this.skyCanvas.getContext('2d');
        const g = x.createLinearGradient(0, 0, 0, 256);
        const css = (c) => '#' + c.getHexString();
        g.addColorStop(0, css(this.top));
        g.addColorStop(0.55, css(this.tmp.copy(this.top).lerp(this.bottom, 0.55)));
        g.addColorStop(1, css(this.bottom));
        x.fillStyle = g; x.fillRect(0, 0, 2, 256);
        this.skyTex.needsUpdate = true;
    }

    updateRain(dt, cam, amount) {
        const show = amount > 0.04;
        this.rain.visible = show;
        if (!show) return;
        const n = Math.floor(this.rainCount * Math.min(1, amount));
        const attr = this.rain.geometry.attributes.position, p = attr.array, o = this.rainOff, sp = this.rainSpeed;
        const slant = 0.18;
        for (let i = 0; i < n; i++) {
            o[i * 3 + 1] -= sp[i] * dt;
            o[i * 3] -= slant * sp[i] * dt;
            if (o[i * 3 + 1] < -8) this.resetDrop(i);
            const x = cam.x + o[i * 3], y = Math.max(0, cam.y + o[i * 3 + 1]), z = cam.z + o[i * 3 + 2];
            p[i * 6] = x; p[i * 6 + 1] = y; p[i * 6 + 2] = z;
            p[i * 6 + 3] = x + slant * 0.9; p[i * 6 + 4] = y + 0.9; p[i * 6 + 5] = z;
        }
        this.rain.geometry.setDrawRange(0, n * 2);
        attr.needsUpdate = true;
        this.rain.material.opacity = 0.18 + 0.4 * Math.min(1, amount);
    }
}
