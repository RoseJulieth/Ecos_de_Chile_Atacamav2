import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.angle = 0;

        // 🎥 AJUSTES DE CÁMARA TERCERA PERSONA
        // Configuración para personajes con escala 2.5-3.0 (más grandes)
        this.verticalAngle = 0.4;  // Ángulo ligeramente más bajo
        this.distance = 15;  // Distancia aumentada para personajes más grandes
        this.sensitivity = 0.002;  // Sensibilidad balanceada
        this.minVerticalAngle = 0.1;  // Límite inferior
        this.maxVerticalAngle = 1.4;  // Límite superior

        this.raycaster = new THREE.Raycaster();

        // Capturar mouse
        domElement.addEventListener('click', () => {
            domElement.requestPointerLock();
        });

        document.addEventListener('pointerlockchange', () => {
            if (document.pointerLockElement === domElement) {
                document.addEventListener('mousemove', this.onMouseMove.bind(this));
            } else {
                document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            }
        });
    }

    onMouseMove(event) {
        this.angle -= event.movementX * this.sensitivity;
        this.verticalAngle -= event.movementY * this.sensitivity;
        this.verticalAngle = Math.max(this.minVerticalAngle, Math.min(this.maxVerticalAngle, this.verticalAngle));
    }

    update(targetPosition, obstacles = []) {
        // 🎥 PUNTO DE ENFOQUE EN EL JUGADOR
        // Con jugador escala 2.5, apuntar al centro del personaje
        const targetHeight = 2.0;  // Altura del centro del jugador (ajustado para escala 2.5)
        const elevatedTarget = new THREE.Vector3(
            targetPosition.x,
            targetPosition.y + targetHeight,
            targetPosition.z
        );

        const horizontalDist = this.distance * Math.cos(this.verticalAngle);
        const verticalDist = this.distance * Math.sin(this.verticalAngle);

        const camX = elevatedTarget.x + Math.sin(this.angle) * horizontalDist;
        const camZ = elevatedTarget.z + Math.cos(this.angle) * horizontalDist;
        const camY = elevatedTarget.y + verticalDist;

        const desiredPosition = new THREE.Vector3(camX, camY, camZ);

        // Raycast para evitar atravesar geometría
        this.raycaster.set(elevatedTarget, desiredPosition.clone().sub(elevatedTarget).normalize());
        const intersects = this.raycaster.intersectObjects(obstacles);

        if (intersects.length > 0 && intersects[0].distance < this.distance) {
            const safeDistance = intersects[0].distance - 0.5;
            const ratio = safeDistance / this.distance;
            this.camera.position.lerpVectors(elevatedTarget, desiredPosition, Math.max(0.1, ratio));
        } else {
            this.camera.position.copy(desiredPosition);
        }

        // Mirar al centro del jugador
        this.camera.lookAt(elevatedTarget);
    }

    getAngle() {
        return this.angle;
    }
}
