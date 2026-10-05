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
    gato: {
        id: 'fauna_gato', name: 'Gato de plaza', icon: '🐈', place: 'Copiapó', sightRadius: 9,
        info: 'Los gatos son habitantes tranquilos de las plazas y casas de Copiapó. Son tímidos: se acercan solo cuando quieren, y se alejan si te acercas demasiado rápido.'
    },
    perro: {
        id: 'fauna_perro', name: 'Quiltro', icon: '🐕', place: 'Copiapó', sightRadius: 9,
        info: 'En Chile, a los perros callejeros sin raza definida se les llama "quiltros". Son simpáticos, sociables y suelen acompañar a las personas por las calles del pueblo.'
    },
    zorro: {
        id: 'fauna_zorro', name: 'Zorro culpeo', icon: '🦊', place: 'Batallón Atacama', sightRadius: 12,
        info: 'Es el zorro más grande de Chile. Vive desde el desierto de Atacama hasta Tierra del Fuego, caza roedores y aves, y es muy desconfiado: huye apenas siente a una persona.'
    },
    diuca: {
        id: 'fauna_diuca', name: 'Diuca', icon: '🐦', place: 'Cultura Diaguita', sightRadius: 10,
        info: 'La diuca es un pajarito gris con la garganta y el vientre blancos, muy común en el norte y centro de Chile. Anda en grupos y se alimenta de semillas.'
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
        this.flapPhase = random() * 6.28;
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
            // Aleteo lento y tranquilo, con tramos de planeo. La fase se ACUMULA (fase += velocidad * dt):
            // calcular sin(t * velocidad) con una velocidad cambiante hace que la frecuencia crezca con el tiempo.
            const busy = this.state === 'fly' ? 0 : 1;
            const glide = busy ? 0 : smooth(clamp01((Math.sin(t * 0.45 + this.phase * 2) - 0.2) / 0.6)); // 0 = batir, 1 = planear
            const rate = busy ? 6.5 : 3.2;                 // rad/s -> ~1 y ~0.5 aleteos por segundo
            this.flapPhase += dt * rate;
            const amp = busy ? 0.7 : 0.42 * (1 - glide) + 0.1 * glide;
            const flap = Math.sin(this.flapPhase) * amp + (busy ? -0.05 : 0.12 * glide);
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


// =====================================================================
// CUADRÚPEDOS: gatos, perros y zorros culpeo
// =====================================================================
const BREEDS = {
    gato: { L: 0.95, H: 0.5, W: 0.42, legLen: 0.32, legR: 0.07, headR: 0.24, snout: 0.1, ear: 'tri', earH: 0.2, tail: 'up', tailLen: 0.75, speed: 1.4, run: 5 },
    perro: { L: 1.25, H: 0.62, W: 0.5, legLen: 0.45, legR: 0.09, headR: 0.29, snout: 0.26, ear: 'drop', earH: 0.2, tail: 'perk', tailLen: 0.7, speed: 2.0, run: 5.2 },
    zorro: { L: 1.3, H: 0.58, W: 0.44, legLen: 0.5, legR: 0.075, headR: 0.25, snout: 0.34, ear: 'big', earH: 0.4, tail: 'bushy', tailLen: 0.95, speed: 1.6, run: 7.5 }
};

const COATS = {
    gato: [
        { main: 0xe08a3c, belly: 0xf6e7d2, face: 0xe08a3c, leg: 0xe08a3c, paw: 0xf6e7d2, tailTip: 0xb5601f, ear: 0xe08a3c },
        { main: 0x7d838c, belly: 0xdfe2e6, face: 0x7d838c, leg: 0x7d838c, paw: 0xdfe2e6, tailTip: 0x5a5f66, ear: 0x7d838c },
        { main: 0x26262b, belly: 0x3a3a42, face: 0x26262b, leg: 0x26262b, paw: 0x26262b, tailTip: 0x26262b, ear: 0x26262b }
    ],
    perro: [
        { main: 0xa87442, belly: 0xf1e2c6, face: 0xa87442, leg: 0xa87442, paw: 0xf1e2c6, tailTip: 0xf1e2c6, ear: 0x6e4a26 },
        { main: 0x2f2f35, belly: 0xf3f3f0, face: 0x2f2f35, leg: 0x2f2f35, paw: 0xf3f3f0, tailTip: 0xf3f3f0, ear: 0x2f2f35 },
        { main: 0xd8c39a, belly: 0xf7efdc, face: 0xd8c39a, leg: 0xd8c39a, paw: 0xf7efdc, tailTip: 0xd8c39a, ear: 0xb89a66 }
    ],
    zorro: [
        { main: 0x9b7a52, belly: 0xf0e6d2, face: 0xb5703c, leg: 0xb5703c, paw: 0x2b2118, tailTip: 0x1d140b, ear: 0xb5703c },
        { main: 0x8a7552, belly: 0xece0c8, face: 0xa8682f, leg: 0xa8682f, paw: 0x2b2118, tailTip: 0x1d140b, ear: 0xa8682f }
    ]
};

function buildQuadruped(kind, coat) {
    const c = BREEDS[kind];
    const root = new THREE.Group();
    const bodyY = c.legLen + c.H * 0.5;

    const torso = new THREE.Group();
    torso.add(piece(new THREE.SphereGeometry(0.5, 8, 6), coat.main, { pos: [0, bodyY, 0], scale: [c.W, c.H, c.L] }));
    torso.add(piece(new THREE.SphereGeometry(0.5, 7, 5), coat.belly, { pos: [0, bodyY - c.H * 0.2, 0.02], scale: [c.W * 0.9, c.H * 0.55, c.L * 0.78] }));
    torso.add(piece(new THREE.SphereGeometry(0.5, 7, 5), coat.main, { pos: [0, bodyY + c.H * 0.12, c.L * 0.34], scale: [c.W * 0.85, c.H * 0.9, c.L * 0.36] }));
    // cabeza
    const hy = bodyY + c.H * 0.5, hz = c.L * 0.52;
    torso.add(piece(new THREE.SphereGeometry(c.headR, 8, 6), coat.face, { pos: [0, hy, hz], scale: [1, 0.92, 1] }));
    torso.add(piece(new THREE.ConeGeometry(c.headR * 0.55, c.snout + c.headR * 0.4, 6), coat.face, { pos: [0, hy - c.headR * 0.12, hz + c.headR * 0.8 + c.snout * 0.35], rot: [Math.PI / 2, 0, 0] }));
    torso.add(piece(new THREE.SphereGeometry(c.headR * 0.17, 5, 4), 0x15110d, { pos: [0, hy - c.headR * 0.08, hz + c.headR + c.snout * 0.85] }));
    if (kind !== 'perro') torso.add(piece(new THREE.SphereGeometry(c.headR * 0.5, 6, 5), coat.belly, { pos: [0, hy - c.headR * 0.35, hz + c.headR * 0.55], scale: [1, 0.55, 0.8] }));
    for (const s of [-1, 1]) {
        torso.add(piece(new THREE.SphereGeometry(c.headR * 0.14, 5, 4), 0x15110d, { pos: [s * c.headR * 0.45, hy + c.headR * 0.18, hz + c.headR * 0.78] }));
        // orejas
        if (c.ear === 'drop') torso.add(piece(new THREE.SphereGeometry(c.headR * 0.45, 6, 5), coat.ear, { pos: [s * c.headR * 0.85, hy + c.headR * 0.05, hz - c.headR * 0.1], scale: [0.45, 1.05, 0.8] }));
        else torso.add(piece(new THREE.ConeGeometry(c.headR * (c.ear === 'big' ? 0.5 : 0.42), c.earH, 4), coat.ear, { pos: [s * c.headR * 0.62, hy + c.headR * 0.95, hz - c.headR * 0.15], rot: [0, 0, -s * 0.18] }));
    }
    const torsoMesh = bake(torso);
    root.add(torsoMesh);

    // patas (pivote en la cadera)
    const legs = [];
    for (const [sx, sz] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
        const pivot = new THREE.Group();
        pivot.position.set(sx * c.W * 0.3, c.legLen + c.H * 0.1, sz * c.L * 0.3);
        const lg = new THREE.Group();
        lg.add(piece(new THREE.CylinderGeometry(c.legR, c.legR * 0.8, c.legLen + c.H * 0.1, 5), coat.leg, { pos: [0, -(c.legLen + c.H * 0.1) / 2, 0] }));
        lg.add(piece(new THREE.SphereGeometry(c.legR * 1.25, 5, 4), coat.paw, { pos: [0, -(c.legLen + c.H * 0.1) + c.legR * 0.7, c.legR * 0.5], scale: [1, 0.7, 1.4] }));
        pivot.add(bake(lg));
        root.add(pivot);
        legs.push(pivot);
    }

    // cola
    const tail = new THREE.Group();
    tail.position.set(0, bodyY + c.H * 0.1, -c.L * 0.5);
    const tg = new THREE.Group();
    if (c.tail === 'bushy') {
        tg.add(piece(new THREE.SphereGeometry(0.5, 7, 5), coat.main, { pos: [0, -0.05, -c.tailLen * 0.4], scale: [0.34, 0.34, c.tailLen] }));
        tg.add(piece(new THREE.SphereGeometry(0.5, 6, 5), coat.tailTip, { pos: [0, -0.07, -c.tailLen * 0.88], scale: [0.3, 0.3, 0.32] }));
        tail.rotation.x = 0.5;
    } else {
        tg.add(piece(new THREE.CapsuleGeometry(c.legR * 0.8, c.tailLen, 2, 5), coat.main, { pos: [0, c.tailLen * 0.5, 0] }));
        tg.add(piece(new THREE.SphereGeometry(c.legR * 0.9, 5, 4), coat.tailTip, { pos: [0, c.tailLen + c.legR, 0] }));
        tail.rotation.x = kind === 'gato' ? -0.35 : -0.9;
    }
    tail.add(bake(tg));
    root.add(tail);

    root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { root, torso: torsoMesh, legs, tail, cfg: c, tailBase: tail.rotation.x };
}

/** Busca un punto libre de obstáculos cerca de (x, z). */
function freeSpot(colliders, x, z, r = 0.7) {
    if (!colliders || !colliders.hits(x, z, r)) return { x, z };
    for (let d = 1; d <= 10; d += 1) {
        for (let a = 0; a < 12; a++) {
            const px = x + Math.cos((a / 12) * Math.PI * 2) * d, pz = z + Math.sin((a / 12) * Math.PI * 2) * d;
            if (!colliders.hits(px, pz, r)) return { x: px, z: pz };
        }
    }
    return { x, z };
}

const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

class Animal {
    constructor(kind, coat, home, { colliders, limit, roam = 8 }) {
        Object.assign(this, buildQuadruped(kind, coat));
        this.kind = kind;
        this.colliders = colliders;
        this.limit = limit;
        this.roam = roam;
        const h = freeSpot(colliders, home.x, home.z);
        this.home = h;
        this.pos = new THREE.Vector3(h.x, 0, h.z);
        this.yaw = random() * Math.PI * 2;
        this.state = 'idle';
        this.timer = range(1, 5);
        this.target = { x: h.x, z: h.z };
        this.gait = random() * 6;
        this.speed = 0;
        this.phase = random() * 10;
        this.fleeTime = 0;
        this.root.position.copy(this.pos);
    }

    pickTarget() {
        for (let i = 0; i < 12; i++) {
            const a = random() * Math.PI * 2, d = range(3, this.roam);
            const x = this.home.x + Math.cos(a) * d, z = this.home.z + Math.sin(a) * d;
            if (Math.hypot(x, z) < this.limit - 3 && !this.colliders.hits(x, z, 0.6)) { this.target = { x, z }; return; }
        }
        this.target = { x: this.home.x, z: this.home.z };
    }

    /** Camina hacia (tx, tz) a velocidad v; devuelve true si llegó o quedó bloqueado. */
    stepTo(tx, tz, v, dt) {
        const dx = tx - this.pos.x, dz = tz - this.pos.z, dist = Math.hypot(dx, dz);
        if (dist < 0.4) { this.speed = 0; return true; }
        const want = Math.atan2(dx, dz);
        this.yaw += angDiff(want, this.yaw) * Math.min(1, dt * 7);
        const step = Math.min(dist, v * dt);
        const nx = this.pos.x + Math.sin(this.yaw) * step, nz = this.pos.z + Math.cos(this.yaw) * step;
        if (Math.hypot(nx, nz) > this.limit - 2.5 || this.colliders.hits(nx, nz, 0.5)) { this.speed = 0; return true; }
        this.pos.x = nx; this.pos.z = nz; this.speed = v;
        return false;
    }

    update(t, dt, player) {
        const c = this.cfg;
        const dx = player.x - this.pos.x, dz = player.z - this.pos.z, dP = Math.hypot(dx, dz);
        this.timer -= dt;
        let wag = 0.25, v = 0;

        if (this.kind === 'gato') {
            if (dP < 3.6 && this.state !== 'flee') { this.state = 'flee'; this.fleeTime = range(1.2, 2.2); }
            if (this.state === 'flee') {
                const away = Math.atan2(-dx, -dz);
                const tx = this.pos.x + Math.sin(away) * 6, tz = this.pos.z + Math.cos(away) * 6;
                if (this.stepTo(tx, tz, c.run, dt)) { /* bloqueado: sigue */ }
                v = c.run; this.fleeTime -= dt;
                if (this.fleeTime <= 0) { this.state = 'idle'; this.timer = range(3, 7); this.home = { x: this.pos.x, z: this.pos.z }; }
            } else if (this.state === 'idle') {
                if (this.timer <= 0) { this.state = 'walk'; this.pickTarget(); }
            } else if (this.state === 'walk') {
                if (this.stepTo(this.target.x, this.target.z, c.speed, dt)) { this.state = 'idle'; this.timer = range(4, 10); }
                v = c.speed;
            }
        } else if (this.kind === 'perro') {
            if (dP < 16 && dP > 4.2) {                       // curioso: viene a saludar
                this.state = 'follow';
                const run = dP > 9;
                this.stepTo(player.x, player.z, run ? c.run : c.speed * 1.4, dt);
                v = run ? c.run : c.speed * 1.4; wag = 1.4;
            } else if (dP <= 4.2) {                          // cerca: se queda moviendo la cola, mirándote
                this.state = 'greet';
                this.yaw += angDiff(Math.atan2(dx, dz), this.yaw) * Math.min(1, dt * 5);
                v = 0; wag = 2.2;
            } else if (this.state === 'idle') {
                if (this.timer <= 0) { this.state = 'walk'; this.pickTarget(); }
            } else if (this.state === 'walk') {
                if (this.stepTo(this.target.x, this.target.z, c.speed, dt)) { this.state = 'idle'; this.timer = range(2, 6); }
                v = c.speed;
            } else { this.state = 'idle'; this.timer = range(1, 3); }
        } else {                                             // zorro: desconfiado
            if (dP < 8 && this.state !== 'flee') { this.state = 'flee'; this.fleeTime = range(2.5, 4); }
            if (this.state === 'flee') {
                const away = Math.atan2(-dx, -dz);
                this.stepTo(this.pos.x + Math.sin(away) * 8, this.pos.z + Math.cos(away) * 8, c.run, dt);
                v = c.run; this.fleeTime -= dt;
                if (this.fleeTime <= 0 && dP > 11) { this.state = 'idle'; this.timer = range(4, 8); }
            } else if (this.state === 'idle') {
                if (this.timer <= 0) { this.state = 'walk'; this.pickTarget(); }
            } else if (this.state === 'walk') {
                if (this.stepTo(this.target.x, this.target.z, c.speed, dt)) { this.state = 'idle'; this.timer = range(3, 9); }
                v = c.speed;
            }
        }

        // animación
        this.root.position.copy(this.pos);
        this.root.rotation.y = this.yaw;
        const moving = v > 0.05 && this.speed > 0.05;
        this.gait += dt * (moving ? 3.2 * this.speed + 3 : 0);
        const amp = moving ? Math.min(0.9, 0.35 + this.speed * 0.1) : 0;
        const s = Math.sin(this.gait) * amp;
        this.legs[0].rotation.x = s; this.legs[3].rotation.x = s;
        this.legs[1].rotation.x = -s; this.legs[2].rotation.x = -s;
        this.torso.position.y = moving ? Math.abs(Math.sin(this.gait)) * 0.05 : 0;
        this.torso.rotation.x = moving && this.speed > 4 ? -0.08 : Math.sin(t * 1.6 + this.phase) * 0.01;
        this.tail.rotation.y = Math.sin(t * (3 + wag * 6) + this.phase) * 0.3 * wag;
        this.tail.rotation.x = this.tailBase + (moving && this.kind === 'zorro' ? -0.35 : 0);
    }
}

function createHerd(kind, species, { colliders, limit, homes, roam = 8 }) {
    const root = new THREE.Group();
    const coats = COATS[kind];
    const animals = homes.map((h, i) => new Animal(kind, coats[i % coats.length], h, { colliders, limit, roam }));
    animals.forEach((a) => root.add(a.root));
    return {
        root, species, animals,
        update(t, dt, player) { animals.forEach((a) => a.update(t, dt, player)); },
        minDistance(player) { let m = Infinity; for (const a of animals) m = Math.min(m, Math.hypot(a.pos.x - player.x, a.pos.z - player.z)); return m; }
    };
}

export const createCats = (opts) => createHerd('gato', SPECIES.gato, opts);
export const createDogs = (opts) => createHerd('perro', SPECIES.perro, opts);
export const createFoxes = (opts) => createHerd('zorro', SPECIES.zorro, opts);

// =====================================================================
// DIUCAS (pajaritos que saltan entre perchas)
// =====================================================================
function buildSmallBird() {
    const root = new THREE.Group();
    const body = new THREE.Group();
    const parts = new THREE.Group();
    parts.add(piece(new THREE.SphereGeometry(0.13, 7, 5), 0x808c9c, { scale: [1, 0.95, 1.45] }));
    parts.add(piece(new THREE.SphereGeometry(0.1, 7, 5), 0xf4f4f1, { pos: [0, -0.04, 0.03], scale: [0.9, 0.7, 1.15] }));
    parts.add(piece(new THREE.SphereGeometry(0.088, 6, 5), 0x808c9c, { pos: [0, 0.1, 0.15] }));
    parts.add(piece(new THREE.SphereGeometry(0.05, 5, 4), 0xf4f4f1, { pos: [0, 0.07, 0.22], scale: [1, 0.7, 0.7] }));
    parts.add(piece(new THREE.ConeGeometry(0.03, 0.09, 4), 0x2b2b2e, { pos: [0, 0.1, 0.27], rot: [Math.PI / 2, 0, 0] }));
    for (const s of [-1, 1]) parts.add(piece(new THREE.SphereGeometry(0.014, 4, 3), 0x15110d, { pos: [s * 0.055, 0.12, 0.215] }));
    parts.add(piece(new THREE.BoxGeometry(0.1, 0.02, 0.2), 0x4a5260, { pos: [0, 0.01, -0.22], rot: [0.15, 0, 0] }));
    body.add(bake(parts));
    const legs = bake(new THREE.Group().add(
        piece(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 3), 0x3a3a3a, { pos: [-0.04, -0.14, 0.02] }),
        piece(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 3), 0x3a3a3a, { pos: [0.04, -0.14, 0.02] })
    ));
    body.add(legs);
    const wing = (side) => {
        const p = new THREE.Group();
        p.add(bake(new THREE.Group().add(piece(new THREE.BoxGeometry(0.2, 0.015, 0.14), 0x5d6776, { pos: [side * 0.1, 0, -0.02] }))));
        p.position.set(side * 0.09, 0.05, 0.02);
        return p;
    };
    const wingL = wing(-1), wingR = wing(1);
    body.add(wingL, wingR);
    root.add(body);
    root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    return { root, body, legs, wingL, wingR };
}

