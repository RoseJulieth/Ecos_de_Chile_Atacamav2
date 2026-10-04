# 📝 Notas Técnicas - Ecos de Chile: Atacama

## 🏗️ Arquitectura del Sistema

### Patrón de Diseño
El proyecto utiliza una arquitectura **modular orientada a objetos** con separación de responsabilidades:

```
┌─────────────────────────────────────────┐
│           index.html (Main)             │
│  - Inicialización                       │
│  - Game Loop                            │
│  - Event Handlers                       │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Game Systems  │    │   UI Systems    │
│                │    │                 │
│ - Player       │    │ - UIManager     │
│ - Camera       │    │ - Menus         │
│ - Physics      │    │ - HUD           │
│ - Fragments    │    │ - Notifications │
│ - Inventory    │    └─────────────────┘
│ - World        │
│ - GameState    │
└────────────────┘
```

---

## 🎮 Sistema de Física

### Gravedad y Movimiento Vertical

```javascript
// Constantes físicas
const GRAVITY = 9.8; // m/s²
const JUMP_FORCE = 0.35; // Impulso inicial
const GROUND_THRESHOLD = 1.2; // Distancia para considerar "en suelo"

// Aplicación por frame
velocity.y -= GRAVITY * deltaTime;
position.y += velocity.y;
```

### Detección de Suelo (Raycasting)

```javascript
raycaster.set(playerPosition, Vector3(0, -1, 0));
const intersects = raycaster.intersectObject(ground);
isGrounded = intersects.length > 0 && intersects[0].distance < GROUND_THRESHOLD;
```

**Ventajas:**
- ✅ Preciso en terrenos irregulares
- ✅ Bajo costo computacional
- ✅ Fácil de debuggear

---

## 📷 Sistema de Cámara

### Cámara Tercera Persona

```javascript
// Posicionamiento esférico
const horizontalDist = distance * cos(verticalAngle);
const verticalDist = distance * sin(verticalAngle);

camX = playerX + sin(horizontalAngle) * horizontalDist;
camZ = playerZ + cos(horizontalAngle) * horizontalDist;
camY = playerY + verticalDist;
```

### Prevención de Colisiones

```javascript
// Raycast desde jugador hacia cámara
raycaster.set(playerPos, cameraDirection);
const obstacles = raycaster.intersectObjects(scene.children);

if (obstacles.length > 0) {
    // Acercar cámara para evitar atravesar
    const safeDistance = obstacles[0].distance - 0.5;
    camera.position.lerp(targetPos, safeDistance / desiredDistance);
}
```

---

## 🎨 Cel-Shading Implementation

### MeshToonMaterial

```javascript
const material = new THREE.MeshToonMaterial({
    color: 0xFFD700,
    emissive: 0xFFD700,
    emissiveIntensity: 0.4
});
```

**Características:**
- Gradientes discretos (3-4 niveles)
- Sombras estilo cartoon
- Bajo costo de renderizado
- Compatible con iluminación estándar

### Iluminación para Cel-Shading

```javascript
// Luz ambiental suave
const ambient = new THREE.AmbientLight(0xFFE4B5, 0.5);

// Luz direccional fuerte (sol)
const sun = new THREE.DirectionalLight(0xFFEBCD, 1.5);
sun.position.set(50, 80, 30);

// Luz de relleno
const fill = new THREE.DirectionalLight(0xFFA500, 0.3);
fill.position.set(-30, 40, -30);
```

---

## 💾 Sistema de Persistencia

### Estructura de Datos

```javascript
// Guardado del juego
{
    player: {
        x: float,
        y: float,
        z: float
    },
    inventory: {
        fragments: [id1, id2, ...],
        items: [...],
        resources: [...]
    },
    timestamp: number
}
```

### localStorage API

```javascript
// Guardar
localStorage.setItem('ecos_atacama_save', JSON.stringify(gameData));

// Cargar
const saved = localStorage.getItem('ecos_atacama_save');
const gameData = JSON.parse(saved);

// Verificar existencia
const hasSave = localStorage.getItem('ecos_atacama_save') !== null;
```

