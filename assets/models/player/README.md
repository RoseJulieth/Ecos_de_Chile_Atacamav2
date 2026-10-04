# 🎮 Modelos del Jugador

## 📋 Archivos Necesarios

### Opción 1: GLTF/GLB (Recomendado)
```
player.glb              # Modelo con animaciones incluidas
```

### Opción 2: OBJ + Texturas
```
player.obj              # Modelo 3D
player.mtl              # Archivo de materiales
player_diffuse.png      # Textura de color
player_normal.png       # Mapa de normales (opcional)
```

## 🎬 Animaciones Requeridas

Si usas GLTF, el modelo debe incluir estas animaciones:

1. **idle** - Reposo/respiración
2. **walk** - Caminar
3. **run** - Correr
4. **jump** - Saltar

## 📐 Especificaciones Técnicas

- **Altura:** ~1.8 unidades (representa ~1.8 metros)
- **Polígonos:** 1,000 - 5,000 (low-poly)
- **Orientación:** Mirando hacia +Z
- **Escala:** 1 unidad = 1 metro
- **Pivot:** En los pies del personaje

## 🔧 Preparación en Blender

### 1. Modelado
```
- Mantén el modelo simple (low-poly)
- Usa modificador Subdivision Surface si necesitas más detalle
- Aplica todas las transformaciones (Ctrl+A)
```

### 2. Animación con Mixamo
```
1. Exporta el modelo como FBX
2. Sube a Mixamo.com
3. Descarga animaciones:
   - Idle
   - Walking
   - Running
   - Jumping
4. Importa de vuelta a Blender
```

### 3. Exportación
```
Archivo → Exportar → glTF 2.0 (.glb)

Opciones:
☑ Include: Selected Objects
☑ Transform: +Y Up
☑ Geometry: Apply Modifiers
☑ Animation: Export Animations
☑ Compression: Draco (opcional)
```

## 💻 Uso en el Código

```javascript
// En index.html, después de crear el AssetLoader
const playerGLTF = await assetLoader.loadGLTF(
    'assets/models/player/player.glb',
    'player'
);

// Reemplazar el placeholder del jugador
player.mesh.remove();
player.mesh = playerGLTF.scene;
player.mesh.scale.set(1, 1, 1);
scene.add(player.mesh);

// Configurar animaciones
const animController = new AnimationController(
    player.mesh,
    playerGLTF.animations
);
player.setAnimationController(animController);
```

## 📦 Ejemplo de Estructura

```
player/
├── player.glb                  # Modelo completo con animaciones
├── player_diffuse.png          # Textura (si usas OBJ)
└── README.md                   # Este archivo
```

## 🎨 Estilo Visual

- **Cel-Shading:** El modelo se renderizará con estilo cartoon
- **Colores:** Tonos cálidos que combinen con el desierto
- **Detalles:** Mantén los detalles simples pero reconocibles

## ✅ Checklist

- [ ] Modelo exportado en formato GLTF/GLB
- [ ] 4 animaciones incluidas (idle, walk, run, jump)
- [ ] Escala correcta (1.8 unidades de altura)
- [ ] Orientación correcta (mirando +Z)
- [ ] Texturas optimizadas (512x512 o 1024x1024)
- [ ] Archivo < 5MB
- [ ] Probado en el juego

## 🔗 Recursos

- [Mixamo](https://www.mixamo.com/) - Animaciones gratuitas
- [Tutorial Blender → GLTF](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
