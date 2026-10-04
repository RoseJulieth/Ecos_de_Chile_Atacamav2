# 🎮 Implementación de Modelos Específicos por NPC

## 📋 Resumen de Cambios

Se han implementado modelos específicos para cada NPC y se ha corregido la altura del terreno para evitar flotación.

---

## 1. 🎮 Jugador: Hooded_Adventurer.glb

### Cambios en `index.html`:

```javascript
// Antes
const playerFBX = await assetLoader.loadFBX(
    'assets/models/player/Adventurer.fbx',
    'player'
);

// Ahora
const gltf = await assetLoader.loadGLTF(
    'assets/models/player/Hooded_Adventurer.glb',
    'player'
);
```

**Configuración:**
- Modelo: `Hooded_Adventurer.glb`
- Escala: 1.0
- Posición inicial: (0, 0, 0)

---

## 2. 👥 NPCs con Modelos Específicos

### Cambios en `js/NPCManager.js`:

Se reemplazó el sistema de género por un sistema de asignación específica por NPC ID:

| NPC ID | Nombre | Modelo | Tipo |
|--------|--------|--------|------|
| npc_001 | Don Pedro - Minero Veterano | **Worker.glb** | GLB |
| npc_002 | Doña Rosa - Guardiana de Leyendas | Animated_Woman.glb | GLB |
| npc_003 | Capitán Vargas - Veterano de Guerra | **Solider.glb** | GLB |
| npc_004 | María - Guía del Desierto Florido | Animated_Woman.glb | GLB |
| npc_005 | Don Esteban - Botánico Local | **Farmer.glb** | GLB |
| npc_006 | Capitán Morales - Pescador Artesanal | **Beach_Character.glb** | GLB |
| npc_007 | Elena - Bióloga Marina | Animated_Woman.glb | GLB |
| npc_008 | Abuelo Tomás - Contador de Historias | **Wizardus_Maximus.glb** | GLB |
| npc_009 | Profesora Carla - Historiadora | Animated_Woman.glb | GLB |
| npc_010 | Javier - Guía Turístico | **Male_Casual.fbx** | FBX |
| npc_011 | Sofía - Arqueóloga | Animated_Woman.glb | GLB |
| npc_012 | Valentina - Astrónoma | Animated_Woman.glb | GLB |
| npc_013 | Diego - Viajero Casual | **Beach_Character.glb** | GLB |

### Modelos Implementados:

```javascript
this.npcModels = {
    'npc_001': { // Don Pedro - Minero Veterano
        path: 'assets/models/npcs/Worker.glb',
        type: 'glb',
        scale: 1.0
    },
    'npc_003': { // Capitán Vargas - Veterano de Guerra
        path: 'assets/models/npcs/Solider.glb',
        type: 'glb',
        scale: 1.0
    },
    'npc_005': { // Don Esteban - Botánico Local
        path: 'assets/models/npcs/Farmer.glb',
        type: 'glb',
        scale: 1.0
    },
    'npc_006': { // Capitán Morales - Pescador Artesanal
        path: 'assets/models/npcs/Beach_Character.glb',
        type: 'glb',
        scale: 1.0
    },
    'npc_008': { // Abuelo Tomás - Contador de Historias
        path: 'assets/models/npcs/Wizardus_Maximus.glb',
        type: 'glb',
        scale: 1.0
    },
    'npc_010': { // Javier - Guía Turístico
        path: 'assets/models/npcs/Male_Casual.fbx',
        type: 'fbx',
        scale: 0.01
    },
    'npc_013': { // Diego - Viajero Casual
        path: 'assets/models/npcs/Beach_Character.glb',
        type: 'glb',
        scale: 1.0
    }
};
```

### Nuevo Método:

```javascript
getModelForNPC(npcId) {
    // Retornar modelo específico para este NPC
    return this.npcModels[npcId] || {
        path: 'assets/models/npcs/Adventurer.fbx',
        type: 'fbx',
        scale: 0.01
    };
}
```

---