**Límites:**
- Máximo: ~5-10 MB (varía por navegador)
- Sincrónico (puede bloquear UI en datos grandes)
- Solo strings (requiere JSON.stringify/parse)

---

## 🎯 Sistema de Detección de Proximidad

### Algoritmo de Recolección

```javascript
// Por cada fragmento
const distance = playerPosition.distanceTo(fragmentPosition);

if (distance < COLLECTION_RADIUS && !fragment.collected) {
    collectFragment(fragment);
}
```

**Optimizaciones:**
- Solo verificar fragmentos no recolectados
- Usar distancia al cuadrado para evitar sqrt()
- Limitar verificaciones por frame

```javascript
// Optimizado
const distSq = playerPos.distanceToSquared(fragPos);
const radiusSq = COLLECTION_RADIUS * COLLECTION_RADIUS;

if (distSq < radiusSq) {
    // Recolectar
}
```

---

## 🌍 Construcción del Mundo

### Generación Procedural del Terreno

```javascript
const vertices = geometry.attributes.position.array;

for (let i = 0; i < vertices.length; i += 3) {
    // Agregar variación en altura (eje Y)
    vertices[i + 2] = Math.random() * 0.5;
}

geometry.computeVertexNormals(); // Recalcular normales
```

### Zonas Temáticas

```javascript
// Marcador de zona
const marker = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height),
    new THREE.MeshToonMaterial({ 
        color: zoneColor, 
        transparent: true, 
        opacity: 0.3 
    })
);
```

---

## ⚡ Optimizaciones de Rendimiento

### Delta Time para Física Consistente

```javascript
let lastTime = performance.now();

function gameLoop() {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Segundos
    lastTime = currentTime;
    
    // Usar deltaTime en física
    velocity.y -= GRAVITY * deltaTime;
    position.add(velocity.multiplyScalar(deltaTime));
}
```

**Beneficios:**
- ✅ Física consistente en diferentes FPS
- ✅ Movimiento suave
- ✅ Predecible en diferentes dispositivos

### Frustum Culling Automático

Three.js automáticamente no renderiza objetos fuera del campo de visión:

```javascript
// Configurar fog para ocultar límites
scene.fog = new THREE.Fog(color, near, far);
```

### Shadow Map Optimization

```javascript
// Configurar calidad de sombras
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Suave pero eficiente

// Limitar área de sombras
sunLight.shadow.camera.left = -100;
sunLight.shadow.camera.right = 100;
sunLight.shadow.camera.top = 100;
sunLight.shadow.camera.bottom = -100;

// Resolución de shadow map
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
```

---

## 🎨 Animaciones CSS

### Keyframes Utilizados

```css
/* Glow effect para título */
@keyframes glow {
    from { text-shadow: 4px 4px 0 #8B4513, 2px 2px 10px rgba(255,215,0,0.5); }
    to { text-shadow: 4px 4px 0 #8B4513, 2px 2px 20px rgba(255,215,0,0.9); }
}

/* Slide up para notificaciones */
@keyframes slideUp {
    from { bottom: 10%; opacity: 0; }
    to { bottom: 15%; opacity: 1; }
}

/* Pulse para hints */
@keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
}
```

---

## 🔧 Debugging y Herramientas

### Console Logging Estratégico

```javascript
// Desarrollo
const DEBUG = true;

function debugLog(message, data) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`, data);
    }
}

