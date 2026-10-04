        import * as THREE from 'three';
        import { Player } from './Player.js';
        import { CameraController } from './CameraController.js';
        import { InventorySystem } from './InventorySystem.js';
        import { FragmentManager } from './FragmentManager.js';
        import { AssetLoader } from './AssetLoader.js';
        import { AnimationController } from './AnimationController.js';
        import { NPCManager } from './NPCManager.js';
        import { InteractionSystem } from './InteractionSystem.js';
        import { UIManager } from './UIManager.js';
        import { GameStateManager } from './GameStateManager.js';
        import { WorldBuilder } from './WorldBuilder.js';
        import { TerrainDecorationManager } from './TerrainDecorationManager.js';
        import { ZoneManager } from './ZoneManager.js';
        import { AudioManager } from './AudioManager.js';

        // ========== CONFIGURACIÓN INICIAL ==========
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro
        scene.fog = new THREE.Fog(0xB0E0E6, 50, 150); // Niebla azul suave

        // 🎥 FOV AJUSTADO PARA PERSONAJES ESCALADOS
        // FOV más amplio (70°) para ver mejor el entorno con cámara alejada
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        document.body.appendChild(renderer.domElement);

        // ========== SISTEMAS DEL JUEGO ==========
        let sunLight;
        const SUN_OFFSET = new THREE.Vector3(50, 100, 30);
        let assetLoader, inventory, gameState, worldBuilder, ground, audioManager;
        let player, cameraController, fragmentManager, uiManager, interactionSystem, npcManager, terrainDecoration, zoneManager;

        // Función de inicialización async
        async function initGame() {
            assetLoader = new AssetLoader();
            inventory = new InventorySystem();
            gameState = new GameStateManager();
            worldBuilder = new WorldBuilder(scene);

            // Construir el mundo
            sunLight = worldBuilder.setupLighting();
            ground = worldBuilder.createTerrain();
            worldBuilder.createZones();
            worldBuilder.addRocks();

            // Crear jugador y cámara
            player = new Player(scene, assetLoader);
            cameraController = new CameraController(camera, renderer.domElement);

            // 🔊 INICIALIZAR SISTEMA DE AUDIO
            audioManager = new AudioManager();
            await audioManager.loadSoundConfig();
            audioManager.attachToCamera(camera);

            // Precargar sonidos disponibles
            await audioManager.preloadAllSounds();

            // Hacer audioManager global para fácil acceso
            window.audioManager = audioManager;

            console.log('🎵 Sistema de audio inicializado');

            // Crear fragmentos (ahora con modelos GLB)
            fragmentManager = new FragmentManager(scene, inventory, assetLoader);
            await fragmentManager.createFragments();

            // UI Manager
            uiManager = new UIManager(fragmentManager.getFragmentsData());

            // Sistema de interacción
            interactionSystem = new InteractionSystem(uiManager);

            // NPCs (con modelos GLB y FBX)
            npcManager = new NPCManager(scene, assetLoader);
            await npcManager.createNPCs();

            // Decoración del terreno (cactus y flores)
            terrainDecoration = new TerrainDecorationManager(scene, assetLoader);
            await terrainDecoration.createDecorations();

            // Zonas temáticas (Copiapó y Bahía Inglesa)
            zoneManager = new ZoneManager(scene, assetLoader);
            await zoneManager.createZones();

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

            // Cargar modelo del jugador
            await loadPlayerModel();

            // Verificar si hay partida guardada
            if (gameState.hasSavedGame()) {
                document.getElementById('btn-continue').style.display = 'block';
            }

            // 🎵 INICIAR MÚSICA DEL MENÚ PRINCIPAL
            // Nota: La música se inicia después de la primera interacción del usuario
            // debido a las políticas de autoplay de los navegadores

            console.log('✅ Juego inicializado correctamente');
        }

        // ========== CARGAR MODELO DEL JUGADOR ==========
        async function loadPlayerModel() {
            try {
                console.log('🎮 Cargando modelo del jugador (Adventurer.glb)...');

                // Cargar modelo GLB
                const playerGLTF = await assetLoader.loadGLTF(
                    'assets/models/player/Adventurer.glb',
                    'player'
                );

                console.log('✅ Modelo GLB cargado, configurando...');

                // Remover el placeholder
                scene.remove(player.mesh);

                // Configurar el nuevo modelo (extraer scene del GLTF)
                player.mesh = playerGLTF.scene;

                // 📏 ESCALA AJUSTADA DEL JUGADOR (GLB)
                // Adventurer.glb necesita escala aumentada
                // Escala 2.5: Aumentada para que se vea más grande
                player.mesh.scale.set(2.5, 2.5, 2.5);

                // 🔧 AJUSTE DE POSICIÓN EN EL SUELO
                // Calcular bounding box para ajustar la posición Y
                player.mesh.updateMatrixWorld(true);
                const playerBBox = new THREE.Box3().setFromObject(player.mesh);
                const playerYOffset = -playerBBox.min.y;

                // 👟 ELEVACIÓN LIGERA: Subir un poco para que se vean los pies
                const finalYPosition = playerYOffset + 0.3; // +0.3 unidades para elevar ligeramente

                // Posición inicial ligeramente elevada
                player.mesh.position.set(0, finalYPosition, 0);

                console.log(`  📐 Offset Y del jugador: ${playerYOffset.toFixed(2)} → ${finalYPosition.toFixed(2)} (elevado +0.3)`);

                // Rotación inicial (si el modelo mira en dirección incorrecta)
                // player.mesh.rotation.y = Math.PI; // Descomentar si mira hacia atrás

                // Aplicar materiales con iluminación mejorada
                player.mesh.traverse((child) => {
                    if (child.isMesh) {
                        console.log('Configurando mesh:', child.name);

                        // Habilitar sombras
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Mejorar el material para que se vea bien
                        if (child.material) {
                            // Si tiene textura, mantenerla
                            if (child.material.map) {
                                console.log('  - Tiene textura');
                                child.material.needsUpdate = true;
                            }

                            // Ajustar propiedades para mejor visibilidad
                            child.material.side = THREE.DoubleSide; // Ver ambos lados

                            // Si es muy oscuro, agregar emisión
                            if (child.material.emissive) {
                                child.material.emissive = new THREE.Color(0x222222);
                                child.material.emissiveIntensity = 0.2;
                            }

                            // Ajustar roughness y metalness si existen
                            if (child.material.roughness !== undefined) {
                                child.material.roughness = 0.8;
                            }
                            if (child.material.metalness !== undefined) {
                                child.material.metalness = 0.0;
                            }

                            child.material.needsUpdate = true;
                        }
                    }
                });

                // Agregar a la escena
                scene.add(player.mesh);

                console.log('✅ Modelo agregado a la escena');
                console.log('   Escala:', player.mesh.scale);
                console.log('   Posición:', player.mesh.position);

                // Configurar animaciones si existen
                if (playerGLTF.animations && playerGLTF.animations.length > 0) {
                    console.log(`✅ ${playerGLTF.animations.length} animaciones encontradas:`);
                    playerGLTF.animations.forEach((anim, i) => {
                        console.log(`   ${i + 1}. ${anim.name} (duración: ${anim.duration.toFixed(2)}s)`);
                    });

                    const animController = new AnimationController(
                        player.mesh,
                        playerGLTF.animations
                    );
                    player.setAnimationController(animController);

                    // 🎬 SISTEMA MEJORADO DE DETECCIÓN DE ANIMACIONES
                    // Excluir animaciones de armas/combate para encontrar idle correcto
                    const excludeKeywords = ['gun', 'shoot', 'shot', 'fire', 'aim', 'reload', 'weapon', 'attack', 'punch', 'kick'];

                    const findAnimation = (keywords, excludeList = []) => {
                        return playerGLTF.animations.find(anim => {
                            const animName = anim.name.toLowerCase();

                            // Excluir animaciones no deseadas
                            const isExcluded = excludeList.some(exclude =>
                                animName.includes(exclude.toLowerCase())
                            );
                            if (isExcluded) return false;

                            // Buscar por palabras clave
                            return keywords.some(keyword =>
                                animName.includes(keyword.toLowerCase())
                            );
                        });
                    };

                    // Detectar animaciones automáticamente (excluyendo combate)
                    const idleAnim = findAnimation(['idle', 'standing', 'breathe', 'neutral'], excludeKeywords);
                    const walkAnim = findAnimation(['walk', 'walking'], excludeKeywords);
                    const runAnim = findAnimation(['run', 'running', 'jog', 'sprint'], excludeKeywords);
                    const jumpAnim = findAnimation(['jump', 'jumping', 'leap'], excludeKeywords);

                    console.log('🎬 Animaciones detectadas:');
                    if (idleAnim) console.log(`   ✅ Idle: ${idleAnim.name}`);
                    if (walkAnim) console.log(`   ✅ Walk: ${walkAnim.name}`);
                    if (runAnim) console.log(`   ✅ Run: ${runAnim.name}`);
                    if (jumpAnim) console.log(`   ✅ Jump: ${jumpAnim.name}`);

                    // Iniciar animación idle (con fallback seguro)
                    if (idleAnim) {
                        animController.play(idleAnim.name);
                        console.log('✅ Animación idle iniciada:', idleAnim.name);
                    } else {
                        // Buscar la primera animación que NO sea de combate
                        const safeAnim = playerGLTF.animations.find(anim => {
                            const name = anim.name.toLowerCase();
                            return !excludeKeywords.some(exclude => name.includes(exclude));
                        });

                        if (safeAnim) {
                            animController.play(safeAnim.name);
                            console.log('✅ Animación segura iniciada:', safeAnim.name);
                        } else {
                            console.warn('⚠️ No se encontró animación idle, usando primera disponible');
                            animController.play(playerGLTF.animations[0].name);
                        }
                    }
                } else {
                    console.log('⚠️ No se encontraron animaciones en el modelo');
                    console.log('💡 El modelo funcionará sin animaciones');
                }

                console.log('✅ Modelo del jugador cargado exitosamente');
                console.log('');
                console.log('🎮 CONTROLES:');
                console.log('   WASD / Flechas: Moverse');
                console.log('   Shift: Correr');
                console.log('   Espacio: Saltar');
                console.log('   Mouse: Rotar cámara (click primero)');
                console.log('');

            } catch (error) {
                console.warn('⚠️ No se pudo cargar el modelo del jugador:', error);
                console.log('📦 Usando placeholder');
            }
        }

        // Iniciar el juego (carga fragmentos y modelo del jugador)
        initGame();

        // ========== CONTROLES ==========
        const keys = {
            w: false, a: false, s: false, d: false,
            arrowup: false, arrowdown: false, arrowleft: false, arrowright: false,
            space: false, shift: false, escape: false, i: false
        };

        window.addEventListener('keydown', (e) => {
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

        // ========== GAME LOOP ==========
        let lastTime = performance.now();
        let clickHintShown = true;

        const obstacles = [];
        const allInteractables = [];

        // Contador de rendimiento (F3): FPS, draw calls y triángulos
        const perfEl = document.createElement('div');
        perfEl.style.cssText = 'position:fixed;left:10px;top:10px;z-index:9999;display:none;padding:6px 10px;background:rgba(0,0,0,.7);color:#0f0;font:12px monospace;border-radius:4px;pointer-events:none';
        document.body.appendChild(perfEl);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') { e.preventDefault(); perfEl.style.display = perfEl.style.display === 'none' ? 'block' : 'none'; }
        });
        let perfFrames = 0, perfLast = performance.now();

        function animate() {
            requestAnimationFrame(animate);

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

            const currentTime = performance.now();
            const delta = Math.min((currentTime - lastTime) / 1000, 0.1); // evita saltos tras pausas
            lastTime = currentTime;

            if (gameState.isPlaying()) {
                // Ocultar hint de click después de capturar el mouse
                if (clickHintShown && document.pointerLockElement) {
                    document.getElementById('click-hint').style.display = 'none';
                    clickHintShown = false;
                }

                // Verificar si el jugador puede moverse (no en diálogo)
                const canMove = !interactionSystem.isInDialog();

                // Listas reutilizadas (sin crear arreglos nuevos en cada frame)
                obstacles.length = 0;
                obstacles.push(...npcManager.npcs, ...worldBuilder.rocks, ...(zoneManager.houses || []));

                // Actualizar jugador con obstáculos
                player.update(keys, cameraController.getAngle(), delta, ground, canMove, obstacles);

                // La sombra del sol sigue al jugador
                if (sunLight) {
                    const pp = player.getPosition();
                    sunLight.target.position.set(pp.x, 0, pp.z);
                    sunLight.position.copy(sunLight.target.position).add(SUN_OFFSET);
                }

                // Actualizar cámara
                cameraController.update(player.getPosition(), [ground]);

                // Actualizar NPCs
                npcManager.update(player.getPosition(), delta);

                // Actualizar sistema de interacción
                allInteractables.length = 0;
                allInteractables.push(...fragmentManager.fragments, ...npcManager.npcs);
                if (zoneManager) allInteractables.push(...zoneManager.getInteractableSigns());
                interactionSystem.update(player.getPosition(), allInteractables);

                // Actualizar fragmentos (solo animaciones, no recolección automática)
                fragmentManager.update(player.getPosition());

                // Actualizar decoración del terreno (animaciones sutiles)
                if (terrainDecoration) {
                    terrainDecoration.update();
                }
            }

            renderer.render(scene, camera);
        }

        // ========== FUNCIONES DE CONTROL ==========
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

        function handleInteraction() {
            if (interactionSystem.isInDialog()) {
                // Cerrar diálogo si está abierto
                closeDialogWithSound();
                return;
            }

            const interaction = interactionSystem.tryInteract();
            if (!interaction) return;

            if (interaction.type === 'fragment') {
                // Recolectar fragmento
                fragmentManager.collectFragment(interaction.object, (fragmentData) => {
                    playSfx('collect_fragment');
                    console.log('🎯 Fragmento recolectado:', fragmentData);

                    uiManager.updateFragmentUI(fragmentData.id, true);
                    uiManager.updateCounter(fragmentManager.getCollectedCount(), 5);
                    uiManager.showNotification(fragmentData.name, fragmentData.info);

                    // Actualizar panel de inventario inmediatamente
                    uiManager.updateInventoryPanel(inventory.getInventoryData());
                    console.log('📦 Inventario actualizado:', inventory.getInventoryData());

                    // Auto-guardar
                    autoSave();

                    // Verificar victoria
                    if (fragmentManager.getCollectedCount() === 5) {
                        setTimeout(() => {
                            playSfx('notification');
                            uiManager.showVictoryMessage();
                        }, 1000);
                    }
                });
            } else if (interaction.type === 'npc') {
                // Hablar con NPC
                openDialogWithSound(interaction.data);
            } else if (interaction.type === 'info_sign') {
                // Mostrar información del letrero
                const signData = {
                    name: interaction.data.name,
                    dialog_type: 'Información',
                    historical_cue: interaction.data.description
                };
                openDialogWithSound(signData);
            }
        }

        function startNewGame() {
            gameState.setState('playing');
            uiManager.showHUD();

            // 🎵 CAMBIAR A MÚSICA Y AMBIENTE DEL JUEGO
            if (audioManager) {
                // Cambiar de música de menú a música de juego
                audioManager.changeMusicWithFade('game_theme', 2.0);

                // Iniciar ambiente del desierto
                audioManager.play('desert_ambience');

                console.log('🎵 Música de juego y ambiente iniciados');
            }

            // Cargar inventario guardado si existe (pasar datos de fragmentos para reconstruir)
            inventory.load(fragmentManager.getFragmentsData());

            // Actualizar UI con fragmentos ya recolectados
            fragmentManager.getFragmentsData().forEach(frag => {
                if (inventory.hasFragment(frag.id)) {
                    uiManager.updateFragmentUI(frag.id, true);
                }
            });

            uiManager.updateCounter(fragmentManager.getCollectedCount(), 5);

            // Actualizar panel de inventario con datos cargados
            uiManager.updateInventoryPanel(inventory.getInventoryData());

            animate();
        }

        function continueGame() {
            const savedGame = gameState.loadGame();
            if (savedGame) {
                player.loadState(savedGame.player);
                inventory.load(fragmentManager.getFragmentsData());

                // Actualizar UI
                fragmentManager.getFragmentsData().forEach(frag => {
                    if (inventory.hasFragment(frag.id)) {
                        uiManager.updateFragmentUI(frag.id, true);
                    }
                });

                uiManager.updateCounter(fragmentManager.getCollectedCount(), 5);

                // Actualizar panel de inventario con datos cargados
                uiManager.updateInventoryPanel(inventory.getInventoryData());
            }
            startNewGame();
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

        function autoSave() {
            gameState.saveGame(player.saveState(), inventory.getInventoryData());
        }

        function exitToMenu() {
            gameState.setState('menu');
            uiManager.showMainMenu();
            document.exitPointerLock();

            // Resetear posición del jugador
            player.setPosition(0, 2, 0);
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

            // Resetear fragmentos en el mundo
            fragmentManager.fragments.forEach(fragment => {
                fragment.visible = true;
                fragment.userData.collected = false;
            });

            // Actualizar UI
            fragmentManager.getFragmentsData().forEach(frag => {
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

        // Iniciar el loop de renderizado
        animate();
    
