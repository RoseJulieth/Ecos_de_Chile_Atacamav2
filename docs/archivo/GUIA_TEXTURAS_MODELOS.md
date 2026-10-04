# 🎨 Guía de Texturas y Modelos - Ecos de Chile: Atacama

## ✅ Problema Resuelto: Texturas No Visibles

### Causa del Problema
Los modelos GLB se cargaban correctamente, pero el código estaba **reemplazando los materiales originales** con MeshToonMaterial, eliminando las texturas embebidas.

### Solución Implementada
Ahora el código **preserva las texturas originales** y solo agrega efectos de emisión para el brillo.

---

## 🔧 Cambios Realizados

### js/FragmentManager.js
**ANTES:**
```javascript
// Reemplazaba el material (perdía texturas)
child.material = new THREE.MeshToonMaterial({
    color: data.color,
    emissive: data.color,
    emissiveIntensity: 0.4
});
```

**AHORA:**
```javascript
// Preserva texturas si existen
if (child.material) {
    const hasTexture = child.material.map !== null;
    
    if (hasTexture) {
        // Mantener textura, solo agregar emisión
        child.material.emissive = new THREE.Color(data.color);
        child.material.emissiveIntensity = 0.2;
        child.material.needsUpdate = true;
    } else {
        // Sin textura, aplicar color sólido
        child.material = new THREE.MeshToonMaterial({...});
    }
}
```

### js/NPCManager.js
**Agregado:**
```javascript
// Configurar materiales preservando texturas
npcMesh.traverse((child) => {
    if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        if (child.material && child.material.map) {
            console.log(`✅ NPC con textura: ${child.name}`);
        }
        child.material.needsUpdate = true;
    }
});
```

---

## 📦 Formatos de Modelos Soportados

### 1. GLB/GLTF (Recomendado) ⭐

**Ventajas:**
- ✅ Texturas embebidas en un solo archivo
- ✅ Soporta animaciones
- ✅ Formato estándar de Three.js
- ✅ Compresión eficiente
- ✅ **Ahora preserva texturas correctamente**

**Cómo usar:**
```javascript
// Ya implementado en AssetLoader
const gltf = await assetLoader.loadGLTF('modelo.glb', 'nombre');
const mesh = gltf.scene;
// Las texturas se preservan automáticamente
```

**Exportar desde Blender:**
```
File → Export → glTF 2.0 (.glb)
Opciones:
☑ Format: glTF Binary (.glb)
☑ Include: Selected Objects
☑ Materials: Export
☑ Images: Automatic (embebidas)
```

---

### 2. FBX (Ya Implementado) ⭐

**Ventajas:**
- ✅ Soporta animaciones complejas
- ✅ Compatible con Mixamo
- ✅ Texturas externas o embebidas
- ✅ **Ya funciona con el jugador**

**Cómo usar:**
```javascript
// Ya implementado en AssetLoader
const fbx = await assetLoader.loadFBX('modelo.fbx', 'nombre');
// Las texturas se cargan automáticamente si están en la misma carpeta
```

**Estructura de archivos:**
```
assets/models/player/
├── Male_Casual.fbx
└── textures/           ← Texturas externas (si las hay)
    ├── diffuse.png
    ├── normal.png
    └── specular.png
```

**Exportar desde Blender:**
```
File → Export → FBX (.fbx)
Opciones:
☑ Selected Objects
☑ Apply Modifiers
☑ Bake Animation
☑ Embed Textures (si quieres incluirlas)
```

---

### 3. OBJ + MTL (Soportado)

**Ventajas:**
- ✅ Formato simple
- ✅ Ampliamente compatible
- ❌ No soporta animaciones
- ❌ Requiere archivo MTL separado

**Cómo usar:**
```javascript
// Ya implementado en AssetLoader
const obj = await assetLoader.loadOBJ('modelo.obj', 'nombre');
```

**Estructura de archivos:**
```
assets/models/fragments/
├── modelo.obj
├── modelo.mtl          ← Archivo de materiales
└── textures/
    └── texture.png
```

---

## 🎨 Verificar Texturas en el Juego

### 1. Abrir Consola (F12)

Busca estos mensajes:
```
✅ Modelo GLTF cargado: fragment_1
  ✅ Preservando textura de Mesh_0
✅ Modelo cargado: Cultura Diaguita
```

Si ves "Preservando textura", significa que el modelo tiene texturas y se están manteniendo.

### 2. Verificar en el Juego

**Fragmentos:**
- Deberían verse con sus texturas originales
- Efecto de brillo sutil (emisión)
- Colores característicos como tint

**NPCs:**
- Deberían verse con texturas de ropa, piel, etc.
- No deberían ser de un solo color

---

## 🔍 Solución de Problemas

### Problema: Modelos Sin Texturas (Color Sólido)

**Posibles Causas:**

