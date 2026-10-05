// Construcciones y objetos de escena hechos por código (low-poly toon).
// Casi todo sale como una malla "horneada" (sin contorno): la escena junta todo el decorado estático en una
// sola malla (mergeBaked) y le pone un único contorno. Lo que se mueve (portales, reliquias, nubes) va aparte.
import * as THREE from 'three';
import { piece, bake, pick, getToonMaterial, getGradientMap, createFlower } from '../ProceduralAssets.js';

const group = (...pieces) => { const g = new THREE.Group(); pieces.forEach(p => g.add(p)); return g; };
const box = (w, h, d, color, pos, rot) => piece(new THREE.BoxGeometry(w, h, d), color, { pos, rot });
const cyl = (rt, rb, h, color, pos, seg = 8, rot) => piece(new THREE.CylinderGeometry(rt, rb, h, seg), color, { pos, rot });

// =====================================================================
// CASAS Y EDIFICIOS
// =====================================================================
export const WALLS = [0xe8c9a0, 0xe9c46a, 0xe29578, 0x8ecae6, 0xf0e6d2, 0xd9a577];

/** Casa colonial/adobe. La puerta mira hacia +Z. roof: 'pyramid' | 'flat' */
export function createHouse({ w = 7, d = 6, h = 3.4, wall = 0xe8c9a0, roof = 0xb8553a, roofType = 'pyramid', trim = 0x7a4b2a } = {}) {
    const g = new THREE.Group();
    g.add(box(w, h, d, wall, [0, h / 2, 0]));
    g.add(box(w + 0.3, 0.25, d + 0.3, 0xa89a86, [0, 0.12, 0])); // zócalo

    if (roofType === 'flat') {
        g.add(box(w + 0.4, 0.3, d + 0.4, trim, [0, h + 0.15, 0]));
        g.add(box(w * 0.3, 0.9, d * 0.3, wall, [w * 0.25, h + 0.75, -d * 0.2])); // caja de escalera
    } else {
        const r = Math.max(w, d) * 0.5 * Math.SQRT2 + 0.5;
        g.add(piece(new THREE.ConeGeometry(r, h * 0.7, 4), roof, {
            pos: [0, h + h * 0.35, 0], rot: [0, Math.PI / 4, 0], scale: [(w + 1) / (2 * r / Math.SQRT2), 1, (d + 1) / (2 * r / Math.SQRT2)]
        }));
        g.add(box(0.5, 1.0, 0.5, 0xb0907a, [w * 0.25, h + h * 0.4, -d * 0.2])); // chimenea
    }
    // puerta y ventanas
    g.add(box(1.3, 2.2, 0.15, trim, [0, 1.1, d / 2 + 0.03]));
    g.add(box(1.6, 0.18, 0.25, 0xf0e6d2, [0, 2.3, d / 2 + 0.05]));
    for (const x of [-w * 0.3, w * 0.3]) {
        g.add(box(1.0, 1.1, 0.12, 0x2e3b4a, [x, h * 0.62, d / 2 + 0.03]));
        g.add(box(1.25, 0.12, 0.2, trim, [x, h * 0.62 - 0.62, d / 2 + 0.06]));
    }
    return bake(g);
}

/** Iglesia con torre y campanario. Puerta hacia +Z. */
export function createChurch({ wall = 0xf0e6d2, roof = 0xa94438 } = {}) {
    const g = new THREE.Group();
    g.add(box(9, 6, 14, wall, [0, 3, 0]));
    g.add(piece(new THREE.CylinderGeometry(0.1, 5.2, 3.2, 4), roof, { pos: [0, 7.6, 0], rot: [0, Math.PI / 4, 0], scale: [1, 1, 1.5] }));
    // torre
    g.add(box(4, 12, 4, wall, [0, 6, 8.2]));
    g.add(box(2.2, 2.2, 0.3, 0x2e3b4a, [0, 9.5, 10.3]));       // arco del campanario
    g.add(piece(new THREE.ConeGeometry(3.2, 4, 4), roof, { pos: [0, 14, 8.2], rot: [0, Math.PI / 4, 0] }));
    g.add(box(0.2, 1.6, 0.2, 0xd4a017, [0, 16.8, 8.2]));        // cruz
    g.add(box(0.9, 0.2, 0.2, 0xd4a017, [0, 17.0, 8.2]));
    g.add(box(2.2, 3.6, 0.2, 0x6b4a2e, [0, 1.8, 10.3]));        // portón
    for (const x of [-2.6, 2.6]) g.add(box(1.0, 1.6, 0.15, 0x2e3b4a, [x, 3.6, 7]));
    return bake(g);
}

/** Fuente de plaza. */
export function createFountain() {
    return bake(group(
        cyl(3.2, 3.4, 0.7, 0xb8b0a2, [0, 0.35, 0], 10),
        cyl(2.8, 2.8, 0.5, 0x4aa9c9, [0, 0.55, 0], 10),
        cyl(0.5, 0.7, 1.8, 0xb8b0a2, [0, 1.3, 0], 8),
        cyl(1.4, 1.1, 0.35, 0xb8b0a2, [0, 2.1, 0], 10),
        piece(new THREE.SphereGeometry(0.45, 7, 5), 0x7fd4ee, { pos: [0, 2.5, 0] })
    ));
}

export function createLamp() {
    return bake(group(
        cyl(0.1, 0.14, 3.2, 0x2b2b30, [0, 1.6, 0], 6),
        box(0.5, 0.6, 0.5, 0xfff0b0, [0, 3.4, 0]),
        piece(new THREE.ConeGeometry(0.42, 0.35, 4), 0x2b2b30, { pos: [0, 3.9, 0], rot: [0, Math.PI / 4, 0] })
    ));
}

