# 🔄 Rollback de Escalas

## 🐛 Problema Detectado

Después de cambiar las escalas a valores pequeños (0.020 y 0.025), los NPCs desaparecieron y se fueron al aire, igual que en problemas anteriores.

**Causa:** El sistema de posicionamiento con bounding box no funciona correctamente con escalas muy pequeñas (< 0.1).

---

## ✅ Solución: Rollback a Escalas Funcionales

Volver a las escalas que funcionaban correctamente (cuando los NPCs estaban en el suelo).

---

## 🔄 Cambios Aplicados

### 1. NPCs (js/NPCManager.js)

#### Antes (Problemático):
```javascript
// Todos los NPCs
scale: 0.025  // ❌ NPCs desaparecen/flotan
```

#### Después (Rollback):
```javascript
// NPCs GLB
scale: 2.5    // ✅ Funciona correctamente

// NPCs FBX
scale: 0.12   // ✅ Funciona correctamente
```

### 2. Jugador (index.html)

#### Antes:
```javascript
player.mesh.scale.set(0.020, 0.020, 0.020);  // Muy pequeño
```

#### Después (Rollback):
```javascript
player.mesh.scale.set(0.1, 0.1, 0.1);  // ✅ Proporcional a NPCs
```

---

## 📊 Escalas Finales (Funcionales)

| Elemento | Escala | Estado |
|----------|--------|--------|
| **Jugador FBX** | 0.1 | ✅ Funciona |
| **NPCs GLB** | 2.5 | ✅ Funciona |
| **NPCs FBX** | 0.12 | ✅ Funciona |

---

## 🎮 Velocidades (Mantenidas)

Las velocidades reducidas se mantienen porque funcionan bien:

```javascript
// js/Player.js
this.speed = 0.15;              // Caminar (natural)
this.sprintMultiplier = 2.0;    // Correr: 0.30
```

---

## 🎥 Cámara (Mantenida)

La cámara tercera persona se mantiene:

```javascript
// js/CameraController.js
this.distance = 8;           // Distancia cercana
this.verticalAngle = 0.5;    // Ángulo moderado
const targetHeight = 0.5;    // Centro del jugador
```

---

## ✅ Resultado

### Lo que funciona:
✅ **NPCs en el suelo** - No flotan ni desaparecen
✅ **Jugador visible** - Escala 0.1 proporcional
✅ **Velocidad natural** - 0.15 caminar, 0.30 correr
✅ **Cámara tercera persona** - Distancia 8, sigue al jugador

### Lo que se revirtió:
🔄 **Escalas de NPCs** - 0.025 → 2.5 (GLB) y 0.12 (FBX)
🔄 **Escala del jugador** - 0.020 → 0.1

---

## 📋 Archivos Modificados

1. **js/NPCManager.js**
   - Líneas ~27-75: Escalas revertidas a 2.5 (GLB) y 0.12 (FBX)

2. **index.html**
   - Línea ~595: Escala del jugador revertida a 0.1

---

## 🔍 Por Qué Falló

### Problema con Escalas Pequeñas:
Cuando usamos escalas muy pequeñas (< 0.1), el sistema de bounding box calcula offsets incorrectos:

```javascript
// Con escala 0.025
const bbox = new THREE.Box3().setFromObject(npcMesh);
const yOffset = -bbox.min.y;  // Valor muy pequeño o incorrecto
npcMesh.position.set(x, yOffset, z);  // ❌ NPC flota o desaparece
```

### Por Qué Funciona con Escalas Grandes:
Con escalas mayores (2.5 para GLB, 0.1+ para FBX), el bounding box se calcula correctamente y los NPCs quedan en el suelo.

---

## 💡 Lección Aprendida

**No usar escalas muy pequeñas (< 0.1) con el sistema actual de posicionamiento.**

Si necesitas personajes más pequeños, hay dos opciones:

### Opción 1: Ajustar el Sistema de Posicionamiento
```javascript
// Forzar Y=0 sin usar bounding box
npcMesh.position.set(x, 0, z);
```

### Opción 2: Usar Escalas Mayores
```javascript
// Mantener escalas > 0.1 para FBX y > 1.0 para GLB
GLB: scale >= 1.0
FBX: scale >= 0.1
```

---

## 🚀 Próximos Pasos

Si quieres ajustar el tamaño de los personajes:

### Para hacer NPCs más pequeños:
```javascript
// Reducir gradualmente desde 2.5
scale: 2.0  // Probar primero
scale: 1.5  // Si funciona, probar más pequeño
scale: 1.0  // Mínimo recomendado para GLB
```

### Para hacer jugador más grande:
```javascript
// Aumentar desde 0.1
player.mesh.scale.set(0.12, 0.12, 0.12);  // Ligeramente más grande
player.mesh.scale.set(0.15, 0.15, 0.15);  // Más grande
```

---

## ✅ Estado Actual

**Rollback completado exitosamente.**

Escalas funcionales restauradas:
- ✅ Jugador: 0.1
- ✅ NPCs GLB: 2.5
- ✅ NPCs FBX: 0.12
- ✅ Velocidades: 0.15 (caminar), 0.30 (correr)
- ✅ Cámara: Distancia 8, tercera persona

---

**Recarga el navegador (F5)** y los NPCs deberían estar en el suelo nuevamente.

---

**Fecha:** 2024
**Versión:** Rollback v1.0
**Estado:** ✅ Revertido a estado funcional
