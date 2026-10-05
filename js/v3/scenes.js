// Definición de las 6 escenas del juego. Cada una arma su decorado con las piezas de Buildings.js
// y ProceduralAssets.js. Convención del mapa: "adelante" al empezar es -Z; el portal de regreso queda en +Z.
import * as THREE from 'three';
import { piece, bake, range, createCactus, createRock, createRockCluster, createFlowerPatch } from '../ProceduralAssets.js';
import * as B from './Buildings.js';
import { createSeagulls, createBees, createCats, createDogs, createFoxes, createBirds } from './Fauna.js';

const toRad = (deg) => (deg * Math.PI) / 180;
const polar = (phiDeg, r) => ({ x: r * Math.sin(toRad(phiDeg)), z: -r * Math.cos(toRad(phiDeg)) }); // phi=0 -> -Z (adelante)
const faceTo = (x, z, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

const GOLD = 0xffd54a;

/** Portal de regreso a Copiapó, siempre atrás del punto de partida (en +Z) mirando al jugador. */
function backPortal(ctx) {
    ctx.portal({ label: 'Volver a Copiapó', target: 'copiapo', x: 0, z: 35, face: Math.PI, color: GOLD });
    ctx.patch(0, 31, 6.5, 0xb8a888, { h: 0.06 });
}

const WARM_HILLS = [0xd9a56e, 0xcf9a62, 0xe0b07a, 0xc88f5a];

// =====================================================================
// COPIAPÓ (pueblo central con los portales)
// =====================================================================
const HUB_PORTALS = [
    { target: 'diaguita', phi: -72, label: 'Cultura Diaguita', color: 0xf0a04b },
    { target: 'batallon', phi: -36, label: 'Batallón Atacama', color: 0xe0443d },
    { target: 'chanarcillo', phi: 0, label: 'Plata de Chañarcillo', color: 0xbfe0ff },
    { target: 'florido', phi: 36, label: 'Desierto Florido', color: 0xff7bc0 },
    { target: 'bahia', phi: 72, label: 'Bahía Inglesa', color: 0x36d6e0 }
];
const HUB_PORTAL_R = 46;

// al volver desde una escena, el jugador aparece frente al portal por el que salió
const hubSpawns = {};
for (const p of HUB_PORTALS) {
    const pos = polar(p.phi, HUB_PORTAL_R - 7);
    hubSpawns[p.target] = { x: pos.x, z: pos.z, heading: [-pos.x, -pos.z] };
}

const GRASS = 0x7fb069;

const copiapo = {
    id: 'copiapo', name: 'Copiapó', subtitle: 'La capital minera de Atacama · elige un portal',
    seed: 11, radius: 58,
    sky: [0x5aa6ea, 0xd8edf7], ground: 0xcdb27e, hillColors: WARM_HILLS,
    audio: { wind: 0.4, waves: 0 },
    spawn: { x: 0, z: 19, heading: [0, -1] },
    spawns: hubSpawns,
    build(ctx) {
        // plaza amplia con césped, arriates de flores y fuente (todo con holgura para pasar entre medio)
        ctx.patch(0, 0, 19, GRASS);
        ctx.patch(0, 0, 16, 0xdcceb0);
        ctx.patch(0, 0, 12.5, 0xc9b896);
        ctx.place(B.createFountain(), 0, 0, { collide: 3.6 });
        for (let i = 0; i < 4; i++) {
            const p = polar(i * 90 + 45, 9.5);
            ctx.place(B.createFlowerBed({ radius: 1.5 }), p.x, p.z, { collide: 1.7 });
        }
        for (let i = 0; i < 8; i++) {
            const p = polar(i * 45 + 22.5, 14.2);
            ctx.place(B.createLamp(), p.x, p.z, { collide: 0.4 });
        }
        for (let i = 0; i < 8; i++) {
            const phi = i * 45;
            if (phi % 90 === 0 && phi !== 90 && phi !== 270) continue; // accesos norte/sur libres
            const p = polar(phi, 12.6);
            ctx.place(B.createBench(), p.x, p.z, { rot: faceTo(p.x, p.z), collide: 1.2 });
        }

        // caminos anchos hacia cada portal, con farolas a los costados
        for (const hp of HUB_PORTALS) {
            const a = polar(hp.phi, 16), b = polar(hp.phi, HUB_PORTAL_R - 4);
            ctx.path(a.x, a.z, b.x, b.z, 5, 0xdcceb0);
            const portalPos = polar(hp.phi, HUB_PORTAL_R);
            ctx.portal({ label: hp.label, target: hp.target, x: portalPos.x, z: portalPos.z, color: hp.color });
            const nx = Math.cos(toRad(hp.phi)), nz = Math.sin(toRad(hp.phi)); // perpendicular al camino
            for (const d of [24, 32, 40]) for (const side of [-1, 1]) {
                const c = polar(hp.phi, d);
                ctx.place(B.createLamp(), c.x + nx * 3.4 * side, c.z + nz * 3.4 * side, { collide: 0.4 });
            }
        }

        // anillo de árboles de plaza (Copiapó es un oasis verde en el desierto)
        for (let i = 0; i < 34; i++) {
            const phi = i * (360 / 34) + 5;
            const p = polar(phi, 22 + (i % 2) * 2.5);
            if (Math.abs(phi - 180) < 30) continue;          // franja de la cámara al empezar (detrás del jugador)
            if (ctx.nearPath(p.x, p.z, 2.8)) continue;
            ctx.place(B.createTree({ height: 2.8 + (i % 3) * 0.5, size: 0.9 + (i % 4) * 0.1 }), p.x, p.z, { collide: 0.7, rot: i, camBlock: 2.4 });
        }

        // iglesia y casas, solo detrás de la plaza (así no invaden los caminos hacia los portales)
        const church = polar(218, 46);
        ctx.patch(church.x, church.z, 10, GRASS);
        ctx.placeBox(B.createChurch(), church.x, church.z, 9, 14, { rot: faceTo(church.x, church.z) });
        const walls = B.WALLS;
        [98, 120, 142, 164, 252].forEach((phi, i) => {
            const p = polar(phi, 41 + (i % 2) * 2.5);
            ctx.placeBox(B.createHouse({ wall: walls[i % walls.length], roofType: i % 2 ? 'flat' : 'pyramid' }), p.x, p.z, 7, 6, { rot: faceTo(p.x, p.z) });
            const t = polar(phi - 6, 35);
            ctx.place(B.createTree({ height: 3, size: 0.95 }), t.x, t.z, { collide: 0.7, rot: i, camBlock: 2.4 });
        });
        const w = polar(192, 32);
        ctx.place(B.createWell(), w.x, w.z, { collide: 1.5 });

        // gente
        ctx.npc('npc_002', -10, -4, faceTo(-10, -4, 0, 12));
        ctx.npc('npc_008', 11, 6, faceTo(11, 6, 0, 12));
        const cn = { x: church.x + 6, z: church.z - 13 };
        ctx.npc('npc_009', cn.x, cn.z, faceTo(cn.x, cn.z, 0, 12));

        ctx.sign({
            title: 'Copiapó', x: 8, z: 14, rot: 0,
            description: 'Copiapó es la capital de la Región de Atacama. En 1832 el descubrimiento de plata en Chañarcillo la convirtió en capital minera, y en 1851 llegó el ferrocarril que la unió con Caldera, uno de los primeros de Sudamérica. Elige un portal para viajar por Atacama y encontrar los 5 fragmentos históricos.'
        });

        // un poco de desierto y más verde en los bordes
        ctx.avoid.push({ x: 0, z: 0, r: 20 }, { x: 0, z: 19, r: 6 }, { x: 0, z: 30, r: 8 }); // 30 = donde queda la cámara al empezar
        ctx.scatter(8, () => createCactus(), { rMin: 30, collide: 0.7, minGap: 7 });
        ctx.scatter(6, () => createRockCluster(), { rMin: 30, collide: 1.8, minGap: 8 });
        ctx.scatter(16, () => B.createTree({ height: 2.6, size: 0.9 }), { rMin: 26, collide: 0.7, minGap: 6, camBlock: 2.4 });

        // mascotas del pueblo: gatos tímidos y perros (quiltros) curiosos
        const pet = { colliders: ctx.colliders, limit: 58 };
        ctx.fauna(createCats({ ...pet, roam: 9, homes: [{ x: -17, z: 13 }, { x: 22, z: -9 }] }));
        ctx.fauna(createDogs({ ...pet, roam: 12, homes: [{ x: 15, z: 17 }, { x: -20, z: -12 }] }));
    }
};

// =====================================================================
// CULTURA DIAGUITA
// =====================================================================
const diaguita = {
    id: 'diaguita', name: 'Cultura Diaguita', subtitle: 'Maestros de la cerámica · 1000-1540 d.C.',
    seed: 21, radius: 42,
    sky: [0x7bb6e8, 0xf0e4cc], ground: 0xc99a6a, hillColors: [0xcfa070, 0xc2915f, 0xdcae7f],
    audio: { wind: 1, waves: 0 },
    spawn: { x: 0, z: 20, heading: [0, -1] },
    build(ctx) {
        backPortal(ctx);
        // plaza ceremonial dentro del muro de piedra (pukará)
        ctx.patch(0, -2, 13, 0xb9a07a);
        ctx.patch(0, -2, 3.2, 0x8f8272, { h: 0.5 });
        for (let i = 0; i < 8; i++) {
            const phi = i * 45;
            if (phi === 0) continue; // entrada hacia +Z
            const x = 15 * Math.sin(toRad(phi)), z = -2 + 15 * Math.cos(toRad(phi));
            const rot = toRad(phi); // el muro va tangente al círculo
            ctx.place(B.createStoneWall(8, 1.8), x, z, { rot });
            ctx.colliders.rect(x, z, 8, 1.1, rot, false);   // muro bajo: no tapa a la cámara
        }
        ctx.place(B.createStele(), -5.5, 17, { collide: 1.0 });
        ctx.place(B.createStele(), 5.5, 17, { collide: 1.0 });

        // chozas y alfarería
        [[-26, -8], [27, -10], [-19, -26], [20, -27]].forEach(([x, z]) => ctx.placeBox(B.createAdobeHut(), x, z, 5.4, 5.4, { rot: faceTo(x, z, 0, 0) }));
        [[-22, -2], [-20, -5], [22, -4], [24, -6], [-14, -22], [16, -23]].forEach(([x, z], i) => {
            ctx.place(i % 2 ? B.createDuckJar({ scale: 0.8 }) : B.createClayPot(1.1), x, z, { collide: 0.6, rot: i });
        });

        ctx.fragment(1, 0, -2);
        ctx.npc('npc_011', 10, 12, faceTo(10, 12, 0, 20));
        ctx.sign({
            title: 'Cultura Diaguita', x: -6, z: 21, rot: 0,
            description: 'Pueblo originario del Norte Chico de Chile (1000-1540 d.C.), famoso por su cerámica de diseños geométricos en rojo, blanco y negro. Sus jarros-pato combinaban función y arte.'
        });

        ctx.avoid.push({ x: 0, z: -2, r: 17 }, { x: 0, z: 20, r: 6 });
        ctx.scatter(12, () => createCactus(), { rMin: 20, collide: 0.7, minGap: 4 });
        ctx.scatter(9, () => createRockCluster(), { rMin: 20, collide: 1.8, minGap: 5 });

        // diucas: se posan en los muros, las estelas y las vasijas, y saltan de una a otra
        const perches = [];
        for (let i = 0; i < 8; i++) {
            if (i === 0) continue;
            perches.push({ x: 15 * Math.sin(toRad(i * 45)), y: 1.85, z: -2 + 15 * Math.cos(toRad(i * 45)) });
        }
        perches.push({ x: -5.5, y: 4.4, z: 17 }, { x: 5.5, y: 4.4, z: 17 });
        [[-22, -2], [22, -4], [-14, -22], [16, -23]].forEach(([x, z]) => perches.push({ x, y: 1.3, z }));
        perches.push({ x: 3, y: 0.05, z: -14 }, { x: -4, y: 0.05, z: 8 }, { x: 8, y: 0.05, z: 3 });
        ctx.fauna(createBirds({ perches, count: 8 }));
    }
};

// =====================================================================
// BATALLÓN ATACAMA
// =====================================================================
function campfire(ctx, x, z) {
    const logs = new THREE.Group();
    for (let i = 0; i < 4; i++) {
        logs.add(piece(new THREE.CylinderGeometry(0.12, 0.12, 1.5, 5), 0x5a3a1c, { pos: [0, 0.15, 0], rot: [Math.PI / 2 - 0.2, (i * Math.PI) / 4 * 2, 0] }));
    }
    logs.add(piece(new THREE.CylinderGeometry(0.9, 1.0, 0.1, 8), 0x3a3a3a, { pos: [0, 0.03, 0] }));
    const mesh = bake(logs);
    ctx.place(mesh, x, z, { collide: 1.0 });

    const flame = new THREE.Group();
    flame.position.set(x, 0.1, z);
    const mats = [0xff7a1a, 0xffc233, 0xfff1a8].map((c) => new THREE.MeshBasicMaterial({ color: c }));
    const cones = [0, 1, 2].map((i) => {
        const c = new THREE.Mesh(new THREE.ConeGeometry(0.55 - i * 0.14, 1.5 - i * 0.3, 5), mats[i]);
        c.position.y = 0.7 - i * 0.05;
        flame.add(c);
        return c;
    });
    const light = new THREE.PointLight(0xff9a3a, 14, 14, 1.6);
    light.position.y = 1.2;
    flame.add(light);
    ctx.dynamic(flame, (t) => {
        cones.forEach((c, i) => { c.scale.y = 1 + Math.sin(t * (9 + i * 3) + i) * 0.18; c.rotation.y = t * 2; });
        light.intensity = 13 + Math.sin(t * 11) * 2.5;
    });
}

const batallon = {
    id: 'batallon', name: 'Batallón Atacama', subtitle: 'Los "Curitas" de la Guerra del Pacífico · 1879-1880',
    seed: 31, radius: 42,
    sky: [0x8fb4d6, 0xeadfcb], ground: 0xb9a273, hillColors: [0xb59d78, 0xa88f6a, 0xc2aa84],
    audio: { wind: 0.8, waves: 0 },
    spawn: { x: 0, z: 20, heading: [0, -1] },
    build(ctx) {
        backPortal(ctx);
        ctx.patch(0, -6, 12, 0xa8935f);

        // bandera central y carpas
        ctx.place(B.createFlag(), 0, -8, { collide: 0.6 });
        [[-16, -4, 90], [16, -4, -90], [-22, -16, 60], [22, -16, -60], [-9, -24, 20], [9, -24, -20]].forEach(([x, z], i) => {
            ctx.placeBox(B.createTent({ color: i % 2 ? 0xd9c9a0 : 0xc9b88a }), x, z, 4.8, 6.2, { rot: faceTo(x, z, 0, -4) });
        });
        // artillería y trincheras
        ctx.place(B.createCannon(), -9, -1, { rot: Math.PI, collide: 1.3 });
        ctx.place(B.createCannon(), 9, -1, { rot: Math.PI, collide: 1.3 });
        for (let i = -3; i <= 3; i++) {
            ctx.place(B.createSandbags(), i * 4.2, -32, { collide: 1.8 });
        }
        // intendencia
        [[13, 6], [14.4, 6.6], [12.5, 8]].forEach(([x, z], i) => ctx.place(i === 2 ? B.createBarrel() : B.createCrate(1.1), x, z, { collide: 0.7, rot: i }));
        campfire(ctx, -6, 7);

        ctx.fragment(2, -11, -13);
        ctx.npc('npc_003', 3, -3, faceTo(3, -3, 0, 20));
        ctx.sign({
            title: 'Batallón Atacama', x: 6, z: 18, rot: 0,
            description: 'Apodados "Los Curitas" por sus uniformes negros, los soldados del Batallón Atacama demostraron un valor inquebrantable en la Batalla de Tacna, el 26 de mayo de 1880, durante la Guerra del Pacífico.'
        });

        ctx.avoid.push({ x: 0, z: -6, r: 14 }, { x: 0, z: 20, r: 6 });
        ctx.scatter(8, () => createCactus(), { rMin: 22, collide: 0.7, minGap: 4 });
        ctx.scatter(8, () => createRockCluster(), { rMin: 20, collide: 1.8, minGap: 5 });

        // zorros culpeo que rondan el campamento (se esconden si te acercas)
        ctx.fauna(createFoxes({ colliders: ctx.colliders, limit: 42, roam: 6, homes: [{ x: -31, z: -22 }, { x: 31, z: -25 }, { x: -33, z: 6 }] }));
    }
};

// =====================================================================
// CHAÑARCILLO
// =====================================================================
const chanarcillo = {
    id: 'chanarcillo', name: 'Plata de Chañarcillo', subtitle: 'La fiebre de la plata · 1832',
    seed: 41, radius: 42,
    sky: [0xe39a62, 0xf8e0bd], ground: 0xa88a6a, hillColors: [0x8f7b66, 0x7f6d5a, 0x9c8872],
    hemiSky: 0xffe2c0, hemiGround: 0x9a7a5a,
    audio: { wind: 0.9, waves: 0 },
    spawn: { x: 0, z: 20, heading: [0, -1] },
    build(ctx) {
        backPortal(ctx);
        // la mina al fondo
        ctx.place(B.createMineEntrance(), 0, -34);
        ctx.colliders.rect(0, -36, 24, 12);
        ctx.patch(0, -22, 8, 0x8f7556);
        ctx.place(B.createRails(22), 0, -16, {});
        ctx.place(B.createMineCart(), 0, -9, { collide: 1.4 });
        ctx.place(B.createLamp(), -3.8, -26, { collide: 0.4 });
        ctx.place(B.createLamp(), 3.8, -26, { collide: 0.4 });
        // campamento minero
        [[-14, -6], [-16, -9], [15, -12], [16.6, -13.4], [13, -14]].forEach(([x, z], i) => ctx.place(i % 3 === 2 ? B.createBarrel() : B.createCrate(1.2), x, z, { collide: 0.8, rot: i }));
        ctx.placeBox(B.createHouse({ wall: 0xc9a374, roofType: 'flat', w: 6, d: 5, h: 3 }), -20, -16, 6, 5, { rot: faceTo(-20, -16, 0, 0) });
        ctx.placeBox(B.createHouse({ wall: 0xb89066, roofType: 'flat', w: 6, d: 5, h: 3 }), 21, -18, 6, 5, { rot: faceTo(21, -18, 0, 0) });

        ctx.fragment(4, 10, -22);
        ctx.npc('npc_001', -6, -18, faceTo(-6, -18, 0, 20));
        ctx.sign({
            title: 'Mina de Chañarcillo', x: 7, z: 14, rot: 0,
            description: 'En 1832 el arriero Juan Godoy descubrió plata en Chañarcillo. La riqueza del mineral transformó a Copiapó en la capital minera de Chile y ayudó a financiar el ferrocarril.'
        });

        ctx.avoid.push({ x: 0, z: -18, r: 16 }, { x: 0, z: 20, r: 6 });
        ctx.scatter(10, () => B.createSilverRock(range(1, 1.6)), { rMin: 12, collide: 1.3, minGap: 4 });
        ctx.scatter(6, () => createCactus(), { rMin: 22, collide: 0.7, minGap: 4 });
        ctx.scatter(8, () => createRockCluster(), { rMin: 22, collide: 1.8, minGap: 5 });
    }
};

// =====================================================================
// DESIERTO FLORIDO
// =====================================================================
function telescope() {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2;
        g.add(piece(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 5), 0x3a3a40, { pos: [Math.cos(a) * 0.45, 1.1, Math.sin(a) * 0.45], rot: [Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3] }));
    }
    g.add(piece(new THREE.CylinderGeometry(0.22, 0.28, 2.2, 8), 0xe8e8ee, { pos: [0, 2.7, 0.5], rot: [-0.9, 0, 0] }));
    g.add(piece(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8), 0x2f6fb3, { pos: [0, 3.3, 1.25], rot: [-0.9, 0, 0] }));
    return bake(g);
}