export function createFence(length = 6, color = 0x8a6a45) {
    const g = new THREE.Group();
    const n = Math.max(2, Math.round(length / 1.5) + 1);
    for (let i = 0; i < n; i++) g.add(box(0.2, 1.1, 0.2, color, [-length / 2 + (i * length) / (n - 1), 0.55, 0]));
    g.add(box(length, 0.14, 0.1, color, [0, 0.9, 0]));
    g.add(box(length, 0.14, 0.1, color, [0, 0.5, 0]));
    return bake(g);
}

export function createCrate(size = 1, color = 0x9a7040) {
    return bake(group(box(size, size, size, color, [0, size / 2, 0]), box(size * 1.04, size * 0.12, size * 1.04, 0x6e4e2a, [0, size * 0.5, 0])));
}

export function createBarrel() {
    return bake(group(cyl(0.5, 0.5, 1.1, 0x8a5a30, [0, 0.55, 0], 8), cyl(0.53, 0.53, 0.1, 0x3a3a3a, [0, 0.3, 0], 8), cyl(0.53, 0.53, 0.1, 0x3a3a3a, [0, 0.85, 0], 8)));
}

export function createWell() {
    return bake(group(
        cyl(1.1, 1.2, 1.0, 0xa89a86, [0, 0.5, 0], 8),
        cyl(0.85, 0.85, 0.05, 0x2f6f8f, [0, 0.95, 0], 8),
        box(0.18, 2.2, 0.18, 0x6b4a2e, [-1.0, 1.9, 0]), box(0.18, 2.2, 0.18, 0x6b4a2e, [1.0, 1.9, 0]),
        piece(new THREE.ConeGeometry(1.7, 0.9, 4), 0xb8553a, { pos: [0, 3.4, 0], rot: [0, Math.PI / 4, 0] })
    ));
}

// =====================================================================
// ÁRBOLES Y PLAZA (Copiapó)
// =====================================================================
const LEAVES = [0x4f9a4a, 0x5fae55, 0x3f8a44, 0x6dbb5d];

/** Árbol de plaza: tronco y copa de varias esferas facetadas. */
export function createTree({ height = 3.2, size = 1, leaf = null } = {}) {
    const g = new THREE.Group();
    const color = leaf ?? pick(LEAVES);
    g.add(cyl(0.28 * size, 0.42 * size, height, 0x7a5535, [0, height / 2, 0], 6));
    const blobs = [[0, 0, 0, 2.3], [1.3, -0.5, 0.4, 1.7], [-1.2, -0.4, -0.5, 1.8], [0.2, 0.9, -0.8, 1.5], [-0.3, 0.3, 1.2, 1.5]];
    blobs.forEach(([x, y, z, r], i) => g.add(piece(new THREE.IcosahedronGeometry(r * size, 0), i % 2 ? color : LEAVES[(i + 1) % LEAVES.length], {
        pos: [x * size, height + 1.2 * size + y * size, z * size]
    })));
    return bake(g);
}

export function createBench() {
    const g = new THREE.Group();
    g.add(box(2.2, 0.14, 0.7, 0x8a6a45, [0, 0.55, 0]));
    g.add(box(2.2, 0.5, 0.1, 0x8a6a45, [0, 1.0, -0.3], [-0.15, 0, 0]));
    for (const x of [-0.9, 0.9]) g.add(box(0.12, 0.55, 0.6, 0x2b2b30, [x, 0.27, 0]));
    return bake(g);
}

/** Arriate de flores en un círculo (césped con flores de colores). */
export function createFlowerBed({ radius = 1.8 } = {}) {
    const g = new THREE.Group();
    g.add(cyl(radius, radius + 0.1, 0.3, 0x9a9488, [0, 0.15, 0], 10));
    g.add(cyl(radius - 0.2, radius - 0.2, 0.34, 0x6a4a30, [0, 0.17, 0], 10));
    const cols = [0xe8372c, 0xf2c200, 0xff7bc0, 0xf5f2ea, 0x9b4fd6];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + (i % 2) * 0.3;
        const d = (i % 3) * (radius * 0.28) + radius * 0.25;
        g.add(piece(new THREE.IcosahedronGeometry(0.22, 0), cols[i % cols.length], { pos: [Math.cos(a) * d, 0.52, Math.sin(a) * d] }));
        g.add(piece(new THREE.ConeGeometry(0.2, 0.3, 4), 0x4f9a4a, { pos: [Math.cos(a) * d, 0.4, Math.sin(a) * d] }));
    }
    return bake(g);
}

// =====================================================================
// BAHÍA INGLESA
// =====================================================================
export function createPalm({ height = 5 } = {}) {
    const g = new THREE.Group();
    const lean = 0.18;
    // tronco curvo con 3 tramos
    for (let i = 0; i < 3; i++) {
        const t = i / 3;
        g.add(cyl(0.2 - i * 0.03, 0.26 - i * 0.03, height / 3 + 0.1, 0x8a6a45, [lean * (i + 0.5) * 1.2, (height / 3) * (i + 0.5), 0], 6, [0, 0, -lean * i * 0.5]));
    }
    const top = [lean * 3.2, height, 0];
    for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        g.add(piece(new THREE.ConeGeometry(0.35, 2.6, 4), i % 2 ? 0x3f9a4a : 0x2f8a3e, {
            pos: [top[0] + Math.cos(a) * 1.1, top[1] - 0.1, Math.sin(a) * 1.1],
            rot: [Math.sin(a) * 1.25, 0, -Math.cos(a) * 1.25 + Math.PI],
            scale: [1, 1, 0.35]
        }));
    }
    g.add(piece(new THREE.SphereGeometry(0.22, 5, 4), 0x6b4a2e, { pos: [top[0], top[1] - 0.2, 0.15] }));
    g.add(piece(new THREE.SphereGeometry(0.22, 5, 4), 0x6b4a2e, { pos: [top[0] + 0.2, top[1] - 0.25, -0.15] }));
    return bake(g);
}

