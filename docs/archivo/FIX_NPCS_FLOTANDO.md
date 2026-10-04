# Fix: NPCs Flotando en el Cielo

## Problema Identificado
Los NPCs estaban flotando en el cielo porque los modelos GLB tienen su punto de pivote (origin) en el centro o parte superior del modelo, no en los pies.

### Causa Raíz
- Cuando posicionábamos `npcMesh.position.y = 0`, el **centro** del modelo quedaba en Y=0
- Si el modelo mide 20 unidades de alto, sus pies quedaban en Y=-10 (bajo tierra) o Y=10 (en el aire)
- Los offsets manuales (-10) no funcionaban porque cada modelo tiene diferente altura y pivot point

## Solución Implementada

### 1. Cálculo Automático de Offset
Ahora calculamos dinámicamente el offset necesario para cada NPC:

```javascript
// Calcular bounding box del modelo
const bbox = new THREE.Box3().setFromObject(npcMesh);
const modelHeight = bbox.max.y - bbox.min.y;

// Calcular offset para que los pies toquen Y=0
const yOffset = -bbox.min.y; // Sube el modelo para que su parte inferior esté en Y=0

npcMesh.position.set(data.position.x, yOffset, data.position.z);
```

### 2. Indicadores Relativos
Los indicadores ahora se posicionan relativamente a la altura del modelo:

```javascript
const indicatorY = modelHeight + 2;  // 2 unidades sobre la cabeza
indicator.position.y = indicatorY;
indicator.userData.baseY = indicatorY;  // Para animación de flotación
```

### 3. Eliminación de Offsets Hardcodeados
Removimos todos los `yOffset: -10` de la configuración de modelos, ya que ahora se calculan automáticamente.

## Archivos Modificados
- `js/NPCManager.js`

## Cambios Específicos

### Antes:
```javascript
// Offsets manuales que no funcionaban
'npc_001': {
    path: 'assets/models/npcs/Worker.glb',
    type: 'glb',
    scale: 1.5,
    yOffset: -10  // ❌ No funciona para todos los modelos
}

// Posicionamiento fijo
npcMesh.position.set(data.position.x, yOffset, data.position.z);
```

### Después:
```javascript
// Sin offsets manuales
'npc_001': {
    path: 'assets/models/npcs/Worker.glb',
    type: 'glb',
    scale: 1.5  // ✅ Solo escala
}

// Cálculo automático del offset
const bbox = new THREE.Box3().setFromObject(npcMesh);
const yOffset = -bbox.min.y;
npcMesh.position.set(data.position.x, yOffset, data.position.z);
```

## Resultado Esperado
- ✅ Todos los NPCs ahora están con los pies en el suelo (Y=0)
- ✅ Los indicadores están correctamente posicionados sobre sus cabezas
- ✅ Funciona para cualquier modelo GLB/FBX independientemente de su pivot point
- ✅ Las animaciones de saludo funcionan correctamente
- ✅ Los NPCs miran al jugador cuando se acerca

## Cómo Probar
1. Recargar la página (F5)
2. Iniciar el juego
3. Acercarse a cualquier NPC
4. Verificar que:
   - Los NPCs están en el suelo, no flotando
   - Los indicadores están sobre sus cabezas
   - Las animaciones de saludo funcionan
   - Los NPCs rotan para mirar al jugador

## Notas Técnicas
- `Box3.setFromObject()` calcula el bounding box en coordenadas del mundo
- `bbox.min.y` es la coordenada Y más baja del modelo (los pies)
- Si `bbox.min.y = -10`, significa que los pies están 10 unidades bajo el pivot
- Al aplicar `yOffset = -bbox.min.y = 10`, subimos el modelo 10 unidades
- Resultado: los pies quedan en Y=0 (suelo)

## Estado
✅ **COMPLETADO** - Los NPCs ahora se posicionan correctamente en el suelo
