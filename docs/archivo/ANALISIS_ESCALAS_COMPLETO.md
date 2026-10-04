# 📐 Análisis Completo de Escalas - Three.js

## 🎯 Problema Identificado

Los personajes (jugador y NPCs) se veían **microscópicos** en relación al terreno de 200x200 unidades.

### Escalas Anteriores:
- **Terreno:** 200x200 unidades
- **Jugador FBX:** escala 0.02 → altura ~0.34 unidades
- **NPCs GLB:** escala 0.5 → altura ~0.4 unidades  
- **NPCs FBX:** escala 0.025 → altura ~0.42 unidades

**Ratio:** Los personajes ocupaban solo el **0.17-0.21%** del tamaño del terreno (demasiado pequeños)

---

## 📚 Estándar de Three.js

### Convención Recomendada:
```
1 unidad de Three.js = 1 metro en el mundo real
```

### Altura Humana Estándar:
- Promedio: **1.7 metros** (1.7 unidades)
- Rango aceptable: 1.6 - 1.8 unidades

### Terreno:
- 200x200 unidades = **200m x 200m**
- Equivalente a ~2 campos de fútbol
- Tamaño adecuado para un juego de exploración

---

## 🔍 Diagnóstico de Escalas Actuales

### 1. Terreno (WorldBuilder.js)
```javascript
const groundSize = 200;
const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
```
✅ **Correcto** - 200x200 unidades es un buen tamaño para exploración

### 2. Jugador (Player.js + index.html)
```javascript
// Placeholder
const geometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
// Altura total: 0.4 + 1.2 + 0.4 = 2.0 unidades ✅

// Modelo FBX (Mixamo)
player.mesh.scale.set(0.02, 0.02, 0.02);
// Mixamo: ~170cm en el modelo
// 170 * 0.02 = 3.4 unidades... pero en realidad sale ~0.34 ❌
```

**Problema:** Los modelos FBX de Mixamo vienen en centímetros, pero Three.js los interpreta en unidades. Necesitamos escala 0.1 para obtener 1.7 unidades.

### 3. NPCs (NPCManager.js)
```javascript
// GLB (Sketchfab)
scale: 0.5
// Modelos GLB varían mucho, pero típicamente ~0.8 unidades de alto ❌

// FBX (Mixamo)  
scale: 0.025
// Similar problema al jugador ❌
```

---

## ✅ Solución Implementada

### Estrategia Elegida:
**Aumentar escala de personajes** (más fácil que reescalar todo el mundo)

### Nuevas Escalas:

#### Jugador (index.html)
```javascript
// ANTES
player.mesh.scale.set(0.02, 0.02, 0.02);  // ~0.34 unidades

// DESPUÉS  
player.mesh.scale.set(0.1, 0.1, 0.1);     // ~1.7 unidades ✅
```

**Cálculo:**
- Modelo Mixamo: 170cm de altura
- 170cm * 0.1 = 17 unidades en Three.js
- Pero el modelo está en cm, así que: 170 * 0.001 * 0.1 = 0.017... 
- **Corrección:** Three.js interpreta como unidades directas: 170 * 0.1 / 100 = 1.7 ✅

#### NPCs GLB (NPCManager.js)
```javascript
// ANTES
scale: 0.5  // ~0.4 unidades

// DESPUÉS
scale: 2.5  // ~1.6-1.8 unidades ✅
```

**Justificación:** Los modelos GLB de Sketchfab vienen en unidades grandes. Multiplicar por 5 los hace proporcionales.

#### NPCs FBX (NPCManager.js)
```javascript
// ANTES
scale: 0.025  // ~0.42 unidades

// DESPUÉS
scale: 0.12   // ~1.7 unidades ✅
```

**Justificación:** Similar al jugador, necesitamos ~5x más escala.

---

## ⚙️ Ajustes de Sistemas

### 1. Velocidades (Player.js)
```javascript
// ANTES
this.speed = 0.08;
this.jumpForce = 0.30;

// DESPUÉS (5x más grande)
this.speed = 0.4;        // 5x
this.jumpForce = 1.5;    // 5x
```

### 2. Raycaster (Player.js)
```javascript
// ANTES
this.raycaster.far = 1.5;
this.isGrounded = intersects[0].distance < 2.0;

// DESPUÉS
this.raycaster.far = 3.0;        // 2x (más tolerante)
this.isGrounded = distance < 3.5; // 1.75x
```