export function createBoat({ hull = 0xf0e6d2, stripe = 0x2f6fb3 } = {}) {
    const g = new THREE.Group();
    g.add(box(1.8, 0.7, 5, hull, [0, 0.55, 0]));
    g.add(piece(new THREE.ConeGeometry(0.9, 1.6, 4), hull, { pos: [0, 0.55, 3.2], rot: [Math.PI / 2, Math.PI / 4, 0], scale: [1, 1, 0.78] }));
    g.add(box(1.86, 0.18, 5.05, stripe, [0, 0.82, 0]));
    g.add(box(1.5, 0.12, 4.4, 0x8a6a45, [0, 0.95, -0.1]));
    g.add(box(1.2, 0.9, 1.2, 0xf5f2ea, [0, 1.45, -1.2]));
    g.add(cyl(0.07, 0.07, 3.2, 0x5a4026, [0, 2.4, 0.6], 5));
    g.add(box(0.05, 1.2, 1.4, 0xf5f2ea, [0, 3.0, 0.1]));
    return bake(g);
}

export function createUmbrella({ a = 0xe8372c, b = 0xf5f2ea } = {}) {
    const g = new THREE.Group();
    g.add(cyl(0.05, 0.05, 2.6, 0x8a6a45, [0, 1.3, 0], 5));
    const segs = 8;
    for (let i = 0; i < segs; i++) {
        g.add(piece(new THREE.ConeGeometry(1.7, 0.7, segs, 1, true, (i / segs) * Math.PI * 2, (Math.PI * 2) / segs), i % 2 ? a : b, { pos: [0, 2.7, 0] }));
    }
    return bake(g);
}

export function createTowel(color = 0xe8372c) {
    return bake(group(box(1.2, 0.04, 2.2, color, [0, 0.03, 0]), box(1.2, 0.045, 0.4, 0xf5f2ea, [0, 0.032, 0.4])));
}

// =====================================================================
// BATALLÓN ATACAMA
// =====================================================================
// ---------- Carpa de campaña ----------
/** Prisma triangular (techo a dos aguas) con la cumbrera a lo largo de Z. Sin cara frontal: ahí va la puerta. */
function roofGeometry(w, h, d) {
    const hw = w / 2, hd = d / 2;
    const v = [
        // pendiente izquierda
        -hw, 0, -hd, -hw, 0, hd, 0, h, hd,   -hw, 0, -hd, 0, h, hd, 0, h, -hd,
        // pendiente derecha
        hw, 0, hd, hw, 0, -hd, 0, h, -hd,    hw, 0, hd, 0, h, -hd, 0, h, hd,
        // fondo
        -hw, 0, -hd, 0, h, -hd, hw, 0, -hd
    ];
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((v.length / 3) * 2).fill(0), 2));
    g.computeVertexNormals();
    return g;
}

/** Cilindro delgado entre dos puntos (cuerdas, mástiles inclinados). */
function cylBetween(a, bb, r, color) {
    const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...bb);
    const dir = vb.clone().sub(va);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const e = new THREE.Euler().setFromQuaternion(q);
    return piece(new THREE.CylinderGeometry(r, r, dir.length(), 5), color, { pos: [mid.x, mid.y, mid.z], rot: [e.x, e.y, e.z] });
}

/**
 * Carpa de campaña de lona: paredes bajas, techo a dos aguas, puerta abierta con interior oscuro,
 * mástiles, tensores con estacas y alfombra de entrada. La puerta mira hacia +Z.
 * stripe: color de las franjas del techo (opcional, para carpas de colores).
 */
