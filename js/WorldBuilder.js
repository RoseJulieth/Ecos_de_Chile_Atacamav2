import * as THREE from 'three';

export class WorldBuilder {
    constructor(scene) {
        this.scene = scene;
        this.ground = null;
        this.rocks = []; // Array para almacenar rocas para colisiones
    }

    createTerrain() {
        // Terreno principal con zonas diferenciadas
        const groundSize = 200;
        const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);

        // Crear variaciones en el terreno
        const vertices = groundGeo.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            vertices[i + 2] = 0; // Terreno plano: coincide con el raycast del suelo
        }
        groundGeo.computeVertexNormals();

        // Cargar texturas PBR del terreno
        const textureLoader = new THREE.TextureLoader();
        const textureBasePath = 'assets/textures/terrain/';

        console.log('🏜️ Cargando texturas del terreno...');

        // Cargar todas las texturas
        const colorMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_Color.png');
        const normalMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_NormalGL.png');
        const roughnessMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_Roughness.png');
        const aoMap = textureLoader.load(textureBasePath + 'Ground079L_1K-PNG_AmbientOcclusion.png');

        // Configurar repetición de texturas para cubrir todo el terreno
        const repeatX = 20;
        const repeatY = 20;

        [colorMap, normalMap, roughnessMap, aoMap].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
        });

        // Crear material con texturas PBR
        const groundMat = new THREE.MeshStandardMaterial({
            map: colorMap,
            normalMap: normalMap,
            roughnessMap: roughnessMap,
            aoMap: aoMap,
            side: THREE.FrontSide
        });

        console.log('✅ Texturas del terreno cargadas');

        this.ground = new THREE.Mesh(groundGeo, groundMat);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        return this.ground;
    }

    createZones() {
        // Zona 1: Copiapó (Centro) - Tonos marrones
        this.createZoneMarker(0, 0, 0xA0522D, "Copiapó");

        // Zona 2: Desierto Florido (Norte) - Tonos rosados
        this.createZoneMarker(20, -20, 0xFF69B4, "Desierto Florido");
        this.addFlowers(20, -20);

        // Zona 3: Bahía Inglesa (Sur) - Tonos azules
        this.createZoneMarker(0, -35, 0x4682B4, "Bahía Inglesa");
        this.addWaterEffect(0, -35);
    }

    createZoneMarker(x, z, color, name) {
        const geometry = new THREE.CylinderGeometry(8, 8, 0.2, 32);
        const material = new THREE.MeshToonMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.set(x, 0.1, z);
        marker.receiveShadow = true;
        this.scene.add(marker);
    }

    addFlowers(centerX, centerZ) {
        // ============================================================
        // FLORES DECORATIVAS - ESCALA NORMALIZADA
        // ============================================================
        // Flores reales: 0.1 - 0.3 metros de alto
        // Con personajes de 1.7m, las flores deben verse pequeñas pero visibles
        // ============================================================
        for (let i = 0; i < 30; i++) {
            const x = centerX + (Math.random() - 0.5) * 15;
            const z = centerZ + (Math.random() - 0.5) * 15;

            // Tamaño aleatorio entre 0.1 y 0.3 unidades (10-30cm)
            const flowerHeight = 0.1 + Math.random() * 0.2;
            const flowerRadius = flowerHeight * 0.4;  // Proporción realista

            const flowerGeo = new THREE.ConeGeometry(flowerRadius, flowerHeight, 4);
            const flowerMat = new THREE.MeshToonMaterial({
                color: Math.random() > 0.5 ? 0xFF1493 : 0xFF69B4
            });
            const flower = new THREE.Mesh(flowerGeo, flowerMat);
            flower.position.set(x, 0.25, z);
            flower.castShadow = true;
            this.scene.add(flower);
        }
    }

    addWaterEffect(centerX, centerZ) {
        // Simular agua en Bahía Inglesa
        const waterGeo = new THREE.PlaneGeometry(15, 15);
        const waterMat = new THREE.MeshToonMaterial({
            color: 0x4682B4,
            transparent: true,
            opacity: 0.6
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.set(centerX, 0.15, centerZ);
        this.scene.add(water);
    }

    addRocks() {
        // ============================================================
        // ROCAS DECORATIVAS - ESCALA NORMALIZADA
        // ============================================================
        // Rocas reales: 0.3 - 1.5 metros de diámetro
        // Con personajes de 1.7m, las rocas deben verse como obstáculos naturales
        // Tamaño: 0.3 - 1.5 unidades (30cm - 1.5m)
        // ============================================================
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 180;
            const z = (Math.random() - 0.5) * 180;

            // Tamaño aleatorio entre 0.3 y 1.5 unidades (30cm - 1.5m)
            const rockSize = 0.3 + Math.random() * 1.2;

            const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);
            const rockMat = new THREE.MeshToonMaterial({ color: 0x8B7355 });
            const rock = new THREE.Mesh(rockGeo, rockMat);

            // Posicionar a ras de suelo (Y = mitad del tamaño)
            rock.position.set(x, rockSize * 0.5, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            rock.receiveShadow = true;

            // 🚧 MARCAR COMO OBSTÁCULO PARA COLISIONES
            rock.userData = {
                type: 'rock',
                radius: rockSize
            };

            this.scene.add(rock);
            this.rocks.push(rock); // Agregar a la lista de rocas
        }
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
        this.scene.add(ambientLight);

        // Sol: la sombra cubre solo el área alrededor del jugador (main.js la mueve con él)
        const sunLight = new THREE.DirectionalLight(0xFFFFFF, 2.0);
        sunLight.position.set(50, 100, 30);
        sunLight.castShadow = true;
        sunLight.shadow.camera.left = -40;
        sunLight.shadow.camera.right = 40;
        sunLight.shadow.camera.top = 40;
        sunLight.shadow.camera.bottom = -40;
        sunLight.shadow.camera.near = 10;
        sunLight.shadow.camera.far = 250;
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.bias = -0.0005;
        this.scene.add(sunLight);
        this.scene.add(sunLight.target);

        // Luz de relleno única (reemplaza fill + back + hemisférica anteriores)
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0xD2B48C, 0.7);
        this.scene.add(hemiLight);

        this.sunLight = sunLight;
        return sunLight;
    }

    getGround() {
        return this.ground;
    }
}

