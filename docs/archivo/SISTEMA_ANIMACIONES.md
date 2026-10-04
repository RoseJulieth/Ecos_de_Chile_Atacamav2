# 🎬 Sistema de Animaciones - Documentación Técnica

## Resumen Ejecutivo

El sistema de animaciones está **completamente implementado** y funcional. Utiliza el modelo `Male_Casual.fbx` con detección automática de animaciones por palabras clave.

---

## 📁 Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                            │
│  - Carga el modelo FBX                                       │
│  - Configura escala, posición, materiales                    │
│  - Detecta animaciones automáticamente                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   js/AssetLoader.js                          │
│  - FBXLoader integrado                                       │
│  - Carga modelos con animaciones                             │
│  - Configura sombras automáticamente                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│               js/AnimationController.js                      │
│  - Gestiona AnimationMixer de Three.js                       │
│  - Búsqueda de animaciones por keywords                      │
│  - Transiciones suaves (crossfade)                           │
│  - Método playByKeyword() para detección automática          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                     js/Player.js                             │
│  - Lógica de movimiento                                      │
│  - Detección de estado (idle, walk, run, jump)               │
│  - Llamadas a animaciones según estado                       │
│  - Método updateAnimation()                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Animaciones

### 1. Carga del Modelo (index.html)

```javascript
async function loadPlayerModel() {
    // 1. Cargar FBX
    const playerFBX = await assetLoader.loadFBX(
        'assets/models/player/Male_Casual.fbx',
        'player'
    );

    // 2. Configurar modelo
    player.mesh = playerFBX;
    player.mesh.scale.set(0.01, 0.01, 0.01);

    // 3. Mejorar materiales
    player.mesh.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.material.side = THREE.DoubleSide;
            child.material.emissive = new THREE.Color(0x222222);
        }
    });

    // 4. Configurar animaciones
    if (playerFBX.animations && playerFBX.animations.length > 0) {
        const animController = new AnimationController(
            player.mesh,
            playerFBX.animations
        );
        player.setAnimationController(animController);

        // 5. Detectar animaciones por keywords
        const findAnimation = (keywords) => {
            return playerFBX.animations.find(anim =>
                keywords.some(keyword =>
                    anim.name.toLowerCase().includes(keyword.toLowerCase())
                )
            );
        };

        const idleAnim = findAnimation(['idle', 'standing', 'breathe']);
        const walkAnim = findAnimation(['walk', 'walking']);
        const runAnim = findAnimation(['run', 'running', 'jog']);
        const jumpAnim = findAnimation(['jump', 'jumping', 'leap']);

        // 6. Iniciar animación idle
        if (idleAnim) {
            animController.play(idleAnim.name);
        }
    }
}
```

### 2. Control de Animaciones (AnimationController.js)

```javascript
export class AnimationController {
    constructor(model, animations) {
        this.mixer = new THREE.AnimationMixer(model);
        this.actions = new Map();
        
        // Crear acciones para cada animación
        animations.forEach(clip => {
            const action = this.mixer.clipAction(clip);
            this.actions.set(clip.name.toLowerCase(), action);
        });
    }

    // Reproducir por nombre exacto
    play(animationName, options = {}) {
        const action = this.actions.get(animationName.toLowerCase());
        if (!action) return false;

        // Transición suave desde animación anterior
        if (this.previousAction && this.previousAction !== action) {
            action.crossFadeFrom(this.previousAction, 0.3, true);
        }

        action.play();
        return true;
    }

    // Reproducir por palabra clave (NUEVO)
    playByKeyword(keyword, options = {}) {
        // Buscar animación que contenga la keyword
        for (const [name, action] of this.actions) {
            if (name.includes(keyword.toLowerCase())) {
                // Transición suave
                if (this.previousAction && this.previousAction !== action) {
                    action.crossFadeFrom(this.previousAction, 0.3, true);
                }
                action.play();
                return true;
            }
        }
        return false;
    }

    // Actualizar mixer (llamar cada frame)
    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
}
```

### 3. Lógica de Estado (Player.js)

