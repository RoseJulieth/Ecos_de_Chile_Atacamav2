import * as THREE from 'three';
import { CameraController } from '../CameraController.js';
import { InventorySystem } from '../InventorySystem.js';
import { FragmentManager } from '../FragmentManager.js';
import { InteractionSystem } from '../InteractionSystem.js';
import { UIManager } from '../UIManager.js';
import { GameStateManager } from '../GameStateManager.js';
import { AudioManager } from '../AudioManager.js';
import { LoadingScreen } from '../LoadingScreen.js';
import { Tutorial } from '../Tutorial.js';
import { World } from './World.js';
import { ALL_SCENES } from './scenes.js';
import { PlayerController } from './PlayerController.js';
import { Minimap } from './Minimap.js';
import { Quests } from './Quests.js';

// ========== CONFIGURACIÓN INICIAL ==========
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 900);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.NoToneMapping; // colores planos: el tone mapping los apaga
document.body.appendChild(renderer.domElement);

// Los datos de los 5 fragmentos viven en FragmentManager (fuente única); aquí solo se leen
const FRAGMENTS = new FragmentManager(null, null, null).fragmentsData;
const TOTAL_FRAGMENTS = FRAGMENTS.length;

// ========== SISTEMAS DEL JUEGO ==========
let inventory, gameState, audioManager, world, player, cameraController, uiManager, interactionSystem;
let currentSceneId = 'copiapo';
let minimap = null;
let quests = null;
let transitioning = false;
let menuOrbit = 0;