// ============================================================
// ✅ CHECKLIST DE VERIFICACIÓN DE ESCALAS
// ============================================================
//
// Después de recargar el juego, verifica:
//
// 1. PROPORCIONES VISUALES:
//    □ El jugador y los NPCs se ven a escala humana realista
//    □ Un NPC al lado del jugador tiene altura similar (~1.6-1.8 unidades)
//    □ Las rocas, flores y marcadores se ven proporcionales a los personajes
//    □ Las casas de Copiapó se ven como edificios reales (no miniaturas)
//
// 2. NAVEGACIÓN Y MOVIMIENTO:
//    □ Caminar desde el centro hasta un borde del mapa (100 unidades)
//      toma un tiempo razonable (~30-40 segundos caminando)
//    □ El salto tiene una altura visual correcta (~0.5-0.8 unidades)
//    □ La velocidad de carrera se siente natural (no muy lenta ni muy rápida)
//
// 3. SISTEMAS DE JUEGO:
//    □ El raycaster detecta el suelo correctamente (no flotan ni se hunden)
//    □ Los NPCs saludan cuando el jugador se acerca (distancia ~5 unidades)
//    □ Los indicadores sobre las cabezas están bien posicionados
//    □ Las animaciones se reproducen a velocidad normal
//
// 4. CÁMARA (ajustar en CameraController.js si es necesario):
//    □ Distancia recomendada: 8-12 unidades detrás del jugador
//    □ Altura recomendada: 3-5 unidades sobre el jugador
//    □ FOV recomendado: 60-75 grados
//
// 5. COMPARACIÓN CON REFERENCIAS:
//    □ El jugador ocupa ~0.85% del ancho del mapa (1.7/200 = 0.85%)
//    □ Esto es similar a un humano de 1.7m en un campo de 200m
//    □ La escala se siente como un juego de exploración (Zelda, Genshin Impact)
//
// ============================================================


