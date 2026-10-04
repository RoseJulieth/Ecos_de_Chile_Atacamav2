# 🎥 Ajustes de Cámara Recomendados

## Contexto

Con los personajes ahora 5x más grandes (1.7 unidades de altura), la cámara necesita ajustarse para mantener una buena composición visual.

---

## 📐 Valores Recomendados

### Para CameraController.js:

```javascript
export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // ⚙️ DISTANCIA DE LA CÁMARA AL JUGADOR
        // Con personajes de 1.7 unidades, necesitamos más distancia
        this.distance = 10;          // Antes: 5-6
        this.minDistance = 5;        // Antes: 3
        this.maxDistance = 20;       // Antes: 15
        
        // ⚙️ ALTURA DE LA CÁMARA SOBRE EL JUGADOR
        // Debe estar lo suficientemente alta para ver el entorno
        this.height = 4;             // Antes: 2-3
        this.minHeight = 2;          // Antes: 1
        this.maxHeight = 8;          // Antes: 5
        
        // ⚙️ ÁNGULOS DE ROTACIÓN
        this.angleH = 0;             // Ángulo horizontal (sin cambios)
        this.angleV = Math.PI / 6;   // Ángulo vertical (30°, sin cambios)
        this.minAngleV = 0.1;        // Mínimo (casi horizontal)
        this.maxAngleV = Math.PI / 3; // Máximo (60°)
        
        // ⚙️ SENSIBILIDAD DEL MOUSE
        this.sensitivity = 0.002;    // Sin cambios
        this.zoomSpeed = 0.5;        // Sin cambios
        
        // ⚙️ SUAVIZADO DE MOVIMIENTO
        this.smoothing = 0.1;        // Sin cambios (0.1 = suave, 1.0 = instantáneo)
    }
    
    update(targetPosition, obstacles = []) {
        // Calcular posición objetivo de la cámara
        const offset = new THREE.Vector3(
            Math.sin(this.angleH) * this.distance,
            this.height,
            Math.cos(this.angleH) * this.distance
        );
        
        const targetCameraPos = targetPosition.clone().add(offset);
        
        // Suavizar movimiento (lerp)
        this.camera.position.lerp(targetCameraPos, this.smoothing);
        
        // Mirar al jugador (ligeramente por encima del centro)
        const lookAtPos = targetPosition.clone();
        lookAtPos.y += 1.0;  // ⚙️ AJUSTADO: Antes era 0.5
        this.camera.lookAt(lookAtPos);
        
        // Colisión con obstáculos (opcional)
        this.checkCollisions(targetPosition, obstacles);
    }
    
    checkCollisions(targetPosition, obstacles) {
        // Raycast desde el jugador hacia la cámara
        const direction = this.camera.position.clone()
            .sub(targetPosition)
            .normalize();
        
        const raycaster = new THREE.Raycaster(
            targetPosition,
            direction,
            0,
            this.distance
        );
        
        const intersects = raycaster.intersectObjects(obstacles, true);
        
        if (intersects.length > 0) {
            // Acercar la cámara si hay obstáculos
            const distance = intersects[0].distance - 0.5;
            this.camera.position.copy(
                targetPosition.clone().add(
                    direction.multiplyScalar(Math.max(distance, this.minDistance))
                )
            );
        }
    }
}
```

---

## 🎮 Valores Alternativos por Estilo de Juego

### Estilo "Acción" (más cerca, más dinámico)
```javascript
this.distance = 8;
this.height = 3;
this.angleV = Math.PI / 4;  // 45°
```

### Estilo "Exploración" (más lejos, más panorámico)
```javascript
this.distance = 12;
this.height = 5;
this.angleV = Math.PI / 5;  // 36°
```

### Estilo "Aventura" (balanceado) ⭐ RECOMENDADO
```javascript
this.distance = 10;
this.height = 4;
this.angleV = Math.PI / 6;  // 30°
```

---

## 📷 Ajuste del FOV (Field of View)

### En la inicialización de la cámara (index.html o main.js):