const loading = new LoadingScreen();
const tutorial = new Tutorial();
const fadeEl = document.getElementById('fade');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function initGame() {
    inventory = new InventorySystem();
    gameState = new GameStateManager();

    loading.set(0.05, 'Preparando el desierto...');
    const npcData = (await (await fetch('data/npcDialogs.json')).json()).npcs;

    loading.set(0.15, 'Cargando sonidos...');
    audioManager = new AudioManager();
    await audioManager.loadSoundConfig();
    audioManager.attachToCamera(camera);
    await audioManager.preloadAllSounds();
    window.audioManager = audioManager;

    loading.set(0.5, 'Levantando Copiapó...');
    world = new World(scene, { npcs: npcData, fragments: FRAGMENTS, inventory });
    world.onSighting = registerSighting;
    ALL_SCENES.forEach((d) => world.register(d));
    inventory.load(FRAGMENTS);

    // misiones de los NPC
    quests = new Quests(inventory);
    world.quests = quests;
    quests.onChange = () => { world.syncQuestObjects(); updateTracker(); };

    uiManager = new UIManager(FRAGMENTS);
    interactionSystem = new InteractionSystem(uiManager);
    interactionSystem.interactionRange = 4.5;
    minimap = new Minimap(document.getElementById('minimap'));

    loading.set(0.7, 'Vistiendo al explorador...');
    player = new PlayerController(scene);
    cameraController = new CameraController(camera, renderer.domElement);
    cameraController.distance = 11;
    cameraController.targetHeight = 1.9;
    cameraController.verticalAngle = 0.3;   // un poco más baja: se ve más cielo y nubes

    loading.set(0.85, 'Armando la plaza...');
    enterScene('copiapo', null);

    // ----- Funciones globales de la interfaz (diálogo, videos de YouTube) -----
    // Función global para cerrar diálogo (llamada desde botón)
    window.closeNPCDialog = () => {
        // 🔊 SONIDO DE BOTÓN
        if (audioManager) {
            audioManager.play('button_click');
        }
        closeDialogWithSound();
    };

    // 🎬 FUNCIONES GLOBALES PARA MANEJO DE MÚLTIPLES VIDEOS DE YOUTUBE

    // Variable global para el video activo
    window.currentVideoIndex = 0;

    // Cambiar entre videos en el sistema de pestañas
    window.switchVideo = (index) => {
        // 🔊 SONIDO DE BOTÓN
        if (audioManager) {
            audioManager.play('button_click');
        }

        // Ocultar video actual
        const currentVideo = document.getElementById(`video-${window.currentVideoIndex}`);
        const currentTab = document.getElementById(`video-tab-${window.currentVideoIndex}`);

        if (currentVideo) currentVideo.style.display = 'none';
        if (currentTab) {
            currentTab.style.background = 'rgba(100,100,100,0.5)';
            currentTab.style.borderColor = '#666';
        }

        // Mostrar nuevo video
        const newVideo = document.getElementById(`video-${index}`);
        const newTab = document.getElementById(`video-tab-${index}`);

        if (newVideo) newVideo.style.display = 'block';
        if (newTab) {
            newTab.style.background = '#d4a017';
            newTab.style.borderColor = '#FFD700';
        }

        window.currentVideoIndex = index;
    };

    // Abrir todos los videos en YouTube
    window.openAllVideosInYouTube = () => {
        const dialog = document.getElementById('npc-dialog');
        if (!dialog) return;

        const videosData = dialog.getAttribute('data-videos');
        if (videosData) {
            // 🔊 SONIDO DE BOTÓN
            if (audioManager) {
                audioManager.play('button_click');
            }

            const videos = JSON.parse(videosData);

            // Confirmar antes de abrir múltiples pestañas
            if (videos.length > 1) {
                const confirmed = confirm(`¿Deseas abrir ${videos.length} videos en YouTube?\n\nEsto abrirá ${videos.length} pestañas nuevas.`);
                if (!confirmed) return;
            }

            // Abrir cada video en una nueva pestaña
            videos.forEach((video, index) => {
                setTimeout(() => {
                    window.open(video.url, '_blank');
                }, index * 500); // Retraso de 500ms entre cada pestaña
            });
        }
    };

    // Función legacy para compatibilidad
    window.toggleVideoFullscreen = () => {
        window.openAllVideosInYouTube();
    };

    // Función para crear un reproductor de video flotante (opcional)
    window.createFloatingVideoPlayer = (embedUrl, title) => {
        // Remover reproductor existente si existe
        const existingPlayer = document.getElementById('floating-video-player');
        if (existingPlayer) {
            existingPlayer.remove();
        }

        // Crear nuevo reproductor flotante
        const player = document.createElement('div');
        player.id = 'floating-video-player';
        player.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            height: 225px;
            background: rgba(0,0,0,0.9);
            border: 3px solid #FFD700;
            border-radius: 10px;
            z-index: 3000;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
            overflow: hidden;
        `;

        player.innerHTML = `
            <div style="background: #FFD700; color: #000; padding: 8px; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                <span>🎥 ${title}</span>
                <button onclick="document.getElementById('floating-video-player').remove()" style="
                    background: #8B0000; 
                    color: white; 
                    border: none; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    cursor: pointer;
                    font-size: 10px;
                ">✕</button>
            </div>
            <iframe 
                src="${embedUrl}" 
                style="width: 100%; height: calc(100% - 32px); border: none;"
                allowfullscreen>
            </iframe>
        `;

        document.body.appendChild(player);

        // Hacer el reproductor arrastrable
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        const header = player.querySelector('div');
        header.style.cursor = 'move';

        header.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragOffset.x = e.clientX - player.offsetLeft;
            dragOffset.y = e.clientY - player.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                player.style.left = (e.clientX - dragOffset.x) + 'px';
                player.style.top = (e.clientY - dragOffset.y) + 'px';
                player.style.right = 'auto';
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    };


    if (gameState.hasSavedGame()) {
        document.getElementById('btn-continue').style.display = 'block';
    }
    refreshProgressUI();
    loading.set(1, '¡Listo!');
}

// ========== ESCENAS ==========
/** Construye la escena y deja al jugador en su punto de llegada. */
function enterScene(id, from) {
    const cur = world.load(id);
    currentSceneId = id;
    const spawn = (from && cur.def.spawns && cur.def.spawns[from]) || cur.def.spawn;
    cameraController.angle = player.placeFacing(spawn.x, spawn.z, spawn.heading);
    return cur;
}

/** Cambio de escena con fundido a negro y cartel con el nombre del lugar. */
async function goToScene(target, from) {
    if (transitioning) return;
    transitioning = true;
    playSfx('dialog_open');
    fadeEl.classList.add('on');
    await sleep(450);
    const cur = enterScene(target, from);
    showSceneTitle(cur.def);
    autoSave();
    await sleep(100);
    fadeEl.classList.remove('on');
    await sleep(450);
    transitioning = false;
}

let titleTimer = null;
function showSceneTitle(def) {
    const el = document.getElementById('scene-title');
    el.querySelector('h2').textContent = def.name;
    el.querySelector('p').textContent = def.subtitle;
    el.classList.add('show');
    clearTimeout(titleTimer);
    titleTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function refreshProgressUI() {
    FRAGMENTS.forEach((f) => uiManager.updateFragmentUI(f.id, inventory.hasFragment(f.id)));
    uiManager.updateCounter(inventory.getFragmentCount(), TOTAL_FRAGMENTS);
    uiManager.updateInventoryPanel(inventory.getInventoryData());
    updateTracker();
}

function updateSceneAudio(delta) {
    const a = world.current.def.audio || {};
    audioManager.setLayerTarget('desert_wind', a.wind ?? 0.5);
    audioManager.setLayerTarget('ocean_waves', a.waves ?? 0);
    audioManager.updateLayers(delta);
}

// ========== CONTROLES ==========
const keys = {
    w: false, a: false, s: false, d: false,
    arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
    space: false, shift: false, escape: false, i: false
};

window.addEventListener('keydown', (e) => {
    // Con el tutorial abierto, Enter / Esc / Espacio / E lo cierran y nada más reacciona
    if (tutorial.isOpen()) {
        if (['enter', 'escape', ' ', 'e'].includes(e.key.toLowerCase())) {
            e.preventDefault();
            closeTutorial();
        }
        return;
    }

    const key = e.key === ' ' ? 'space' : e.key.toLowerCase(); // la barra espaciadora llega como ' '
    if (key in keys) keys[key] = true;

    // Pausa con ESC
    if (key === 'escape' && gameState.isPlaying()) {
        if (interactionSystem.isInDialog()) {
            closeDialogWithSound();
        } else {
            togglePause();
        }
    }

    // Inventario con I
    if (key === 'i' && gameState.isPlaying() && !interactionSystem.isInDialog()) {
        toggleInventory();
    }

    // Interacción con E
    if (key === 'e' && gameState.isPlaying()) {
        handleInteraction();
    }
});

window.addEventListener('keyup', (e) => {
    const key = e.key === ' ' ? 'space' : e.key.toLowerCase(); // la barra espaciadora llega como ' '
    if (key in keys) keys[key] = false;
});

// ========== FUNCIONES DE CONTROL ==========
function closeTutorial() {
    playSfx('button_click');
    tutorial.close();
}

document.getElementById('tutorial-ok').addEventListener('click', closeTutorial);
document.getElementById('btn-controls').addEventListener('click', () => {
    playSfx('button_click');
    tutorial.open();
});

function playSfx(id) {
    if (audioManager && !audioManager.isMuted) audioManager.play(id);
}

function closeDialogWithSound() {
    playSfx('dialog_close');
    interactionSystem.closeDialog();
}

function openDialogWithSound(data) {
    playSfx('dialog_open');
    interactionSystem.openDialog(data);
}


// ========== GAME LOOP ==========
const clock = new THREE.Clock();
let clickHintShown = true;

// Contador de rendimiento (F3): FPS, draw calls y triángulos
const perfEl = document.createElement('div');
perfEl.style.cssText = 'position:fixed;left:10px;top:10px;z-index:9999;display:none;padding:6px 10px;background:rgba(0,0,0,.7);color:#0f0;font:12px monospace;border-radius:4px;pointer-events:none';
document.body.appendChild(perfEl);
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'm' && minimap && gameState.isPlaying() && !tutorial.isOpen()) minimap.toggle();
    if (e.key === 'F3') { e.preventDefault(); perfEl.style.display = perfEl.style.display === 'none' ? 'block' : 'none'; }
});
let perfFrames = 0, perfLast = performance.now();

function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);

    perfFrames++;
    const perfNow = performance.now();
    if (perfNow - perfLast >= 500) {
        if (perfEl.style.display !== 'none') {
            const info = renderer.info.render;
            perfEl.textContent = `${Math.round(perfFrames * 1000 / (perfNow - perfLast))} FPS | ${info.calls} draw calls | ${(info.triangles / 1000).toFixed(0)}k tris`;
        }
        perfFrames = 0;
        perfLast = perfNow;
    }

    if (!world || !world.current) { renderer.render(scene, camera); return; }

    if (gameState.isPlaying()) {
        if (clickHintShown && document.pointerLockElement) {
            document.getElementById('click-hint').style.display = 'none';
            clickHintShown = false;
        }

        const cur = world.current;
        const canMove = !interactionSystem.isInDialog() && !tutorial.isOpen() && !transitioning;
        player.update(keys, cameraController.getAngle(), delta, canMove, cur.colliders, cur.radius);
        cameraController.update(player.getPosition(), []);
        keepCameraClear(cur, delta);

        const pp = player.getPosition();
        world.update(delta, pp);
        interactionSystem.update(pp, cur.interactables);
        updateSceneAudio(delta);
        minimap.update(cur, { x: pp.x, z: pp.z, heading: player.root.rotation.y }, cameraController.getAngle(), inventory, world.time);

        // objetos de misión: se recogen al caminar sobre ellos
        for (const p of cur.pickups) {
            if (!p.visible || Math.hypot(pp.x - p.position.x, pp.z - p.position.z) > 1.8) continue;
            p.visible = false;
            const { questId, index } = p.userData;
            const prog = quests.collect(questId, index);
            const q = quests.byId.get(questId);
            if (!prog) continue;
            playSfx('collect_fragment');
            if (quests.stateOf(questId) === 'ready') notifyQuestReady(q);
            else uiManager.showNotification(q.goal.label, `${prog.have} de ${prog.need}`, 'Objeto recogido');
        }

        // portales: se cruzan caminando hacia el centro del arco
        if (!transitioning) {
            for (const p of cur.portals) {
                if (Math.hypot(pp.x - p.userData.pos.x, pp.z - p.userData.pos.z) < 2.4) {
                    goToScene(p.userData.target, cur.id);
                    break;
                }
            }
        }
    } else if (gameState.getState() === 'menu') {
        // detrás del menú principal, la cámara da vueltas lentas por la plaza
        menuOrbit += delta * 0.12;
        camera.position.set(Math.sin(menuOrbit) * 30, 11, Math.cos(menuOrbit) * 30);
        camera.lookAt(0, 3, 0);
        world.update(delta, { x: 0, z: 0 });
    }

    renderer.render(scene, camera);
}

// La cámara se acerca al jugador cuando hay algo alto (casa, árbol, carpa) entre ambos
let camReach = 1;
function keepCameraClear(cur, dt) {
    const head = player.getPosition();
    const hy = head.y + cameraController.targetHeight;
    const dx = camera.position.x - head.x, dy = camera.position.y - hy, dz = camera.position.z - head.z;
    let safe = 1;
    for (let t = 0.12; t <= 1.0001; t += 0.04) {
        if (cur.colliders.hitsCam(head.x + dx * t, head.z + dz * t, 0.7)) { safe = Math.max(0.4, t - 0.08); break; }
    }
    camReach += (safe - camReach) * Math.min(1, dt * (safe < camReach ? 16 : 3));
    camera.position.set(head.x + dx * camReach, hy + dy * camReach, head.z + dz * camReach);
    camera.lookAt(head.x, hy, head.z);
}

// ========== FAUNA ==========
/** Un animal avistado por primera vez se guarda en Items (inventario) y se avisa en pantalla. */
function registerSighting(species) {
    if (inventory.categories.items.some((i) => i.id === species.id)) return;
    inventory.addItem({ id: species.id, name: species.name, icon: species.icon, place: species.place, info: species.info });
    uiManager.showNotification(`${species.icon} ${species.name}`, species.info, '¡Nuevo avistamiento!');
    uiManager.updateInventoryPanel(inventory.getInventoryData());
    playSfx('notification');
    quests.refresh().forEach((q) => setTimeout(() => notifyQuestReady(q), 5300));
}

function notifyQuestReady(q) {
    const npc = world.npcData.get(q.npc);
    uiManager.showNotification(q.title, `Objetivo cumplido. Vuelve a hablar con ${npc ? npc.name.split(' - ')[0] : 'el NPC'} para recibir tu recompensa.`, '¡Misión lista!');
    playSfx('notification');
}

// ========== PANEL DE MISIONES ==========
function updateTracker() {
    const el = document.getElementById('quest-tracker');
    if (!el || !quests) return;
    el.innerHTML = quests.activeQuests().map((q) => {
        const p = quests.progress(q);
        const ready = quests.stateOf(q.id) === 'ready';
        const npc = world.npcData.get(q.npc);
        const who = npc ? npc.name.split(' - ')[0] : 'el NPC';
        return `<div class="chip ${ready ? 'ready' : ''}"><b>📜 ${q.title}</b><small>${ready ? '✅ Vuelve con ' + who : `${q.goal.label}: ${p.have}/${p.need}`}</small></div>`;
    }).join('');
}

// ========== INTERACCIÓN ==========
function collectFragment(obj) {
    const data = obj.userData;
    data.collected = true;
    data.interactable = false;
    obj.visible = false;
    if (!inventory.addFragment(data)) return;

    playSfx('collect_fragment');
    uiManager.updateFragmentUI(data.id, true);
    uiManager.updateCounter(inventory.getFragmentCount(), TOTAL_FRAGMENTS);
    uiManager.showNotification(data.name, data.info);
    uiManager.updateInventoryPanel(inventory.getInventoryData());
    autoSave();

    if (inventory.getFragmentCount() === TOTAL_FRAGMENTS) {
        setTimeout(() => {
            playSfx('notification');
            uiManager.showVictoryMessage();
        }, 1000);
    }
}

/** Agrega al diálogo del NPC su misión: la ofrece, muestra el avance o entrega la recompensa. */
function withQuest(data) {
    const q = quests.current(data.npc_id);
    if (!q) {
        const had = quests.forNpc(data.npc_id).length > 0;
        return had ? { ...data, questHtml: '<div style="margin-top:14px;color:#58e07a;text-align:center">✅ Ya completaste la misión de este personaje.</div>' } : data;
    }
    let html;
    const wasNew = quests.stateOf(q.id) === 'new';
    if (wasNew) quests.accept(q.id);
    if (quests.stateOf(q.id) === 'ready') {
        const reward = quests.complete(q.id);
        html = quests.dialogHtml(q, false, reward);
        playSfx('collect_fragment');
        uiManager.showNotification(`${reward.icon} ${reward.name}`, reward.info, '¡Misión completada!');
        uiManager.updateInventoryPanel(inventory.getInventoryData());
        autoSave();
    } else {
        html = quests.dialogHtml(q, wasNew);
    }
    return { ...data, questHtml: html };
}

function handleInteraction() {
    if (interactionSystem.isInDialog()) {
        closeDialogWithSound();
        return;
    }
    const interaction = interactionSystem.tryInteract();
    if (!interaction) return;

    if (interaction.type === 'fragment') {
        collectFragment(interaction.object);
    } else if (interaction.type === 'npc') {
        openDialogWithSound(withQuest(interaction.data));
    } else if (interaction.type === 'info_sign') {
        openDialogWithSound({
            name: interaction.data.name,
            dialog_type: 'Información',
            historical_cue: interaction.data.description
        });
    }
}

// ========== PARTIDAS ==========
function startNewGame() {
    gameState.setState('playing');
    uiManager.showHUD();

    if (audioManager) {
        audioManager.changeMusicWithFade('game_theme', 2.0);
        audioManager.play('desert_ambience');
    }
    refreshProgressUI();

    showSceneTitle(world.current.def);
    tutorial.open();
}

function continueGame() {
    const saved = gameState.loadGame();
    if (saved) {
        inventory.load(FRAGMENTS);
        const p = saved.player || {};
        const id = world.defs.has(p.scene) ? p.scene : 'copiapo';
        const cur = enterScene(id, null);
        if (typeof p.x === 'number' && Math.hypot(p.x, p.z) < cur.radius - 2 && !cur.colliders.hits(p.x, p.z, 0.8)) {
            player.setPosition(p.x, 0, p.z);
        }
    }
    startNewGame();
}

function autoSave() {
    gameState.saveGame({ scene: currentSceneId, ...player.saveState() }, inventory.getInventoryData());
}

function exitToMenu() {
    gameState.setState('menu');
    uiManager.showMainMenu();
    document.exitPointerLock();
    enterScene('copiapo', null);
}

function togglePause() {
    if (gameState.isPlaying()) {
        playSfx('menu_open');
        gameState.setState('paused');
        uiManager.showPauseMenu();
        document.exitPointerLock();
    } else if (gameState.isPaused()) {
        playSfx('menu_close');
        gameState.setState('playing');
        uiManager.hidePauseMenu();
    }
}

function toggleInventory() {
    const invPanel = document.getElementById('full-inventory');
    if (invPanel.style.display === 'none' || !invPanel.style.display) {
        playSfx('menu_open');
        invPanel.style.display = 'block';
        uiManager.updateInventoryPanel(inventory.getInventoryData());
        document.exitPointerLock();
    } else {
        playSfx('menu_close');
        invPanel.style.display = 'none';
    }
}

// ========== EVENT LISTENERS ==========
document.getElementById('btn-start').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // 🎵 INICIAR MÚSICA DEL MENÚ (primera interacción del usuario)
    if (audioManager && !audioManager.currentMusic) {
        audioManager.play('main_theme');
        console.log('🎵 Música del menú iniciada');
    }
    startNewGame();
});

document.getElementById('btn-continue').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }
    continueGame();
});

document.getElementById('btn-reset').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Mostrar cuadro de confirmación personalizado
    document.getElementById('reset-confirmation').style.display = 'flex';
});

document.getElementById('btn-credits').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('credits-screen').style.display = 'block';
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }
    document.getElementById('credits-screen').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
});

document.getElementById('btn-resume').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }
    togglePause();
});

document.getElementById('btn-inventory-full').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }
    toggleInventory();
});

document.getElementById('btn-save').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Mostrar cuadro de confirmación personalizado
    document.getElementById('save-confirmation').style.display = 'flex';
});

document.getElementById('btn-main-menu').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Mostrar cuadro de confirmación personalizado
    document.getElementById('exit-confirmation').style.display = 'flex';
});

// ========== CUADROS DE CONFIRMACIÓN ==========

// Cuadro de Reiniciar Progreso
document.getElementById('btn-reset-confirm').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Limpiar todo el progreso
    localStorage.clear();
    inventory.clear();
    gameState.clearSave();

    // Los fragmentos vuelven a aparecer al reconstruir la escena actual
    world.load(currentSceneId);

    // Actualizar UI
    FRAGMENTS.forEach(frag => {
        uiManager.updateFragmentUI(frag.id, false);
    });
    uiManager.updateCounter(0, 5);

    // Ocultar botón de continuar
    document.getElementById('btn-continue').style.display = 'none';

    // Ocultar cuadro y mostrar mensaje de éxito
    document.getElementById('reset-confirmation').style.display = 'none';
    
    // Mostrar notificación de éxito en el juego
    setTimeout(() => {
        uiManager.showNotification('Progreso Reiniciado', '✅ Todos los fragmentos están disponibles de nuevo.');
    }, 500);
});

document.getElementById('btn-reset-cancel').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Solo ocultar el cuadro
    document.getElementById('reset-confirmation').style.display = 'none';
});

// Cuadro de Guardar Progreso
document.getElementById('btn-save-confirm').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Guardar progreso
    autoSave();

    // Ocultar cuadro
    document.getElementById('save-confirmation').style.display = 'none';
    
    // Mostrar notificación de éxito en el juego
    setTimeout(() => {
        uiManager.showNotification('Progreso Guardado', '✅ Tu progreso ha sido guardado exitosamente.');
    }, 500);
});

document.getElementById('btn-save-cancel').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Solo ocultar el cuadro
    document.getElementById('save-confirmation').style.display = 'none';
});

// ========== CUADRO DE CONFIRMACIÓN PARA SALIR ==========
document.getElementById('btn-exit-save').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Guardar progreso
    autoSave();
    
    // 🎵 VOLVER A MÚSICA DEL MENÚ
    if (audioManager) {
        audioManager.stopAmbient(); // Detener ambiente del desierto
        audioManager.changeMusicWithFade('main_theme', 2.0); // Volver a música del menú
        console.log('🎵 Volviendo a música del menú');
    }
    
    // Ocultar cuadro y salir al menú
    document.getElementById('exit-confirmation').style.display = 'none';
    exitToMenu();
});

document.getElementById('btn-exit-no-save').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // 🎵 VOLVER A MÚSICA DEL MENÚ
    if (audioManager) {
        audioManager.stopAmbient(); // Detener ambiente del desierto
        audioManager.changeMusicWithFade('main_theme', 2.0); // Volver a música del menú
        console.log('🎵 Volviendo a música del menú');
    }
    
    // Ocultar cuadro y salir al menú sin guardar
    document.getElementById('exit-confirmation').style.display = 'none';
    exitToMenu();
});

document.getElementById('btn-exit-cancel').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN
    if (audioManager) {
        audioManager.play('button_click');
    }

    // Solo ocultar el cuadro y continuar jugando
    document.getElementById('exit-confirmation').style.display = 'none';
});

// ========== CONTROLES DE AUDIO ==========
document.getElementById('master-volume').addEventListener('input', (e) => {
    if (audioManager) {
        const vol = e.target.value / 100;
        audioManager.setMasterVolume(vol);
        document.getElementById('master-vol').textContent = e.target.value;
    }
});

document.getElementById('music-volume').addEventListener('input', (e) => {
    if (audioManager) {
        const vol = e.target.value / 100;
        audioManager.setMusicVolume(vol);
        document.getElementById('music-vol').textContent = e.target.value;
    }
});

document.getElementById('ambient-volume').addEventListener('input', (e) => {
    if (audioManager) {
        const vol = e.target.value / 100;
        audioManager.setAmbientVolume(vol);
        document.getElementById('ambient-vol').textContent = e.target.value;
    }
});

document.getElementById('sfx-volume').addEventListener('input', (e) => {
    if (audioManager) {
        const vol = e.target.value / 100;
        audioManager.setSFXVolume(vol);
        document.getElementById('sfx-vol').textContent = e.target.value;
    }
});

document.getElementById('btn-mute').addEventListener('click', () => {
    // 🔊 SONIDO DE BOTÓN (antes de mutear)
    if (audioManager && !audioManager.isMuted) {
        audioManager.play('button_click');
    }

    if (audioManager) {
        const isMuted = audioManager.toggleMute();
        document.getElementById('btn-mute').textContent = isMuted ? '🔊 Activar' : '🔇 Mutear';
    }
});


// Redimensionamiento
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Arranque
initGame().then(() => {
    setTimeout(() => loading.hide(), 300);
}).catch((error) => {
    console.error('❌ Error al inicializar el juego:', error);
    loading.fail('Algo no cargó bien. Puedes intentar entrar o recargar la página (F5).');
});
animate();