// ============================================================
// ✅ CHECKLIST DE VERIFICACIÓN DE ESCALAS NORMALIZADAS
// ============================================================
//
// ESTÁNDAR APLICADO: 1 unidad = 1 metro
// ALTURA OBJETIVO: 1.7 unidades (altura humana promedio)
//
// Después de recargar el juego, verifica:
//
// 1. PROPORCIONES VISUALES:
//    □ El jugador mide ~1.7 unidades (verificar con bounding box)
//    □ Todos los NPCs miden ~1.6-1.9 unidades (normalización automática)
//    □ Un NPC al lado del jugador tiene altura similar
//    □ Las rocas miden 0.3-1.5 unidades (30cm-1.5m) - proporcionales
//    □ Las flores miden 0.1-0.3 unidades (10-30cm) - pequeñas pero visibles
//    □ Las casas de Copiapó se ven como edificios reales
//
// 2. NAVEGACIÓN Y MOVIMIENTO:
//    □ Caminar 100 unidades (100m) toma ~30-40 segundos
//    □ Correr 100 unidades toma ~15-20 segundos
//    □ El salto alcanza ~0.5-0.8 unidades de altura (50-80cm)
//    □ La velocidad se siente natural para un humano
//
// 3. SISTEMAS DE JUEGO:
//    □ El raycaster detecta el suelo correctamente (far = 3.0)
//    □ Los NPCs están en el suelo (no flotan ni se hunden)
//    □ Los indicadores están sobre las cabezas (altura relativa a modelHeight)
//    □ Las animaciones se reproducen a velocidad normal
//    □ La distancia de interacción (5 unidades) es visible y razonable
//
// 4. CÁMARA:
//    □ Distancia actual: 25 unidades (ajustada para personajes 1.7u)
//    □ Ángulo vertical: 0.6 rad (~34°)
//    □ FOV: 70° (vista amplia)
//    □ El jugador ocupa ~25% de la altura de pantalla
//
// 5. COMPARACIÓN CON REFERENCIAS:
//    □ Jugador/Terreno: 1.7/200 = 0.85% ✅ (humano en campo de 200m)
//    □ Roca grande: 1.5u = 88% de la altura del jugador ✅
//    □ Flor: 0.2u = 12% de la altura del jugador ✅
//    □ Escala similar a: Zelda BotW, Genshin Impact, Minecraft
//
// 6. PRUEBAS MANUALES:
//    □ Colocar jugador al lado de un NPC → alturas similares
//    □ Colocar jugador al lado de una roca → roca hasta la cintura/pecho
//    □ Colocar jugador al lado de una flor → flor hasta las rodillas
//    □ Caminar de un extremo al otro del mapa → tiempo razonable
//    □ Saltar → altura visual correcta (medio cuerpo)
//
// ============================================================
// 📊 VALORES DE REFERENCIA
// ============================================================
// Terreno: 200x200 unidades (200m x 200m)
// Jugador: 1.7 unidades (1.7m)
// NPCs: 1.6-1.9 unidades (normalización automática)
// Rocas: 0.3-1.5 unidades (30cm-1.5m)
// Flores: 0.1-0.3 unidades (10-30cm)
// Casas: Escala 2.0 (ajustar si es necesario)
// Velocidad caminar: 0.4 u/frame (~4 m/s)
// Velocidad correr: 0.8 u/frame (~8 m/s)
// Salto: 1.5 u de fuerza (~0.6u de altura)
// ============================================================
