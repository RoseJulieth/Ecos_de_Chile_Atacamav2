import * as THREE from 'three';

export class TerrainDecorationManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.decorations = [];

        // Configuración de modelos de decoración
        this.decorationModels = {
            // Flores pequeñas
            desert_lily: {
                path: 'assets/models/terrain/Desert_lily.glb',
                scale: 0.3,
                type: 'small',
                yOffset: 0,
                count: 15
            },
            desert_marigold: {
                path: 'assets/models/terrain/Desert_marigold.glb',
                scale: 0.3,
                type: 'small',
                yOffset: 0,
                count: 15
            },
            // Cactus medianos
            cactus: {
                path: 'assets/models/terrain/Cactus.glb',
                scale: 1.0,
                type: 'medium',
                yOffset: 1.0,  // Elevar para que se vea completo
                count: 20
            },
            // 🆕 NUEVO: Cactus con pájaro
            cactus_wren: {
                path: 'assets/models/terrain/Cactus_wren.glb',
                scale: 0.3,  // Reducido de 1.0 a 0.3 para que sea proporcional
                type: 'medium',
                yOffset: 0.5,  // Ajustado para la nueva escala
                count: 3  // Máximo 3
            },
            // 🆕 NUEVO: Rocas grandes (reducidas para mejor rendimiento)
            rock_large: {
                path: 'assets/models/terrain/Rock_Large.fbx',
                scale: 0.5,
                type: 'large',
                yOffset: 0.5,
                count: 2,  // Reducido de 3 a 2
                isFBX: true
            }
        };
    }

    async createDecorations() {
        console.log('🌵 Creando decoración del terreno...');

        for (const [key, config] of Object.entries(this.decorationModels)) {
            await this.createDecorationType(key, config);
        }

        console.log(`✅ ${this.decorations.length} elementos de decoración creados`);
    }

    async createDecorationType(key, config) {
        const { path, scale, type, count, yOffset, isFBX } = config;

        // Intentar cargar el modelo
        let modelTemplate;
        try {
            console.log(`⏳ Cargando decoración: ${path}`);

            if (isFBX) {
                // Cargar modelo FBX
                modelTemplate = await this.assetLoader.loadFBX(path, `decoration_${key}`);
            } else {
                // Cargar modelo GLB
                const gltf = await this.assetLoader.loadGLTF(path, `decoration_${key}`);
                modelTemplate = gltf.scene;
            }

            console.log(`✅ Modelo cargado: ${key}`);
        } catch (error) {
            console.warn(`⚠️ No se pudo cargar ${path}, usando placeholder`);
            modelTemplate = this.createPlaceholder(type);
        }

        // Crear múltiples instancias distribuidas por el mapa
        for (let i = 0; i < count; i++) {
            const decoration = modelTemplate.clone();

            // Aplicar escala
            decoration.scale.set(scale, scale, scale);

            // Posición aleatoria en el mapa
            const position = this.getRandomPosition(type);
            decoration.position.set(position.x, yOffset || 0, position.z);

            // Rotación aleatoria para variedad
            decoration.rotation.y = Math.random() * Math.PI * 2;

            // Configurar sombras
            decoration.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Agregar a la escena
            this.scene.add(decoration);
            this.decorations.push({
                mesh: decoration,
                type: key,
                position: position
            });
        }

        console.log(`  ✅ ${count} ${key} creados`);
    }

    getRandomPosition(type) {
        // Generar posición aleatoria según el tipo
        let x, z;

        if (type === 'small') {
            // Flores: distribuidas por casi todo el mapa (terreno es 200x200)
            x = (Math.random() - 0.5) * 180; // -90 a 90
            z = (Math.random() - 0.5) * 180; // -90 a 90
        } else if (type === 'medium') {
            // Cactus: distribuidos por casi todo el mapa
            x = (Math.random() - 0.5) * 180; // -90 a 90
            z = (Math.random() - 0.5) * 180; // -90 a 90
        } else if (type === 'large') {
            // Rocas grandes: más espaciadas, en zonas específicas
            x = (Math.random() - 0.5) * 160; // -80 a 80
            z = (Math.random() - 0.5) * 160; // -80 a 80
        }

        // Evitar el centro (donde aparece el jugador y hay NPCs)
        if (Math.abs(x) < 10 && Math.abs(z) < 10) {
            // Mover a una zona segura
            x += (x >= 0 ? 15 : -15);
            z += (z >= 0 ? 15 : -15);
        }

        return { x, z };
    }

    createPlaceholder(type) {
        let geometry, material;

        if (type === 'small') {
            // Placeholder para flores: cilindro pequeño
            geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8);
            material = new THREE.MeshToonMaterial({
                color: 0xFF69B4, // Rosa
                emissive: 0xFF69B4,
                emissiveIntensity: 0.2
            });
        } else if (type === 'medium') {
            // Placeholder para cactus: cilindro alto
            geometry = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
            material = new THREE.MeshToonMaterial({
                color: 0x228B22 // Verde
            });
        } else if (type === 'large') {
            // Placeholder para rocas: esfera grande
            geometry = new THREE.SphereGeometry(1.5, 8, 8);
            material = new THREE.MeshToonMaterial({
                color: 0x8B7355 // Marrón
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }

    update() {
        // Animación sutil de flores (balanceo)
        this.decorations.forEach((decoration, index) => {
            if (decoration.type.includes('lily') || decoration.type.includes('marigold')) {
                const time = Date.now() * 0.001;
                const offset = index * 0.5;
                decoration.mesh.rotation.z = Math.sin(time + offset) * 0.05;
            }
        });
    }
}
