// Personajes low-poly hechos por código (jugador y NPC), con animación procedural.
// Mira hacia +Z. Altura aproximada: 2.5 unidades (3 con sombrero).
import * as THREE from 'three';
import { piece, bake, addOutline } from '../ProceduralAssets.js';

const OUTLINE = 0.022;

// ---------- Partes del cuerpo ----------
const SKINS = { clara: 0xf1c9a5, media: 0xe0a57c, canela: 0xc58b62, morena: 0x9a6a47, oscura: 0x7a4e33 };

function head(look) {
    const g = new THREE.Group();
    const skin = look.skin;
    g.add(piece(new THREE.SphereGeometry(0.42, 9, 7), skin, { pos: [0, 0, 0] }));
    // orejas
    for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.08, 5, 4), skin, { pos: [s * 0.41, -0.02, 0] }));
    // ojos
    for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.052, 6, 5), 0x1a1410, { pos: [s * 0.15, 0.04, 0.385] }));
    // mejillas
    if (look.blush) for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.06, 5, 4), 0xe58f7a, { pos: [s * 0.25, -0.1, 0.34], scale: [1, 0.6, 0.4] }));
    // nariz
    g.add(piece(new THREE.ConeGeometry(0.05, 0.1, 4), skin, { pos: [0, -0.04, 0.43], rot: [Math.PI / 2, 0, 0] }));

    // pelo
    const hair = look.hairColor;
    const style = look.hair;
    if (style && style !== 'none') {
        g.add(piece(new THREE.SphereGeometry(0.46, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), hair, { pos: [0, 0.02, -0.03], rot: [-0.45, 0, 0] }));
        if (style === 'long') g.add(piece(new THREE.CapsuleGeometry(0.3, 0.55, 2, 6), hair, { pos: [0, -0.28, -0.22] }));
        if (style === 'bun') g.add(piece(new THREE.SphereGeometry(0.19, 6, 5), hair, { pos: [0, 0.42, -0.2] }));
        if (style === 'ponytail') g.add(piece(new THREE.CapsuleGeometry(0.11, 0.5, 2, 5), hair, { pos: [0, -0.1, -0.5], rot: [0.5, 0, 0] }));
        if (style === 'sides') {
            g.children.pop(); // sin gorro de pelo: solo a los lados (calvo)
            for (const s of [-1, 1]) g.add(piece(new THREE.SphereGeometry(0.17, 6, 5), hair, { pos: [s * 0.34, 0.08, -0.05] }));
        }
    }
    if (look.beard) g.add(piece(new THREE.ConeGeometry(0.26, 0.42, 6), look.beardColor ?? hair, { pos: [0, -0.33, 0.2], rot: [Math.PI + 0.25, 0, 0] }));
    if (look.mustache) g.add(piece(new THREE.BoxGeometry(0.3, 0.06, 0.07), look.beardColor ?? hair, { pos: [0, -0.13, 0.4] }));
    if (look.glasses) {
        for (const s of [-1, 1]) g.add(piece(new THREE.TorusGeometry(0.09, 0.02, 4, 8), 0x2b2b2b, { pos: [s * 0.15, 0.04, 0.4] }));
        g.add(piece(new THREE.BoxGeometry(0.1, 0.02, 0.02), 0x2b2b2b, { pos: [0, 0.05, 0.41] }));
    }

    // sombreros
    const hc = look.hatColor;
    switch (look.hat) {
        case 'cap':
            g.add(piece(new THREE.SphereGeometry(0.47, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), hc, { pos: [0, 0.06, 0] }));
            g.add(piece(new THREE.BoxGeometry(0.5, 0.04, 0.34), hc, { pos: [0, 0.12, 0.5], rot: [0.12, 0, 0] }));
            break;
        case 'straw':
            g.add(piece(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 10), hc, { pos: [0, 0.3, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.34, 0.42, 0.28, 8), hc, { pos: [0, 0.45, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.43, 0.43, 0.07, 8), look.hatBand ?? 0xb04a3a, { pos: [0, 0.34, 0] }));
            break;
        case 'explorer':
            g.add(piece(new THREE.CylinderGeometry(0.72, 0.72, 0.05, 10), hc, { pos: [0, 0.3, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.3, 0.42, 0.3, 8), hc, { pos: [0, 0.47, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.43, 0.43, 0.08, 8), look.hatBand ?? 0x5a3a1c, { pos: [0, 0.35, 0] }));
            break;
        case 'helmet':
            g.add(piece(new THREE.SphereGeometry(0.5, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), hc, { pos: [0, 0.08, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 9), hc, { pos: [0, 0.1, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.08, 0.1, 0.12, 6), 0xfff2a8, { pos: [0, 0.36, 0.44], rot: [Math.PI / 2 - 0.3, 0, 0] }));
            break;
        case 'kepi':
            g.add(piece(new THREE.CylinderGeometry(0.4, 0.46, 0.24, 9), hc, { pos: [0, 0.34, 0] }));
            g.add(piece(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 9), hc, { pos: [0, 0.46, 0], scale: [1, 1, 1.05] }));
            g.add(piece(new THREE.BoxGeometry(0.46, 0.03, 0.26), 0x111111, { pos: [0, 0.25, 0.47], rot: [0.2, 0, 0] }));
            g.add(piece(new THREE.BoxGeometry(0.1, 0.1, 0.03), 0xd4a017, { pos: [0, 0.34, 0.46] }));
            break;
        case 'beanie':
            g.add(piece(new THREE.SphereGeometry(0.47, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), hc, { pos: [0, 0.07, 0] }));
            g.add(piece(new THREE.SphereGeometry(0.1, 5, 4), hc, { pos: [0, 0.55, 0] }));
            break;
    }
    return g;
}

function torso(look) {
    const g = new THREE.Group();
    const shirt = look.shirt;
    // torso
    g.add(piece(new THREE.CylinderGeometry(0.33, 0.4, 0.92, 7), shirt, { pos: [0, 0, 0] }));
    // cinturón
    g.add(piece(new THREE.CylinderGeometry(0.405, 0.405, 0.09, 7), look.belt ?? look.pants, { pos: [0, -0.4, 0] }));
    // chaleco
    if (look.vest) g.add(piece(new THREE.CylinderGeometry(0.355, 0.42, 0.62, 7), look.vest, { pos: [0, -0.1, 0.01] }));
    // delantal / falda larga / bata
    if (look.skirt) g.add(piece(new THREE.CylinderGeometry(0.4, 0.68, 0.85, 8), look.skirt, { pos: [0, -0.8, 0] }));
    if (look.coat) g.add(piece(new THREE.CylinderGeometry(0.42, 0.6, 1.45, 8), look.coat, { pos: [0, -0.35, 0], scale: [1, 1, 1.08] }));
    // poncho
    if (look.poncho) {
        g.add(piece(new THREE.CylinderGeometry(0.3, 0.72, 0.8, 8), look.poncho, { pos: [0, -0.1, 0] }));
        g.add(piece(new THREE.CylinderGeometry(0.73, 0.73, 0.09, 8), look.ponchoTrim ?? 0xe7c36a, { pos: [0, -0.5, 0] }));
    }
    // bufanda
    if (look.scarf) g.add(piece(new THREE.TorusGeometry(0.3, 0.09, 5, 8), look.scarf, { pos: [0, 0.5, 0], rot: [Math.PI / 2, 0, 0] }));
    // mochila
    if (look.backpack) {
        g.add(piece(new THREE.BoxGeometry(0.58, 0.75, 0.3), look.backpack, { pos: [0, 0.02, -0.42] }));
        g.add(piece(new THREE.BoxGeometry(0.4, 0.28, 0.12), look.backpackAccent ?? 0x3a2a18, { pos: [0, -0.15, -0.62] }));
    }
    return g;
}

function limbArm(look) {
    const g = new THREE.Group();
    g.add(piece(new THREE.CapsuleGeometry(0.12, 0.42, 2, 5), look.sleeve ?? look.shirt, { pos: [0, -0.33, 0] }));
    g.add(piece(new THREE.SphereGeometry(0.12, 6, 5), look.skin, { pos: [0, -0.66, 0] }));
    return g;
}

function limbLeg(look) {
    const g = new THREE.Group();
    if (!look.skirt && !look.coat) {
        g.add(piece(new THREE.CapsuleGeometry(0.16, 0.5, 2, 5), look.pants, { pos: [0, -0.4, 0] }));
    } else {
        g.add(piece(new THREE.CapsuleGeometry(0.14, 0.5, 2, 5), look.legs ?? look.skin, { pos: [0, -0.4, 0] }));
    }
    g.add(piece(new THREE.SphereGeometry(0.2, 6, 5), look.shoes, { pos: [0, -0.8, 0.07], scale: [1, 0.65, 1.35] }));
    return g;
}

/** Objeto que se sostiene en la mano derecha. */
function handItem(kind) {
    const g = new THREE.Group();
    if (kind === 'pickaxe') {
        g.add(piece(new THREE.CylinderGeometry(0.035, 0.035, 1.3, 5), 0x6b4a2e, { pos: [0, -0.4, 0.25], rot: [Math.PI / 2 - 0.6, 0, 0] }));
        g.add(piece(new THREE.BoxGeometry(0.7, 0.07, 0.07), 0x6e7378, { pos: [0, -0.05, 0.62], rot: [0, 0, 0] }));
    } else if (kind === 'cane') {
        g.add(piece(new THREE.CylinderGeometry(0.03, 0.035, 1.5, 5), 0x6b4a2e, { pos: [0, -0.55, 0.05] }));
    } else if (kind === 'clipboard') {
        g.add(piece(new THREE.BoxGeometry(0.4, 0.5, 0.04), 0xf1ebd8, { pos: [0, -0.6, 0.18], rot: [0.3, 0, 0] }));
    } else if (kind === 'rod') {
        g.add(piece(new THREE.CylinderGeometry(0.025, 0.03, 2.1, 5), 0x7a5b34, { pos: [0, -0.2, 0.5], rot: [Math.PI / 2 - 0.5, 0, 0] }));
    }
    return g;
}

function finish(group, thickness = OUTLINE) {
    const mesh = bake(group);
    addOutline(mesh, thickness);
    return mesh;
}

// ---------- Personaje ----------
const DEFAULT = {
    skin: SKINS.media, hair: 'short', hairColor: 0x3a2515, hat: null, hatColor: 0xb98a4e,
    shirt: 0x6b7a3a, pants: 0x6b5a3e, shoes: 0x3a2a1a, blush: true
};

/**
 * look: { skin, hair: 'short'|'long'|'bun'|'ponytail'|'sides'|'none', hairColor, beard, beardColor, mustache, glasses,
 *         hat: 'cap'|'straw'|'explorer'|'helmet'|'kepi'|'beanie', hatColor, shirt, sleeve, pants, shoes, vest, skirt, legs,
 *         coat, poncho, scarf, backpack, belt, item: 'pickaxe'|'cane'|'clipboard'|'rod', scale }
 */
export function createCharacter(lookOverrides = {}) {
    const look = { ...DEFAULT, ...lookOverrides };
    const root = new THREE.Group();

    const body = new THREE.Group();       // se mueve al caminar (rebote)
    root.add(body);

    const torsoMesh = finish(torso(look));
    torsoMesh.position.y = 1.34;
    body.add(torsoMesh);

    const headMesh = finish(head(look), 0.02);
    headMesh.position.y = 2.22;
    body.add(headMesh);

    const armL = new THREE.Group(), armR = new THREE.Group();
    armL.position.set(-0.5, 1.72, 0);
    armR.position.set(0.5, 1.72, 0);
    const armMeshL = finish(limbArm(look)), armMeshR = finish(limbArm(look));
    armL.add(armMeshL);
    armR.add(armMeshR);
    if (look.item) armR.add(finish(handItem(look.item), 0.015).translateY(-0.55));
    body.add(armL, armR);

    const legL = new THREE.Group(), legR = new THREE.Group();
    legL.position.set(-0.2, 0.93, 0);
    legR.position.set(0.2, 0.93, 0);
    legL.add(finish(limbLeg(look)));
    legR.add(finish(limbLeg(look)));
    root.add(legL, legR);

    if (look.scale) root.scale.setScalar(look.scale);

    // ---------- Animación ----------
    const state = { phase: Math.random() * 6, walk: 0, air: 0, wave: 0, time: Math.random() * 10 };

    /**
     * dt: segundos. opts: { moving, speed (0..2, 1 = caminar, 2 = correr), airborne, waving }
     */
    function update(dt, { moving = false, speed = 1, airborne = false, waving = false } = {}) {
        state.time += dt;
        const smooth = (cur, target, rate) => cur + (target - cur) * Math.min(1, dt * rate);
        state.walk = smooth(state.walk, moving && !airborne ? 1 : 0, 10);
        state.air = smooth(state.air, airborne ? 1 : 0, 12);
        state.wave = smooth(state.wave, waving ? 1 : 0, 8);
        state.phase += dt * (7 + speed * 3) * (moving ? 1 : 0);

        const swing = Math.sin(state.phase) * 0.85 * state.walk * (0.7 + speed * 0.3);
        legL.rotation.x = swing * (1 - state.air) - 0.5 * state.air;
        legR.rotation.x = -swing * (1 - state.air) + 0.3 * state.air;

        // brazos: oscilan al caminar, suben al saltar y el derecho saluda
        armL.rotation.x = -swing * 0.8 * (1 - state.air) - 2.6 * state.air;
        armR.rotation.x = swing * 0.8 * (1 - state.air) - 2.6 * state.air;
        armL.rotation.z = 0.12 + 0.35 * state.air;
        armR.rotation.z = -0.12 - 0.35 * state.air;
        if (state.wave > 0.01) {
            armR.rotation.x = THREE.MathUtils.lerp(armR.rotation.x, 0, state.wave);
            armR.rotation.z = THREE.MathUtils.lerp(armR.rotation.z, -2.5 + Math.sin(state.time * 9) * 0.3, state.wave);
        }

        // rebote al caminar y respiración al estar quieto
        const bob = Math.abs(Math.sin(state.phase)) * 0.09 * state.walk;
        const breathe = Math.sin(state.time * 2.2) * 0.012 * (1 - state.walk);
        body.position.y = bob;
        torsoMesh.scale.y = 1 + breathe;
        headMesh.rotation.z = Math.sin(state.time * 1.3) * 0.03 * (1 - state.walk);
    }

    return { root, update, look };
}

// ---------- Recetas: jugador y los 13 NPC ----------
export const LOOKS = {
    player: {
        skin: SKINS.media, hair: 'short', hairColor: 0x4a2f1b, hat: 'explorer', hatColor: 0xb98a4e,
        shirt: 0x6b7a3a, pants: 0xa6875a, shoes: 0x4a3320, scarf: 0xc0392b, backpack: 0x8b5a2b
    },
    // Copiapó
    npc_002: { skin: SKINS.canela, hair: 'bun', hairColor: 0xb8b8b8, shirt: 0xf0e2c0, skirt: 0x7a4b8a, scarf: 0xe7a23b, shoes: 0x3a2a1a },
    npc_008: { skin: SKINS.canela, hair: 'sides', hairColor: 0xe8e8e8, beard: true, beardColor: 0xf0f0f0, shirt: 0xb5443a, poncho: 0xb5443a, pants: 0x4a3a2a, item: 'cane' },
    npc_009: { skin: SKINS.clara, hair: 'bun', hairColor: 0x4a2a1a, glasses: true, shirt: 0x7a3b3b, skirt: 0x2f2f3a, item: 'clipboard', shoes: 0x222222 },
    // Chañarcillo
    npc_001: { skin: SKINS.canela, hair: 'short', hairColor: 0x9a9a9a, beard: true, beardColor: 0xb0b0b0, hat: 'helmet', hatColor: 0xf2c200, shirt: 0x5f7388, pants: 0x6b4a2e, shoes: 0x2b2118, item: 'pickaxe' },
    // Batallón Atacama
    npc_003: { skin: SKINS.media, hair: 'short', hairColor: 0x222222, mustache: true, hat: 'kepi', hatColor: 0x202127, shirt: 0x22232b, pants: 0x22232b, belt: 0xd4a017, shoes: 0x111111, vest: 0x2c2d38 },
    // Desierto Florido
    npc_004: { skin: SKINS.canela, hair: 'long', hairColor: 0x1d1410, hat: 'straw', hatColor: 0xe3c76f, hatBand: 0xe8372c, shirt: 0xf2c200, skirt: 0x3f8f5a, scarf: 0xe8372c },
    npc_005: { skin: SKINS.clara, hair: 'short', hairColor: 0xd8d8d8, beard: true, beardColor: 0xe8e8e8, glasses: true, hat: 'straw', hatColor: 0xd9c070, shirt: 0xeadfbf, vest: 0x4f7a3a, pants: 0x7a6a4a },
    npc_010: { skin: SKINS.media, hair: 'short', hairColor: 0x2a1a10, hat: 'cap', hatColor: 0xd23b2e, shirt: 0xe8772e, pants: 0x3a4a6a, backpack: 0x2f5d8a, scarf: 0xf2c200 },
    npc_012: { skin: SKINS.morena, hair: 'long', hairColor: 0x15101c, glasses: true, shirt: 0x1f2b4d, coat: 0x1f2b4d, scarf: 0x7a5ccf, hat: 'beanie', hatColor: 0x7a5ccf },
    // Bahía Inglesa
    npc_006: { skin: SKINS.canela, hair: 'short', hairColor: 0x9a9a9a, beard: true, beardColor: 0xcfcfcf, hat: 'cap', hatColor: 0x2f5d8a, shirt: 0xe8772e, vest: 0xe8772e, pants: 0x2b3f5c, shoes: 0x1c1c1c, item: 'rod' },
    npc_007: { skin: SKINS.clara, hair: 'bun', hairColor: 0x5a3a22, glasses: true, shirt: 0xeaf4f4, coat: 0xf5f5f5, scarf: 0x2fb5c9, item: 'clipboard', shoes: 0x2b5c6a },
    npc_013: { skin: SKINS.media, hair: 'short', hairColor: 0x3a2515, hat: 'cap', hatColor: 0x3f8f5a, shirt: 0xcf5a2a, pants: 0x3f3f4f, backpack: 0xc23b2e, backpackAccent: 0xf2c200 },
    // Diaguita
    npc_011: { skin: SKINS.clara, hair: 'ponytail', hairColor: 0x6a3a1a, hat: 'explorer', hatColor: 0xc9a46a, shirt: 0xe9dcc0, vest: 0x7a8a4a, pants: 0x8a7350, backpack: 0x6b4a2e, item: 'clipboard' }
};
