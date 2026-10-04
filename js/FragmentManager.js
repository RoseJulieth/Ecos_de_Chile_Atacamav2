import * as THREE from 'three';

export class FragmentManager {
    constructor(scene, inventory, assetLoader = null) {
        this.scene = scene;
        this.inventory = inventory;
        this.assetLoader = assetLoader;
        this.fragments = [];
        this.fragmentsData = [
            {
                id: 1,
                name: "Cultura Diaguita",
                icon: "🏺",
                color: 0xFFD700,
                x: 15, z: 15,
                modelPath: 'assets/models/fragments/Trophy.glb',  // ✅ Trophy para cultura
                modelScale: 1.2,
                info: "Pueblo originario (1000-1540 d.C). Famosos por su cerámica 'jarro-pato'.",
                period: "1000-1540 d.C",
                origin: "Valle de Copiapó, Región de Atacama",
                belongedTo: "Pueblo Diaguita",
                description: "Los Diaguitas fueron maestros alfareros que habitaron los valles de Atacama. Sus jarros-pato son considerados obras maestras de la cerámica precolombina, combinando funcionalidad con representaciones artísticas de aves acuáticas.",
                fact: "Sus jarros-pato combinaban funcionalidad con arte, representando patos que nadaban en el agua."
            },
            {
                id: 2,
                name: "Batallón Atacama",
                icon: "⚔️",
                color: 0x8B0000,
                x: -20, z: 20,
                modelPath: 'assets/models/fragments/Dagger.glb',  // ✅ Dagger para batallón
                modelScale: 0.9,
                info: "Unidad militar de 1879, conocidos como 'Los Curitas' por sus uniformes negros.",
                period: "1879 - Guerra del Pacífico",
                origin: "Copiapó, Región de Atacama",
                belongedTo: "Ejército de Chile",
                description: "El Batallón Atacama fue una unidad militar legendaria durante la Guerra del Pacífico. Apodados 'Los Curitas' por sus uniformes negros, demostraron un valor inquebrantable en la Batalla de Tacna el 26 de mayo de 1880.",
                fact: "Participaron heroicamente en la Batalla de Tacna, siendo reconocidos por su valentía."
            },
            {
                id: 3,
                name: "Desierto Florido",
                icon: "🌸",
                color: 0xFF69B4,
                x: 25, z: -25,
                modelPath: 'assets/models/fragments/Simple_red_flower.glb',  // ✅ Flor roja para desierto florido
                modelScale: 0.8,
                info: "Fenómeno único donde semillas latentes florecen tras lluvias inusuales.",
                period: "Fenómeno Natural Cíclico",
                origin: "Desierto de Atacama",
                belongedTo: "Patrimonio Natural de Chile",
                description: "El Desierto Florido es uno de los fenómenos naturales más espectaculares del planeta. Semillas que permanecen latentes durante décadas germinan simultáneamente cuando las lluvias del fenómeno de El Niño llegan al desierto más árido del mundo.",
                fact: "Ocurre cada 5-7 años cuando El Niño trae lluvias al desierto más árido del mundo."
            },
            {
                id: 4,
                name: "Plata Chañarcillo",
                icon: "💎",
                color: 0xC0C0C0,
                x: -25, z: -15,
                modelPath: 'assets/models/fragments/Coin.glb',  // ✅ Moneda para plata
                modelScale: 1.4,
                info: "Descubierto en 1832, convirtió a Copiapó en capital minera.",
                period: "1832-1875",
                origin: "Mina de Chañarcillo, Copiapó",
                belongedTo: "Mineros de Atacama",
                description: "El descubrimiento de plata en Chañarcillo por Juan Godoy en 1832 transformó a Copiapó de un pueblo polvoriento en la capital minera de Chile. La riqueza generada financió el primer ferrocarril de Sudamérica y modernizó toda la región.",
                fact: "El descubrimiento fue realizado por Juan Godoy, un arriero que cambió la historia de Chile."
            },
            {
                id: 5,
                name: "Bahía Inglesa",
                icon: "🏖️",
                color: 0x1E90FF,
                x: 0, z: -35,
                modelPath: 'assets/models/fragments/Seashell.glb',  // ✅ Concha marina para bahía
                modelScale: 0.8,
                info: "Puerto histórico. Nombrado por la visita del corsario Edward Davis en 1687.",
                period: "Siglo XVII - Actualidad",
                origin: "Bahía Inglesa, Caldera",
                belongedTo: "Pescadores Changos y Corsarios",
                description: "Bahía Inglesa recibió su nombre en 1687 cuando el corsario inglés Edward Davis ancló aquí. Antes, los changos (pescadores indígenas) ya conocían estas aguas. Hoy es famosa por sus playas de arena blanca y aguas turquesas.",
                fact: "Sus aguas turquesas y arena blanca la convierten en una de las playas más hermosas de Chile."
            }
        ];
    }