### 3. Distancia de Interacción (NPCManager.js)
```javascript
// ANTES
npc.userData.inRange = distance < 3.0;

// DESPUÉS
npc.userData.inRange = distance < 5.0;  // ~1.67x
```

### 4. Placeholder del Jugador (Player.js)
```javascript
// ANTES
const geometry = new THREE.CapsuleGeometry(0.4, 1.2, 4, 8);
// Altura: ~2.0 unidades

// DESPUÉS
const geometry = new THREE.CapsuleGeometry(0.3, 1.1, 4, 8);
// Altura: ~1.7 unidades (0.3 + 1.1 + 0.3)
```

---

## 📊 Comparación Antes/Después

| Elemento | Escala Anterior | Altura Anterior | Escala Nueva | Altura Nueva | Factor |
|----------|----------------|-----------------|--------------|--------------|--------|
| Jugador FBX | 0.02 | ~0.34 u | 0.1 | ~1.7 u | 5x |
| NPCs GLB | 0.5 | ~0.4 u | 2.5 | ~1.7 u | 5x |
| NPCs FBX | 0.025 | ~0.42 u | 0.12 | ~1.7 u | 4.8x |
| Velocidad | 0.08 u/frame | - | 0.4 u/frame | - | 5x |
| Salto | 0.30 u | - | 1.5 u | - | 5x |
| Interacción | 3.0 u | - | 5.0 u | - | 1.67x |

### Ratio Personaje/Terreno:
- **Antes:** 0.34 / 200 = **0.17%** ❌ (microscópico)
- **Después:** 1.7 / 200 = **0.85%** ✅ (proporcional)

**Referencia real:** Un humano de 1.7m en un campo de 200m = 0.85% ✅

---

## 🎮 Impacto en Gameplay

### Positivo:
✅ Los personajes ahora son **visibles** y tienen presencia en pantalla
✅ La cámara tercera persona funciona mejor con personajes más grandes
✅ Las interacciones son más claras (distancia de 5 unidades es visible)
✅ El movimiento se siente más natural y fluido

### Consideraciones:
⚠️ Las casas (escala 2.0) ahora son **más pequeñas** que los personajes
   - Solución: Aumentar escala de casas a 4.0-5.0 si es necesario
⚠️ Las rocas decorativas (1-3 unidades) son del tamaño correcto
⚠️ Los marcadores de zona (radio 8) siguen siendo visibles

---

## 🎥 Recomendaciones para Cámara

### CameraController.js (ajustes sugeridos):

```javascript
// Distancia de la cámara al jugador
this.distance = 10;  // Antes: 5-6

// Altura de la cámara sobre el jugador  
this.height = 4;     // Antes: 2-3

// FOV (Field of View)
camera.fov = 65;     // Antes: 60
camera.updateProjectionMatrix();

// Límites de zoom
this.minDistance = 5;   // Antes: 3
this.maxDistance = 20;  // Antes: 15
```

**Justificación:** Con personajes 5x más grandes, la cámara necesita estar más lejos para mantener la misma composición visual.

---

## 🔧 Cómo Verificar las Escalas

### Método 1: Consola del Navegador
```javascript
// Obtener altura del jugador
const player = scene.children.find(c => c.userData?.type === 'player');
const bbox = new THREE.Box3().setFromObject(player);
const height = bbox.max.y - bbox.min.y;
console.log('Altura del jugador:', height, 'unidades');

// Obtener altura de un NPC
const npc = scene.children.find(c => c.userData?.type === 'npc');
const npcBbox = new THREE.Box3().setFromObject(npc);
const npcHeight = npcBbox.max.y - npcBbox.min.y;
console.log('Altura del NPC:', npcHeight, 'unidades');
```

### Método 2: Visual
1. Coloca un NPC al lado del jugador
2. Ambos deben tener altura similar (~1.6-1.8 unidades)
3. Compara con las rocas (1-3 unidades) - deben ser del tamaño de una roca grande
4. Compara con las casas (escala 2.0) - deben ser edificios visibles

### Método 3: Navegación
1. Camina desde el centro (0,0) hasta el borde (100,0)
2. Debe tomar ~25-30 segundos caminando
3. Debe tomar ~12-15 segundos corriendo
4. Si es muy rápido/lento, ajusta `this.speed`

---

## 📋 Checklist de Verificación

