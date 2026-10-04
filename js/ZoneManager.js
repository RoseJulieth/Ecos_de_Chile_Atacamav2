import * as THREE from 'three';

export class ZoneManager {
    constructor(scene, assetLoader) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.zones = [];
        this.interactableSigns = [];
        this.houses = []; // Array para almacenar casas para colisiones
    }

    async createZones() {
        console.log('🏙️ Creando zonas temáticas...');

        // Crear camino principal que se divide
        await this.createMainPath();

        // Zona 1: Copiapó (Oeste) - Ciudad minera
        await this.createCopiapoZone();

        // Zona 2: Bahía Inglesa (Este) - Playa
        await this.createBahiaInglesaZone();

        console.log(`✅ ${this.zones.length} zonas temáticas creadas`);
        console.log(`✅ ${this.interactableSigns.length} letreros interactuables creados`);
    }

    async createMainPath() {
        console.log('🛤️ Creando camino principal...');

        const pathModel = 'assets/models/terrain/Rock_Path_Round_Small.glb';

        // Camino desde el centro hacia el oeste (Copiapó)
        const westPathPositions = [
            { x: -10, z: 0 }, { x: -20, z: 0 }, { x: -30, z: 0 },
            { x: -40, z: 0 }, { x: -50, z: 0 }, { x: -60, z: 0 },
            { x: -70, z: 0 }, { x: -80, z: 0 }
        ];

        // Camino desde el centro hacia el este (Bahía Inglesa)
        const eastPathPositions = [
            { x: 10, z: 0 }, { x: 20, z: 0 }, { x: 30, z: 0 },
            { x: 40, z: 0 }, { x: 50, z: 0 }, { x: 60, z: 0 },
            { x: 70, z: 0 }, { x: 80, z: 0 }
        ];

        // Crear piezas de camino
        for (const pos of [...westPathPositions, ...eastPathPositions]) {
            await this.createPathPiece(pathModel, pos.x, pos.z);
        }

        console.log('✅ Camino principal creado');
    }

    async createPathPiece(modelPath, x, z) {
        try {
            const gltf = await this.assetLoader.loadGLTF(modelPath, `path_${x}_${z}`);
            const path = gltf.scene;

            path.scale.set(2, 1, 2);  // Escala para que se vea como camino
            path.position.set(x, 0.1, z);
            path.rotation.y = Math.random() * Math.PI * 2;  // Rotación aleatoria

            path.traverse((child) => {
                if (child.isMesh) {
                    child.receiveShadow = true;
                    child.castShadow = true;
                }
            });

            this.scene.add(path);
        } catch (error) {
            // Fallback: crear placeholder de camino
            const geometry = new THREE.CylinderGeometry(3, 3, 0.2, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x8B7355,
                roughness: 0.9
            });
            const pathPiece = new THREE.Mesh(geometry, material);
            pathPiece.position.set(x, 0.1, z);
            pathPiece.receiveShadow = true;
            this.scene.add(pathPiece);
        }
    }

    async createCopiapoZone() {
        const zoneData = {
            name: 'Copiapó',
            position: { x: -90, z: 0 },
            size: { width: 40, depth: 40 }
        };

        // Crear plataforma con textura del terreno
        const platform = this.createTerrainPlatform(
            zoneData.position.x,
            zoneData.position.z,
            zoneData.size.width,
            zoneData.size.depth
        );

        // Crear letrero interactuable pequeño
        this.createInteractableSign(
            'Copiapó',
            zoneData.position.x,
            zoneData.position.z + 15,
            'Copiapó, fundada en 1744, fue el corazón de la fiebre de la plata en Chile. El descubrimiento de Chañarcillo en 1832 transformó esta ciudad en la capital minera del país, financiando el primer ferrocarril de Sudamérica y modernizando toda la región.',
            0xFFD700
        );

        // Colocar casas alrededor del terreno
        await this.placeHouses(zoneData.position.x, zoneData.position.z);

        // Colocar caminos alrededor de Copiapó
        await this.placePathsAroundCopiap(zoneData.position.x, zoneData.position.z);

        this.zones.push({
            ...zoneData,
            type: 'city',
            platform: platform
        });

        console.log('  ✅ Zona Copiapó creada (Oeste)');
    }

    async placePathsAroundCopiap(centerX, centerZ) {
        const pathModel = 'assets/models/terrain/Rock_Path_Round_Small.glb';

        // Caminos alrededor del terreno de Copiapó
        const pathPositions = [
            // Lado norte
            { x: centerX - 20, z: centerZ + 20 },
            { x: centerX - 10, z: centerZ + 20 },
            { x: centerX, z: centerZ + 20 },
            { x: centerX + 10, z: centerZ + 20 },
            // Lado sur
            { x: centerX - 20, z: centerZ - 20 },
            { x: centerX - 10, z: centerZ - 20 },
            { x: centerX, z: centerZ - 20 },
            { x: centerX + 10, z: centerZ - 20 },
            // Lado oeste
            { x: centerX - 20, z: centerZ - 10 },
            { x: centerX - 20, z: centerZ },
            { x: centerX - 20, z: centerZ + 10 },
            // Lado este
            { x: centerX + 20, z: centerZ - 10 },
            { x: centerX + 20, z: centerZ },
            { x: centerX + 20, z: centerZ + 10 }
        ];

        for (const pos of pathPositions) {
            await this.createPathPiece(pathModel, pos.x, pos.z);
        }

        console.log('  ✅ Caminos colocados alrededor de Copiapó');
    }

    async placeHouses(centerX, centerZ) {
        const houseModels = [
            'assets/models/terrain/Houses.glb',
            'assets/models/terrain/Storage_House.glb'
        ];

        // Posiciones alrededor del terreno
        const housePositions = [
            { x: centerX - 15, z: centerZ - 15, rotation: 0 },
            { x: centerX + 15, z: centerZ - 15, rotation: Math.PI / 2 },
            { x: centerX - 15, z: centerZ + 15, rotation: -Math.PI / 2 },
            { x: centerX + 15, z: centerZ + 15, rotation: Math.PI }
        ];

        for (let i = 0; i < housePositions.length; i++) {
            const pos = housePositions[i];
            // Alternar entre los dos modelos de casas
            const modelPath = houseModels[i % 2];

            try {
                const gltf = await this.assetLoader.loadGLTF(modelPath, `house_${pos.x}_${pos.z}`);
                const house = gltf.scene;

                // 🏠 ESCALA MUY GRANDE: 8.0 para que se vean como edificios grandes
                house.scale.set(8.0, 8.0, 8.0);
                house.position.set(pos.x, 0, pos.z);
                house.rotation.y = pos.rotation;

                house.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                // 🚧 MARCAR COMO OBSTÁCULO PARA COLISIONES
                house.userData = {
                    type: 'house',
                    radius: 8.0 // Radio de colisión basado en la escala
                };

                this.scene.add(house);
                this.houses.push(house); // Agregar a la lista de casas
                console.log(`  ✅ Casa cargada: ${modelPath} en (${pos.x}, ${pos.z})`);
            } catch (error) {
                console.error(`❌ Error cargando casa en (${pos.x}, ${pos.z}):`, error);
                // Placeholder de casa
                this.createHousePlaceholder(pos.x, pos.z);
            }
        }

        console.log('  ✅ Casas colocadas en Copiapó');
    }

    createHousePlaceholder(x, z) {
        const geometry = new THREE.BoxGeometry(5, 4, 5);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });
        const house = new THREE.Mesh(geometry, material);
        house.position.set(x, 2.5, z);
        house.castShadow = true;
        house.receiveShadow = true;

        // 🚧 MARCAR PLACEHOLDER COMO OBSTÁCULO
        house.userData = {
            type: 'house',
            radius: 4.0
        };

        this.scene.add(house);
        this.houses.push(house); // Agregar placeholder a la lista
    }

    async createBahiaInglesaZone() {
        const zoneData = {
            name: 'Bahía Inglesa',
            position: { x: 90, z: 0 },
            size: { width: 40, depth: 40 }
        };

        // Crear plataforma con textura del terreno
        const platform = this.createTerrainPlatform(
            zoneData.position.x,
            zoneData.position.z,
            zoneData.size.width,
            zoneData.size.depth
        );

        // Crear letrero interactuable pequeño (movido hacia la derecha)
        this.createInteractableSign(
            'Bahía Inglesa',
            zoneData.position.x + 18,  // Movido 18 unidades a la derecha
            zoneData.position.z + 15,
            'Bahía Inglesa recibió su nombre en 1687 cuando el corsario inglés Edward Davis ancló aquí. Famosa por sus playas de arena blanca y aguas turquesas, es uno de los destinos turísticos más hermosos de la Región de Atacama.',
            0x00CED1
        );

        // Colocar playa con gaviotas
        await this.placeBeach(zoneData.position.x, zoneData.position.z);

        // Efecto de agua alrededor de la isla
        this.createWaterEffect(
            zoneData.position.x,
            zoneData.position.z,
            38,
            38
        );

        this.zones.push({
            ...zoneData,
            type: 'beach',
            platform: platform
        });

        console.log('  ✅ Zona Bahía Inglesa creada (Este)');
    }

    async placeBeach(centerX, centerZ) {
        const beachModel = 'assets/models/terrain/Beach.glb';

        try {
            const gltf = await this.assetLoader.loadGLTF(beachModel, 'beach_bahia');
            const beach = gltf.scene;

            // 🏖️ ESCALA ICONO: 0.08 para que se vea como representación pequeña de playa
            beach.scale.set(0.08, 0.08, 0.08);
            beach.position.set(centerX, 0.5, centerZ);

            // 🔄 ROTACIÓN: Voltear 180 grados para que se vea de frente
            beach.rotation.y = Math.PI;

            beach.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            this.scene.add(beach);

            console.log('  ✅ Playa colocada en Bahía Inglesa (escala 0.08 - ícono pequeño)');
        } catch (error) {
            console.error('❌ Error cargando Beach.glb:', error);
            // Placeholder de playa
            this.createBeachPlaceholder(centerX, centerZ);
        }

        // Agregar gaviotas
        await this.placeSeagulls(centerX, centerZ);
    }

    async placeSeagulls(centerX, centerZ) {
        const seagullModel = 'assets/models/terrain/Seagull.glb';

        // 🐦 Gaviotas en la arena alrededor de Beach.glb
        // Posiciones cerca del suelo (Y=0.5) para que se vean en la arena
        const seagullPositions = [
            { x: centerX - 8, y: 0.5, z: centerZ - 5 },
            { x: centerX + 8, y: 0.5, z: centerZ - 5 },
            { x: centerX - 6, y: 0.5, z: centerZ + 6 },
            { x: centerX + 6, y: 0.5, z: centerZ + 6 }
        ];

        for (let i = 0; i < seagullPositions.length; i++) {
            const pos = seagullPositions[i];
            try {
                const gltf = await this.assetLoader.loadGLTF(seagullModel, `seagull_${i}`);
                const seagull = gltf.scene;

                // 🐦 ESCALA REDUCIDA: 0.02 para gaviotas pequeñas en la arena
                seagull.scale.set(0.02, 0.02, 0.02);
                seagull.position.set(pos.x, pos.y, pos.z);
                seagull.rotation.y = Math.random() * Math.PI * 2;

                seagull.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.scene.add(seagull);
            } catch (error) {
                console.warn(`⚠️ No se pudo cargar gaviota ${i}`);
            }
        }

        console.log('  ✅ 4 gaviotas colocadas en la arena alrededor de Beach.glb (escala 0.02)');
    }

    createBeachPlaceholder(x, z) {
        const geometry = new THREE.CylinderGeometry(10, 10, 0.5, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xF4A460,
            roughness: 0.9
        });
        const beach = new THREE.Mesh(geometry, material);
        beach.position.set(x, 0.5, z);
        beach.castShadow = true;
        beach.receiveShadow = true;
        this.scene.add(beach);
    }

    createIslandPlaceholder(x, z) {
        const geometry = new THREE.ConeGeometry(8, 3, 8);
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 0.9
        });
        const island = new THREE.Mesh(geometry, material);
        island.position.set(x, 1.5, z);
        island.castShadow = true;
        island.receiveShadow = true;
        this.scene.add(island);
    }

    createTerrainPlatform(x, z, width, depth) {
        // Crear plataforma con las mismas texturas PBR del terreno principal
        const geometry = new THREE.PlaneGeometry(width, depth, 10, 10);

        // Crear pequeñas variaciones en el terreno
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = Math.random() * 0.3; // Pequeñas elevaciones
        }
        geometry.computeVertexNormals();

        // Cargar las mismas texturas PBR del terreno
        const textureLoader = new THREE.TextureLoader();
        const textureBasePath = 'assets/textures/terrain/';

        const colorMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_Color.png');
        const normalMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_NormalGL.png');
        const roughnessMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_Roughness.png');
        const aoMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_AmbientOcclusion.png');
        const displacementMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_Displacement.png');

        // Configurar repetición de texturas
        const repeatX = 4;
        const repeatY = 4;

        [colorMap, normalMap, roughnessMap, aoMap, displacementMap].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
        });

        // Crear material con texturas PBR (igual que el terreno principal)
        const material = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            aoMap: aoMap,
            displacementMap: displacementMap,
            displacementScale: 0.1,
            side: THREE.DoubleSide
        });

        const platform = new THREE.Mesh(geometry, material);
        platform.rotation.x = -Math.PI / 2;
        platform.position.set(x, 0.1, z);
        platform.receiveShadow = true;
        this.scene.add(platform);

        console.log(`  ✅ Plataforma con textura del terreno creada en (${x}, ${z})`);
        return platform;
    }

    createInteractableSign(name, x, z, description, color) {
        // Crear letrero pequeño interactuable
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Fondo
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Borde
        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

        // Icono de información
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ℹ️', canvas.width / 2, 40);

        // Texto
        ctx.font = 'bold 24px Arial';
        ctx.fillText(name, canvas.width / 2, 85);

        // Indicación de interacción
        ctx.font = '16px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('Presiona E', canvas.width / 2, 110);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, 3, z);
        sprite.scale.set(8, 4, 1);

        // Agregar datos de interacción
        sprite.userData = {
            type: 'info_sign',
            interactable: true,
            name: name,
            description: description
        };

        this.scene.add(sprite);
        this.interactableSigns.push(sprite);

        console.log(`  ✅ Letrero interactuable creado: ${name}`);
    }

    createWaterEffect(x, z, width, depth) {
        // Efecto de agua para Bahía Inglesa - más grande para rodear la isla
        const geometry = new THREE.PlaneGeometry(width, depth);
        const material = new THREE.MeshStandardMaterial({
            color: 0x4682B4,
            transparent: true,
            opacity: 0.7,
            roughness: 0.1,
            metalness: 0.8
        });
        const water = new THREE.Mesh(geometry, material);
        water.rotation.x = -Math.PI / 2;
        water.position.set(x, 0.5, z);
        water.receiveShadow = true;
        this.scene.add(water);

        // Animación de agua (opcional)
        this.animateWater(water);
    }

    animateWater(waterMesh) {
        const animate = () => {
            waterMesh.material.opacity = 0.6 + Math.sin(Date.now() * 0.001) * 0.1;
            requestAnimationFrame(animate);
        };
        animate();
    }

    getZones() {
        return this.zones;
    }

    getInteractableSigns() {
        return this.interactableSigns;
    }
}
