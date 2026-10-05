// Motor de escenas: construye cada escena, guarda colisiones/NPC/portales y las libera al cambiar.
import * as THREE from 'three';
import { createGround, createHillRing, addOutline, mergeBaked, bake, setSeed, random, range } from '../ProceduralAssets.js';
import { createCharacter, LOOKS } from './Characters.js';
import { createCloud, createPortal, createRelic, createSignboard } from './Buildings.js';

const faceTo = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

// ---------- Colisiones ----------
export class Colliders {
    constructor() { this.list = []; }
    /** r = radio para caminar; cam = radio con el que tapa a la cámara (0 = objeto bajo, no la tapa). */
    circle(x, z, r, cam = 0) { this.list.push({ t: 'c', x, z, r, cam }); }
    /** Rectángulo de ancho w (x local) y fondo d (z local), girado `rot` radianes. cam=false para muros bajos/agua. */
    rect(x, z, w, d, rot = 0, cam = true) {
        this.list.push({ t: 'r', x, z, hw: w / 2, hd: d / 2, cos: Math.cos(rot), sin: Math.sin(rot), cam });
    }
    /** ¿La cámara (círculo de radio pr) queda dentro de algo alto: casas, árboles, carpas? */
    hitsCam(px, pz, pr) {
        for (const c of this.list) {
            if (c.t === 'c') {
                if (!c.cam) continue;
                const dx = px - c.x, dz = pz - c.z, m = pr + c.cam;
                if (dx * dx + dz * dz < m * m) return true;
            } else if (c.cam) {
                const dx = px - c.x, dz = pz - c.z;
                const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
                const ex = lx - Math.max(-c.hw, Math.min(c.hw, lx)), ez = lz - Math.max(-c.hd, Math.min(c.hd, lz));
                if (ex * ex + ez * ez < pr * pr) return true;
            }
        }
        return false;
    }
    /** ¿Un círculo de radio `pr` en (px, pz) toca algo? */
    hits(px, pz, pr) {
        for (const c of this.list) {
            if (c.t === 'c') {
                const dx = px - c.x, dz = pz - c.z, m = pr + c.r;
                if (dx * dx + dz * dz < m * m) return true;
            } else {
                const dx = px - c.x, dz = pz - c.z;
                const lx = dx * c.cos - dz * c.sin;
                const lz = dx * c.sin + dz * c.cos;
                const cx = Math.max(-c.hw, Math.min(c.hw, lx));
                const cz = Math.max(-c.hd, Math.min(c.hd, lz));
                const ex = lx - cx, ez = lz - cz;
                if (ex * ex + ez * ez < pr * pr) return true;
            }
        }
        return false;
    }
}

// ---------- Cielo ----------
function skyTexture(top, bottom) {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#' + new THREE.Color(top).getHexString());
    g.addColorStop(0.55, '#' + new THREE.Color(top).lerp(new THREE.Color(bottom), 0.55).getHexString());
    g.addColorStop(1, '#' + new THREE.Color(bottom).getHexString());
    x.fillStyle = g; x.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function nameTag(name, role) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(20,12,6,0.8)';
    x.beginPath(); x.roundRect(4, 4, 504, 120, 26); x.fill();
    x.fillStyle = '#fff6dc'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 46px sans-serif'; x.fillText(name, 256, 48, 470);
    x.font = '30px sans-serif'; x.fillStyle = '#f2c96b'; x.fillText(role, 256, 94, 470);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(4.6, 1.15, 1);
    return s;
}

const TYPE_COLORS = { Historia: 0xd9822b, Leyenda: 0xa070e0, Turismo: 0x20b2aa, Paisaje: 0x4cc35a };

export class World {
    /**
     * @param {THREE.Scene} scene
     * @param {{ npcs: object[], fragments: object[], inventory: object }} data
     */
    constructor(scene, { npcs, fragments, inventory }) {
        this.scene = scene;
        this.npcData = new Map(npcs.map((n) => [n.npc_id, n]));
        this.fragmentData = new Map(fragments.map((f) => [f.id, f]));
        this.inventory = inventory;
        this.defs = new Map();
        this.current = null;
        this.time = 0;
        this.setupLights();
    }

