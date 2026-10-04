import * as THREE from 'three';

export class NPCManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.npcs = [];
        this.npcData = null;

        // ============================================================
        // CONFIGURACIÓN DE ESCALAS AJUSTADAS PARA NPCs (TODOS GLB)
        // ============================================================
        // Escalas aumentadas para que los modelos se vean más grandes
        // Modelos pequeños necesitan escalas mayores
        // ============================================================
        this.USE_AUTO_NORMALIZATION = false;  // Desactivar normalización automática
        this.TARGET_HEIGHT = 1.7;  // Altura objetivo (no se usa)
        this.npcModels = {
            'npc_001': { // Don Pedro - Minero Veterano
                path: 'assets/models/npcs/Worker.glb',
                type: 'glb',
                scale: 2.5  // Aumentado para que se vea más grande
            },
            'npc_002': { // Doña Rosa - Guardiana de Leyendas
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_003': { // Capitán Vargas - Veterano de Guerra
                path: 'assets/models/npcs/Solider.glb',
                type: 'glb',
                scale: 2.5  // Aumentado para que se vea más grande
            },
            'npc_004': { // María - Guía del Desierto Florido
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_005': { // Don Esteban - Botánico Local
                path: 'assets/models/npcs/Farmer.glb',
                type: 'glb',
                scale: 2.5  // Aumentado para que se vea más grande
            },
            'npc_006': { // Capitán Morales - Pescador Artesanal
                path: 'assets/models/npcs/Beach_Character.glb',
                type: 'glb',
                scale: 3.0  // Aumentado un poco más
            },
            'npc_007': { // Elena - Bióloga Marina
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_008': { // Abuelo Tomás - Contador de Historias
                path: 'assets/models/npcs/Wizardus_Maximus.glb',
                type: 'glb',
                scale: 2.5  // Aumentado para que se vea más grande
            },
            'npc_009': { // Profesora Carla - Historiadora
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_010': { // Javier - Guía Turístico
                path: 'assets/models/npcs/Man.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_011': { // Sofía - Arqueóloga
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_012': { // Valentina - Astrónoma
                path: 'assets/models/npcs/Animated_Woman.glb',
                type: 'glb',
                scale: 0.8
            },
            'npc_013': { // Diego - Viajero Casual
                path: 'assets/models/npcs/Beach_Character.glb',
                type: 'glb',
                scale: 3.0  // Aumentado un poco más
            }
        };
    }

    async loadNPCData() {
        try {
            const response = await fetch('data/npcDialogs.json');
            this.npcData = await response.json();
            console.log(`✅ Datos de NPCs cargados: ${this.npcData.npcs.length} NPCs`);
            return this.npcData;
        } catch (error) {
            console.error('❌ Error cargando datos de NPCs:', error);
            return null;
        }
    }

    getModelForNPC(npcId) {
        // Retornar modelo específico para este NPC
        return this.npcModels[npcId] || {
            path: 'assets/models/npcs/Adventurer.fbx',
            type: 'fbx',
            scale: 0.01
        };
    }

    /**
     * ============================================================
     * NORMALIZACIÓN AUTOMÁTICA DE ALTURA
     * ============================================================
     * Calcula la escala necesaria para que un modelo alcance
     * la altura objetivo (1.7 unidades por defecto).
     * 
     * @param {THREE.Object3D} mesh - El mesh del NPC
     * @param {number} initialScale - Escala inicial aplicada
     * @param {number} heightMultiplier - Multiplicador de altura (1.0 = normal)
     * @returns {number} - Nueva escala normalizada
     * ============================================================
     */
    calculateNormalizedScale(mesh, initialScale, heightMultiplier = 1.0) {
        // Calcular bounding box con la escala inicial
        mesh.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(mesh);
        const currentHeight = bbox.max.y - bbox.min.y;

        // Altura objetivo ajustada por multiplicador
        const targetHeight = this.TARGET_HEIGHT * heightMultiplier;

        // Calcular nueva escala: (altura_objetivo / altura_actual) * escala_inicial
        const normalizedScale = (targetHeight / currentHeight) * initialScale;

        console.log(`  📐 Normalización de escala:`);
        console.log(`     Altura actual: ${currentHeight.toFixed(2)}u con escala ${initialScale}`);
        console.log(`     Altura objetivo: ${targetHeight.toFixed(2)}u`);
        console.log(`     Nueva escala: ${normalizedScale.toFixed(3)}`);

        return normalizedScale;
    }

    async createNPCs() {
        if (!this.npcData) {
            await this.loadNPCData();
        }

        if (!this.npcData) {
            console.warn('⚠️ No se pudieron cargar los datos de NPCs');
            return;
        }

        console.log('👥 Creando NPCs con modelos GLB y FBX...');

        for (const data of this.npcData.npcs) {
            await this.createNPC(data);
        }

        console.log(`✅ ${this.npcs.length} NPCs creados en el mundo`);
    }

    async createNPC(data) {
        let npcMesh;
        let usedPlaceholder = false;

        // Extraer número del npc_id (ej: "npc_001" -> 1)
        const npcNumber = parseInt(data.npc_id.replace('npc_', ''));

        // Obtener modelo específico para este NPC
        const modelData = this.getModelForNPC(data.npc_id);
        const modelPath = modelData.path;
        const modelType = modelData.type;
        const modelScale = modelData.scale;

        console.log(`👤 NPC ${npcNumber}: ${data.name} (${modelPath})`);

        // Intentar cargar modelo (FBX o GLB según género)
        try {
            console.log(`⏳ Cargando ${modelType.toUpperCase()}: ${modelPath}`);

            let loadedModel;
            let animations = [];

            if (modelType === 'fbx') {
                // Cargar FBX
                loadedModel = await this.assetLoader.loadFBX(modelPath, `npc_${npcNumber}`);
                npcMesh = loadedModel;

                // Extraer animaciones del FBX
                if (loadedModel.animations && loadedModel.animations.length > 0) {
                    animations = loadedModel.animations;
                    console.log(`  🎬 ${animations.length} animaciones encontradas en FBX`);
                }
            } else {
                // Cargar GLB
                const gltf = await this.assetLoader.loadGLTF(modelPath, `npc_${npcNumber}`);
                npcMesh = gltf.scene;

                // Extraer animaciones del GLB
                if (gltf.animations && gltf.animations.length > 0) {
                    animations = gltf.animations;
                    console.log(`  🎬 ${animations.length} animaciones encontradas en GLB`);
                }
            }

            // ============================================================
            // PASO 1: Aplicar escala inicial
            // ============================================================
            npcMesh.scale.set(modelScale, modelScale, modelScale);

            // ============================================================
            // PASO 2: Aplicar escala (con o sin normalización)
            // ============================================================
            let finalScale = modelScale;

            if (this.USE_AUTO_NORMALIZATION) {
                // Normalización automática activada
                const heightMultiplier = modelData.heightMultiplier || 1.0;
                finalScale = this.calculateNormalizedScale(
                    npcMesh,
                    modelScale,
                    heightMultiplier
                );
                console.log(`  📐 Normalización automática: ${modelScale} → ${finalScale.toFixed(3)}`);
            } else {
                // Usar escala fija
                console.log(`  📏 Escala fija aplicada: ${finalScale}`);
            }

            // Aplicar escala final
            npcMesh.scale.set(finalScale, finalScale, finalScale);

            // ============================================================
            // PASO 3: Configurar materiales
            // ============================================================
            let textureCount = 0;
            npcMesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Verificar si tiene textura
                    if (child.material) {
                        const hasTexture = child.material.map !== null;
                        if (hasTexture) {
                            textureCount++;
                        }
                        // Mejorar visibilidad
                        if (child.material.emissive) {
                            child.material.emissiveIntensity = 0.1;
                        }
                        child.material.needsUpdate = true;
                    }
                }
            });

            console.log(`✅ Modelo ${modelType.toUpperCase()} cargado: ${data.name} (${textureCount} texturas)`);
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar ${modelPath}: ${error.message}`);
            console.log(`📦 Creando placeholder para: ${data.name}`);

            // Crear placeholder visible con color según tipo
            npcMesh = this.assetLoader.createPlaceholder('npc', {
                color: this.getColorByDialogType(data.dialog_type)
            });
            usedPlaceholder = true;
        }

        // Si no se creó ningún mesh, crear placeholder de emergencia
        if (!npcMesh) {
            console.warn(`⚠️ Creando placeholder de emergencia para ${data.name}`);
            npcMesh = this.assetLoader.createPlaceholder('npc', {
                color: this.getColorByDialogType(data.dialog_type)
            });
            usedPlaceholder = true;
        }

        // ============================================================
        // PASO 4: Posicionar NPC sobre el suelo
        // ============================================================
        // Forzar actualización de matrices con la escala final
        npcMesh.updateMatrixWorld(true);

        // Calcular bounding box con la escala normalizada
        const bbox = new THREE.Box3().setFromObject(npcMesh);
        const modelHeight = bbox.max.y - bbox.min.y;

        // Calcular offset para que los pies toquen Y=0
        // Si el modelo está centrado, bbox.min.y será negativo (mitad inferior)
        const yOffset = -bbox.min.y;

        npcMesh.position.set(data.position.x, yOffset, data.position.z);

        console.log(`  ✅ NPC posicionado: ${data.name}`);
        console.log(`     Altura final: ${modelHeight.toFixed(2)}u (objetivo: ${(this.TARGET_HEIGHT * (modelData.heightMultiplier || 1.0)).toFixed(2)}u)`);
        console.log(`     Offset Y: ${yOffset.toFixed(2)}u`);

        // Agregar un indicador visual encima del NPC
        const indicator = this.createIndicator(data.dialog_type);
        // 🔧 POSICIÓN AJUSTADA: Indicador cerca de la cabeza, no en el cielo
        // Con escalas grandes (2.5-3.0), usar altura fija más razonable
        const indicatorY = modelHeight * 0.6;  // 60% de la altura del modelo (cerca de la cabeza)
        indicator.position.y = indicatorY;
        indicator.userData.baseY = indicatorY;  // Guardar posición base para animación
        npcMesh.add(indicator);

        // Si es placeholder, agregar texto con el nombre
        if (usedPlaceholder) {
            const nameLabel = this.createNameLabel(data.name);
            nameLabel.position.y = modelHeight * 0.7;  // 70% de la altura (sobre el indicador)
            npcMesh.add(nameLabel);
            console.log(`  📝 Etiqueta de nombre agregada: ${data.name}`);
        }

        // Configurar mixer de animaciones si hay animaciones disponibles
        let mixer = null;
        let npcAnimations = [];

        if (npcMesh.animations && npcMesh.animations.length > 0) {
            mixer = new THREE.AnimationMixer(npcMesh);
            npcAnimations = npcMesh.animations;
            console.log(`  🎬 Mixer creado con ${npcAnimations.length} animaciones`);
        }

        // Guardar datos en userData
        npcMesh.userData = {
            ...data,
            type: 'npc',
            interactable: true,
            inRange: false,
            mixer: mixer,
            animations: npcAnimations
        };

        this.scene.add(npcMesh);
        this.npcs.push(npcMesh);
    }

    createIndicator(dialogType) {
        // Crear un icono flotante sobre el NPC
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Fondo circular
        ctx.fillStyle = this.getColorByDialogType(dialogType);
        ctx.beginPath();
        ctx.arc(32, 32, 30, 0, Math.PI * 2);
        ctx.fill();

        // Icono según tipo
        ctx.fillStyle = 'white';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const icon = this.getIconByDialogType(dialogType);
        ctx.fillText(icon, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(0.8, 0.8, 1);

        return sprite;
    }

    createNameLabel(name) {
        // Crear etiqueta con el nombre del NPC
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Fondo semi-transparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Texto del nombre
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(name, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);

        return sprite;
    }

    getColorByDialogType(type) {
        const colors = {
            'Historia': '#8B4513',
            'Leyenda': '#9370DB',
            'Turismo': '#20B2AA',
            'Paisaje': '#32CD32'
        };
        return colors[type] || '#FFD700';
    }

    getIconByDialogType(type) {
        const icons = {
            'Historia': '📜',
            'Leyenda': '✨',
            'Turismo': '🗺️',
            'Paisaje': '🌄'
        };
        return icons[type] || '💬';
    }

    update(playerPosition, delta = 0.016) {
        this.npcs.forEach(npc => {
            // Animación de flotación del indicador
            const indicator = npc.children[0];
            if (indicator && indicator.userData.baseY) {
                // Usar posición base guardada + animación de flotación
                indicator.position.y = indicator.userData.baseY + Math.sin(Date.now() * 0.003) * 0.5;
            }

            // ⚙️ DISTANCIA DE INTERACCIÓN AJUSTADA A NUEVA ESCALA
            // Con personajes 5x más grandes, la distancia debe ser proporcional
            const distance = playerPosition.distanceTo(npc.position);
            const wasInRange = npc.userData.inRange;
            npc.userData.inRange = distance < 5.0;  // Antes: 3.0

            // Hacer que el NPC mire al jugador cuando está cerca
            if (npc.userData.inRange) {
                const direction = new THREE.Vector3()
                    .subVectors(playerPosition, npc.position)
                    .normalize();
                const angle = Math.atan2(direction.x, direction.z);
                npc.rotation.y = angle;

                // 👋 Activar animación de saludo cuando el jugador se acerca
                if (!wasInRange && npc.userData.mixer) {
                    this.playGreetingAnimation(npc);
                }
            }

            // Actualizar mixer de animaciones si existe
            if (npc.userData.mixer) {
                npc.userData.mixer.update(delta);
            }
        });
    }

    playGreetingAnimation(npc) {
        // Intentar reproducir animación de saludo/interacción
        if (!npc.userData.mixer || !npc.userData.animations) return;

        const animations = npc.userData.animations;

        // Buscar animación de saludo (wave, greeting, hello, idle)
        const greetingKeywords = ['wave', 'greeting', 'hello', 'salute', 'idle'];
        let greetingClip = null;

        for (const keyword of greetingKeywords) {
            greetingClip = animations.find(clip =>
                clip.name.toLowerCase().includes(keyword)
            );
            if (greetingClip) break;
        }

        if (greetingClip) {
            const action = npc.userData.mixer.clipAction(greetingClip);
            action.reset();
            action.setLoop(THREE.LoopOnce, 1);
            action.clampWhenFinished = true;
            action.play();
            console.log(`👋 ${npc.userData.name} saluda con animación: ${greetingClip.name}`);
        }
    }

    getNearestNPC(playerPosition) {
        let nearest = null;
        let minDistance = Infinity;

        this.npcs.forEach(npc => {
            if (npc.userData.inRange) {
                const distance = playerPosition.distanceTo(npc.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = npc;
                }
            }
        });

        return nearest;
    }

    getNPCData(npc) {
        return npc.userData;
    }
}