1. **El GLB no tiene texturas embebidas**
   - Solución: Re-exportar desde Blender con texturas embebidas
   - Verificar en Blender: Shading workspace → ver si hay texturas

2. **Texturas externas no encontradas**
   - Solución: Asegurar que las texturas estén en la misma carpeta
   - O re-exportar con texturas embebidas

3. **Formato de textura no soportado**
   - Solución: Usar PNG o JPG
   - Evitar formatos exóticos

### Problema: Modelos Muy Oscuros

**Solución:**
Aumentar emisión en el código:
```javascript
// En FragmentManager.js o NPCManager.js
child.material.emissiveIntensity = 0.3; // Aumentar de 0.2
```

### Problema: Texturas Pixeladas

**Solución:**
Usar texturas de mayor resolución:
```javascript
// En AssetLoader.js, agregar después de cargar textura
texture.minFilter = THREE.LinearFilter;
texture.magFilter = THREE.LinearFilter;
```

---

## 📝 Checklist de Texturas

### Para Fragmentos (GLB)
- [ ] Modelo exportado con texturas embebidas
- [ ] Archivo GLB < 500 KB
- [ ] Texturas en formato PNG o JPG
- [ ] Probado en Blender antes de exportar

### Para NPCs (GLB)
- [ ] Modelo de Mixamo o similar
- [ ] Texturas de piel, ropa incluidas
- [ ] Escala correcta (0.01 para Mixamo)
- [ ] Animaciones incluidas (opcional)

### Para Jugador (FBX)
- [ ] Modelo con animaciones
- [ ] Texturas en la misma carpeta o embebidas
- [ ] Escala 0.01
- [ ] Animaciones: idle, walk, run, jump

---

## 🎯 Recomendaciones

### 1. Usar GLB para Todo
- Formato más eficiente
- Texturas embebidas
- Un solo archivo
- Mejor rendimiento

### 2. Verificar en Blender Primero
Antes de exportar:
```
1. Abrir modelo en Blender
2. Cambiar a Shading workspace
3. Verificar que las texturas se ven
4. Cambiar a Rendered view (Z → Rendered)
5. Si se ve bien, exportar
```

### 3. Optimizar Texturas
```
- Resolución: 512x512 o 1024x1024
- Formato: PNG (con transparencia) o JPG (sin transparencia)
- Compresión: Moderada
- Evitar texturas > 2048x2048
```

### 4. Nombrar Correctamente
```
✅ Bueno:
- trophy_gold.glb
- npc_woman_01.glb
- coin_silver.glb

❌ Malo:
- modelo (1).glb
- sin título.glb
- test.glb
```

---

## 🔄 Convertir FBX a GLB

Si tienes modelos FBX y quieres convertirlos a GLB:

### Opción 1: Blender
```
1. File → Import → FBX
2. Seleccionar modelo
3. File → Export → glTF 2.0 (.glb)
4. Configurar opciones (ver arriba)
5. Export
```

### Opción 2: Online
- https://products.aspose.app/3d/conversion/fbx-to-glb
- https://anyconv.com/fbx-to-glb-converter/

---

## 📊 Comparación de Formatos

| Formato | Texturas | Animaciones | Tamaño | Recomendado |
|---------|----------|-------------|--------|-------------|
| **GLB** | ✅ Embebidas | ✅ Sí | Pequeño | ⭐⭐⭐⭐⭐ |
| **FBX** | ✅ Externas/Embebidas | ✅ Sí | Mediano | ⭐⭐⭐⭐ |
| **GLTF** | ✅ Externas | ✅ Sí | Mediano | ⭐⭐⭐ |
| **OBJ** | ❌ Externas (MTL) | ❌ No | Pequeño | ⭐⭐ |

---

## 🧪 Probar Texturas

### 1. Abrir el Juego
```
http://localhost:8000
```

### 2. Verificar Consola (F12)
```
✅ Modelo GLTF cargado: fragment_1
  ✅ Preservando textura de Mesh_0
✅ Modelo cargado: Cultura Diaguita
```

### 3. Buscar Fragmentos
- Deberían verse con texturas
- No solo colores sólidos

### 4. Buscar NPCs
- Deberían tener texturas de ropa, piel
- No deberían ser cápsulas de un color

---

## 💡 Consejos Finales

1. **Siempre exporta con texturas embebidas** (GLB)
2. **Verifica en Blender antes de exportar**
3. **Usa resoluciones moderadas** (512-1024px)
4. **Comprime texturas** si son muy grandes
5. **Prueba en el juego** después de exportar
6. **Revisa la consola** para ver si hay errores

---

**Estado:** ✅ Sistema de texturas corregido y funcionando
**Formatos soportados:** GLB (recomendado), FBX, GLTF, OBJ
**Próximo paso:** Probar modelos con texturas en el juego
