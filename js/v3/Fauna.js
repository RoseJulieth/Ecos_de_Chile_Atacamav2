// Fauna de cada zona hecha por código: gaviotas (Bahía Inglesa) y abejas (Desierto Florido).
// Cada módulo devuelve { root, update(t, dt, player), minDistance(player), species }.
// `species` es la ficha que se guarda en el inventario cuando el jugador avista al animal.
import * as THREE from 'three';
import { piece, bake, getToonMaterial, range, random } from '../ProceduralAssets.js';

export const SPECIES = {
    gaviota: {
        id: 'fauna_gaviota', name: 'Gaviota dominicana', icon: '🐦', place: 'Bahía Inglesa', sightRadius: 14,
        info: 'Es una de las aves más comunes de la costa chilena. Vive en grupos en playas y caletas, y se alimenta de peces, moluscos y restos que deja la marea.'
    },
    abeja: {
        id: 'fauna_abeja', name: 'Abeja nativa', icon: '🐝', place: 'Desierto Florido', sightRadius: 8,
        info: 'Cuando el desierto florece, las abejas nativas pasan de flor en flor llevando polen. Esa polinización permite que muchas de las especies del Desierto Florido den semillas.'
    }
};

const smooth = (x) => x * x * (3 - 2 * x);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

// =====================================================================
// GAVIOTAS
// =====================================================================
function buildGull() {
    const root = new THREE.Group();
    const body = new THREE.Group();

    // cuerpo, cabeza y cola (una sola malla)
    const parts = new THREE.Group();
    parts.add(piece(new THREE.SphereGeometry(0.26, 7, 5), 0xf6f6f2, { scale: [1, 0.85, 1.9] }));
    parts.add(piece(new THREE.SphereGeometry(0.17, 7, 5), 0xf6f6f2, { pos: [0, 0.16, 0.52] }));
    parts.add(piece(new THREE.ConeGeometry(0.06, 0.24, 5), 0xf2b400, { pos: [0, 0.14, 0.76], rot: [Math.PI / 2, 0, 0] }));
    parts.add(piece(new THREE.SphereGeometry(0.025, 4, 3), 0xd23b2e, { pos: [0, 0.11, 0.81] }));
    for (const s of [-1, 1]) parts.add(piece(new THREE.SphereGeometry(0.03, 4, 3), 0x1d140b, { pos: [s * 0.1, 0.2, 0.62] }));
    parts.add(piece(new THREE.ConeGeometry(0.2, 0.45, 4), 0xf6f6f2, { pos: [0, 0, -0.62], rot: [-Math.PI / 2, Math.PI / 4, 0], scale: [1, 1, 0.3] }));
    parts.add(piece(new THREE.BoxGeometry(0.34, 0.03, 0.1), 0x15181c, { pos: [0, 0.04, -0.82] }));
    body.add(bake(parts));

    // patas (se esconden en vuelo)
    const legs = new THREE.Group();
    for (const s of [-1, 1]) legs.add(piece(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 4), 0xe8a020, { pos: [s * 0.1, -0.3, 0.05] }));
    const legMesh = bake(legs);
    body.add(legMesh);

    // alas: negro-grisáceo por arriba con punta oscura y borde blanco
    const wing = (side) => {
        const pivot = new THREE.Group();
        const w = new THREE.Group();
        w.add(piece(new THREE.BoxGeometry(0.55, 0.04, 0.42), 0x4a5058, { pos: [side * 0.28, 0, -0.02] }));
        w.add(piece(new THREE.BoxGeometry(0.4, 0.04, 0.34), 0x15181c, { pos: [side * 0.74, 0, -0.04] }));
        w.add(piece(new THREE.BoxGeometry(0.55, 0.035, 0.08), 0xf6f6f2, { pos: [side * 0.28, 0, -0.25] }));
        pivot.add(bake(w));
        pivot.position.set(side * 0.16, 0.1, 0.12);
        return pivot;
    };
    const wingL = wing(-1), wingR = wing(1);
    body.add(wingL, wingR);
    root.add(body);

    root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { root, body, wingL, wingR, legMesh };
}