    register(def) { this.defs.set(def.id, def); }

    setupLights() {
        this.hemi = new THREE.HemisphereLight(0xdcebff, 0xb98a5c, 0.8);
        this.sun = new THREE.DirectionalLight(0xffffff, 2.7);
        this.sunOffset = new THREE.Vector3(26, 46, 20);
        this.sun.position.copy(this.sunOffset);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(2048, 2048);
        Object.assign(this.sun.shadow.camera, { left: -38, right: 38, top: 38, bottom: -38, near: 5, far: 160 });
        this.sun.shadow.bias = -0.0004;
        this.sun.shadow.normalBias = 0.06;
        this.scene.add(this.hemi, this.sun, this.sun.target);
    }

    /** Construye la escena `id`. Devuelve los datos de la escena actual. */
    load(id) {
        const def = this.defs.get(id);
        if (!def) throw new Error(`Escena desconocida: ${id}`);
        this.unload();

        const group = new THREE.Group();
        const statics = new THREE.Group();
        const colliders = new Colliders();
        const cur = {
            id, def, group, colliders, radius: def.radius ?? 40,
            interactables: [], npcs: [], fragments: [], portals: [], dynamics: [], signs: []
        };
        setSeed(def.seed ?? 1);

        const ctx = this.makeContext(cur, statics, colliders);
        def.build(ctx);

        // decorado estático: todo en una malla con un solo contorno
        const merged = mergeBaked(statics);
        addOutline(merged, 0.05);
        group.add(merged);

        // suelo y cerros
        group.add(createGround(700, def.ground ?? 0xc98a5b));
        const hills = createHillRing({
            inner: cur.radius + 24, outer: cur.radius + 78, count: 22,
            colors: def.hillColors, skip: def.hillSkip, minH: 8, maxH: 20
        });
        addOutline(hills, 0.2);
        hills.castShadow = hills.receiveShadow = false;
        group.add(hills);

        // nubes
        for (let i = 0; i < (def.clouds ?? 6); i++) {
            const cloud = createCloud();
            const a = random() * Math.PI * 2, d = range(60, 170);
            cloud.position.set(Math.cos(a) * d, range(38, 62), Math.sin(a) * d);
            cloud.scale.setScalar(range(1.4, 2.6));
            cloud.castShadow = cloud.receiveShadow = false;
            group.add(cloud);
            const speed = range(0.6, 1.6);
            cur.dynamics.push((t, dt) => { cloud.position.x += speed * dt; if (cloud.position.x > 190) cloud.position.x = -190; });
        }

        this.scene.add(group);
        this.scene.background = skyTexture(def.sky[0], def.sky[1]);
        this.scene.fog = new THREE.Fog(def.sky[1], cur.radius * 1.2, cur.radius * 3.6);
        this.hemi.color.set(def.hemiSky ?? 0xdcebff);
        this.hemi.groundColor.set(def.hemiGround ?? 0xb98a5c);

        this.current = cur;
        return cur;
    }

    unload() {
        if (!this.current) return;
        const { group } = this.current;
        this.scene.remove(group);
        group.traverse((o) => {
            if (o.geometry) o.geometry.dispose();
            const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
            mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        });
        if (this.scene.background && this.scene.background.dispose) this.scene.background.dispose();
        this.current = null;
    }