export function createTent({ color = 0xd9c9a0, stripe = null, w = 4.2, d = 5.4, wallH = 0.9, roofH = 2.3 } = {}) {
    const g = new THREE.Group();
    const dark = new THREE.Color(color).multiplyScalar(0.72).getHex();
    const wood = 0x6b4a2e, rope = 0xcdbb94;
    const hd = d / 2, hw = w / 2, ridgeY = wallH + roofH;

    // paredes laterales y trasera
    for (const s of [-1, 1]) g.add(box(0.07, wallH, d, dark, [s * hw, wallH / 2, 0]));
    g.add(box(w, wallH, 0.07, dark, [0, wallH / 2, -hd]));

    // techo: en tramos para poder alternar franjas de color
    const segs = stripe ? 6 : 1;
    for (let i = 0; i < segs; i++) {
        g.add(piece(roofGeometry(w + 0.35, roofH, d / segs + 0.02), stripe && i % 2 ? stripe : color, {
            pos: [0, wallH - 0.05, -hd + (i + 0.5) * (d / segs)]
        }));
    }
    // vuelo del techo en el borde de las paredes
    for (const s of [-1, 1]) g.add(box(0.12, 0.1, d + 0.1, dark, [s * (hw + 0.1), wallH - 0.03, 0]));

    // puerta: dos solapas de lona que se juntan en la cumbrera dejan una abertura triangular (interior oscuro detrás)
    const W = hw + 0.17, H = wallH + roofH - 0.05, o = W * 0.4, top = wallH - 0.05;
    const flap = (pts) => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pts.length / 3) * 2).fill(0), 2));
        geo.computeVertexNormals();
        return piece(geo, color, { pos: [0, 0, hd] });
    };
    g.add(flap([-W, 0, 0, -o, 0, 0, 0, H, 0,   -W, 0, 0, 0, H, 0, -W, top, 0]));      // solapa izquierda
    g.add(flap([o, 0, 0, W, 0, 0, 0, H, 0,     W, 0, 0, W, top, 0, 0, H, 0]));         // solapa derecha
    // pared interior oscura y piso, para que la abertura no deje ver a través de la carpa
    const inner = new THREE.BufferGeometry();
    inner.setAttribute('position', new THREE.Float32BufferAttribute([-W * 0.9, 0, 0, W * 0.9, 0, 0, 0, H * 0.97, 0], 3));
    inner.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 2));
    inner.computeVertexNormals();
    g.add(piece(inner, 0x241b12, { pos: [0, 0.02, -hd + 0.2] }));
    g.add(box(w * 0.95, 0.04, d * 0.95, 0x4a3a28, [0, 0.03, 0]));
    // bordes de la puerta reforzados y atados
    for (const s of [-1, 1]) {
        g.add(cylBetween([s * o, 0.02, hd + 0.03], [0, H * 0.985, hd + 0.03], 0.06, dark));
        g.add(piece(new THREE.TorusGeometry(0.13, 0.03, 4, 6), rope, { pos: [s * o * 0.55, H * 0.42, hd + 0.05], rot: [0, 0, 0] }));
    }
    // piso de entrada
    g.add(box(w * 0.55, 0.05, 1.5, 0x6b4f30, [0, 0.03, hd + 0.85]));

    // mástil de cumbrera con remates y postes
    g.add(cyl(0.06, 0.06, d + 1.4, wood, [0, ridgeY, 0], 6, [Math.PI / 2, 0, 0]));
    for (const z of [-hd - 0.7, hd + 0.7]) {
        g.add(piece(new THREE.SphereGeometry(0.1, 5, 4), 0xd4a017, { pos: [0, ridgeY, z] }));
        g.add(cyl(0.06, 0.07, ridgeY, wood, [0, ridgeY / 2, z], 6));
    }

    // tensores y estacas
    const stake = (x, z) => g.add(piece(new THREE.ConeGeometry(0.07, 0.35, 4), wood, { pos: [x, 0.12, z], rot: [Math.PI, 0, 0] }));
    for (const z of [-hd - 0.7, hd + 0.7]) {
        for (const s of [-1, 1]) {
            const sx = s * (hw + 1.5), sz = z + Math.sign(z) * 1.4;
            g.add(cylBetween([0, ridgeY, z], [sx, 0.05, sz], 0.018, rope));
            stake(sx, sz);
        }
    }
    for (const s of [-1, 1]) for (const z of [-hd * 0.5, hd * 0.5]) {
        const sx = s * (hw + 1.1);
        g.add(cylBetween([s * (hw + 0.1), wallH, z], [sx, 0.05, z], 0.018, rope));
        stake(sx, z);
    }
    return bake(g);
}

/** Bandera de Chile en asta. */
export function createFlag() {
    const g = new THREE.Group();
    g.add(cyl(0.07, 0.09, 6, 0xcfcfcf, [0, 3, 0], 6));
    g.add(piece(new THREE.SphereGeometry(0.15, 5, 4), 0xd4a017, { pos: [0, 6.05, 0] }));
    g.add(box(2.4, 0.7, 0.05, 0xf5f2ea, [1.3, 5.45, 0]));      // franja blanca (arriba)
    g.add(box(2.4, 0.7, 0.05, 0xd0312d, [1.3, 4.75, 0]));      // franja roja (abajo)
    g.add(box(0.95, 0.95, 0.06, 0x0b3a8c, [0.575, 5.25, 0.005])); // cantón azul
    g.add(piece(new THREE.OctahedronGeometry(0.2, 0), 0xf5f2ea, { pos: [0.575, 5.25, 0.045], scale: [1, 1, 0.3] })); // estrella
    return bake(g);
}

export function createCannon() {
    const g = new THREE.Group();
    g.add(cyl(0.34, 0.45, 2.4, 0x3a3d44, [0, 1.0, 0.2], 8, [Math.PI / 2 - 0.15, 0, 0]));
    for (const s of [-1, 1]) g.add(cyl(0.6, 0.6, 0.18, 0x6b4a2e, [s * 0.7, 0.6, 0], 8, [0, 0, Math.PI / 2]));
    g.add(box(1.2, 0.3, 1.5, 0x6b4a2e, [0, 0.6, -0.3]));
    return bake(g);
}

export function createSandbags() {
    const g = new THREE.Group();
    for (let r = 0; r < 2; r++) for (let i = 0; i < 4 - r; i++) {
        g.add(piece(new THREE.SphereGeometry(0.5, 5, 4), r ? 0xbfa77a : 0xc9b384, { pos: [(i - (3 - r) / 2) * 0.95, 0.3 + r * 0.45, 0], scale: [1.2, 0.6, 0.8] }));
    }
    return bake(g);
}

// =====================================================================
// CHAÑARCILLO (mina de plata)
// =====================================================================
export function createMineEntrance() {
    const g = new THREE.Group();
    // cerro con la boca de la mina
    g.add(piece(new THREE.SphereGeometry(9, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), 0x8a7a68, { pos: [0, -1, -2], scale: [1.3, 0.85, 0.9] }));
    g.add(box(4.2, 4.2, 1.5, 0x1b1410, [0, 2.1, 5.6]));
    for (const x of [-2.4, 2.4]) g.add(box(0.5, 4.8, 0.7, 0x6b4a2e, [x, 2.4, 6.4]));
    g.add(box(5.8, 0.6, 0.8, 0x6b4a2e, [0, 4.9, 6.4]));
    g.add(box(0.5, 0.5, 0.5, 0xfff0b0, [-2.9, 4.2, 6.9])); // farol
    return bake(g);
}