class Gull {
    /**
     * @param home posición donde se posa {x, z} (null = siempre vuela)
     * @param orbit {cx, cz, r, h, w} órbita de vuelo
     */
    constructor(home, orbit) {
        const g = buildGull();
        Object.assign(this, g);
        this.home = home;
        this.orbit = orbit;
        this.theta = random() * Math.PI * 2;
        this.phase = random() * 10;
        this.state = home ? 'perch' : 'fly';
        this.blend = this.state === 'perch' ? 0 : 1;
        this.timer = range(6, 12);
        this.pos = new THREE.Vector3();
        this.prev = new THREE.Vector3();
        this.orbitPoint(0);
        this.root.scale.setScalar(1.15);
    }

    orbitPoint(t, out = this.pos) {
        const o = this.orbit;
        return out.set(o.cx + Math.cos(this.theta) * o.r, o.h + Math.sin(t * 0.9 + this.phase) * 0.7, o.cz + Math.sin(this.theta) * o.r * 0.8);
    }

    update(t, dt, player) {
        const o = this.orbit;
        const dPlayer = this.home ? Math.hypot(player.x - this.home.x, player.z - this.home.z) : 99;
        this.prev.copy(this.pos);

        if (this.state === 'perch') {
            this.pos.set(this.home.x, 0.38, this.home.z);
            if (dPlayer < 6.5) { this.state = 'takeoff'; this.blend = 0; this.timer = range(10, 16); this.theta = Math.atan2(this.home.z - o.cz, this.home.x - o.cx); }
        } else if (this.state === 'takeoff') {
            this.blend = Math.min(1, this.blend + dt / 1.5);
            this.theta += o.w * dt;
            const target = this.orbitPoint(t, new THREE.Vector3());
            const k = smooth(this.blend);
            this.pos.set(
                THREE.MathUtils.lerp(this.home.x, target.x, k),
                THREE.MathUtils.lerp(0.38, target.y, k * k) + Math.sin(k * Math.PI) * 1.2,
                THREE.MathUtils.lerp(this.home.z, target.z, k)
            );
            if (this.blend >= 1) this.state = 'fly';
        } else if (this.state === 'fly') {
            this.theta += o.w * dt;
            this.orbitPoint(t);
            if (this.home) {
                this.timer -= dt;
                if (this.timer <= 0 && dPlayer > 9) { this.state = 'landing'; this.blend = 0; }
            }
        } else if (this.state === 'landing') {
            this.blend = Math.min(1, this.blend + dt / 2.6);
            this.theta += o.w * dt * (1 - this.blend * 0.7);
            const from = this.orbitPoint(t, new THREE.Vector3());
            const k = smooth(this.blend);
            this.pos.set(
                THREE.MathUtils.lerp(from.x, this.home.x, k),
                THREE.MathUtils.lerp(from.y, 0.38, k * (2 - k)),
                THREE.MathUtils.lerp(from.z, this.home.z, k)
            );
            if (dPlayer < 6) { this.state = 'takeoff'; this.blend = 0; this.timer = range(10, 16); }
            else if (this.blend >= 1) { this.state = 'perch'; this.timer = range(6, 12); }
        }

        this.root.position.copy(this.pos);

        const vx = this.pos.x - this.prev.x, vz = this.pos.z - this.prev.z, vy = this.pos.y - this.prev.y;
        const moving = Math.hypot(vx, vz) > 0.0005;
        if (moving) {
            const targetYaw = Math.atan2(vx, vz);
            let diff = targetYaw - this.root.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.root.rotation.y += diff * Math.min(1, dt * 6);
        }

        const flying = this.state !== 'perch';
        if (flying) {
            // aleteo: rápido al despegar y aterrizar, planeo suave en el aire
            const busy = this.state === 'fly' ? 0 : 1;
            const rate = busy ? 11 : 4.5 + Math.sin(t * 0.7 + this.phase) * 1.2;
            const amp = busy ? 0.75 : 0.45;
            const flap = Math.sin(t * rate + this.phase) * amp + (busy ? 0 : -0.1);
            this.wingR.rotation.z = flap; this.wingL.rotation.z = -flap;
            this.wingR.scale.x = this.wingL.scale.x = 1;
            this.legMesh.visible = this.state === 'landing' && this.blend > 0.6;
            this.body.rotation.z = THREE.MathUtils.lerp(this.body.rotation.z, -Math.max(-0.5, Math.min(0.5, o.w * 0.9)), dt * 3); // se inclina al girar
            this.body.rotation.x = THREE.MathUtils.lerp(this.body.rotation.x, vy > 0 ? -0.25 : 0.12, dt * 3);
        } else {
            // posada: alas plegadas y cabeceo
            this.wingR.rotation.z = -1.25; this.wingL.rotation.z = 1.25;
            this.wingR.scale.x = this.wingL.scale.x = 0.55;
            this.legMesh.visible = true;
            this.body.rotation.z = 0;
            this.body.rotation.x = Math.sin(t * 2.2 + this.phase) * 0.06 + (Math.sin(t * 0.6 + this.phase * 3) > 0.92 ? 0.35 : 0);
            this.root.rotation.y += Math.sin(t * 0.4 + this.phase) * 0.003;
        }
    }
}

