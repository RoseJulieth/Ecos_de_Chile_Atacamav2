// Objetos del desierto de Atacama generados por código (estilo low-poly / "Zelda").
// Cactus, rocas, flores y cerros con figuras básicas, colores planos y MeshToonMaterial.
//
// Cada objeto sale como UNA sola malla (con colores por vértice y un material compartido),
// así que cada cactus, roca o flor cuesta 1 draw call en vez de 5-10.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// ---------- Azar con semilla (el mundo sale igual en cada carga) ----------
function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

let rand = mulberry32(2024);
export function setSeed(seed) { rand = mulberry32(seed); }
export const range = (a, b) => a + (b - a) * rand();
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];
export const random = () => rand();

// ---------- Material toon compartido ----------
let gradientMap = null;
export function getGradientMap() {
    if (!gradientMap) {
        // 3 escalones de luz (sombra, medio, luz) sin degradé: el "corte" típico del cel-shading
        gradientMap = new THREE.DataTexture(new Uint8Array([110, 190, 255]), 3, 1, THREE.RedFormat);
        gradientMap.minFilter = gradientMap.magFilter = THREE.NearestFilter;
        gradientMap.generateMipmaps = false;
        gradientMap.needsUpdate = true;
    }
    return gradientMap;
}

let vertexColorMaterial = null;
/** Material para todos los objetos horneados: el color viene de cada vértice. */
export function getToonMaterial() {
    if (!vertexColorMaterial) {
        vertexColorMaterial = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: getGradientMap() });
    }
    return vertexColorMaterial;
}

// ---------- Utilidades de geometría ----------
/**
 * Mueve los vértices al azar. Los vértices que están en la misma posición se mueven IGUAL:
 * si cada copia se moviera distinto, las caras se separarían y quedarían grietas.
 * (Los Dodecahedron/Cone/Sphere de three.js repiten vértices en cada cara o costura.)
 */
function jitter(geometry, amount, { keepBase = false } = {}) {
    const pos = geometry.attributes.position;
    const offsets = new Map();
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const key = `${Math.round(x * 1000)},${Math.round(y * 1000)},${Math.round(z * 1000)}`;
        let o = offsets.get(key);
        if (!o) {
            o = [(rand() - 0.5) * 2, (rand() - 0.5) * 2, (rand() - 0.5) * 2];
            offsets.set(key, o);
        }
        const baseY = keepBase && y < 0.001;
        pos.setXYZ(i, x + o[0] * amount, baseY ? y : y + o[1] * amount, z + o[2] * amount);
    }
    pos.needsUpdate = true;
}

/** Pieza = geometría + color + posición/rotación/escala; se junta con las demás en bake(). */
export function piece(geometry, color, { pos, rot, scale } = {}) {
    const mesh = new THREE.Mesh(geometry);
    mesh.userData.color = new THREE.Color(color);
    if (pos) mesh.position.set(...pos);
    if (rot) mesh.rotation.set(...rot);
    if (scale) mesh.scale.set(...scale);
    return mesh;
}