## 3. 🏔️ Corrección de Altura del Terreno

### Problema:
Los objetos y el jugador se veían flotando sobre el terreno.

### Solución:

#### Cambios en `js/Player.js`:

**Posición inicial del placeholder:**
```javascript
// Antes
this.mesh.position.set(0, 2, 0);

// Ahora
this.mesh.position.set(0, 0, 0);
```

**Límite de caída ajustado:**
```javascript
// Antes
if (this.mesh.position.y < 0) {
    this.mesh.position.y = 0;

// Ahora
if (this.mesh.position.y < 0.5) {
    this.mesh.position.y = 0.5;
```

**Detección de suelo mejorada:**
```javascript
// Antes
this.isGrounded = intersects.length > 0 && intersects[0].distance < 1.2;

// Ahora
this.isGrounded = intersects.length > 0 && intersects[0].distance < 2.0;
```

#### Cambios en `js/NPCManager.js`:

**Posición de NPCs:**
```javascript
// Antes
npcMesh.position.set(data.position.x, 0.9, data.position.z);

// Ahora
npcMesh.position.set(data.position.x, 0, data.position.z);
```

---

## 4. 📝 Notas Técnicas

### Escalas:
- **GLB models:** Escala 1.0 (tamaño natural)
- **FBX models (Mixamo):** Escala 0.01 (ajuste necesario)

### Tipos de Archivo:
- **GLB:** Formato preferido, carga más rápida
- **FBX:** Solo para Male_Casual (npc_010)

### Altura del Suelo:
- **Jugador:** Y = 0.5 (mínimo)
- **NPCs:** Y = 0 (base)
- **Detección:** Distancia < 2.0

---

## 5. 🎨 Modelos Disponibles

### En `assets/models/npcs/`:
- ✅ Worker.glb
- ✅ Solider.glb (nota: typo en nombre del archivo)
- ✅ Farmer.glb
- ✅ Beach_Character.glb
- ✅ Wizardus_Maximus.glb
- ✅ Male_Casual.fbx
- ✅ Animated_Woman.glb
- ✅ Adventurer.fbx (fallback)
- ✅ Business_Man.glb (no usado)

### En `assets/models/player/`:
- ✅ Hooded_Adventurer.glb

---

## 6. 🧪 Cómo Probar

1. **Recarga la página** (F5)
2. Verifica que el jugador sea Hooded_Adventurer
3. Verifica que el jugador NO flote sobre el terreno
4. Camina por el mapa y verifica cada NPC:
   - **Don Pedro** (Copiapó) → Worker
   - **Capitán Vargas** (Copiapó) → Soldier
   - **Don Esteban** (Desierto Florido) → Farmer
   - **Capitán Morales** (Bahía Inglesa) → Beach Character
   - **Abuelo Tomás** (Copiapó) → Wizard
   - **Javier** (Desierto Florido) → Male Casual
   - **Diego** (Bahía Inglesa) → Beach Character

5. Verifica que los NPCs NO floten

---

## 7. ✅ Resultado Final

- ✅ Jugador: Hooded_Adventurer.glb
- ✅ 7 NPCs con modelos específicos
- ✅ Altura del terreno corregida
- ✅ Sin flotación de objetos
- ✅ Sistema de carga por NPC ID
- ✅ Soporte para GLB y FBX

---

## 8. 🐛 Solución de Problemas

### Si un NPC no carga:
- Verifica que el archivo exista en `assets/models/npcs/`
- Revisa la consola del navegador (F12)
- Se creará un placeholder automáticamente

### Si hay flotación:
- Verifica que Y = 0 para NPCs
- Verifica que Y = 0.5 (mínimo) para jugador
- Ajusta `this.isGrounded` si es necesario

### Si Male_Casual.fbx no carga:
- Verifica que FBXLoader esté disponible
- Escala debe ser 0.01
- Tipo debe ser 'fbx'

---

**Estado:** ✅ Completado
**Fecha:** 9 de diciembre de 2025
**Versión:** 4.0