/**
 * Bandada de gaviotas.
 * flyers: cuántas vuelan siempre; perches: lista de {x, z} donde se posan (despegan si te acercas).
 */
export function createSeagulls({ center = [0, -22], flyers = 5, perches = [], radius = 14 } = {}) {
    const root = new THREE.Group();
    const gulls = [];
    for (let i = 0; i < flyers; i++) {
        const g = new Gull(null, {
            cx: center[0] + range(-14, 14), cz: center[1] + range(-6, 8),
            r: range(radius * 0.5, radius), h: range(9, 15), w: (i % 2 ? 1 : -1) * range(0.28, 0.45)
        });
        gulls.push(g);
    }
    for (const p of perches) {
        gulls.push(new Gull(p, { cx: p.x + range(-6, 6), cz: p.z + range(-12, -2), r: range(6, 10), h: range(8, 12), w: (random() > 0.5 ? 1 : -1) * range(0.35, 0.55) }));
    }
    gulls.forEach((g) => root.add(g.root));

    return {
        root,
        species: SPECIES.gaviota,
        update(t, dt, player) { gulls.forEach((g) => g.update(t, dt, player)); },
        minDistance(player) {
            let best = Infinity;
            for (const g of gulls) best = Math.min(best, Math.hypot(g.pos.x - player.x, g.pos.z - player.z));
            return best;
        },
        gulls
    };
}

// =====================================================================
// ABEJAS (instanciadas: todas las abejas = 2 draw calls)
// =====================================================================
function beeBodyGeometry() {
    const g = new THREE.Group();
    g.add(piece(new THREE.SphereGeometry(0.13, 7, 5), 0xf2c200, { scale: [1, 0.9, 1.5] }));
    for (const z of [-0.07, 0.05]) g.add(piece(new THREE.SphereGeometry(0.125, 7, 5), 0x1d140b, { pos: [0, 0, z], scale: [1.02, 0.92, 0.28] }));
    g.add(piece(new THREE.SphereGeometry(0.085, 6, 5), 0x1d140b, { pos: [0, 0.01, 0.2] }));
    g.add(piece(new THREE.ConeGeometry(0.03, 0.1, 4), 0x1d140b, { pos: [0, -0.01, -0.25], rot: [-Math.PI / 2, 0, 0] }));
    for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.02, 4, 3), 0xffffff, { pos: [s * 0.045, 0.04, 0.26] }));
    return bake(g).geometry;
}