/** Junta todas las piezas de `root` en una sola malla con caras planas y colores por vértice. */
export function bake(root) {
    root.updateMatrixWorld(true);
    const geometries = [];
    root.traverse((child) => {
        if (!child.isMesh) return;
        let g = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
        for (const name of Object.keys(g.attributes)) {
            if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
        }
        g.applyMatrix4(child.matrixWorld);
        g.computeVertexNormals(); // al no tener índice, cada cara tiene su propia normal = aspecto facetado

        const c = child.userData.color;
        const colors = new Float32Array(g.attributes.position.count * 3);
        for (let i = 0; i < colors.length; i += 3) { colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b; }
        g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometries.push(g);
    });

    const mesh = new THREE.Mesh(mergeGeometries(geometries, false), getToonMaterial());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

// ---------- 1. CACTUS (saguaro) ----------
const CACTUS_GREENS = [0x2f5d34, 0x366b3b, 0x2a5030];

export function createCactus({ height = range(3, 4.4) } = {}) {
    const root = new THREE.Group();
    const green = pick(CACTUS_GREENS);
    const r = range(0.38, 0.5);

    // Las cápsulas dan las puntas redondeadas de los saguaros reales
    root.add(piece(new THREE.CapsuleGeometry(r, height - 2 * r, 2, 6), green, { pos: [0, height / 2, 0] }));

    const lados = rand() < 0.15 ? [pick([-1, 1])] : (rand() < 0.5 ? [-1, 1] : [pick([-1, 1])]);
    for (const lado of lados) {
        const armR = r * range(0.55, 0.7);
        const alcance = range(0.8, 1.3);
        const subida = range(0.8, 1.6);
        const y = height * range(0.35, 0.62);

        // tramo horizontal que sale del tronco
        root.add(piece(new THREE.CapsuleGeometry(armR, alcance, 2, 6), green, {
            pos: [lado * (r * 0.4 + alcance / 2), y, 0], rot: [0, 0, Math.PI / 2]
        }));
        // tramo vertical hacia arriba
        root.add(piece(new THREE.CapsuleGeometry(armR, subida, 2, 6), green, {
            pos: [lado * (r * 0.4 + alcance), y + subida / 2, 0]
        }));
    }

    root.rotation.y = rand() * Math.PI * 2;
    return bake(root);
}

// ---------- 2. ROCAS ----------
const ROCK_COLORS = [0x8b8c89, 0xa39d91, 0x6e685f, 0xc2b59b, 0x9b8f7b];

function rockPiece(size) {
    const geo = new THREE.DodecahedronGeometry(size, 0);
    jitter(geo, size * 0.16);
    return piece(geo, pick(ROCK_COLORS), {
        rot: [rand() * Math.PI, rand() * Math.PI, 0],
        scale: [1, range(0.6, 0.85), range(0.85, 1.1)]
    });
}

export function createRock(size = 1) {
    const root = new THREE.Group();
    const rock = rockPiece(size);
    rock.position.y = size * 0.35; // un poco enterrada en la arena
    root.add(rock);
    return bake(root);
}

/** Grupo de rocas como las de la imagen de referencia: una grande rodeada de otras más chicas. */
export function createRockCluster({ size = range(1, 1.8), count = Math.floor(range(3, 7)) } = {}) {
    const root = new THREE.Group();
    const main = rockPiece(size);
    main.position.y = size * 0.35;
    root.add(main);

    for (let i = 1; i < count; i++) {
        const s = size * range(0.3, 0.65);
        const a = rand() * Math.PI * 2;
        const d = size * range(0.9, 1.6);
        const rock = rockPiece(s);
        rock.position.set(Math.cos(a) * d, s * 0.3, Math.sin(a) * d);
        root.add(rock);
    }
    return bake(root);
}

// ---------- 3. FLORES (Desierto Florido) ----------
const PETAL_COLORS = [0xe8372c, 0x9b4fd6, 0xf2c200, 0xf5f2ea];

function buildFlower() {
    const flower = new THREE.Group();
    flower.add(piece(new THREE.CylinderGeometry(0.04, 0.06, 0.7, 5), 0x4f6b2a, { pos: [0, 0.35, 0] }));
    flower.add(piece(new THREE.IcosahedronGeometry(0.1, 0), 0x6b8e23, { pos: [0, 0.7, 0] }));

    const petalColor = pick(PETAL_COLORS);
    const petals = 5;
    for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        flower.add(piece(new THREE.IcosahedronGeometry(0.22, 0), petalColor, {
            pos: [Math.cos(angle) * 0.15, 0.75, Math.sin(angle) * 0.15],
            rot: [Math.PI / 2.3, angle + Math.PI / 2, 0],
            scale: [1, 1.2, 0.3]
        }));
    }
    flower.add(piece(new THREE.SphereGeometry(0.09, 8, 6), 0xf5d90a, { pos: [0, 0.82, 0] }));
    flower.scale.setScalar(range(1.0, 1.5)); // flores vistosas, como en la referencia
    return flower;
}

export function createFlower() {
    const root = new THREE.Group();
    root.add(buildFlower());
    return bake(root);
}

/** Varias flores en una sola malla (1 draw call): ideal para llenar el Desierto Florido. */
export function createFlowerPatch({ count = 8, radius = 3 } = {}) {
    const root = new THREE.Group();
    for (let i = 0; i < count; i++) {
        const flower = buildFlower();
        const a = rand() * Math.PI * 2;
        const d = Math.sqrt(rand()) * radius;
        flower.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
        flower.rotation.y = rand() * Math.PI * 2;
        root.add(flower);
    }
    return bake(root);
}

