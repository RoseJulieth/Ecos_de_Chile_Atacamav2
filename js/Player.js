import * as THREE from 'three';

const GRAVITY = 45;     // unidades/s²
const JUMP_SPEED = 15;  // unidades/s -> salto de ~2,5 unidades y ~0,65 s en el aire
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const PLAYER_RADIUS = 1.5;
const DEFAULT_OBSTACLE_RADIUS = 2.0;
const OBSTACLE_RADIUS = { rock: 3.0, house: 8.0, npc: 1.0, tree: 2.5 };

// ============================================================
// CONFIGURACIÓN DE ESCALA GLOBAL
// ============================================================
// Estándar Three.js: 1 unidad = 1 metro
// Altura humana promedio: 1.7 metros
// Terreno: 200x200 unidades (200m x 200m)
// 
// ESCALAS OBJETIVO:
// - Jugador FBX (Mixamo): 0.1 → altura final ~1.7 unidades
// - NPCs GLB: 2.5 → altura final ~1.6-1.8 unidades
// - NPCs FBX: 0.12 → altura final ~1.7 unidades
// ============================================================

export class Player {
    constructor(scene, assetLoader = null) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.velocity = new THREE.Vector3(0, 0, 0);

        // ⚙️ VELOCIDADES AJUSTADAS PARA MOVIMIENTO NATURAL
        // Velocidades reducidas para movimiento más realista
        this.speed = 0.15;              // Velocidad de caminar (antes: 0.4 - muy rápido)
        this.sprintMultiplier = 2.0;    // Multiplicador para correr (0.15 * 2 = 0.3)
        this.restY = 0;                 // altura del origen del modelo cuando pisa el suelo (la fija main.js)
        this.isGrounded = false;
        this.canJump = true;
        this.isMoving = false;
        this.isSprinting = false;
        this.isJumping = false;

        // Animación
        this.animationController = null;
        this.currentAnimation = 'idle';

        // 🔊 SISTEMA DE SONIDOS DE PASOS
        this.footstepTimer = 0;
        this.footstepInterval = 0.5; // Intervalo entre pasos (segundos)
        this.lastMovingState = false;

        // Crear mesh del jugador (placeholder o modelo cargado)
        this.createPlayerMesh();