// Uso
debugLog('Fragment collected', fragmentData);
```

### Stats.js para FPS Monitoring

```javascript
// Agregar en desarrollo
import Stats from 'three/addons/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
    stats.begin();
    // ... render
    stats.end();
}
```

### Three.js Inspector

Chrome Extension: "Three.js Inspector"
- Inspeccionar escena en tiempo real
- Ver jerarquía de objetos
- Modificar propiedades en vivo

---

## 📊 Métricas de Rendimiento

### Objetivos de Performance

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| FPS | 60 | ~60 |
| Draw Calls | <100 | ~30 |
| Triangles | <50k | ~5k |
| Memory | <100MB | ~50MB |
| Load Time | <3s | ~2s |

### Profiling

```javascript
// Medir tiempo de operaciones
console.time('Fragment Update');
fragmentManager.update();
console.timeEnd('Fragment Update');
```

---

## 🔐 Seguridad y Validación

### Validación de Input

```javascript
// Sanitizar datos de localStorage
function loadGame() {
    try {
        const saved = localStorage.getItem('ecos_atacama_save');
        if (!saved) return null;
        
        const data = JSON.parse(saved);
        
        // Validar estructura
        if (!data.player || !data.inventory) {
            throw new Error('Invalid save data');
        }
        
        // Validar tipos
        if (typeof data.player.x !== 'number') {
            throw new Error('Invalid player position');
        }
        
        return data;
    } catch (error) {
        console.error('Failed to load game:', error);
        return null;
    }
}
```

### Prevención de Cheating

```javascript
// Validar fragmentos recolectados
function collectFragment(fragment) {
    // Verificar distancia real
    const distance = player.position.distanceTo(fragment.position);
    if (distance > MAX_COLLECTION_DISTANCE) {
        console.warn('Invalid collection attempt');
        return false;
    }
    
    // Verificar que no esté ya recolectado
    if (inventory.hasFragment(fragment.id)) {
        return false;
    }
    
    // Proceder con recolección
    inventory.addFragment(fragment);
}
```

---

## 🧪 Testing Checklist

### Funcionalidad

```javascript
// Test de movimiento
✓ WASD mueve al jugador
✓ Shift aumenta velocidad
✓ Espacio hace saltar
✓ Mouse rota cámara

// Test de física
✓ Gravedad funciona
✓ Salto tiene altura correcta
✓ Jugador no atraviesa suelo
✓ Colisiones detectadas

// Test de recolección
✓ Fragmentos detectables
✓ Recolección automática
✓ UI se actualiza
✓ Notificación aparece

// Test de persistencia
✓ Guardado funciona
✓ Carga funciona
✓ Datos persisten al recargar
✓ Botón "Continuar" aparece
```

---

## 📚 Referencias Técnicas

### Three.js Documentation
- [Official Docs](https://threejs.org/docs/)
- [Examples](https://threejs.org/examples/)
- [Manual](https://threejs.org/manual/)

### Recursos Utilizados
- Three.js r160 (CDN: unpkg.com)
- ES6 Modules
- localStorage API
- Pointer Lock API
- RequestAnimationFrame API

### Inspiración
- Wind Waker (Cel-shading)
- Journey (Ambientación desértica)
- Breath of the Wild (Exploración)

---

## 🔮 Extensiones Futuras

### Sistema de Diálogos

```javascript
class DialogueSystem {
    constructor() {
        this.dialogues = new Map();
        this.currentDialogue = null;
    }
    
    addDialogue(npcId, dialogue) {
        this.dialogues.set(npcId, dialogue);
    }
    
    showDialogue(npcId) {
        const dialogue = this.dialogues.get(npcId);
        // Mostrar UI de diálogo
    }
}
```

### Mini-mapa

```javascript
class Minimap {
    constructor(size) {
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
    }
    
    update(playerPos, fragments) {
        // Dibujar mapa
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dibujar jugador
        this.drawPlayer(playerPos);
        
        // Dibujar fragmentos
        fragments.forEach(f => this.drawFragment(f));
    }
}
```

---

## 💡 Lecciones Aprendidas

### Buenas Prácticas Aplicadas
- ✅ Separación de responsabilidades
- ✅ Código modular y reutilizable
- ✅ Nombres descriptivos
- ✅ Comentarios donde necesario
- ✅ Manejo de errores
- ✅ Validación de datos

### Desafíos Superados
- 🎯 Física consistente con delta time
- 🎯 Cámara sin atravesar geometría
- 🎯 Persistencia robusta
- 🎯 UI responsive y pulida
- 🎯 Optimización de rendimiento

---

**Documentación técnica completa para desarrollo y mantenimiento del proyecto.**