```javascript
// ANTES
const camera = new THREE.PerspectiveCamera(
    60,                              // FOV
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// DESPUÉS (más amplio para ver más entorno)
const camera = new THREE.PerspectiveCamera(
    65,                              // FOV aumentado
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
```

### Valores de FOV por estilo:

| Estilo | FOV | Efecto |
|--------|-----|--------|
| Cinematográfico | 50-55° | Más zoom, menos distorsión |
| Balanceado | 60-65° | ⭐ Recomendado |
| Acción | 70-75° | Más amplio, más inmersivo |
| Extremo | 80-90° | Muy amplio, puede marear |

---

## 🔧 Cómo Ajustar en Tiempo Real

### Método 1: Consola del Navegador
```javascript
// Cambiar distancia
cameraController.distance = 12;

// Cambiar altura
cameraController.height = 5;

// Cambiar FOV
camera.fov = 70;
camera.updateProjectionMatrix();
```

### Método 2: Controles de Teclado (agregar en el código)
```javascript
// En el event listener de keydown
if (key === 'pageup') {
    cameraController.distance = Math.min(
        cameraController.distance + 1,
        cameraController.maxDistance
    );
}
if (key === 'pagedown') {
    cameraController.distance = Math.max(
        cameraController.distance - 1,
        cameraController.minDistance
    );
}
```

---

## 📊 Comparación Visual

### Antes (personajes pequeños):
```
Distancia: 5-6 unidades
Altura: 2-3 unidades
FOV: 60°

     📷 (cámara muy cerca)
      |
      |
    🧍 (jugador 0.34u)
```

### Después (personajes realistas):
```
Distancia: 10 unidades
Altura: 4 unidades
FOV: 65°

           📷 (cámara más lejos)
          /
         /
       🧍 (jugador 1.7u)
```

---

## ✅ Checklist de Verificación

### Composición Visual:
- [ ] El jugador ocupa ~15-20% de la altura de la pantalla
- [ ] Se puede ver el entorno alrededor del jugador
- [ ] No hay objetos cortados en los bordes de la pantalla
- [ ] La cámara no atraviesa el terreno ni objetos

### Movimiento:
- [ ] La cámara sigue al jugador suavemente (no brusco)
- [ ] Al girar, la rotación es fluida
- [ ] Al correr, la cámara mantiene el ritmo
- [ ] Al saltar, la cámara no se descontrola

### Interacción:
- [ ] Se pueden ver los NPCs antes de llegar a ellos
- [ ] Los indicadores sobre las cabezas son visibles
- [ ] Los diálogos no quedan fuera de cámara
- [ ] Las casas y objetos grandes son visibles

### Confort:
- [ ] No hay mareo al mover la cámara
- [ ] El FOV no distorsiona demasiado los bordes
- [ ] La distancia permite ver peligros/obstáculos
- [ ] Se puede jugar cómodamente por 10+ minutos

---

## 🎯 Valores Finales Recomendados

```javascript
// CameraController.js
this.distance = 10;       // ⭐ Distancia óptima
this.height = 4;          // ⭐ Altura óptima
this.minDistance = 5;
this.maxDistance = 20;
this.angleV = Math.PI / 6; // 30°

// Camera (index.html)
camera.fov = 65;          // ⭐ FOV óptimo
camera.near = 0.1;
camera.far = 1000;
```

---

## 📖 Referencias

### Juegos de Referencia:
- **Zelda: Breath of the Wild:** Distancia ~8-10, FOV ~60°
- **Genshin Impact:** Distancia ~10-12, FOV ~65°
- **Dark Souls:** Distancia ~6-8, FOV ~55° (más cercano)

### Documentación:
- [Three.js PerspectiveCamera](https://threejs.org/docs/#api/en/cameras/PerspectiveCamera)
- [Camera Controls Best Practices](https://discoverthreejs.com/book/first-steps/camera-controls/)

---

**Nota:** Estos valores son puntos de partida. Ajusta según tu preferencia y el feedback de los jugadores.