    async createFragments() {
        console.log('🏺 Cargando fragmentos históricos...');

        for (const data of this.fragmentsData) {
            let mesh;

            // Intentar cargar modelo GLB
            if (data.modelPath && this.assetLoader) {
                try {
                    console.log(`⏳ Cargando modelo: ${data.modelPath}`);
                    const gltf = await this.assetLoader.loadGLTF(
                        data.modelPath,
                        `fragment_${data.id}`
                    );

                    mesh = gltf.scene;

                    // Ajustar escala
                    const scale = data.modelScale || 0.6;
                    mesh.scale.set(scale, scale, scale);

                    // Configurar materiales preservando texturas
                    mesh.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            // Preservar material original si tiene textura
                            if (child.material) {
                                const hasTexture = child.material.map !== null;

                                if (hasTexture) {
                                    // Mantener textura pero agregar tint y emisión
                                    console.log(`  ✅ Preservando textura de ${child.name}`);
                                    child.material.emissive = new THREE.Color(data.color);
                                    child.material.emissiveIntensity = 0.2;
                                    child.material.needsUpdate = true;
                                } else {
                                    // Sin textura, aplicar color sólido
                                    child.material = new THREE.MeshToonMaterial({
                                        color: data.color,
                                        emissive: data.color,
                                        emissiveIntensity: 0.4
                                    });
                                }
                            }
                        }
                    });

                    console.log(`✅ Modelo cargado: ${data.name}`);
                } catch (error) {
                    console.warn(`⚠️ No se pudo cargar ${data.modelPath}, usando placeholder`);
                    mesh = this.createPlaceholder(data.color);
                }
            } else {
                // Usar placeholder si no hay modelo
                mesh = this.createPlaceholder(data.color);
            }

            // Posicionar fragmento
            mesh.position.set(data.x, 2, data.z);

            // Agregar datos de usuario
            mesh.userData = {
                ...data,
                collected: false,
                type: 'fragment',
                interactable: true
            };

            // Crear efecto de brillo (glow)
            const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: data.color,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glow);

            this.scene.add(mesh);
            this.fragments.push(mesh);

            // Verificar si ya fue recolectado
            if (this.inventory.hasFragment(data.id)) {
                mesh.visible = false;
                mesh.userData.collected = true;
            }
        }

        console.log(`✅ ${this.fragments.length} fragmentos creados`);
    }

    createPlaceholder(color) {
        const geometry = new THREE.OctahedronGeometry(0.6, 0);
        const material = new THREE.MeshToonMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        return mesh;
    }

    update(playerPosition, onCollect) {
        this.fragments.forEach(fragment => {
            if (fragment.userData.collected || !fragment.visible) return;

            // Animaciones
            fragment.rotation.y += 0.02;
            fragment.position.y = 2 + Math.sin(Date.now() * 0.003) * 0.3;

            // Ya no recolectamos automáticamente, solo actualizamos animaciones
            // La recolección se hace con la tecla E a través del InteractionSystem
        });
    }

    collectFragment(fragment, callback) {
        fragment.userData.collected = true;
        fragment.visible = false;

        const success = this.inventory.addFragment(fragment.userData);
        if (success && callback) {
            callback(fragment.userData);
        }
    }

    getFragmentsData() {
        return this.fragmentsData;
    }

    getCollectedCount() {
        return this.fragments.filter(f => f.userData.collected).length;
    }
}