const florido = {
    id: 'florido', name: 'Desierto Florido', subtitle: 'Cuando el desierto más árido se cubre de flores',
    seed: 51, radius: 44,
    sky: [0x68aef0, 0xf5e6d6], ground: 0xc78a60, hillColors: [0xd9a56e, 0xcf9a62, 0xe0b07a, 0xd49a78],
    audio: { wind: 0.7, waves: 0 },
    spawn: { x: 0, z: 21, heading: [0, -1] },
    build(ctx) {
        backPortal(ctx);
        ctx.fragment(3, 0, -30);
        ctx.npc('npc_004', -12, -12, faceTo(-12, -12, 0, 20));
        ctx.npc('npc_005', 13, -16, faceTo(13, -16, 0, 20));
        ctx.npc('npc_010', 8, 9, faceTo(8, 9, 0, 20));
        ctx.npc('npc_012', -16, 9, faceTo(-16, 9, 0, 20));
        ctx.place(telescope(), -19, 7, { rot: 0.8, collide: 0.9 });
        ctx.placeBox(B.createTent({ color: 0xf3efe4, stripe: 0x3a78c2, w: 3.8, d: 4.8 }), 14, 11, 4.4, 5.6, { rot: faceTo(14, 11, 0, 20) });
        ctx.sign({
            title: 'Desierto Florido', x: -6, z: 22, rot: 0,
            description: 'Ocurre cada 5 a 7 años, cuando las lluvias del fenómeno de El Niño despiertan semillas que han permanecido latentes durante décadas. Aparecen más de 200 especies de flores.'
        });

        ctx.avoid.push({ x: 0, z: 21, r: 7 });
        // mar de flores: parches grandes por todo el valle (sin colisión, se camina entre ellas)
        const patches = ctx.scatter(34, () => createFlowerPatch({ count: 11, radius: 4.2 }), { rMin: 5, rMax: 42, minGap: 5.5, clear: 4.5 });
        ctx.scatter(12, () => createCactus(), { rMin: 10, collide: 0.7, minGap: 4 });
        ctx.scatter(9, () => createRockCluster(), { rMin: 12, collide: 1.8, minGap: 5 });

        // abejas nativas que revolotean alrededor de las flores
        ctx.fauna(createBees({ patches, count: 22 }));
    }
};

