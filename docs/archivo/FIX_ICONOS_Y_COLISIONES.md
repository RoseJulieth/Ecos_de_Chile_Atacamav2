# Fix Iconos de NPCs y Sistema de Colisiones

## Problemas Solucionados

### 1. Iconos de NPCs Flotando ✅

**Problema**: Los iconos estaban muy altos en el cielo
**Causa**: `modelHeight + 2` con modelos escalados (2.5-3.0) resultaba en alturas de 10+ unidades

**Solución Aplicada**:
```javascript
// Antes: Altura fija
const indicatorY = modelHeight + 2;  // Muy alto

// Después: Altura proporcional
const indicatorY = modelHeight * 0.6;  // 60% de la altura (cerca de la cabeza)
```

**Archivo**: `js/NPCManager.js`

### 2. Sistema de Colisiones Completo ✅

**Problema**: El jugador atravesaba objetos y podía salir del mapa
**Solución**: Sistema completo de detección de colisiones

#### A. Límites del Mapa
```javascript
// Terreno 200x200 centrado en (0,0)
const mapLimit = 95; // Límite con margen de seguridad
const clampedX = Math.max(-mapLimit, Math.min(mapLimit, newX));
const clampedZ = Math.max(-mapLimit, Math.min(mapLimit, newZ));
```

#### B. Colisiones con Objetos
```javascript
// Sistema de radio de colisión
const playerRadius = 1.5;
const distance = player.position.distanceTo(obstacle.position);

if (distance < (playerRadius + obstacleRadius)) {
    // Revertir movimiento
    player.position.copy(oldPosition);
}
```

#### C. Radios de Colisión por Tipo
| Tipo | Radio | Descripción |
|------|-------|-------------|
| rock | 3.0 | Rocas decorativas |
| house | 8.0 | Casas grandes |
| npc | 1.0 | NPCs |
| tree | 2.5 | Árboles (futuro) |
| default | 2.0 | Objetos genéricos |

## Archivos Modificados

### 1. `js/NPCManager.js` ✅
- **Iconos ajustados**: `modelHeight * 0.6` (cerca de la cabeza)
- **Etiquetas ajustadas**: `modelHeight * 0.7` (sobre el icono)

### 2. `js/Player.js` ✅
- **Parámetro agregado**: `obstacles = []` en `update()`
- **Límites del mapa**: Clamp X,Z entre -95 y +95
- **Sistema de colisiones**: Detección por radio con revert de posición
- **Rotación inteligente**: Solo rota si realmente se movió

### 3. `js/WorldBuilder.js` ✅
- **Propiedad agregada**: `this.rocks = []`
- **userData en rocas**: `{ type: 'rock', radius: rockSize }`
- **Almacenamiento**: Rocas guardadas en array para colisiones

### 4. `js/ZoneManager.js` ✅
- **Propiedad agregada**: `this.houses = []`
- **userData en casas**: `{ type: 'house', radius: 8.0 }`
- **Placeholders incluidos**: También tienen userData de colisión

### 5. `index.html` ✅
- **Lista de obstáculos**: NPCs + rocas + casas
- **Llamada actualizada**: `player.update(..., obstacles)`

## Configuración Final

### Iconos de NPCs
```javascript
// Posición del icono: 60% de la altura del modelo
const indicatorY = modelHeight * 0.6;

// Ejemplos con escalas actuales:
// - Escala 0.8: Altura ~2u → Icono a ~1.2u
// - Escala 2.5: Altura ~6u → Icono a ~3.6u  
// - Escala 3.0: Altura ~7u → Icono a ~4.2u
```

### Sistema de Colisiones
```javascript
// Jugador
const playerRadius = 1.5;

// Límites del mapa
const mapLimit = 95; // Terreno 200x200

// Obstáculos detectados:
// - 20 rocas (radio variable 0.3-1.5)
// - 4 casas (radio 8.0)
// - 13 NPCs (radio 1.0)
```

## Beneficios

### Iconos Mejorados
1. **Visibilidad correcta**: Iconos cerca de las cabezas, no en el cielo
2. **Proporcional**: Se ajusta automáticamente a cualquier escala
3. **Consistente**: Funciona igual para todos los modelos

### Colisiones Robustas
1. **No atravesar objetos**: Rocas, casas y NPCs son sólidos
2. **Límites del mapa**: No se puede salir del terreno
3. **Movimiento suave**: Revert instantáneo sin glitches
4. **Rendimiento optimizado**: Solo verifica objetos visibles
5. **Extensible**: Fácil agregar nuevos tipos de obstáculos

## Verificación

### Iconos de NPCs
- [ ] Los iconos están cerca de las cabezas de los NPCs
- [ ] No flotan en el cielo
- [ ] Se ven proporcionados con diferentes escalas
- [ ] La animación de flotación funciona correctamente

### Sistema de Colisiones
- [ ] No se puede atravesar rocas
- [ ] No se puede atravesar casas
- [ ] No se puede atravesar NPCs
- [ ] No se puede salir del mapa (límites -95 a +95)
- [ ] El movimiento se siente natural (no pegajoso)
- [ ] La rotación del jugador funciona correctamente

## Notas Técnicas

### Optimización de Colisiones
- Solo verifica objetos `visible: true`
- Usa `distanceTo()` para cálculo rápido
- Revert de posición en lugar de física compleja
- Array de obstáculos se recrea cada frame (podría optimizarse)

### Escalabilidad
- Sistema fácil de extender con nuevos tipos
- userData permite configuración por objeto
- Radios configurables por tipo de obstáculo

### Limitaciones Actuales
- Colisiones circulares (no considera forma real del objeto)
- No hay colisiones verticales (solo X,Z)
- No hay física de rebote, solo bloqueo

### Posibles Mejoras Futuras
- Colisiones por bounding box
- Física de rebote suave
- Sonidos de colisión
- Efectos visuales de impacto
- Optimización con spatial partitioning

El sistema ahora proporciona una experiencia de juego sólida con iconos bien posicionados y colisiones realistas.