```javascript
export class Player {
    update(keys, cameraAngle, delta, ground, canMove = true) {
        // ... lógica de movimiento ...

        // Determinar estado
        this.isMoving = direction.length() > 0;
        this.isSprinting = keys.shift;
        this.isJumping = !this.isGrounded;

        // Actualizar animaciones
        this.updateAnimation(delta);
    }

    updateAnimation(delta) {
        if (!this.animationController) return;

        let targetAnimation = 'idle';

        // Determinar animación según estado
        if (this.isJumping || !this.isGrounded) {
            targetAnimation = 'jump';
        } else if (this.isMoving) {
            targetAnimation = this.isSprinting ? 'run' : 'walk';
        }

        // Cambiar animación si es diferente
        if (targetAnimation !== this.currentAnimation) {
            this.currentAnimation = targetAnimation;
            this.animationController.playByKeyword(targetAnimation);
        }

        // Actualizar mixer
        this.animationController.update(delta);
    }
}
```

---

## 🎯 Mapeo de Estados a Animaciones

| Estado del Jugador | Condiciones | Animación Buscada | Keywords |
|-------------------|-------------|-------------------|----------|
| **Idle** | No se mueve + En el suelo | `idle` | idle, standing, breathe |
| **Walk** | Se mueve + No sprint + En el suelo | `walk` | walk, walking |
| **Run** | Se mueve + Shift presionado + En el suelo | `run` | run, running, jog |
| **Jump** | En el aire (no grounded) | `jump` | jump, jumping, leap |

---

## 🔑 Sistema de Keywords

El sistema busca animaciones de forma flexible usando palabras clave:

```javascript
// Ejemplo: Si el modelo tiene una animación llamada "Walking Forward"
// El sistema la encontrará buscando "walk"

playByKeyword('walk')
  ↓
Busca en todas las animaciones
  ↓
Encuentra "Walking Forward" (contiene "walk")
  ↓
Reproduce esa animación
```

### Keywords Soportadas

```javascript
// IDLE
['idle', 'standing', 'breathe']
// Encuentra: "Idle", "Standing Idle", "Breathing Idle", etc.

// WALK
['walk', 'walking']
// Encuentra: "Walking", "Walk Forward", "Standard Walk", etc.

// RUN
['run', 'running', 'jog']
// Encuentra: "Running", "Fast Run", "Sprint", "Jogging", etc.

// JUMP
['jump', 'jumping', 'leap']
// Encuentra: "Jumping", "Jump Up", "Standing Jump", etc.
```

---

## ⚙️ Configuración de Transiciones

### Crossfade (Transición Suave)

```javascript
// Tiempo de transición: 0.3 segundos
action.crossFadeFrom(this.previousAction, 0.3, true);
```

**Efecto**: Las animaciones se mezclan suavemente en lugar de cambiar bruscamente.

### Loop Mode

```javascript
// Todas las animaciones en loop por defecto
action.setLoop(THREE.LoopRepeat);
```

### Time Scale

```javascript
// Velocidad normal (1.0)
action.timeScale = 1;

// Más rápido (1.5)
action.timeScale = 1.5;

// Más lento (0.5)
action.timeScale = 0.5;
```

---

## 🎮 Integración con Controles

### Teclas → Estado → Animación

```
WASD/Flechas presionadas
  ↓
isMoving = true
  ↓
updateAnimation()
  ↓
targetAnimation = 'walk'
  ↓
playByKeyword('walk')
  ↓
Animación de caminar se reproduce
```

```
Shift presionado + WASD
  ↓
isMoving = true, isSprinting = true
  ↓
updateAnimation()
  ↓
targetAnimation = 'run'
  ↓
playByKeyword('run')
  ↓
Animación de correr se reproduce
```

```
Espacio presionado
  ↓
velocity.y = jumpForce
  ↓
isGrounded = false
  ↓
updateAnimation()
  ↓
targetAnimation = 'jump'
  ↓
playByKeyword('jump')
  ↓
Animación de salto se reproduce
```

---

## 🐛 Debug y Verificación

### Consola del Navegador

Al cargar el modelo, verás:

