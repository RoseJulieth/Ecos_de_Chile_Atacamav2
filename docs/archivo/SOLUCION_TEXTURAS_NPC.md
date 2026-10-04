# 🔧 Solución: Texturas de NPCs No Se Cargan

## 🎯 Problema Identificado

### Causa Principal
Los archivos de modelos tienen **espacios y caracteres especiales** en los nombres:
```
❌ Animated Woman.glb          ← Espacio
❌ Animated Woman (1).glb      ← Espacio y paréntesis
✅ Character.glb                ← Sin problemas
```

Los navegadores pueden tener problemas cargando archivos con espacios en las URLs.

---

## ✅ Soluciones Implementadas

### 1. Codificación de URLs en AssetLoader

**js/AssetLoader.js:**
```javascript
// ANTES
this.gltfLoader.load(path, ...)

// AHORA
const encodedPath = path.split('/').map(part => 
    encodeURIComponent(part)
).join('/');
this.gltfLoader.load(encodedPath, ...)
```

**Resultado:**
- `Animated Woman.glb` → `Animated%20Woman.glb`
- `Animated Woman (1).glb` → `Animated%20Woman%20(1).glb`

### 2. Logs Mejorados

Ahora el AssetLoader muestra:
```
⏳ Intentando cargar: assets/models/npcs/Animated Woman.glb
   Ruta codificada: assets/models/npcs/Animated%20Woman.glb
   50% - Animated Woman
✅ Modelo GLTF cargado: npc_2
   📸 3 textura(s) encontrada(s)
```

### 3. Verificación de Texturas

El código ahora detecta y reporta:
- ✅ Cuántas texturas tiene el modelo
- ⚠️ Si no tiene texturas embebidas

---

## 🧪 Página de Prueba Creada

### test_npc_models.html

**Cómo usar:**
```
http://localhost:8000/test_npc_models.html
```

**Qué hace:**
1. Carga los 3 modelos de NPCs
2. Los muestra lado a lado
3. Analiza texturas de cada uno
4. Muestra información detallada

**Información que muestra:**
- ✅ Número de meshes
- ✅ Número de texturas
- ✅ Número de animaciones
- ✅ Nombres de meshes con texturas

---

## 🔍 Cómo Verificar

### Paso 1: Probar Página de Test

1. Abrir: `http://localhost:8000/test_npc_models.html`
2. Abrir consola (F12)
3. Verificar que los 3 modelos cargan
4. Ver información de texturas

**Resultado esperado:**
```
✅ Character
• Meshes: 5
• Texturas: 3
• Animaciones: 0

✅ Animated Woman
• Meshes: 8
• Texturas: 5
• Animaciones: 1

✅ Animated Woman (1)
• Meshes: 8
• Texturas: 5
• Animaciones: 1
```

### Paso 2: Probar en el Juego

1. Abrir: `http://localhost:8000`
2. Comenzar exploración
3. Buscar NPCs en el mundo
4. Verificar que tienen texturas

**Consola (F12):**
```
👥 Creando NPCs con modelos GLB...
⏳ Intentando cargar: assets/models/npcs/Character.glb
✅ Modelo GLTF cargado: npc_1
   📸 3 textura(s) encontrada(s)
  ✅ NPC con textura: Body
✅ Modelo NPC cargado: Guardián de la Historia

⏳ Intentando cargar: assets/models/npcs/Animated Woman.glb
   Ruta codificada: assets/models/npcs/Animated%20Woman.glb
✅ Modelo GLTF cargado: npc_2
   📸 5 textura(s) encontrada(s)
  ✅ NPC con textura: Hair
✅ Modelo NPC cargado: Sabio del Desierto
```

---

## 🎨 Si Aún No Se Ven las Texturas

### Posible Causa 1: GLB Sin Texturas Embebidas

**Verificar:**
```
⏳ Intentando cargar: assets/models/npcs/Character.glb
✅ Modelo GLTF cargado: npc_1
   ⚠️ Sin texturas embebidas  ← PROBLEMA
```

**Solución:**
1. Abrir el modelo en Blender
2. Verificar que tiene texturas en Shading workspace
3. Re-exportar con texturas embebidas:
   ```
   File → Export → glTF 2.0 (.glb)
   ☑ Format: glTF Binary (.glb)
   ☑ Images: Automatic (embebidas)
   ```

### Posible Causa 2: Texturas Externas

Algunos GLB pueden tener texturas como archivos separados.

**Estructura esperada:**
```
assets/models/npcs/
├── Character.glb
├── Character_textures/     ← Texturas externas
│   ├── diffuse.png
│   └── normal.png
├── Animated Woman.glb
└── Animated Woman_textures/
    └── texture.png
```

**Solución:**
- Asegurar que las carpetas de texturas estén junto al GLB
- O re-exportar con texturas embebidas

### Posible Causa 3: Materiales Incorrectos