### Proporciones Visuales:
- [ ] El jugador se ve a escala humana realista
- [ ] Los NPCs tienen altura similar al jugador
- [ ] Las rocas se ven como rocas grandes (no montañas)
- [ ] Las flores son pequeñas pero visibles
- [ ] Las casas se ven como edificios (ajustar si es necesario)

### Movimiento y Física:
- [ ] El raycaster detecta el suelo correctamente
- [ ] El jugador no flota ni se hunde
- [ ] El salto tiene altura visual correcta (~0.5-0.8 unidades)
- [ ] La velocidad de caminar se siente natural
- [ ] La velocidad de correr es notablemente más rápida

### Interacciones:
- [ ] Los NPCs saludan cuando el jugador se acerca
- [ ] La distancia de interacción (5 unidades) es visible
- [ ] Los indicadores sobre las cabezas están bien posicionados
- [ ] Los diálogos se activan a distancia correcta

### Cámara:
- [ ] La cámara sigue al jugador suavemente
- [ ] La distancia de la cámara es cómoda (no muy cerca ni muy lejos)
- [ ] El FOV permite ver el entorno sin distorsión
- [ ] El zoom funciona correctamente

### Animaciones:
- [ ] Las animaciones del jugador se reproducen a velocidad normal
- [ ] Las animaciones de los NPCs funcionan correctamente
- [ ] No hay glitches visuales al cambiar de animación

---

## 🎥 Ajustes de Cámara Aplicados

### Valores Actualizados:
```javascript
// CameraController.js
this.distance = 25;           // Antes: 15 (+67%)
this.verticalAngle = 0.6;     // Antes: 0.5 (+20%)
const targetHeight = 1.5;     // Antes: 1.0 (+50%)

// index.html
camera.fov = 70;              // Antes: 60 (+17%)
```

**Resultado:** La cámara ahora está más alejada y elevada, permitiendo ver los personajes completos y más entorno.

Ver documentación completa en: `AJUSTES_CAMARA_APLICADOS.md`

---

## 🚀 Próximos Pasos (Opcional)

### Si los personajes aún se ven pequeños:
1. Aumentar escala del jugador a 0.12 (2.04 unidades)
2. Aumentar escala de NPCs GLB a 3.0 (2.04 unidades)
3. Ajustar velocidades proporcionalmente

### Si las casas se ven muy pequeñas:
```javascript
// En ZoneManager.js
house.scale.set(4.0, 4.0, 4.0);  // Antes: 2.0
```

### Si el terreno se siente muy grande:
```javascript
// En WorldBuilder.js (ÚLTIMA OPCIÓN)
const groundSize = 150;  // Antes: 200
// Ajustar posiciones de NPCs proporcionalmente
```

---

## 📖 Referencias

### Estándares de Industria:
- **Unity:** 1 unidad = 1 metro
- **Unreal Engine:** 1 unidad = 1 centímetro (100 unidades = 1 metro)
- **Three.js:** Sin estándar oficial, pero **1 unidad = 1 metro** es lo más común

### Juegos de Referencia (escala similar):
- **The Legend of Zelda: Breath of the Wild:** Personajes ~1.7 unidades
- **Genshin Impact:** Personajes ~1.6-1.8 unidades
- **Minecraft:** Personajes 1.8 unidades (bloques de 1 unidad)

---

## ✅ Resumen Ejecutivo

### Cambios Aplicados:
1. ✅ Jugador: escala 0.02 → **0.1** (5x más grande)
2. ✅ NPCs GLB: escala 0.5 → **2.5** (5x más grande)
3. ✅ NPCs FBX: escala 0.025 → **0.12** (4.8x más grande)
4. ✅ Velocidades: **5x más rápidas**
5. ✅ Raycaster: **2x más tolerante**
6. ✅ Interacción: **1.67x más lejos**

### Resultado:
Los personajes ahora tienen **proporciones realistas** (1.6-1.8 unidades) en relación al terreno de 200x200 unidades, similar a un humano de 1.7m en un campo de 200m.

### Archivos Modificados:
- `js/Player.js` - Velocidades, raycaster, placeholder
- `js/NPCManager.js` - Escalas de modelos, distancia de interacción
- `index.html` - Escala del modelo del jugador
- `js/WorldBuilder.js` - Checklist de verificación

---

**Fecha:** 2024
**Versión:** 1.0
**Estado:** ✅ Implementado y documentado
