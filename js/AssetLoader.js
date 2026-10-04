import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export class AssetLoader {
    constructor() {
        this.gltfLoader = new GLTFLoader();
        this.gltfLoader.setMeshoptDecoder(MeshoptDecoder); // modelos comprimidos con Meshopt
        this.objLoader = new OBJLoader();
        this.fbxLoader = new FBXLoader();
        this.textureLoader = new THREE.TextureLoader();
        this.loadedAssets = new Map();
    }

    /**
     * Cargar modelo GLTF/GLB con animaciones
     */
    async loadGLTF(path, name) {
        return new Promise((resolve, reject) => {
            // Codificar la ruta para manejar espacios y caracteres especiales
            const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');

            console.log(`⏳ Intentando cargar: ${path}`);
            if (path !== encodedPath) {
                console.log(`   Ruta codificada: ${encodedPath}`);
            }

            this.gltfLoader.load(
                encodedPath,
                (gltf) => {
                    console.log(`✅ Modelo GLTF cargado: ${name}`);

                    // Verificar texturas
                    let textureCount = 0;
                    gltf.scene.traverse((child) => {
                        if (child.isMesh && child.material && child.material.map) {
                            textureCount++;
                        }
                    });

                    if (textureCount > 0) {
                        console.log(`   📸 ${textureCount} textura(s) encontrada(s)`);
                    } else {
                        console.log(`   ⚠️ Sin texturas embebidas`);
                    }

                    this.loadedAssets.set(name, gltf);
                    resolve(gltf);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total * 100).toFixed(2);
                        console.log(`   ${percent}% - ${name}`);
                    }
                },
                (error) => {
                    console.error(`❌ Error cargando ${name}:`, error);
                    console.error(`   Ruta intentada: ${encodedPath}`);
                    reject(error);
                }
            );
        });
    }

    /**
     * Cargar modelo FBX con animaciones
     */
    async loadFBX(path, name) {
        return new Promise((resolve, reject) => {
            // Codificar la ruta para manejar espacios y caracteres especiales
            const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/');

            console.log(`⏳ Intentando cargar FBX: ${path}`);

            this.fbxLoader.load(
                encodedPath,
                (fbx) => {
                    console.log(`✅ Modelo FBX cargado: ${name}`);

                    // Configurar sombras y verificar texturas
                    let textureCount = 0;
                    fbx.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;

                            if (child.material && child.material.map) {
                                textureCount++;
                            }
                        }
                    });

                    if (textureCount > 0) {
                        console.log(`   📸 ${textureCount} textura(s) encontrada(s)`);
                    }

                    this.loadedAssets.set(name, fbx);
                    resolve(fbx);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percent = (progress.loaded / progress.total * 100).toFixed(2);
                        console.log(`   ${percent}% - ${name}`);
                    }
                },
                (error) => {
                    console.error(`❌ Error cargando ${name}:`, error);
                    console.error(`   Ruta intentada: ${encodedPath}`);
                    reject(error);
                }
            );
        });
    }

    /**
     * Cargar modelo OBJ
     */
    async loadOBJ(path, name, materialOptions = {}) {
        return new Promise((resolve, reject) => {
            this.objLoader.load(
                path,
                (obj) => {
                    // Aplicar material Toon para cel-shading
                    obj.traverse((child) => {
                        if (child.isMesh) {
                            child.material = new THREE.MeshToonMaterial({
                                color: materialOptions.color || 0xffffff,
                                ...materialOptions
                            });
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    console.log(`✅ Modelo OBJ cargado: ${name}`);
                    this.loadedAssets.set(name, obj);
                    resolve(obj);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    console.log(`⏳ Cargando ${name}: ${percent}%`);
                },
                (error) => {
                    console.error(`❌ Error cargando ${name}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Cargar textura
     */
    async loadTexture(path, name) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    console.log(`✅ Textura cargada: ${name}`);
                    this.loadedAssets.set(name, texture);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    console.error(`❌ Error cargando textura ${name}:`, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Obtener asset cargado
     */
    getAsset(name) {
        return this.loadedAssets.get(name);
    }

    /**
     * Crear modelo placeholder si no se puede cargar el real
     */
    createPlaceholder(type, options = {}) {
        let geometry, material;

        switch (type) {
            case 'player':
                geometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
                material = new THREE.MeshToonMaterial({
                    color: options.color || 0x00ff88
                });
                break;

            case 'npc':
                geometry = new THREE.CapsuleGeometry(0.4, 1.4, 4, 8);
                material = new THREE.MeshToonMaterial({
                    color: options.color || 0xffaa00
                });
                break;

            case 'fragment':
                geometry = new THREE.OctahedronGeometry(0.6, 0);
                material = new THREE.MeshToonMaterial({
                    color: options.color || 0xFFD700,
                    emissive: options.color || 0xFFD700,
                    emissiveIntensity: 0.4
                });
                break;

            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
                material = new THREE.MeshToonMaterial({ color: 0xff00ff });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return mesh;
    }
}