    /** Herramientas que usan las escenas para construirse. */
    makeContext(cur, statics, colliders) {
        const world = this;
        const ctx = {
            colliders,
            faceTo,
            avoid: [],          // zonas que el decorado aleatorio debe respetar: {x, z, r}
            pathSegs: [],       // caminos {x1, z1, x2, z2, w}: el decorado aleatorio no se pone encima
            random, range,

            /** Coloca un objeto horneado en el decorado estático. */
            place(mesh, x, z, { rot = 0, scale = 1, y = 0, collide = 0, camBlock = 0 } = {}) {
                mesh.position.set(x, y, z);
                mesh.rotation.y = rot;
                mesh.scale.setScalar(scale);
                statics.add(mesh);
                if (collide) colliders.circle(x, z, collide, camBlock * scale);
                return mesh;
            },
            /** Colocación + colisión rectangular (casas, iglesia). w y d en unidades locales. */
            placeBox(mesh, x, z, w, d, { rot = 0, scale = 1 } = {}) {
                ctx.place(mesh, x, z, { rot, scale });
                colliders.rect(x, z, w * scale, d * scale, rot);
                return mesh;
            },
            /** Mancha plana de color sobre el suelo (plazas, caminos, charcos). */
            patch(x, z, r, color, { h = 0.05, sy = 1, rot = 0 } = {}) {
                const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12));
                m.userData.color = new THREE.Color(color);
                const g = new THREE.Group();
                g.add(m);
                const baked = bake(g);
                baked.position.set(x, h / 2 + 0.005, z);
                baked.scale.set(1, 1, sy);
                baked.rotation.y = rot;
                baked.castShadow = false;
                statics.add(baked);
                return baked;
            },
            /** Camino recto entre dos puntos. */
            path(x1, z1, x2, z2, width, color) {
                const len = Math.hypot(x2 - x1, z2 - z1);
                const m = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, len));
                m.userData.color = new THREE.Color(color);
                const g = new THREE.Group(); g.add(m);
                const baked = bake(g);
                baked.position.set((x1 + x2) / 2, 0.035, (z1 + z2) / 2);
                baked.rotation.y = Math.atan2(x2 - x1, z2 - z1);
                baked.castShadow = false;
                statics.add(baked);
                ctx.pathSegs.push({ x1, z1, x2, z2, w: width });
            },

            /** ¿(x, z) está a menos de `clear` de un camino? */
            nearPath(x, z, clear) {
                for (const s of ctx.pathSegs) {
                    const dx = s.x2 - s.x1, dz = s.z2 - s.z1;
                    const t = Math.max(0, Math.min(1, ((x - s.x1) * dx + (z - s.z1) * dz) / (dx * dx + dz * dz)));
                    if (Math.hypot(x - (s.x1 + t * dx), z - (s.z1 + t * dz)) < s.w / 2 + clear) return true;
                }
                return false;
            },

            /**
             * Esparce `count` objetos al azar entre rMin y rMax.
             * Nunca los pone sobre casas/objetos ya colocados, caminos, NPC, portales ni el punto de llegada.
             * clear: holgura mínima (en unidades) alrededor de cada objeto.
             */
            scatter(count, make, { rMin = 8, rMax = cur.radius - 3, collide = 0, minGap = 3, center = [0, 0], scale = [1, 1], clear = null, camBlock = 0 } = {}) {
                const placed = [];
                let tries = 0;
                while (placed.length < count && tries++ < count * 60) {
                    const a = random() * Math.PI * 2;
                    const d = Math.sqrt(random()) * (rMax - rMin) + rMin;
                    const x = center[0] + Math.cos(a) * d, z = center[1] + Math.sin(a) * d;
                    const s = range(scale[0], scale[1]);
                    const room = clear ?? (collide * s + 1.2);
                    if (Math.hypot(x, z) > cur.radius - 2 - room) continue;
                    if (ctx.avoid.some((p) => Math.hypot(x - p.x, z - p.z) < p.r + room * 0.5)) continue;
                    if (colliders.hits(x, z, room)) continue;
                    if (ctx.nearPath(x, z, room)) continue;
                    if (placed.some((p) => Math.hypot(x - p.x, z - p.z) < minGap)) continue;
                    ctx.place(make(), x, z, { rot: random() * Math.PI * 2, scale: s, collide: collide * s, camBlock });
                    placed.push({ x, z });
                }
                return placed;
            },

            /** NPC con su look, colisión y marca flotante. `face` = hacia dónde mira cuando está solo. */
            npc(npcId, x, z, face = 0) {
                const data = world.npcData.get(npcId);
                if (!data) { console.warn('NPC sin datos:', npcId); return null; }
                const ch = createCharacter(LOOKS[npcId] ?? {});
                const root = new THREE.Group();
                root.position.set(x, 0, z);
                ch.root.rotation.y = face;
                root.add(ch.root);

                const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), new THREE.MeshBasicMaterial({ color: TYPE_COLORS[data.dialog_type] ?? 0xffffff }));
                marker.position.y = 4.1;
                root.add(marker);

                const [name, role = ''] = data.name.split(' - ');
                const tag = nameTag(name, role);
                tag.position.y = 5.0;
                tag.visible = false;
                root.add(tag);

                root.userData = { ...data, type: 'npc', interactable: true };
                cur.group.add(root);
                cur.npcs.push(root);
                cur.interactables.push(root);
                colliders.circle(x, z, 0.9);
                ctx.avoid.push({ x, z, r: 5 });

                const home = face;
                cur.dynamics.push((t, dt, player) => {
                    const dx = player.x - x, dz = player.z - z;
                    const dist = Math.hypot(dx, dz);
                    const near = dist < 11;
                    let target = near ? Math.atan2(dx, dz) : home;
                    let diff = target - ch.root.rotation.y;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    ch.root.rotation.y += diff * Math.min(1, dt * 5);
                    ch.update(dt, { waving: dist < 7 });
                    marker.position.y = 4.1 + Math.sin(t * 3 + x) * 0.18;
                    marker.rotation.y = t * 2;
                    tag.visible = dist < 15;
                });
                return root;
            },

            /** Fragmento histórico (reliquia). Si ya se recolectó, no aparece. */
            fragment(fragId, x, z) {
                const data = world.fragmentData.get(fragId);
                const relic = createRelic(fragId, data.color);
                relic.root.position.set(x, 0, z);
                const collected = world.inventory.hasFragment(fragId);
                relic.root.userData = { ...data, collected, type: 'fragment', interactable: !collected };
                relic.root.visible = !collected;
                cur.group.add(relic.root);
                cur.fragments.push(relic.root);
                cur.interactables.push(relic.root);
                colliders.circle(x, z, 1.1);
                ctx.avoid.push({ x, z, r: 6 });
                cur.dynamics.push((t) => { if (relic.root.visible) relic.update(t); });
                return relic.root;
            },

            /** Portal hacia otra escena. `spawnKey` identifica desde qué portal se llegó. */
            portal({ label, target, x, z, face, color, y = 0 }) {
                const p = createPortal({ label, target, color });
                p.root.position.set(x, y, z);
                p.root.rotation.y = face ?? faceTo(x, z);
                cur.group.add(p.root);
                cur.portals.push(p.root);
                p.root.userData.pos = { x, z };
                // los dos pilares son obstáculos; el centro queda libre para cruzar
                const c = Math.cos(p.root.rotation.y), s = Math.sin(p.root.rotation.y);
                for (const side of [-1, 1]) colliders.circle(x + c * side * 3, z - s * side * 3, 0.95);
                ctx.avoid.push({ x, z, r: 8 });
                cur.dynamics.push((t) => p.update(t));
                return p.root;
            },

            /** Letrero informativo (se lee con E). */
            sign({ title, description, x, z, rot = 0, subtitle = 'E: leer' }) {
                const s = createSignboard({ title, subtitle, description });
                s.position.set(x, 0, z);
                s.rotation.y = rot;
                cur.group.add(s);
                cur.interactables.push(s);
                cur.signs.push(s);
                colliders.circle(x, z, 1.5);
                ctx.avoid.push({ x, z, r: 4 });
                return s;
            },

            /** Objeto animado: fn(t, dt, jugador). */
            dynamic(obj, fn) {
                if (obj) cur.group.add(obj);
                if (fn) cur.dynamics.push(fn);
                return obj;
            },
            addToScene(obj) { cur.group.add(obj); return obj; }
        };
        return ctx;
    }

    /** Se llama cada frame. player = {x, z}. */
    update(dt, player) {
        const cur = this.current;
        if (!cur) return;
        this.time += dt;
        for (const fn of cur.dynamics) fn(this.time, dt, player);

        // la sombra del sol sigue al jugador
        this.sun.target.position.set(player.x, 0, player.z);
        this.sun.position.set(player.x, 0, player.z).add(this.sunOffset);
    }
}
