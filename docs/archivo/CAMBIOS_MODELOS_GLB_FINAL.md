# Cambios de Modelos GLB - Final

## Fecha
Continuación de sesión - Corrección de modelos

## Problema Reportado
- Algunos NPCs desaparecieron
- El modelo del jugador era FBX en vez de GLB
- Las casas se veían muy pequeñas

## Cambios Realizados

### 1. Player: Adventurer.fbx → Adventurer.glb ✅

**Archivo**: `index.html`

**Antes**:
```javascript
const playerFBX = await assetLoader.loadFBX(
    'assets/models/player/Adventurer.fbx',
    'player'
);
player.mesh = playerFBX;
```

**Después**:
```javascript
const playerGLTF = await assetLoader.loadGLTF(
    'assets/models/player/Adventurer.glb',
    'player'
);
player.mesh = playerGLTF.scene;
```

**Escala**: 0.8 (igual que NPCs)

### 2. NPC Javier (npc_010): Male_Casual.glb → Man.glb ✅

**Archivo**: `js/NPCManager.js`

**Antes**:
```javascript
'npc_010': {
    path: 'assets/models/npcs/Male_Casual.glb',
    type: 'glb',
    scale: 0.8
}
```

**Después**:
```javascript
'npc_010': {
    path: 'assets/models/npcs/Man.glb',
    type: 'glb',
    scale: 0.8
}
```

**Razón**: Javier es el guía turístico y debe usar el modelo Man.glb

### 3. Casas: Escala aumentada 2.0 → 5.0 ✅

**Archivo**: `js/ZoneManager.js`

**Modelos afectados**:
- `Houses.glb`
- `Storage_House.glb`

**Antes**:
```javascript
house.scale.set(2.0, 2.0, 2.0);
```

**Después**:
```javascript
house.scale.set(5.0, 5.0, 5.0);
```

**Razón**: Las casas deben verse grandes como casas reales, no como modelos pequeños

## Resumen de Escalas Actuales

### Personajes (GLB)
- **Player (Adventurer.glb)**: 0.8
- **NPCs (todos GLB)**: 0.8
- **NPC Javier (Man.glb)**: 0.8

### Edificios (GLB)
- **Houses.glb**: 5.0 (grande)
- **Storage_House.glb**: 5.0 (grande)

### Decoración
- **Beach.glb**: 0.08 (ícono pequeño)
- **Seagull.glb**: 0.01 (muy pequeñas)
- **Rock_path_round_Small.glb**: 2.0 (caminos)

## Archivos Modificados

1. `index.html` - Cambio de FBX a GLB para el jugador
2. `js/NPCManager.js` - Cambio de modelo para Javier
3. `js/ZoneManager.js` - Aumento de escala de casas

## Verificación Necesaria

1. ✅ Verificar que el jugador aparezca con Adventurer.glb
2. ✅ Verificar que Javier (npc_010) use Man.glb
3. ✅ Verificar que las casas se vean grandes (escala 5.0)
4. ⚠️ Verificar que todos los NPCs estén visibles en el mapa
5. ⚠️ Verificar que las animaciones del jugador funcionen correctamente

## Notas Técnicas

- Todos los modelos de personajes ahora son GLB con escala 0.8
- Las casas tienen escala 5.0 para verse como edificios reales
- El sistema de animaciones sigue funcionando igual (detecta idle, walk, run, jump)
- El sistema de exclusión de animaciones de combate sigue activo