```
🎮 Cargando modelo del jugador (FBX)...
✅ Modelo FBX cargado, configurando...
Configurando mesh: [nombre]
  - Tiene textura
✅ 10 animaciones encontradas:
   1. Idle (duración: 2.50s)
   2. Walking (duración: 1.33s)
   3. Running (duración: 0.83s)
   4. Jumping (duración: 1.00s)
   ...
🎬 Animaciones detectadas:
   ✅ Idle: Idle
   ✅ Walk: Walking
   ✅ Run: Running
   ✅ Jump: Jumping
✅ Animación idle iniciada
✅ Modelo agregado a la escena
🔴 Esfera de debug agregada (roja, wireframe)
```

### Comandos de Debug

```javascript
// Ver animaciones disponibles
player.animationController.actions.forEach((action, name) => {
    console.log(name, action.isRunning());
});

// Ver animación actual
console.log(player.currentAnimation);

// Cambiar animación manualmente
player.animationController.playByKeyword('run');

// Ver estado del jugador
console.log({
    isMoving: player.isMoving,
    isSprinting: player.isSprinting,
    isJumping: player.isJumping,
    isGrounded: player.isGrounded
});
```

---

## 📊 Rendimiento

### Optimizaciones Implementadas

1. **Cambio de animación solo cuando es necesario**
   ```javascript
   if (targetAnimation !== this.currentAnimation) {
       // Solo cambiar si es diferente
   }
   ```

2. **Mixer único por modelo**
   - Un solo AnimationMixer para todas las animaciones
   - Reutilización de acciones

3. **Transiciones suaves**
   - Crossfade en lugar de cambios bruscos
   - Mejor experiencia visual con mínimo costo

### Métricas Esperadas

- **FPS**: 60 (sin impacto significativo)
- **Memoria**: +2-5 MB por modelo animado
- **CPU**: Mínimo (AnimationMixer es eficiente)

---

## 🔧 Personalización

### Agregar Nuevas Animaciones

1. **Agregar keyword al sistema**:
   ```javascript
   // En index.html, función loadPlayerModel()
   const attackAnim = findAnimation(['attack', 'punch', 'hit']);
   ```

2. **Agregar estado en Player.js**:
   ```javascript
   if (keys.f && this.isGrounded) {
       targetAnimation = 'attack';
   }
   ```

3. **Agregar keyword en AnimationController.js** (opcional):
   ```javascript
   // Ya funciona automáticamente con playByKeyword()
   ```

### Ajustar Velocidad de Animación

```javascript
// En AnimationController.js, método play()
play(animationName, options = {}) {
    const { timeScale = 1 } = options;
    action.timeScale = timeScale;
}

// Uso:
animController.play('walk', { timeScale: 1.5 }); // 50% más rápido
```

### Cambiar Tiempo de Transición

```javascript
// En AnimationController.js
const fadeTime = 0.3; // Cambiar este valor

// Más rápido: 0.1
// Más lento: 0.5
```

---

## ✅ Checklist de Implementación

- [x] FBXLoader integrado en AssetLoader.js
- [x] AnimationController con sistema de keywords
- [x] Player.js con lógica de estados
- [x] Detección automática de animaciones
- [x] Transiciones suaves (crossfade)
- [x] Integración con controles (WASD, Shift, Espacio)
- [x] Debug con esfera roja
- [x] Configuración de materiales para visibilidad
- [x] Sistema de logging detallado
- [x] Test page para pruebas aisladas

---

## 🚀 Próximas Mejoras (Opcional)

1. **Animaciones de Interacción**
   - Recoger objetos
   - Hablar con NPCs
   - Abrir inventario

2. **Animaciones de Transición**
   - Idle → Walk (más suave)
   - Walk → Run (aceleración)
   - Jump → Land (aterrizaje)

3. **Animaciones Procedurales**
   - Inclinación al girar
   - Balanceo al caminar
   - Respiración en idle

4. **Sistema de Blend Trees**
   - Mezcla de animaciones según velocidad
   - Transiciones más naturales

---

## 📚 Referencias

- **Three.js AnimationMixer**: https://threejs.org/docs/#api/en/animation/AnimationMixer
- **FBXLoader**: https://threejs.org/docs/#examples/en/loaders/FBXLoader
- **Mixamo**: https://www.mixamo.com/ (fuente de animaciones)

---

**Estado**: ✅ Sistema completamente funcional
**Última actualización**: Implementación completa con detección automática de animaciones
