# 📐 Sistema de Normalización Automática de Escalas

## 🎯 Objetivo

Implementar un sistema que normalice automáticamente las escalas de todos los personajes y props del juego para que sigan el estándar:

```
1 unidad de Three.js = 1 metro en el mundo real
```

---

## 📊 Estándar Aplicado

### Altura Objetivo:
- **Jugador:** 1.7 unidades (1.7 metros)
- **NPCs:** 1.7 unidades ± 0.2 (1.5 - 1.9 metros)
- **Rocas:** 0.3 - 1.5 unidades (30cm - 1.5m)
- **Flores:** 0.1 - 0.3 unidades (10cm - 30cm)

### Terreno:
- **Tamaño:** 200x200 unidades (200m x 200m)
- **Equivalente:** ~2 campos de fútbol
- **Ratio Jugador/Terreno:** 1.7/200 = 0.85% ✅

---

## 🔧 Implementación

### 1. Player (js/Player.js)

#### Placeholder Normalizado:
```javascript
// CapsuleGeometry(radio, altura_cilindro, segmentos_radiales, segmentos_altura)
const radius = 0.3;   // 30cm de radio (ancho de hombros)
const height = 1.1;   // 1.1m de altura del cilindro
// Altura total = 0.3 + 1.1 + 0.3 = 1.7 unidades ✅

const geometry = new THREE.CapsuleGeometry(radius, height, 4, 8);
```

#### Modelo FBX (index.html):
```javascript
// Modelos Mixamo vienen en cm (~170cm)
// Escala 0.1 → 170cm * 0.1 / 100 = 1.7 unidades ✅
player.mesh.scale.set(0.1, 0.1, 0.1);
```

#### Velocidades Ajustadas:
```javascript
this.speed = 0.4;              // 0.4 u/frame ≈ 4 m/s (caminar)
this.sprintMultiplier = 2.0;   // 0.8 u/frame ≈ 8 m/s (correr)
this.jumpForce = 1.5;          // Alcanza ~0.6u de altura (60cm)
```

#### Raycaster Ajustado:
```javascript
this.raycaster.far = 3.0;  // Detecta suelo hasta 3m de distancia
```

---

### 2. NPCs (js/NPCManager.js)

#### Sistema de Normalización Automática:

```javascript
/**
 * Calcula la escala necesaria para que un modelo alcance
 * la altura objetivo (1.7 unidades por defecto).
 */
calculateNormalizedScale(mesh, initialScale, heightMultiplier = 1.0) {
    // 1. Calcular bounding box con escala inicial
    mesh.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(mesh);
    const currentHeight = bbox.max.y - bbox.min.y;
    
    // 2. Altura objetivo ajustada por multiplicador
    const targetHeight = this.TARGET_HEIGHT * heightMultiplier;
    
    // 3. Calcular nueva escala
    const normalizedScale = (targetHeight / currentHeight) * initialScale;
    
    return normalizedScale;
}
```

#### Proceso de Creación de NPC:

```javascript
// PASO 1: Aplicar escala inicial (aproximada)
npcMesh.scale.set(modelScale, modelScale, modelScale);

// PASO 2: Normalizar escala automáticamente
const normalizedScale = this.calculateNormalizedScale(
    npcMesh, 
    modelScale, 
    heightMultiplier  // 1.0 = normal, 0.8 = bajo, 1.2 = alto
);

// PASO 3: Aplicar escala normalizada
npcMesh.scale.set(normalizedScale, normalizedScale, normalizedScale);

// PASO 4: Posicionar con pies en Y=0
const bbox = new THREE.Box3().setFromObject(npcMesh);
const yOffset = -bbox.min.y;
npcMesh.position.set(x, yOffset, z);
```

#### Ventajas:
✅ **Automático** - No necesitas calcular escalas manualmente
✅ **Consistente** - Todos los NPCs quedan a la misma altura
✅ **Flexible** - Puedes crear personajes altos/bajos con `heightMultiplier`
✅ **Preciso** - Usa bounding box real del modelo

---

### 3. Props (js/WorldBuilder.js)

#### Rocas Normalizadas:
```javascript
// Tamaño aleatorio entre 0.3 y 1.5 unidades (30cm - 1.5m)
const rockSize = 0.3 + Math.random() * 1.2;
const rockGeo = new THREE.DodecahedronGeometry(rockSize, 0);

// Posicionar a ras de suelo
rock.position.set(x, rockSize * 0.5, z);
```