// ---------- 4. CERROS / DUNAS ----------
const HILL_COLORS = [0xd9a56e, 0xcf9a62, 0xe0b07a, 0xc88f5a];

function hillPiece(radius, height, colors = HILL_COLORS) {
    // Media esfera con pocos segmentos = domo facetado; se achata y se deforma un poco
    const geo = new THREE.SphereGeometry(radius, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2);
    geo.scale(range(0.9, 1.4), height / radius, 1);
    jitter(geo, radius * 0.08, { keepBase: true });
    return piece(geo, pick(colors), { pos: [0, -0.3, 0], rot: [0, rand() * Math.PI * 2, 0] });
}

export function createHill({ radius = 18, height = 7, colors } = {}) {
    const root = new THREE.Group();
    root.add(hillPiece(radius, height, colors));
    return bake(root);
}

/**
 * Cordillera de cerros alrededor del mapa, todo en una sola malla.
 * colors: paleta de los cerros. skip(angulo): devuelve true para dejar un hueco (ej. para ver el mar).
 */
export function createHillRing({ inner = 80, outer = 130, count = 16, colors, skip, minH = 7, maxH = 16 } = {}) {
    const root = new THREE.Group();
    for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + range(-0.15, 0.15);
        const d = range(inner, outer);
        const r = range(18, 34), h = range(minH, maxH);   // se sortean siempre para que la semilla no cambie
        if (skip && skip(a)) continue;
        const hill = hillPiece(r, h, colors);
        hill.position.x = Math.cos(a) * d;
        hill.position.z = Math.sin(a) * d;
        root.add(hill);
    }
    return bake(root);
}

// ---------- Suelo y contorno ----------
/** Suelo plano de arena (el personaje camina sobre y = 0). */
export function createGround(size = 300, color = 0xc98a5b) {
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshToonMaterial({ color, gradientMap: getGradientMap() })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    return ground;
}

const outlineMaterials = new Map();

/**
 * Contorno oscuro tipo dibujo animado: copia de la malla, inflada y vista "por dentro".
 * Las normales se suavizan por posición para que el contorno no se rompa en las aristas.
 * Se agrega como hijo de `mesh`, así que se mueve y escala junto con él.
 */
export function addOutline(mesh, thickness = 0.05, color = 0x1d140b) {
    const geo = mesh.geometry.clone();
    const pos = geo.attributes.position;
    const nor = geo.attributes.normal;

    const sums = new Map();
    const keyOf = (i) => `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`;
    for (let i = 0; i < pos.count; i++) {
        const k = keyOf(i);
        const s = sums.get(k) || new THREE.Vector3();
        s.x += nor.getX(i); s.y += nor.getY(i); s.z += nor.getZ(i);
        sums.set(k, s);
    }
    for (let i = 0; i < pos.count; i++) {
        const n = sums.get(keyOf(i)).clone().normalize();
        pos.setXYZ(i, pos.getX(i) + n.x * thickness, pos.getY(i) + n.y * thickness, pos.getZ(i) + n.z * thickness);
    }
    geo.deleteAttribute('color');

    if (!outlineMaterials.has(color)) {
        outlineMaterials.set(color, new THREE.MeshBasicMaterial({ color, side: THREE.BackSide }));
    }
    const hull = new THREE.Mesh(geo, outlineMaterials.get(color));
    mesh.add(hull);
    return mesh;
}

/**
 * Junta en UNA sola malla todos los objetos horneados (cactus, rocas, casas...) que cuelgan de `root`.
 * Respeta la posición/rotación/escala de cada uno. Ideal para el decorado estático de una escena:
 * cientos de objetos terminan siendo 1 draw call.
 */
export function mergeBaked(root) {
    root.updateMatrixWorld(true);
    const material = getToonMaterial();
    const geometries = [];
    root.traverse((child) => {
        if (!child.isMesh || child.material !== material) return;
        const g = child.geometry.clone();
        g.applyMatrix4(child.matrixWorld);
        geometries.push(g);
    });
    const mesh = new THREE.Mesh(mergeGeometries(geometries, false), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