        // ⚙️ RAYCASTER AJUSTADO A NUEVA ALTURA
        // Con altura ~1.7 unidades, necesitamos detectar suelo hasta ~2.5 unidades
    }

    createPlayerMesh() {
        // ============================================================
        // 📏 CREACIÓN DEL MESH DEL JUGADOR CON ESCALA NORMALIZADA
        // ============================================================
        // Estándar: 1 unidad = 1 metro
        // Altura objetivo: 1.7 unidades (altura humana promedio)
        // ============================================================

        if (this.assetLoader) {
            // Intentar cargar modelo GLTF
            this.mesh = this.assetLoader.createPlaceholder('player');
        } else {
            // 📏 PLACEHOLDER CON PROPORCIONES HUMANAS REALISTAS
            // CapsuleGeometry(radio, altura_cilindro, segmentos_radiales, segmentos_altura)
            // Altura total = radio_superior + altura_cilindro + radio_inferior
            // Altura total = 0.3 + 1.1 + 0.3 = 1.7 unidades ✅
            const radius = 0.3;        // Radio de la cápsula (ancho de hombros)
            const height = 1.1;        // Altura del cilindro central
            const geometry = new THREE.CapsuleGeometry(radius, height, 4, 8);
            const material = new THREE.MeshToonMaterial({ color: 0x00ff88 });
            this.mesh = new THREE.Mesh(geometry, material);

            console.log(`📏 Placeholder del jugador creado:`);
            console.log(`   Altura total: ${radius + height + radius} unidades (1.7m)`);
            console.log(`   Radio: ${radius} unidades (0.3m)`);
        }

        this.mesh.castShadow = true;
        this.mesh.position.set(0, 0, 0);  // Posición inicial en el suelo

        // ⚠️ IMPORTANTE: No aplicar escala adicional al placeholder
        // La geometría ya está en el tamaño correcto (1.7 unidades)
        // Si se carga un modelo FBX/GLB, la escala se aplica en index.html

        this.scene.add(this.mesh);
    }

    setAnimationController(controller) {
        this.animationController = controller;
    }

    // Colisión por distancia en el plano XZ contra obstáculos con radio por tipo
    collides(x, z, obstacles) {
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (!obstacle.visible) continue;

            const type = obstacle.userData && obstacle.userData.type;
            const minDist = PLAYER_RADIUS + (OBSTACLE_RADIUS[type] || DEFAULT_OBSTACLE_RADIUS);
            const dx = x - obstacle.position.x;
            const dz = z - obstacle.position.z;

            if (dx * dx + dz * dz < minDist * minDist) return true;
        }
        return false;
    }

    update(keys, cameraAngle, delta, ground, canMove = true, obstacles = []) {
        // Movimiento horizontal
        const direction = new THREE.Vector3();
        this.isSprinting = keys.shift;
        const currentSpeed = this.speed * (this.isSprinting ? this.sprintMultiplier : 1);

        // Controles duales: WASD y Flechas
        if (keys.w || keys.arrowup) direction.z -= 1;
        if (keys.s || keys.arrowdown) direction.z += 1;
        if (keys.a || keys.arrowleft) direction.x -= 1;
        if (keys.d || keys.arrowright) direction.x += 1;

        this.isMoving = direction.length() > 0;

        // Factor para que la velocidad sea igual en cualquier equipo (1 = 60 FPS)
        const frameScale = Math.min(delta, 0.05) * 60;

        if (this.isMoving && canMove) {
            direction.normalize();
            direction.applyAxisAngle(Y_AXIS, cameraAngle);

            const oldX = this.mesh.position.x;
            const oldZ = this.mesh.position.z;
            const step = currentSpeed * frameScale;

            // Límites del mapa (terreno 200x200, centrado en 0,0)
            const mapLimit = 95;
            const newX = Math.max(-mapLimit, Math.min(mapLimit, oldX + direction.x * step));
            const newZ = Math.max(-mapLimit, Math.min(mapLimit, oldZ + direction.z * step));

            // Colisión con deslizamiento: si el paso completo choca, se prueba cada eje por separado
            if (!this.collides(newX, newZ, obstacles)) {
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
            } else if (!this.collides(newX, oldZ, obstacles)) {
                this.mesh.position.x = newX;
            } else if (!this.collides(oldX, newZ, obstacles)) {
                this.mesh.position.z = newZ;
            }

            // Rotación suave hacia la dirección del movimiento (solo si se movió)
            if (this.mesh.position.x !== oldX || this.mesh.position.z !== oldZ) {
                const targetRotation = Math.atan2(direction.x, direction.z);
                let normalizedDiff = targetRotation - this.mesh.rotation.y;
                while (normalizedDiff > Math.PI) normalizedDiff -= Math.PI * 2;
                while (normalizedDiff < -Math.PI) normalizedDiff += Math.PI * 2;

                this.mesh.rotation.y += normalizedDiff * Math.min(1, 0.15 * frameScale);
            }
        }

        // 🔊 SISTEMA DE SONIDOS DE PASOS
        this.updateFootstepSounds(delta);

        // Salto y gravedad en unidades por segundo (iguales en cualquier equipo).
        // El terreno es plano: el suelo está a la altura de reposo del modelo (restY).
        const dt = Math.min(delta, 0.05);
        const restY = this.restY;
        this.isGrounded = this.mesh.position.y <= restY + 0.01;

        if (keys.space && this.isGrounded && this.canJump && canMove) {
            this.velocity.y = JUMP_SPEED;
            if (window.audioManager && !window.audioManager.isMuted) window.audioManager.play('jump');
            this.canJump = false;
            this.isJumping = true;
            this.isGrounded = false;
        }

        if (!keys.space) {
            this.canJump = true;
        }

        if (!this.isGrounded) {
            this.velocity.y -= GRAVITY * dt;
            this.mesh.position.y += this.velocity.y * dt;

            // Aterrizaje
            if (this.mesh.position.y <= restY) {
                this.mesh.position.y = restY;
                this.velocity.y = 0;
                this.isGrounded = true;
                this.isJumping = false;
            }
        } else {
            this.velocity.y = 0;
        }

        // Actualizar animaciones
        this.updateAnimation(delta);
    }

    updateAnimation(delta) {
        if (!this.animationController) return;

        let targetAnimation = 'idle';
        let animationSpeed = 1.0;

        // Determinar animación según estado
        if (this.isJumping || !this.isGrounded) {
            targetAnimation = 'jump';
            animationSpeed = 1.0;
        } else if (this.isMoving) {
            if (this.isSprinting) {
                targetAnimation = 'run';
                animationSpeed = 1.0;  // Velocidad normal para correr
            } else {
                targetAnimation = 'walk';
                animationSpeed = 1.0;  // Velocidad normal para caminar
            }
        }

        // Cambiar animación si es diferente
        if (targetAnimation !== this.currentAnimation) {
            this.currentAnimation = targetAnimation;

            // Intentar reproducir la animación con velocidad ajustada
            const success = this.animationController.playByKeyword(targetAnimation, {
                timeScale: animationSpeed
            });

            if (!success) {
                console.warn(`⚠️ Animación no encontrada: ${targetAnimation}`);
            }
        }

        this.animationController.update(delta);
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    saveState() {
        return {
            x: this.mesh.position.x,
            y: this.mesh.position.y,
            z: this.mesh.position.z
        };
    }

    loadState(state) {
        if (state) {
            this.setPosition(state.x, state.y, state.z);
        }
    }

    // 🔊 SISTEMA DE SONIDOS DE PASOS
    updateFootstepSounds(delta) {
        // Solo reproducir sonidos si el jugador se está moviendo y está en el suelo
        if (this.isMoving && this.isGrounded) {
            // Actualizar timer
            this.footstepTimer += delta;

            // Ajustar intervalo según velocidad (correr = pasos más rápidos)
            const currentInterval = this.isSprinting ? this.footstepInterval * 0.7 : this.footstepInterval;

            // Reproducir sonido de paso
            if (this.footstepTimer >= currentInterval) {
                this.playFootstepSound();
                this.footstepTimer = 0; // Resetear timer
            }
        } else {
            // Resetear timer cuando no se mueve
            this.footstepTimer = 0;
        }

        // Actualizar estado anterior
        this.lastMovingState = this.isMoving;
    }

    playFootstepSound() {
        // Reproducir sonido de pasos si el AudioManager está disponible
        if (window.audioManager) {
            window.audioManager.play('footstep_sand');
        }
    }
}
