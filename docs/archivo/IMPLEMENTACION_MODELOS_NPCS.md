# Implementación de Modelos NPCs - GLB y FBX

## ✅ Modelos Implementados

### Modelos Disponibles:
- **Adventurer.fbx** → NPCs masculinos
- **Animated_Woman.glb** → NPCs femeninos

## 🎯 Sistema de Asignación por Género

### Detección Automática:
El sistema detecta el género basándose en el nombre del NPC:

```javascript
Femenino: "Doña", "María", "Elena", "Profesora"
Masculino: Todos los demás
```

### Distribución de NPCs:

| # | Nombre | Género | Modelo |
|---|--------|--------|--------|
| 1 | Don Pedro | Masculino | Adventurer.fbx |
| 2 | Doña Rosa | **Femenino** | Animated_Woman.glb |
| 3 | Capitán Vargas | Masculino | Adventurer.fbx |
| 4 | María | **Femenino** | Animated_Woman.glb |
| 5 | Don Esteban | Masculino | Adventurer.fbx |
| 6 | Capitán Morales | Masculino | Adventurer.fbx |
| 7 | Elena | **Femenino** | Animated_Woman.glb |
| 8 | Abuelo Tomás | Masculino | Adventurer.fbx |
| 9 | Profesora Carla | **Femenino** | Animated_Woman.glb |
| 10 | Javier | Masculino | Adventurer.fbx |

**Resultado**: 6 masculinos (FBX) + 4 femeninos (GLB)

## 🔧 Implementación Técnica

### 1. Estructura de Modelos
```javascript
this.npcModels = {
    male: { 
        path: 'assets/models/npcs/Adventurer.fbx', 
        type: 'fbx',
        scale: 0.01 
    },
    female: { 
        path: 'assets/models/npcs/Animated_Woman.glb', 
        type: 'glb',
        scale: 0.01 
    }
};
```

### 2. Detección de Género
```javascript
determineGender(npcName) {
    const femaleNames = ['Doña', 'María', 'Elena', 'Profesora'];
    const isFemale = femaleNames.some(name => npcName.includes(name));
    return isFemale ? 'female' : 'male';
}
```

### 3. Carga Dinámica
```javascript
if (modelType === 'fbx') {
    // Cargar FBX con FBXLoader
    loadedModel = await this.assetLoader.loadFBX(modelPath, `npc_${npcNumber}`);
} else {
    // Cargar GLB con GLTFLoader
    const gltf = await this.assetLoader.loadGLTF(modelPath, `npc_${npcNumber}`);
    npcMesh = gltf.scene;
}
```

## 📊 Características

### Escala
- **Ambos modelos**: 0.01 (tamaño humano realista ~1.8m)

### Texturas
- **Preservadas**: Se mantienen las texturas originales de los modelos
- **Emisión**: Intensidad 0.1 para mejor visibilidad

### Sombras
- **castShadow**: true
- **receiveShadow**: true

### Sistema de Fallback
Si un modelo no carga:
1. Intenta cargar el modelo (FBX o GLB)
2. Si falla → Crea placeholder con color según tipo de diálogo
3. Si falla → Crea placeholder de emergencia

## 🧪 Logs en Consola

Al cargar el juego verás:
```
👥 Creando NPCs con modelos GLB y FBX...

👤 NPC 1: Don Pedro - Minero Veterano (male)
⏳ Cargando FBX: assets/models/npcs/Adventurer.fbx
✅ Modelo FBX cargado: Don Pedro - Minero Veterano (X texturas)

👤 NPC 2: Doña Rosa - Guardiana de Leyendas (female)
⏳ Cargando GLB: assets/models/npcs/Animated_Woman.glb
✅ Modelo GLB cargado: Doña Rosa - Guardiana de Leyendas (X texturas)

[... 8 NPCs más ...]

✅ 10 NPCs creados en el mundo
```

## 🎮 Verificación en el Juego

### Qué Deberías Ver:
1. **6 NPCs masculinos** con modelo Adventurer (FBX)
2. **4 NPCs femeninos** con modelo Animated_Woman (GLB)
3. **Iconos flotantes** sobre todos los NPCs
4. **Texturas preservadas** de los modelos originales
5. **Tamaños proporcionales** (escala 0.01)

### NPCs Femeninos (más fáciles de identificar):
- **Doña Rosa** (8, -8)
- **María** (22, -22)
- **Elena** (4, -37)
- **Profesora Carla** (-5, -5) ← Más cercana

## 🔍 Diferencias Visuales

### Adventurer.fbx (Masculino):
- Modelo de aventurero/explorador
- Estilo más robusto
- Texturas de ropa de exploración

### Animated_Woman.glb (Femenino):
- Modelo femenino animado
- Estilo más estilizado
- Texturas de ropa casual/formal

## ⚙️ Archivos Modificados

### js/NPCManager.js
- ✅ Sistema de modelos por género
- ✅ Método `determineGender()`
- ✅ Carga dinámica FBX/GLB
- ✅ Logs mejorados con género

### js/AssetLoader.js
- ✅ Ya tiene `loadFBX()` implementado
- ✅ Ya tiene `loadGLTF()` implementado
- ✅ Sistema de placeholders funcional

## 🚀 Ventajas del Sistema

1. **Diversidad Visual**: 2 modelos diferentes (masculino/femenino)
2. **Automático**: Detecta género por nombre
3. **Robusto**: Fallback a placeholders si falla
4. **Flexible**: Fácil agregar más modelos
5. **Educativo**: Variedad visual mejora la experiencia

## 📝 Notas Técnicas

### FBX vs GLB:
- **FBX**: Formato de Autodesk, soporta animaciones complejas
- **GLB**: Formato glTF binario, más ligero y web-optimizado
- **Ambos**: Soportados por Three.js con loaders específicos

### Escala 0.01:
- Modelos Mixamo vienen en escala 100x
- 0.01 los reduce a tamaño humano realista
- 1 unidad del juego ≈ 1 metro

## ✅ Checklist de Verificación

- [ ] Servidor corriendo (http://localhost:8000)
- [ ] Página recargada (Ctrl + F5)
- [ ] Consola abierta (F12)
- [ ] Ver logs de carga FBX/GLB
- [ ] 10 NPCs creados
- [ ] NPCs masculinos visibles
- [ ] NPCs femeninos visibles
- [ ] Texturas cargadas
- [ ] Interacción funcional (tecla E)

## 🎯 Próximos Pasos

1. **Recargar el juego** (Ctrl + F5)
2. **Verificar consola** para ver carga de modelos
3. **Buscar NPCs** en el mapa
4. **Probar interacción** con tecla E
5. **Verificar diferencias** entre modelos masculinos/femeninos

---

**Estado**: ✅ Modelos FBX y GLB implementados
**NPCs**: 6 masculinos (FBX) + 4 femeninos (GLB)
**Listo para**: Prueba inmediata