/**
 * Pajaritos que viven en las perchas dadas ([{x, y, z}, ...]): se quedan quietos cabeceando,
 * y de vez en cuando vuelan a otra percha. Se asustan si te acercas mucho.
 */
export function createBirds({ perches = [], count = 7 } = {}) {
    const root = new THREE.Group();
    const birds = [];
    for (let i = 0; i < count; i++) {
        const b = buildSmallBird();
        const start = perches[Math.floor(random() * perches.length)];
        Object.assign(b, {
            perch: start, from: start, to: start, flight: 1, dur: 1, arc: 1, timer: range(1, 6),
            pos: new THREE.Vector3(start.x, start.y, start.z), yaw: random() * 6.28, phase: random() * 10, flap: 0
        });
        root.add(b.root);
        birds.push(b);
    }
    const taken = () => new Set(birds.map((b) => b.to));

    function update(t, dt, player) {
        for (const b of birds) {
            const dP = Math.hypot(player.x - b.pos.x, player.z - b.pos.z);
            b.timer -= dt;
            if (b.flight >= 1) {
                // posado
                if ((b.timer <= 0 || dP < 3.2) && perches.length > 1) {
                    const used = taken();
                    const options = perches.filter((p) => p !== b.perch && !used.has(p) && Math.hypot(p.x - player.x, p.z - player.z) > 2);
                    if (options.length) {
                        b.from = b.perch; b.to = options[Math.floor(random() * options.length)];
                        b.flight = 0; b.dur = range(0.9, 1.7); b.arc = range(1.2, 2.6);
                        b.timer = range(3, 8);
                        b.yaw = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
                    } else b.timer = 1.5;
                }
            } else {
                b.flight = Math.min(1, b.flight + dt / b.dur);
                const k = b.flight;
                b.pos.set(
                    b.from.x + (b.to.x - b.from.x) * k,
                    b.from.y + (b.to.y - b.from.y) * k + Math.sin(k * Math.PI) * b.arc,
                    b.from.z + (b.to.z - b.from.z) * k
                );
                if (b.flight >= 1) b.perch = b.to;
            }

            b.root.position.copy(b.pos);
            const flying = b.flight < 1;
            if (flying) {
                b.flap += dt * 30;                                   // aleteo rápido y corto (pajarito)
                const f = Math.sin(b.flap) * 0.9;
                b.wingR.rotation.z = f; b.wingL.rotation.z = -f;
                b.legs.visible = false;
                b.root.rotation.y = b.yaw;
                b.body.rotation.x = -0.25 + Math.cos(b.flight * Math.PI) * -0.25;
            } else {
                b.wingR.rotation.z = -0.55; b.wingL.rotation.z = 0.55;
                b.legs.visible = true;
                b.body.rotation.x = Math.sin(t * 5 + b.phase) * 0.08;                 // cabeceo
                b.root.rotation.y += Math.sin(t * 0.9 + b.phase * 3) * 0.01 + (Math.sin(t * 0.35 + b.phase) > 0.97 ? 0.06 : 0);
                b.root.position.y += 0.19;                                               // las patas apoyan en la percha
            }
        }
    }

    return {
        root, species: SPECIES.diuca, update, birds,
        minDistance(player) { let m = Infinity; for (const b of birds) m = Math.min(m, Math.hypot(b.pos.x - player.x, b.pos.z - player.z)); return m; }
    };
}
