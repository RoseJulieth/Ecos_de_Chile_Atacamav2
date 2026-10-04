import * as THREE from 'three';

export class AnimationController {
    constructor(model, animations) {
        this.model = model;
        this.mixer = null;
        this.actions = new Map();
        this.currentAction = null;
        this.previousAction = null;

        if (animations && animations.length > 0) {
            this.setupAnimations(animations);
        }
    }

    setupAnimations(animations) {
        this.mixer = new THREE.AnimationMixer(this.model);

        animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name.toLowerCase(), action);
        });

        console.log(`✅ Animaciones configuradas: ${Array.from(this.actions.keys()).join(', ')}`);
    }

    /**
     * Reproducir animación con transición suave
     */
    play(animationName, options = {}) {
        const {
            loop = THREE.LoopRepeat,
            fadeTime = 0.3,
            timeScale = 1
        } = options;

        const action = this.actions.get(animationName.toLowerCase());

        if (!action) {
            console.warn(`⚠️ Animación no encontrada: ${animationName}`);
            return false;
        }

        if (this.currentAction === action) {
            return true; // Ya está reproduciendo esta animación
        }

        this.previousAction = this.currentAction;
        this.currentAction = action;

        // Configurar nueva animación
        action.reset();
        action.setLoop(loop);
        action.timeScale = timeScale;
        action.enabled = true;

        // Transición suave
        if (this.previousAction && this.previousAction !== action) {
            action.crossFadeFrom(this.previousAction, fadeTime, true);
        }

        action.play();
        return true;
    }

    /**
     * Buscar y reproducir animación por palabra clave
     * Excluye automáticamente animaciones de combate/armas
     */
    playByKeyword(keyword, options = {}) {
        const {
            loop = THREE.LoopRepeat,
            fadeTime = 0.3,
            timeScale = 1.0
        } = options;

        // 🎬 LISTA DE EXCLUSIÓN: Animaciones de combate/armas
        const excludeKeywords = ['gun', 'shoot', 'shot', 'fire', 'aim', 'reload', 'weapon', 'attack', 'punch', 'kick', 'sword', 'rifle'];

        // Primero intentar nombre exacto
        if (this.play(keyword, options)) {
            return true;
        }

        // Buscar por palabra clave en los nombres (excluyendo combate)
        const keywordLower = keyword.toLowerCase();
        for (const [name, action] of this.actions) {
            // ✅ Verificar que NO sea una animación de combate
            const isCombatAnim = excludeKeywords.some(exclude =>
                name.includes(exclude.toLowerCase())
            );

            if (isCombatAnim) {
                continue; // Saltar animaciones de combate
            }

            // ✅ Buscar por palabra clave
            if (name.includes(keywordLower)) {
                console.log(`🎬 Usando animación: ${name} para "${keyword}" (velocidad: ${timeScale}x)`);

                if (this.currentAction === action) {
                    // Actualizar timeScale si cambió
                    if (action.timeScale !== timeScale) {
                        action.timeScale = timeScale;
                    }
                    return true;
                }

                this.previousAction = this.currentAction;
                this.currentAction = action;

                action.reset();
                action.setLoop(loop);
                action.timeScale = timeScale;
                action.enabled = true;

                if (this.previousAction && this.previousAction !== action) {
                    action.crossFadeFrom(this.previousAction, fadeTime, true);
                }

                action.play();
                return true;
            }
        }

        return false;
    }

    /**
     * Detener animación actual
     */
    stop() {
        if (this.currentAction) {
            this.currentAction.fadeOut(0.3);
            this.currentAction = null;
        }
    }

    /**
     * Actualizar mixer (llamar en el game loop)
     */
    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }

    /**
     * Obtener estado de animación
     */
    isPlaying(animationName) {
        const action = this.actions.get(animationName.toLowerCase());
        return action && action.isRunning();
    }

    /**
     * Crear animaciones procedurales simples si no hay modelo
     */
    createProceduralAnimation(type) {
        switch (type) {
            case 'idle':
                return this.createIdleAnimation();
            case 'walk':
                return this.createWalkAnimation();
            case 'run':
                return this.createRunAnimation();
            case 'jump':
                return this.createJumpAnimation();
        }
    }

    createIdleAnimation() {
        // Animación de respiración sutil
        return {
            update: (mesh, time) => {
                mesh.position.y += Math.sin(time * 2) * 0.002;
            }
        };
    }

    createWalkAnimation() {
        return {
            update: (mesh, time) => {
                mesh.position.y += Math.sin(time * 8) * 0.01;
                mesh.rotation.z = Math.sin(time * 8) * 0.05;
            }
        };
    }

    createRunAnimation() {
        return {
            update: (mesh, time) => {
                mesh.position.y += Math.sin(time * 12) * 0.015;
                mesh.rotation.z = Math.sin(time * 12) * 0.08;
            }
        };
    }

    createJumpAnimation() {
        return {
            update: (mesh, progress) => {
                // Progress va de 0 a 1 durante el salto
                mesh.rotation.x = progress * Math.PI * 0.2;
            }
        };
    }
}