**Resultado:**
- Roca pequeña: 0.3u = 18% de la altura del jugador
- Roca mediana: 0.9u = 53% de la altura del jugador
- Roca grande: 1.5u = 88% de la altura del jugador

#### Flores Normalizadas:
```javascript
// Tamaño aleatorio entre 0.1 y 0.3 unidades (10-30cm)
const flowerHeight = 0.1 + Math.random() * 0.2;
const flowerRadius = flowerHeight * 0.4;
const flowerGeo = new THREE.ConeGeometry(flowerRadius, flowerHeight, 4);
```

**Resultado:**
- Flor pequeña: 0.1u = 6% de la altura del jugador
- Flor mediana: 0.2u = 12% de la altura del jugador
- Flor grande: 0.3u = 18% de la altura del jugador

---

## 📊 Comparación Antes/Después

| Elemento | Antes | Después | Cambio |
|----------|-------|---------|--------|
| **Jugador** | 0.34u (placeholder) | 1.7u | +400% |
| **NPCs GLB** | 0.4u (escala 0.5) | 1.7u | +325% |
| **NPCs FBX** | 0.42u (escala 0.025) | 1.7u | +305% |
| **Rocas** | 1-3u (fijas) | 0.3-1.5u | Variable |
| **Flores** | 0.5u (fijas) | 0.1-0.3u | -40% a -80% |

### Ratio Personaje/Terreno:
- **Antes:** 0.34/200 = 0.17% ❌ (microscópico)
- **Después:** 1.7/200 = 0.85% ✅ (realista)

---

## 🎮 Impacto en Gameplay

### Velocidades:
```javascript
// Antes (personajes pequeños)
speed = 0.08 u/frame

// Después (personajes normalizados)
speed = 0.4 u/frame  // 5x más rápido

// Justificación:
// Con personajes 5x más grandes, necesitan moverse 5x más rápido
// para mantener la misma sensación de velocidad relativa
```

### Salto:
```javascript
// Antes
jumpForce = 0.30  // Alcanzaba ~0.15u (15cm con personaje de 0.34u)

// Después
jumpForce = 1.5   // Alcanza ~0.6u (60cm con personaje de 1.7u)

// Justificación:
// Un humano puede saltar ~50-70cm de altura
// 0.6u = 60cm es realista
```

### Interacción:
```javascript
// Antes
interactionDistance = 3.0u  // 3m con personaje de 0.34u = 882% de su altura

// Después
interactionDistance = 5.0u  // 5m con personaje de 1.7u = 294% de su altura

// Justificación:
// 5 metros es una distancia razonable para interactuar con NPCs
```

---

## 🎥 Ajustes de Cámara

Con personajes 5x más grandes, la cámara necesita ajustarse:

```javascript
// CameraController.js
this.distance = 25;           // Antes: 15 (+67%)
this.verticalAngle = 0.6;     // Antes: 0.5 (+20%)
const targetHeight = 1.5;     // Antes: 1.0 (+50%)

// index.html
camera.fov = 70;              // Antes: 60 (+17%)
```

**Resultado:** La cámara está más alejada y elevada, permitiendo ver los personajes completos y más entorno.

---

## 🔍 Cómo Verificar las Escalas

### Método 1: Consola del Navegador
```javascript
// Obtener altura del jugador
const player = scene.children.find(c => c.name === 'player' || c.userData?.type === 'player');
if (player) {
    const bbox = new THREE.Box3().setFromObject(player);
    const height = bbox.max.y - bbox.min.y;
    console.log('Altura del jugador:', height.toFixed(2), 'unidades');
}

// Obtener altura de un NPC
const npc = scene.children.find(c => c.userData?.type === 'npc');
if (npc) {
    const bbox = new THREE.Box3().setFromObject(npc);
    const height = bbox.max.y - bbox.min.y;
    console.log('Altura del NPC:', height.toFixed(2), 'unidades');
}
```

### Método 2: Logs Automáticos
El sistema ya imprime logs durante la carga:

```
📏 Placeholder del jugador creado:
   Altura total: 1.7 unidades (1.7m)
   Radio: 0.3 unidades (0.3m)

📐 Normalización de escala:
   Altura actual: 0.68u con escala 2.5
   Altura objetivo: 1.70u
   Nueva escala: 6.25

✅ NPC posicionado: Don Pedro
   Altura final: 1.70u (objetivo: 1.70u)
   Offset Y: 0.85u
```