export function createMineCart() {
    const g = new THREE.Group();
    g.add(piece(new THREE.CylinderGeometry(1.0, 0.7, 1.0, 6), 0x59606a, { pos: [0, 0.95, 0], rot: [0, Math.PI / 6, 0], scale: [1, 1, 1.4] }));
    for (const x of [-0.7, 0.7]) for (const z of [-0.7, 0.7]) g.add(cyl(0.28, 0.28, 0.15, 0x2b2b30, [x, 0.3, z], 6, [0, 0, Math.PI / 2]));
    g.add(piece(new THREE.DodecahedronGeometry(0.45, 0), 0xcfd6dc, { pos: [0.2, 1.55, 0.1] }));
    g.add(piece(new THREE.DodecahedronGeometry(0.35, 0), 0xb0c4d8, { pos: [-0.3, 1.5, -0.3] }));
    return bake(g);
}

export function createRails(length = 12) {
    const g = new THREE.Group();
    for (const x of [-0.7, 0.7]) g.add(box(0.12, 0.12, length, 0x59606a, [x, 0.12, 0]));
    for (let z = -length / 2 + 0.5; z < length / 2; z += 1.2) g.add(box(2.1, 0.1, 0.3, 0x6b4a2e, [0, 0.05, z]));
    return bake(g);
}

export function createSilverRock(size = 1) {
    return bake(group(
        piece(new THREE.DodecahedronGeometry(size, 0), 0x77706a, { pos: [0, size * 0.6, 0], scale: [1, 0.8, 1] }),
        piece(new THREE.OctahedronGeometry(size * 0.35, 0), 0xcfe3f5, { pos: [size * 0.5, size * 0.95, size * 0.3] }),
        piece(new THREE.OctahedronGeometry(size * 0.25, 0), 0xe6eef7, { pos: [-size * 0.4, size * 1.0, size * 0.2] })
    ));
}

// =====================================================================
// CULTURA DIAGUITA
// =====================================================================
/** Jarro-pato decorativo con bandas blancas y negras (estilo diaguita). */
export function createDuckJar({ scale = 1, clay = 0xc4552b } = {}) {
    const g = new THREE.Group();
    g.add(piece(new THREE.SphereGeometry(0.62, 8, 6), clay, { pos: [0, 0.6, 0], scale: [1.1, 0.9, 1] }));
    for (const [y, c] of [[0.5, 0xf5f2ea], [0.75, 0x1d140b]]) g.add(piece(new THREE.TorusGeometry(0.64 - Math.abs(y - 0.6) * 0.7, 0.05, 4, 10), c, { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
    g.add(cyl(0.2, 0.3, 0.45, clay, [0, 1.3, 0], 7));
    g.add(piece(new THREE.SphereGeometry(0.26, 6, 5), clay, { pos: [0, 1.7, 0.05] }));
    g.add(piece(new THREE.ConeGeometry(0.1, 0.32, 5), 0xe8b04a, { pos: [0, 1.7, 0.4], rot: [Math.PI / 2, 0, 0] }));
    for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.04, 4, 3), 0x1d140b, { pos: [s * 0.14, 1.78, 0.22] }));
    g.add(piece(new THREE.TorusGeometry(0.28, 0.06, 4, 8), clay, { pos: [0.62, 0.8, 0] }));
    g.scale.setScalar(scale);
    return bake(g);
}

export function createClayPot(scale = 1, clay = 0xb45a30) {
    const g = new THREE.Group();
    g.add(piece(new THREE.SphereGeometry(0.55, 8, 6), clay, { pos: [0, 0.5, 0], scale: [1, 0.9, 1] }));
    g.add(cyl(0.3, 0.35, 0.3, clay, [0, 1.0, 0], 8));
    g.add(piece(new THREE.TorusGeometry(0.48, 0.04, 4, 10), 0xf5f2ea, { pos: [0, 0.55, 0], rot: [Math.PI / 2, 0, 0] }));
    g.scale.setScalar(scale);
    return bake(g);
}

/** Muro de piedra (tramo de pukará). */
export function createStoneWall(length = 8, h = 1.6) {
    const g = new THREE.Group();
    const colors = [0x9b8f7b, 0x8b8c89, 0xa39d91, 0x7d756a];
    let x = -length / 2, i = 0;
    while (x < length / 2) {
        const w = 0.9 + ((i * 37) % 7) / 10;
        for (let row = 0; row < Math.ceil(h / 0.6); row++) {
            const off = row % 2 ? 0.45 : 0;
            g.add(box(w - 0.05, 0.56, 0.9 + (row % 2) * 0.1, colors[(i + row) % 4], [x + w / 2 + off, 0.3 + row * 0.6, 0]));
        }
        x += w; i++;
    }
    return bake(g);
}

/** Estela / piedra grabada con zigzags. */
export function createStele() {
    const g = new THREE.Group();
    g.add(box(1.3, 3.6, 0.6, 0x8b8c89, [0, 1.8, 0]));
    g.add(piece(new THREE.ConeGeometry(0.92, 0.7, 4), 0x8b8c89, { pos: [0, 3.95, 0], rot: [0, Math.PI / 4, 0], scale: [1, 1, 0.45] }));
    for (let i = 0; i < 5; i++) g.add(box(0.8, 0.1, 0.05, 0x1d140b, [0, 0.8 + i * 0.5, 0.31], [0, 0, i % 2 ? 0.35 : -0.35]));
    return bake(g);
}

