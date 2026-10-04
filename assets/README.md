# 📦 Assets - Ecos de Chile: Atacama

Esta carpeta contiene todos los recursos visuales del juego.

## 📁 Estructura de Carpetas

```
assets/
├── models/              # Modelos 3D
│   ├── player/         # Modelo del jugador
│   ├── npcs/           # Modelos de NPCs
│   └── fragments/      # Modelos de fragmentos históricos
│
└── textures/           # Texturas e imágenes
    ├── terrain/        # Texturas del terreno
    ├── characters/     # Texturas de personajes
    └── ui/             # Imágenes de interfaz
```

## 🎨 Formatos Soportados

### Modelos 3D
- **GLTF/GLB** (Recomendado) - Incluye animaciones
- **OBJ** - Modelos estáticos con materiales

### Texturas
- **PNG** (Recomendado) - Con transparencia
- **JPG** - Para texturas sin transparencia
- **Tamaño recomendado:** 512x512 o 1024x1024

## 📝 Guías por Carpeta

Ver los archivos README.md en cada subcarpeta para instrucciones específicas.

## 🚀 Inicio Rápido

1. Coloca tus modelos en las carpetas correspondientes
2. Actualiza `js/AssetLoader.js` con las rutas
3. El juego cargará automáticamente los assets

## 💡 Recursos Recomendados

### Modelos Gratuitos
- [Mixamo](https://www.mixamo.com/) - Personajes animados
- [Sketchfab](https://sketchfab.com/) - Modelos 3D variados
- [Poly Pizza](https://poly.pizza/) - Modelos low-poly

### Texturas Gratuitas
- [Textures.com](https://www.textures.com/)
- [Poly Haven](https://polyhaven.com/)
- [OpenGameArt](https://opengameart.org/)

## ⚠️ Importante

- Mantén los archivos pequeños (< 5MB por modelo)
- Usa texturas optimizadas (potencias de 2: 512, 1024, 2048)
- Nombra los archivos de forma descriptiva
- No uses espacios en los nombres de archivo
