# NPCs con Placeholders - Siempre Visibles

## 🎯 Problema Solucionado

Los NPCs no se veían si los modelos GLB no cargaban correctamente.

## ✅ Solución Implementada

### 1. Sistema de Fallback Mejorado

Ahora el sistema tiene 3 niveles de seguridad:

```
1. Intentar cargar modelo GLB
   ↓ (si falla)
2. Crear placeholder con color según tipo
   ↓ (si falla)
3. Crear placeholder de emergencia
```

### 2. Placeholders Visibles

Los NPCs que no cargan como GLB aparecen como **cápsulas de colores**:

| Tipo de Diálogo | Color | Icono |
|-----------------|-------|-------|
| **Historia** | Marrón (#8B4513) | 📜 |
| **Leyenda** | Morado (#9370DB) | ✨ |
| **Turismo** | Turquesa (#20B2AA) | 🗺️ |
| **Paisaje** | Verde (#32CD32) | 🌄 |

### 3. Etiquetas de Nombre

Los placeholders tienen una etiqueta flotante con el nombre del NPC:
- Fondo negro semi-transparente
- Texto blanco
- Posición: 3.5 unidades sobre el NPC

### 4. Fix del npc_id

El JSON usa IDs como "npc_001", ahora el código extrae correctamente el número:
```javascript
const npcNumber = parseInt(data.npc_id.replace('npc_', ''));
```

## 📊 10 NPCs Implementados

Todos los NPCs del JSON están implementados:

| # | Nombre | Tipo | Posición | Color |
|---|--------|------|----------|-------|
| 1 | Don Pedro - Minero Veterano | Historia | (-10, 5) | Marrón |
| 2 | Doña Rosa - Guardiana de Leyendas | Leyenda | (8, -8) | Morado |
| 3 | Capitán Vargas - Veterano de Guerra | Historia | (-18, 18) | Marrón |
| 4 | María - Guía del Desierto Florido | Paisaje | (22, -22) | Verde |
| 5 | Don Esteban - Botánico Local | Historia | (28, -18) | Marrón |
| 6 | Capitán Morales - Pescador Artesanal | Historia | (-3, -33) | Marrón |
| 7 | Elena - Bióloga Marina | Turismo | (4, -37) | Turquesa |
| 8 | Abuelo Tomás - Contador de Historias | Leyenda | (5, 12) | Morado |
| 9 | Profesora Carla - Historiadora | Historia | (-5, -5) | Marrón |
| 10 | Javier - Guía Turístico | Turismo | (20, -28) | Turquesa |

## 🎮 Contenido Educativo

### Historia (6 NPCs)
- **Don Pedro**: Minas de Chañarcillo, descubrimiento de plata 1832
- **Capitán Vargas**: Batallón Atacama, Guerra del Pacífico
- **Don Esteban**: Semillas del desierto, adaptación
- **Capitán Morales**: Bahía Inglesa, corsarios, changos
- **Profesora Carla**: Fundación de Copiapó, primer ferrocarril
- **Abuelo Tomás**: Cultura Diaguita, jarros-pato

### Leyenda (2 NPCs)
- **Doña Rosa**: Leyenda de la Añañuca
- **Abuelo Tomás**: Pueblo Diaguita

### Turismo (2 NPCs)
- **Elena**: Bahía Inglesa, biodiversidad marina
- **Javier**: Parque Nacional Llanos de Challe

### Paisaje (1 NPC)
- **María**: Desierto Florido, fenómeno natural

## 🧪 Cómo Verificar

### 1. Recargar el Juego
```
Ctrl + F5 en http://localhost:8000
```

### 2. Consola (F12)
Deberías ver:
```
👥 Creando NPCs con modelos GLB...

⏳ Cargando NPC 1: assets/models/npcs/Character.glb
[Si carga] ✅ Modelo NPC cargado: Don Pedro - Minero Veterano
[Si falla] ⚠️ No se pudo cargar assets/models/npcs/Character.glb
          📦 Creando placeholder para: Don Pedro - Minero Veterano
          📝 Etiqueta de nombre agregada: Don Pedro - Minero Veterano

[... repetir para 10 NPCs ...]

✅ 10 NPCs creados en el mundo
```

### 3. En el Juego
Deberías ver:
- ✅ **10 NPCs** distribuidos por el mapa
- ✅ **Iconos flotantes** sobre cada NPC
- ✅ **Cápsulas de colores** (si son placeholders)
- ✅ **Etiquetas con nombres** (si son placeholders)
- ✅ **Modelos 3D** (si los GLB cargan correctamente)

## 🎨 Apariencia

### Con Modelo GLB (si carga):
```
     📜 (icono flotante)
      |
   [Modelo 3D]
      |
   ===suelo===
```

### Con Placeholder (si no carga):
```
  Don Pedro - Minero Veterano (etiqueta)
            |
         📜 (icono)
            |
      [Cápsula marrón]
            |
        ===suelo===
```

## 🔧 Tamaños

- **Cápsula**: 0.4 radio, 1.4 altura
- **Icono**: 0.8 x 0.8 unidades
- **Etiqueta**: 2 x 0.5 unidades
- **Posición icono**: Y = 2.5
- **Posición etiqueta**: Y = 3.5

## 🎯 Interacción

Todos los NPCs son interactuables:
1. **Acércate** al NPC (< 3 unidades)
2. **Presiona E** para interactuar
3. **Lee el diálogo** educativo
4. **Presiona E** de nuevo para cerrar

## 📍 NPCs Más Cercanos al Centro

Para probar rápidamente:
1. **Profesora Carla** (-5, -5) - ~7 unidades
2. **Don Pedro** (-10, 5) - ~11 unidades
3. **Doña Rosa** (8, -8) - ~11 unidades

## ✅ Garantías

Con estos cambios:
- ✅ **Siempre se crean 10 NPCs** (con o sin modelos GLB)
- ✅ **Siempre son visibles** (placeholders si es necesario)
- ✅ **Siempre son interactuables** (userData completo)
- ✅ **Siempre tienen iconos** (según tipo de diálogo)
- ✅ **Placeholders tienen nombres** (etiqueta flotante)

## 🚀 Ventajas

1. **Desarrollo**: Puedes probar sin tener los modelos GLB
2. **Debug**: Fácil identificar qué NPCs son placeholders
3. **Educativo**: Todos los diálogos funcionan igual
4. **Visual**: Colores ayudan a identificar tipos de contenido
5. **Robusto**: El juego nunca falla por modelos faltantes

## 📝 Archivos Modificados

- `js/NPCManager.js`:
  - Fix del npc_id (string a número)
  - Sistema de fallback mejorado
  - Método createNameLabel()
  - Etiquetas para placeholders

## 🎓 Contenido Educativo Completo

Todos los diálogos están en `data/npcDialogs.json`:
- ✅ 10 NPCs con información histórica
- ✅ Temas: minería, guerra, leyendas, naturaleza, turismo
- ✅ Lugares: Copiapó, Desierto Florido, Bahía Inglesa
- ✅ Cultura: Diaguitas, Añañuca, Batallón Atacama

---

**Estado**: ✅ NPCs siempre visibles con sistema de fallback
**Garantía**: 10 NPCs funcionales con o sin modelos GLB
**Listo para**: Prueba inmediata