export function createAdobeHut() {
    const g = new THREE.Group();
    g.add(cyl(2.4, 2.6, 2.2, 0xcda877, [0, 1.1, 0], 8));
    g.add(piece(new THREE.ConeGeometry(3.1, 2.2, 8), 0xb8935a, { pos: [0, 3.3, 0] }));
    g.add(box(1.0, 1.7, 0.2, 0x3a2f22, [0, 0.85, 2.5]));
    return bake(g);
}

// =====================================================================
// DESIERTO FLORIDO
// =====================================================================
export function createMountainRock() {
    return bake(group(
        piece(new THREE.DodecahedronGeometry(2.2, 0), 0x8f7f6a, { pos: [0, 1.6, 0], scale: [1.2, 1.1, 1] }),
        piece(new THREE.DodecahedronGeometry(1.4, 0), 0xa39080, { pos: [2, 0.9, 0.8] })
    ));
}

// =====================================================================
// LETREROS (info_sign)
// =====================================================================
function textTexture(title, subtitle) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#f2dfb2'; x.fillRect(0, 0, 512, 256);
    x.strokeStyle = '#6b4a2e'; x.lineWidth = 14; x.strokeRect(7, 7, 498, 242);
    x.fillStyle = '#4a2f1b'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = 'bold 54px sans-serif'; x.fillText(title, 256, 100, 460);
    x.font = '30px sans-serif'; x.fillStyle = '#6b4a2e'; x.fillText(subtitle, 256, 180, 460);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

/** Letrero de madera con texto. Devuelve un Group interactuable (type: 'info_sign'). */
export function createSignboard({ title, subtitle = 'E: leer', description = '' }) {
    const root = new THREE.Group();
    const post = bake(group(box(0.2, 2.4, 0.2, 0x6b4a2e, [-1.0, 1.2, 0]), box(0.2, 2.4, 0.2, 0x6b4a2e, [1.0, 1.2, 0])));
    root.add(post);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 0.12), new THREE.MeshToonMaterial({ color: 0x8a6a45 }));
    board.position.y = 2.4;
    board.castShadow = true;
    root.add(board);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.2), new THREE.MeshBasicMaterial({ map: textTexture(title, subtitle) }));
    face.position.set(0, 2.4, 0.07);
    root.add(face);
    root.userData = { type: 'info_sign', interactable: true, name: title, description };
    return root;
}

// =====================================================================
// NUBES (una sola malla instanciada: todas las nubes cuestan 1 draw call)
// =====================================================================
/**
 * Capa de nubes que derivan con el viento. Cada nube está hecha de varias "bolitas" que se hinchan y
 * flotan a su propio ritmo, así que las nubes cambian de forma lentamente.
 */
