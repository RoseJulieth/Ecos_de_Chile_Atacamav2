// Jugador: personaje procedural + movimiento, salto y colisiones contra los obstáculos de la escena.
import * as THREE from 'three';
import { createCharacter, LOOKS } from './Characters.js';

const WALK_SPEED = 7.5;       // unidades por segundo
const SPRINT_FACTOR = 1.9;
const PLAYER_RADIUS = 0.75;
const GRAVITY = 45;
const JUMP_SPEED = 15;        // salto de ~2,5 unidades

const Y_AXIS = new THREE.Vector3(0, 1, 0);

export class PlayerController {
    constructor(scene) {
        this.character = createCharacter(LOOKS.player);
        this.root = this.character.root;
        scene.add(this.root);

        this.velocityY = 0;
        this.isGrounded = true;
        this.isMoving = false;
        this.isSprinting = false;
        this.canJump = true;
        this.footstepTimer = 0;
        this.direction = new THREE.Vector3();
    }

    get position() { return this.root.position; }
    getPosition() { return this.root.position; }

    setPosition(x, y, z) {
        this.root.position.set(x, y, z);
        this.velocityY = 0;
    }

    /** Coloca al jugador mirando hacia `heading` = [dx, dz]. Devuelve el ángulo que debe tomar la cámara. */
    placeFacing(x, z, heading) {
        this.setPosition(x, 0, z);
        this.root.rotation.y = Math.atan2(heading[0], heading[1]);
        return Math.atan2(-heading[0], -heading[1]);
    }

    saveState() {
        return { x: this.root.position.x, z: this.root.position.z };
    }

    /**
     * @param keys teclas pulsadas
     * @param cameraAngle ángulo horizontal de la cámara
     * @param delta segundos
     * @param canMove false mientras hay un diálogo, el tutorial o una transición
     * @param colliders instancia de Colliders de la escena
     * @param limit radio jugable de la escena
     */
    update(keys, cameraAngle, delta, canMove, colliders, limit) {
        const dt = Math.min(delta, 0.05);
        const pos = this.root.position;

        // --- movimiento horizontal ---
        const dir = this.direction.set(0, 0, 0);
        if (keys.w || keys.arrowup) dir.z -= 1;
        if (keys.s || keys.arrowdown) dir.z += 1;
        if (keys.a || keys.arrowleft) dir.x -= 1;
        if (keys.d || keys.arrowright) dir.x += 1;

        this.isMoving = canMove && dir.lengthSq() > 0;
        this.isSprinting = this.isMoving && keys.shift;

        let moved = false;
        if (this.isMoving) {
            dir.normalize().applyAxisAngle(Y_AXIS, cameraAngle);
            const step = WALK_SPEED * (this.isSprinting ? SPRINT_FACTOR : 1) * dt;
            let nx = pos.x + dir.x * step;
            let nz = pos.z + dir.z * step;

            // borde circular del mapa
            const maxR = limit - 1.5;
            const r = Math.hypot(nx, nz);
            if (r > maxR) { nx *= maxR / r; nz *= maxR / r; }

            // colisión con deslizamiento: si el paso completo choca, se prueba cada eje por separado
            if (!colliders.hits(nx, nz, PLAYER_RADIUS)) {
                pos.x = nx; pos.z = nz; moved = true;
            } else if (!colliders.hits(nx, pos.z, PLAYER_RADIUS)) {
                pos.x = nx; moved = true;
            } else if (!colliders.hits(pos.x, nz, PLAYER_RADIUS)) {
                pos.z = nz; moved = true;
            }

            if (moved) {
                let diff = Math.atan2(dir.x, dir.z) - this.root.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.root.rotation.y += diff * Math.min(1, dt * 14);
            }
        }

        // --- salto y gravedad ---
        this.isGrounded = pos.y <= 0.01;
        if (keys.space && this.isGrounded && this.canJump && canMove) {
            this.velocityY = JUMP_SPEED;
            this.canJump = false;
            this.isGrounded = false;
            if (window.audioManager && !window.audioManager.isMuted) window.audioManager.play('jump');
        }
        if (!keys.space) this.canJump = true;

        if (!this.isGrounded) {
            this.velocityY -= GRAVITY * dt;
            pos.y += this.velocityY * dt;
            if (pos.y <= 0) { pos.y = 0; this.velocityY = 0; this.isGrounded = true; }
        } else {
            this.velocityY = 0;
        }

        // --- pasos y animación ---
        this.updateFootsteps(dt, moved);
        this.character.update(dt, {
            moving: moved,
            speed: this.isSprinting ? 2 : 1,
            airborne: !this.isGrounded
        });
    }

    updateFootsteps(dt, moved) {
        if (moved && this.isGrounded) {
            this.footstepTimer += dt;
            const interval = this.isSprinting ? 0.26 : 0.4;
            if (this.footstepTimer >= interval) {
                this.footstepTimer = 0;
                if (window.audioManager) window.audioManager.play('footstep_sand');
            }
        } else {
            this.footstepTimer = 0;
        }
    }
}