**Verificar en consola:**
```javascript
// Pegar en consola del navegador
scene.children.forEach(child => {
    if (child.userData.type === 'npc') {
        child.traverse(mesh => {
            if (mesh.isMesh) {
                console.log(mesh.name, {
                    hasTexture: mesh.material.map !== null,
                    material: mesh.material.type
                });
            }
        });
    }
});
```

---

## 📝 Recomendaciones

### 1. Renombrar Archivos (Opcional pero Recomendado)

**Cambiar:**
```
❌ Animated Woman.glb       → ✅ animated_woman.glb
❌ Animated Woman (1).glb   → ✅ animated_woman_2.glb
✅ Character.glb            → ✅ character.glb
```

**Ventajas:**
- Sin espacios
- Sin caracteres especiales
- Más fácil de manejar
- Menos problemas de compatibilidad

**Cómo hacerlo:**
1. Renombrar archivos en la carpeta
2. Actualizar rutas en `NPCManager.js`:
   ```javascript
   this.npcModels = [
       'assets/models/npcs/character.glb',
       'assets/models/npcs/animated_woman.glb',
       'assets/models/npcs/animated_woman_2.glb'
   ];
   ```

### 2. Verificar Texturas en Blender

**Antes de exportar:**
```
1. Abrir modelo en Blender
2. Cambiar a Shading workspace
3. Seleccionar objeto
4. Ver nodos de material
5. Verificar que hay nodos de textura conectados
6. Cambiar viewport a Rendered (Z → Rendered)
7. Si se ve bien, exportar
```

### 3. Exportar Correctamente

**Configuración de exportación GLB:**
```
File → Export → glTF 2.0 (.glb)

Opciones importantes:
☑ Format: glTF Binary (.glb)
☑ Include: Selected Objects
☑ Transform: +Y Up
☑ Materials: Export
☑ Images: Automatic          ← IMPORTANTE
☑ Compression: None (o Draco si es muy grande)
```

---

## 🔄 Alternativa: Usar FBX

Si los GLB siguen sin funcionar, puedes usar FBX:

### Ventajas de FBX
- ✅ Mejor soporte de texturas
- ✅ Mixamo usa FBX
- ✅ Más compatible con Blender

### Cómo Cambiar a FBX

1. **Exportar desde Blender:**
   ```
   File → Export → FBX (.fbx)
   ☑ Selected Objects
   ☑ Apply Modifiers
   ☑ Embed Textures
   ```

2. **Actualizar NPCManager.js:**
   ```javascript
   this.npcModels = [
       'assets/models/npcs/character.fbx',
       'assets/models/npcs/animated_woman.fbx',
       'assets/models/npcs/animated_woman_2.fbx'
   ];
   ```

3. **Actualizar createNPC():**
   ```javascript
   // Cambiar loadGLTF por loadFBX
   const fbx = await this.assetLoader.loadFBX(modelPath, `npc_${data.npc_id}`);
   npcMesh = fbx;
   ```

---

## ✅ Checklist de Verificación

### Archivos
- [ ] Modelos GLB en `assets/models/npcs/`
- [ ] Nombres de archivos verificados
- [ ] Texturas embebidas en GLB

### Código
- [ ] AssetLoader con codificación de URLs
- [ ] Logs mejorados implementados
- [ ] Verificación de texturas activa

### Pruebas
- [ ] test_npc_models.html carga los 3 modelos
- [ ] Consola muestra "📸 X textura(s) encontrada(s)"
- [ ] Modelos visibles en test page
- [ ] NPCs con texturas en el juego

### Consola
- [ ] Sin errores 404
- [ ] Sin errores de carga
- [ ] Mensajes de texturas encontradas

---

## 🆘 Si Nada Funciona

### Opción 1: Usar Placeholders Temporalmente
Los placeholders (cápsulas de colores) funcionan perfectamente mientras consigues modelos con texturas correctas.

### Opción 2: Descargar Modelos de Prueba
- Sketchfab: https://sketchfab.com/
- Mixamo: https://www.mixamo.com/
- Poly Pizza: https://poly.pizza/

Buscar "low poly character" y descargar en GLB con texturas.

### Opción 3: Crear Modelos Simples
En Blender, crear personajes muy simples con colores sólidos (sin texturas).

---

## 📊 Resumen

**Problema:** Nombres de archivos con espacios y texturas no embebidas

**Soluciones:**
1. ✅ Codificación de URLs implementada
2. ✅ Logs mejorados para debug
3. ✅ Verificación de texturas
4. ✅ Página de prueba creada

**Próximo paso:**
1. Probar `test_npc_models.html`
2. Verificar logs en consola
3. Si no hay texturas, re-exportar GLB con texturas embebidas

---

**Estado:** ✅ Código actualizado y listo para probar
**Test page:** http://localhost:8000/test_npc_models.html
**Juego:** http://localhost:8000