export function createCloudLayer({ count = 14, minDist = 55, maxDist = 130, minY = 18, maxY = 34 } = {}) {
    const clouds = [];
    let total = 0;
    for (let c = 0; c < count; c++) {
        const a = (c / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;   // repartidas parejo alrededor
        const d = minDist + Math.random() * (maxDist - minDist);
        const puffs = [];
        const n = 5 + Math.floor(Math.random() * 3);
        const size = 4 + Math.random() * 3;
        for (let i = 0; i < n; i++) {
            const k = i / (n - 1) - 0.5;
            puffs.push({
                ox: k * size * 2.6, oy: (1 - Math.abs(k) * 1.6) * size * 0.28, oz: (Math.random() - 0.5) * size * 0.9,
                r: size * (0.55 + (1 - Math.abs(k) * 1.4) * 0.45 + Math.random() * 0.15), ph: Math.random() * 6.28
            });
        }
        total += n;
        clouds.push({ x: Math.cos(a) * d, y: minY + Math.random() * (maxY - minY), z: Math.sin(a) * d, speed: 1.2 + Math.random() * 1.6, puffs });
    }

    const mat = new THREE.MeshToonMaterial({ color: 0xffffff, emissive: 0x4a5566, gradientMap: getGradientMap() });
    const mesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat, total);
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = false;

    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
    const limit = maxDist * 1.35;

    function update(t, dt) {
        let idx = 0;
        for (const c of clouds) {
            c.x += c.speed * dt;
            if (c.x > limit) c.x = -limit;
            for (const p of c.puffs) {
                const breathe = 1 + Math.sin(t * 0.55 + p.ph) * 0.07;
                pos.set(c.x + p.ox + Math.sin(t * 0.21 + p.ph) * 0.9, c.y + p.oy + Math.sin(t * 0.4 + p.ph * 1.7) * 0.8, c.z + p.oz);
                q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, p.ph + t * 0.05);
                sc.set(p.r * 1.35 * breathe, p.r * 0.85 * breathe, p.r * breathe);
                m.compose(pos, q, sc);
                mesh.setMatrixAt(idx++, m);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
    }
    update(0, 0);
    return { mesh, update };
}

// =====================================================================
// OBJETOS DE MISIÓN (se recogen caminando hasta ellos)
// =====================================================================
const PICKUP_GLOW = { municion: 0xffd54a, tiesto: 0xffa86b, mineral: 0xbfe0ff, semilla: 0x9bf08a, concha: 0xffd6e8 };

function pickupBody(kind) {
    const g = new THREE.Group();
    switch (kind) {
        case 'municion':
            g.add(box(0.62, 0.38, 0.42, 0x8a6a45, [0, 0, 0]));
            g.add(box(0.66, 0.1, 0.46, 0x5b4128, [0, 0.2, 0]));
            g.add(box(0.1, 0.4, 0.46, 0xd4a017, [-0.2, 0, 0]));
            g.add(box(0.1, 0.4, 0.46, 0xd4a017, [0.2, 0, 0]));
            for (let i = 0; i < 3; i++) g.add(cyl(0.05, 0.05, 0.22, 0xd4a017, [-0.15 + i * 0.15, 0.36, 0], 5));
            break;
        case 'tiesto':
            g.add(piece(new THREE.ConeGeometry(0.3, 0.42, 4), 0xc4552b, { scale: [1.3, 0.45, 1], rot: [0.3, 0.4, 0.2] }));
            g.add(piece(new THREE.ConeGeometry(0.2, 0.3, 4), 0xb4491f, { pos: [0.28, -0.04, 0.12], scale: [1.2, 0.4, 1], rot: [-0.2, 1.2, 0.1] }));
            g.add(box(0.36, 0.02, 0.07, 0xf5f2ea, [-0.02, 0.1, 0.03], [0.3, 0.4, 0.2]));
            g.add(box(0.28, 0.02, 0.06, 0x1d140b, [-0.02, 0.1, -0.06], [0.3, 0.4, 0.2]));
            break;
        case 'mineral':
            g.add(piece(new THREE.DodecahedronGeometry(0.3, 0), 0x77706a, { scale: [1.1, 0.8, 1], pos: [0, -0.05, 0] }));
            g.add(piece(new THREE.OctahedronGeometry(0.2, 0), 0xcfe3f5, { pos: [0.1, 0.2, 0.05] }));
            g.add(piece(new THREE.OctahedronGeometry(0.14, 0), 0xe6eef7, { pos: [-0.14, 0.17, -0.05] }));
            break;
        case 'semilla':
            g.add(piece(new THREE.SphereGeometry(0.22, 7, 5), 0x6db04a, { scale: [1, 1.2, 1] }));
            g.add(piece(new THREE.ConeGeometry(0.1, 0.3, 5), 0xff7bc0, { pos: [0, 0.34, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 4), 0x4f9a4a, { pos: [0.05, 0.5, 0], rot: [0, 0, -0.4] }));
            break;
        default: // concha
            g.add(piece(new THREE.ConeGeometry(0.34, 0.2, 8), 0xf3cdb5, { rot: [0, 0, 0], scale: [1, 1, 1], pos: [0, 0, 0] }));
            for (let i = 0; i < 5; i++) {
                const a = (i / 4 - 0.5) * 1.6;
                g.add(box(0.03, 0.04, 0.32, 0xe8a98a, [Math.sin(a) * 0.17, 0.1, Math.cos(a) * 0.1 - 0.02], [0, a, 0]));
            }
            g.add(piece(new THREE.SphereGeometry(0.08, 5, 4), 0xe58f7a, { pos: [0, 0.02, -0.28] }));
            g.rotation.x = 0.5;
    }
    return bake(g);
}

/** Objeto brillante que flota y gira; se recoge al caminar hacia él. */
export function createPickup(kind) {
    const root = new THREE.Group();
    const floater = new THREE.Group();
    floater.position.y = 1.0;
    const body = pickupBody(kind);
    body.scale.setScalar(1.35);
    floater.add(body);
    const color = PICKUP_GLOW[kind] ?? 0xffffff;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.2, depthWrite: false }));
    floater.add(glow);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.03, 4, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    ring.rotation.x = Math.PI / 2;
    floater.add(ring);
    root.add(floater);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.04;
    root.add(shadow);

    return {
        root,
        update(t) {
            floater.position.y = 1.0 + Math.sin(t * 2.2) * 0.14;
            body.rotation.y = t * 1.5;
            ring.rotation.z = t * 2;
            glow.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
        }
    };
}

// =====================================================================
// PORTAL
// =====================================================================
function labelSprite(text, color) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(20,12,6,0.82)';
    x.beginPath(); x.roundRect(6, 6, 500, 116, 28); x.fill();
    x.strokeStyle = color; x.lineWidth = 6; x.stroke();
    x.fillStyle = '#fff6dc'; x.font = 'bold 50px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(text, 256, 68, 470);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(6, 1.5, 1);
    return s;
}

/**
 * Portal: arco de piedra con un disco brillante que gira. Se cruza caminando hacia él.
 * Devuelve { root, update(t, dt), radius } y root.userData = { type: 'portal', target, ... }
 */
export function createPortal({ label, target, color = 0x6fe3ff, spawnAt = null }) {
    const root = new THREE.Group();
    const stone = [0x8b8c89, 0xa39d91, 0x7d756a];
    const arch = new THREE.Group();
    const R = 3, segs = 9;
    for (let i = 0; i <= segs; i++) {
        const a = (i / segs) * Math.PI;
        arch.add(piece(new THREE.BoxGeometry(1.1, 1.3, 1.3), stone[i % 3], {
            pos: [Math.cos(a) * R, 0.2 + Math.sin(a) * R + 0.4, 0], rot: [0, 0, a]
        }));
    }
    for (const s of [-1, 1]) {
        arch.add(box(1.1, 1.6, 1.3, stone[(s + 4) % 3], [s * R, 0.8, 0]));
        arch.add(box(1.5, 0.5, 1.7, 0x6e685f, [s * R, 0.25, 0]));
    }
    root.add(bake(arch));

    // disco de energía
    const col = new THREE.Color(color);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.5, 20), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    disc.position.y = 3.2;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R - 0.9, 0.12, 5, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 }));
    ring.position.y = 3.2;
    const sparks = new THREE.Group();
    sparks.position.y = 3.2;
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 8; i++) {
        const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), sparkMat);
        s.userData.a = (i / 8) * Math.PI * 2;
        s.userData.r = 1.1 + (i % 3) * 0.45;
        sparks.add(s);
    }
    root.add(disc, ring, sparks);

    const sign = labelSprite(label, '#' + col.getHexString());
    sign.position.y = 7.6;
    root.add(sign);

    root.userData = { type: 'portal', target, label, spawnAt, color };

    function update(t) {
        ring.rotation.z = t * 0.9;
        disc.material.opacity = 0.45 + Math.sin(t * 2.4) * 0.1;
        disc.scale.setScalar(1 + Math.sin(t * 3) * 0.03);
        sparks.children.forEach((s) => {
            const a = s.userData.a + t * (0.8 + s.userData.r * 0.2);
            s.position.set(Math.cos(a) * s.userData.r, Math.sin(a) * s.userData.r, 0);
            s.rotation.set(t, t * 1.3, 0);
        });
        sign.position.y = 7.6 + Math.sin(t * 1.6) * 0.15;
    }
    return { root, update, radius: R };
}