// =====================================================================
// BAHÍA INGLESA
// =====================================================================
const bahia = {
    id: 'bahia', name: 'Bahía Inglesa', subtitle: 'Aguas turquesas y arena blanca',
    seed: 61, radius: 44,
    sky: [0x4aa0f0, 0xe6f6fb], ground: 0xf0dfb0, hillColors: [0xe0c590, 0xd6b87f, 0xe8d09e],
    hemiSky: 0xe8f6ff, hemiGround: 0xe6d2a0,
    audio: { wind: 0.25, waves: 1 },
    spawn: { x: 0, z: 20, heading: [0, -1] },
    hillSkip: (a) => Math.sin(a) < -0.3,           // hueco hacia el mar (-Z)
    build(ctx) {
        backPortal(ctx);

        // mar: aguas profundas, orilla poco profunda y espuma que va y viene
        const shoreZ = -17;
        const deep = new THREE.Mesh(new THREE.PlaneGeometry(800, 500), new THREE.MeshBasicMaterial({ color: 0x1f8fb8 }));
        deep.rotation.x = -Math.PI / 2; deep.position.set(0, 0.02, shoreZ - 250);
        const shallow = new THREE.Mesh(new THREE.PlaneGeometry(800, 22), new THREE.MeshBasicMaterial({ color: 0x4fd0d6 }));
        shallow.rotation.x = -Math.PI / 2; shallow.position.set(0, 0.04, shoreZ - 11);
        const foamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
        const foams = [0, 1, 2].map((i) => {
            const f = new THREE.Mesh(new THREE.PlaneGeometry(800, 0.5), foamMat);
            f.rotation.x = -Math.PI / 2; f.position.set(0, 0.06, shoreZ);
            return f;
        });
        ctx.dynamic(deep); ctx.dynamic(shallow);
        foams.forEach((f, i) => ctx.dynamic(f, (t) => {
            const k = (Math.sin(t * 0.7 + i * 2.1) + 1) / 2;
            f.position.z = shoreZ - 0.5 - k * (3 + i * 2.5);
            f.scale.y = 0.6 + k * 0.8;
        }));
        ctx.colliders.rect(0, shoreZ - 100, 800, 200, 0, false); // no se puede entrar al agua

        // bote flotando
        const floating = B.createBoat({ hull: 0xf5f2ea, stripe: 0xe8372c });
        floating.position.set(-14, 0, -28);
        floating.rotation.y = 0.6;
        ctx.dynamic(floating, (t) => { floating.position.y = Math.sin(t * 1.3) * 0.12; floating.rotation.z = Math.sin(t * 1.1) * 0.04; });

        // botes varados, sombrillas y palmeras
        ctx.place(B.createBoat(), 14, -12, { rot: 1.4, collide: 2.4 });
        ctx.place(B.createBoat({ stripe: 0xf2c200 }), -20, -11, { rot: 1.9, collide: 2.4 });
        [[-3, 3, 0xe8372c], [6, 6, 0x2f6fb3], [-9, 8, 0xf2c200]].forEach(([x, z, c], i) => {
            ctx.place(B.createUmbrella({ a: c }), x, z, { collide: 0.3 });
            ctx.place(B.createTowel(c), x + 0.5, z + 1.5, { rot: 0.2 * i });
        });
        [[-26, 6], [-22, 18], [24, 8], [28, 20], [-12, 22], [10, 22], [32, -4], [-32, -3]].forEach(([x, z], i) => ctx.place(B.createPalm({ height: 4.5 + (i % 3) * 0.7 }), x, z, { collide: 0.6, rot: i * 1.3 }));
        ctx.place(B.createCrate(1.1), 17, -8, { collide: 0.8 });
        ctx.place(B.createBarrel(), 18.4, -8.6, { collide: 0.6 });

        ctx.fragment(5, 19, -3);
        ctx.npc('npc_006', 10, -9, faceTo(10, -9, 0, 20));
        ctx.npc('npc_007', -14, -8, faceTo(-14, -8, 0, 20));
        ctx.npc('npc_013', -2, 10, faceTo(-2, 10, 0, 20));
        ctx.sign({
            title: 'Bahía Inglesa', x: 7, z: 17, rot: 0,
            description: 'Recibió su nombre en 1687, cuando el corsario inglés Edward Davis ancló aquí. Antes, los changos (pescadores indígenas) ya conocían estas aguas. Hoy es famosa por sus playas de arena blanca y aguas turquesas.'
        });

        ctx.avoid.push({ x: 0, z: 20, r: 6 });
        ctx.scatter(7, () => createRock(range(0.8, 1.5)), { rMin: 14, collide: 1.2, minGap: 4 });

        // gaviotas: unas vuelan sobre el mar y otras se posan en la arena (despegan si te acercas)
        ctx.fauna(createSeagulls({ center: [0, -24], flyers: 5, perches: [{ x: 2, z: -13 }, { x: -7, z: -14 }, { x: 10.5, z: -15 }, { x: -22, z: -14.5 }] }));
    }
};

export const ALL_SCENES = [copiapo, diaguita, batallon, chanarcillo, florido, bahia];