export function createBees({ patches = [], count = 20 } = {}) {
    const root = new THREE.Group();
    const bodies = new THREE.InstancedMesh(beeBodyGeometry(), getToonMaterial(), count);
    const wingGeo = new THREE.PlaneGeometry(0.26, 0.15);
    wingGeo.translate(0.13, 0, 0);          // la base del ala queda en el cuerpo
    wingGeo.rotateX(-Math.PI / 2);
    const wingMat = new THREE.MeshBasicMaterial({ color: 0xe9f6ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
    const wingsR = new THREE.InstancedMesh(wingGeo, wingMat, count);
    const wingsL = new THREE.InstancedMesh(wingGeo, wingMat, count);
    for (const m of [bodies, wingsR, wingsL]) { m.frustumCulled = false; m.castShadow = false; root.add(m); }
    bodies.castShadow = true;

    const bees = [];
    for (let i = 0; i < count; i++) {
        bees.push({
            ph: random() * 20, r: range(0.5, 1.5), h: range(0.9, 1.9), w: range(1.1, 2.0) * (random() > 0.5 ? 1 : -1),
            target: new THREE.Vector3(), from: new THREE.Vector3(), blend: 1, retarget: range(2, 9),
            pos: new THREE.Vector3(), prev: new THREE.Vector3(), yaw: 0
        });
    }

    function pickTarget(b, player) {
        const near = patches.filter((p) => Math.hypot(p.x - player.x, p.z - player.z) < 26);
        const list = near.length ? near : patches;
        const p = list[Math.floor(random() * list.length)] || { x: player.x, z: player.z };
        b.from.copy(b.target);
        b.target.set(p.x + range(-2.6, 2.6), 0, p.z + range(-2.6, 2.6));
        b.blend = 0;
        b.retarget = range(5, 13);
    }

    let started = false;
    const body = new THREE.Matrix4(), wingLocal = new THREE.Matrix4(), out = new THREE.Matrix4();
    const q = new THREE.Quaternion(), qw = new THREE.Quaternion(), p = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
    const sBody = new THREE.Vector3(1.25, 1.25, 1.25), mirror = new THREE.Vector3(-1, 1, 1);
    const wingPos = new THREE.Vector3(), euler = new THREE.Euler(), up = THREE.Object3D.DEFAULT_UP;

    function update(t, dt, player) {
        if (!started) {
            bees.forEach((b) => { pickTarget(b, player); b.from.copy(b.target); b.pos.copy(b.target); });
            started = true;
        }
        for (let i = 0; i < count; i++) {
            const b = bees[i];
            b.retarget -= dt;
            if (b.retarget <= 0) pickTarget(b, player);
            b.blend = Math.min(1, b.blend + dt / 2.4);
            const k = smooth(b.blend);
            const cx = THREE.MathUtils.lerp(b.from.x, b.target.x, k), cz = THREE.MathUtils.lerp(b.from.z, b.target.z, k);

            // vuelo errático alrededor de una flor: círculo + vaivén + sacudidas
            const a = t * b.w + b.ph;
            b.prev.copy(b.pos);
            b.pos.set(
                cx + Math.cos(a) * b.r + Math.sin(t * 3.1 + b.ph) * 0.12,
                b.h + Math.sin(a * 2) * 0.28 + Math.sin(t * 7 + b.ph) * 0.05,
                cz + Math.sin(a) * b.r * 0.8 + Math.cos(t * 2.7 + b.ph) * 0.12
            );

            const vx = b.pos.x - b.prev.x, vz = b.pos.z - b.prev.z;
            if (Math.hypot(vx, vz) > 0.0002) {
                const ty = Math.atan2(vx, vz);
                let d = ty - b.yaw;
                while (d > Math.PI) d -= Math.PI * 2;
                while (d < -Math.PI) d += Math.PI * 2;
                b.yaw += d * Math.min(1, dt * 8);
            }
            q.setFromAxisAngle(up, b.yaw);
            euler.set(Math.sin(t * 5 + b.ph) * 0.12, 0, Math.sin(t * 4 + b.ph) * 0.12);
            qw.setFromEuler(euler);
            q.multiply(qw);

            body.compose(b.pos, q, sBody);
            bodies.setMatrixAt(i, body);

            // alas: baten muy rápido, un lado cada vez (rotación en el eje del cuerpo)
            const flap = Math.sin(t * 60 + b.ph) * 0.9 + 0.15;
            for (const side of [1, -1]) {
                wingPos.set(side * 0.06, 0.1, 0.02);
                euler.set(0, 0, side * flap);
                qw.setFromEuler(euler);
                wingLocal.compose(wingPos, qw, side === 1 ? one : mirror);
                out.multiplyMatrices(body, wingLocal);
                (side === 1 ? wingsR : wingsL).setMatrixAt(i, out);
            }
        }
        bodies.instanceMatrix.needsUpdate = true;
        wingsR.instanceMatrix.needsUpdate = true;
        wingsL.instanceMatrix.needsUpdate = true;
    }

    return {
        root,
        species: SPECIES.abeja,
        update,
        minDistance(player) {
            let best = Infinity;
            for (const b of bees) best = Math.min(best, Math.hypot(b.pos.x - player.x, b.pos.z - player.z));
            return best;
        },
        bees
    };
}