// =====================================================================
// RELIQUIAS (fragmentos históricos)
// =====================================================================
function relicBody(id) {
    switch (id) {
        case 1: return createDuckJar({ scale: 0.9 });                  // Cultura Diaguita
        case 2: {                                                          // Batallón Atacama: sable
            return bake(group(
                box(0.16, 1.7, 0.04, 0xcfd6dc, [0, 0.4, 0]),
                piece(new THREE.ConeGeometry(0.08, 0.3, 4), 0xcfd6dc, { pos: [0, 1.4, 0], rot: [0, Math.PI / 4, 0], scale: [1, 1, 0.3] }),
                box(0.7, 0.1, 0.12, 0xd4a017, [0, -0.45, 0]),
                cyl(0.06, 0.06, 0.5, 0x3a2418, [0, -0.78, 0], 6),
                piece(new THREE.SphereGeometry(0.1, 5, 4), 0xd4a017, { pos: [0, -1.05, 0] })
            ));
        }
        case 3: {                                                          // Desierto Florido: flor grande
            const f = createFlower();
            f.scale.setScalar(2.2);
            f.position.y = -0.6;
            const wrap = new THREE.Group();
            wrap.add(f);
            return wrap;
        }
        case 4: {                                                          // Plata de Chañarcillo: lingotes
            const g = new THREE.Group();
            g.add(piece(new THREE.CylinderGeometry(0.55, 0.7, 0.4, 4), 0xcfd6dc, { pos: [-0.35, -0.2, 0], rot: [0, Math.PI / 4, 0], scale: [1.3, 1, 0.7] }));
            g.add(piece(new THREE.CylinderGeometry(0.55, 0.7, 0.4, 4), 0xe3e9ee, { pos: [0.35, -0.2, 0.1], rot: [0, Math.PI / 4 + 0.3, 0], scale: [1.3, 1, 0.7] }));
            g.add(piece(new THREE.CylinderGeometry(0.5, 0.65, 0.4, 4), 0xf2f5f8, { pos: [0, 0.2, 0], rot: [0, Math.PI / 4 + 0.1, 0], scale: [1.3, 1, 0.7] }));
            g.add(piece(new THREE.OctahedronGeometry(0.4, 0), 0xa9d6ff, { pos: [0, 0.85, 0] }));
            return bake(g);
        }
        default: {                                                         // Bahía Inglesa: caracola
            const g = new THREE.Group();
            g.add(piece(new THREE.SphereGeometry(0.55, 7, 5), 0xf3cdb5, { pos: [0, 0, 0], scale: [1, 0.85, 1.2] }));
            g.add(piece(new THREE.ConeGeometry(0.42, 1.1, 7), 0xf0b99b, { pos: [0, 0.25, -0.75], rot: [-Math.PI / 2 - 0.3, 0, 0] }));
            for (let i = 0; i < 3; i++) g.add(piece(new THREE.TorusGeometry(0.34 - i * 0.07, 0.045, 4, 8), 0xe8a98a, { pos: [0, 0.3 + i * 0.03, -0.45 - i * 0.28], rot: [0, 0, 0] }));
            g.add(piece(new THREE.SphereGeometry(0.3, 6, 4), 0xe58f7a, { pos: [0, -0.1, 0.55], scale: [1, 0.7, 0.7] }));
            const bz = bake(g);
            const wrap = new THREE.Group();
            wrap.add(bz);
            wrap.rotation.x = 0.2;
            return wrap;
        }
    }
}

/**
 * Objeto coleccionable con brillo, aro giratorio y un haz de luz para encontrarlo de lejos.
 * Devuelve { root, update(t) }. El `userData` lo completa la escena (type: 'fragment', datos...).
 */
export function createRelic(id, color) {
    const root = new THREE.Group();
    const floater = new THREE.Group();
    floater.position.y = 2.2;
    const body = relicBody(id);
    body.traverse((c) => { if (c.isMesh) { c.castShadow = true; } });
    floater.add(body);

    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, depthWrite: false }));
    floater.add(glow);
    const halo = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.05, 4, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 }));
    halo.rotation.x = Math.PI / 2;
    floater.add(halo);
    root.add(floater);

    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.8, 26, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }));
    beam.position.y = 13;
    root.add(beam);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 0.25, 8), getToonMaterial().clone());
    base.material.vertexColors = false;
    base.material.color = new THREE.Color(0xb8b0a2);
    base.position.y = 0.12;
    base.castShadow = base.receiveShadow = true;
    root.add(base);

    function update(t) {
        floater.position.y = 2.2 + Math.sin(t * 2) * 0.25;
        body.rotation.y = t * 1.2;
        halo.rotation.z = t * 1.5;
        glow.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
        beam.material.opacity = 0.18 + Math.sin(t * 2.5) * 0.04;
    }
    return { root, update };
}