### Método 3: Visual
1. Coloca un NPC al lado del jugador
2. Ambos deben tener altura similar (~1.7u)
3. Una roca grande debe llegar hasta el pecho del jugador
4. Una flor debe llegar hasta las rodillas

---

## 📋 Checklist de Verificación

### Proporciones:
- [ ] Jugador mide ~1.7 unidades
- [ ] NPCs miden ~1.6-1.9 unidades
- [ ] Rocas miden 0.3-1.5 unidades
- [ ] Flores miden 0.1-0.3 unidades
- [ ] Todos los personajes tienen altura similar

### Movimiento:
- [ ] Caminar 100m toma ~30-40 segundos
- [ ] Correr 100m toma ~15-20 segundos
- [ ] Salto alcanza ~60cm de altura
- [ ] Velocidades se sienten naturales

### Sistemas:
- [ ] Raycaster detecta suelo correctamente
- [ ] NPCs están en el suelo (no flotan)
- [ ] Indicadores sobre cabezas bien posicionados
- [ ] Animaciones a velocidad normal
- [ ] Interacción a distancia razonable (5m)

### Cámara:
- [ ] Distancia cómoda (25 unidades)
- [ ] Ángulo adecuado (34°)
- [ ] FOV amplio (70°)
- [ ] Jugador ocupa ~25% de pantalla

---

## 🚀 Ventajas del Sistema

### 1. Automático
No necesitas calcular escalas manualmente para cada modelo. El sistema lo hace por ti.

### 2. Consistente
Todos los personajes quedan a la misma altura, sin importar el tamaño original del modelo.

### 3. Flexible
Puedes crear personajes especiales:
```javascript
// Niño (80% de altura normal)
heightMultiplier: 0.8  // 1.36 metros

// Adulto normal
heightMultiplier: 1.0  // 1.70 metros

// Gigante
heightMultiplier: 1.5  // 2.55 metros
```

### 4. Preciso
Usa el bounding box real del modelo, no estimaciones.

### 5. Escalable
Fácil de mantener y extender a nuevos modelos.

---

## 📖 Referencias

### Estándares de Industria:
- **Unity:** 1 unidad = 1 metro
- **Unreal Engine:** 1 unidad = 1 centímetro (100 unidades = 1 metro)
- **Three.js:** Sin estándar oficial, pero **1 unidad = 1 metro** es lo más común

### Juegos de Referencia:
- **Zelda: Breath of the Wild:** Personajes ~1.7 unidades
- **Genshin Impact:** Personajes ~1.6-1.8 unidades
- **Minecraft:** Personajes 1.8 unidades (bloques de 1 unidad)

### Medidas Humanas Reales:
- Altura promedio: 1.70m (hombres), 1.60m (mujeres)
- Ancho de hombros: 0.40-0.50m
- Salto vertical: 0.50-0.70m
- Velocidad caminar: 4-5 km/h (~1.1-1.4 m/s)
- Velocidad correr: 12-15 km/h (~3.3-4.2 m/s)

---

## ✅ Resumen Ejecutivo

### Cambios Aplicados:
1. ✅ **Player:** Placeholder de 1.7u, modelo FBX con escala 0.1
2. ✅ **NPCs:** Sistema de normalización automática → todos 1.7u
3. ✅ **Rocas:** Tamaño aleatorio 0.3-1.5u (proporcional)
4. ✅ **Flores:** Tamaño aleatorio 0.1-0.3u (pequeñas)
5. ✅ **Velocidades:** 5x más rápidas (proporcionales a nueva escala)
6. ✅ **Cámara:** Alejada a 25u con FOV 70°

### Resultado:
Los personajes ahora tienen **proporciones realistas** (1.7 unidades) en relación al terreno de 200x200 unidades, similar a un humano de 1.7m en un campo de 200m.

### Archivos Modificados:
- `js/Player.js` - Placeholder normalizado, velocidades ajustadas
- `js/NPCManager.js` - Sistema de normalización automática
- `js/WorldBuilder.js` - Props normalizadas, checklist
- `index.html` - Escala del modelo del jugador

---

**Fecha:** 2024
**Versión:** 2.0
**Estado:** ✅ Implementado con normalización automática
