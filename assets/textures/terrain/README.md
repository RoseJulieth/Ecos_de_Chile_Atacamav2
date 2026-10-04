# 🏜️ Texturas del Terreno

## 📋 Texturas Necesarias

### 1. Terreno Base
**Archivo:** `desert_sand.jpg`
- **Uso:** Suelo principal del desierto
- **Color:** Arena dorada/naranja
- **Tamaño:** 1024x1024
- **Patrón:** Textura de arena con variación

### 2. Zona Copiapó
**Archivo:** `copiapo_ground.jpg`
- **Uso:** Suelo de la zona central
- **Color:** Marrón tierra
- **Detalles:** Tierra compactada, piedras pequeñas

### 3. Desierto Florido
**Archivo:** `desert_flowers.jpg`
- **Uso:** Suelo con flores
- **Color:** Verde con flores rosas
- **Detalles:** Pasto bajo, flores dispersas

### 4. Bahía Inglesa
**Archivo:** `beach_sand.jpg`
- **Uso:** Arena de playa
- **Color:** Blanco/beige claro
- **Detalles:** Arena fina, conchas

### 5. Rocas
**Archivo:** `desert_rocks.jpg`
- **Uso:** Rocas decorativas
- **Color:** Gris/marrón
- **Detalles:** Textura rocosa, grietas

## 📐 Especificaciones Técnicas

### Tamaños Recomendados
- **Terreno principal:** 2048x2048 (alta calidad)
- **Zonas específicas:** 1024x1024
- **Detalles:** 512x512

### Formato
- **JPG** para texturas sin transparencia
- **PNG** si necesitas transparencia (flores, etc.)

### Optimización
- Compresión: 80-90% calidad
- Potencias de 2 (512, 1024, 2048)
- Tileable (que se repita sin costuras)

## 🎨 Paleta de Colores

### Desierto de Atacama
- Arena: #E4A056, #D4A574, #C89F5F
- Tierra: #8B7355, #A0826D, #6B5D4F
- Rocas: #7A6F5D, #5C5447, #8B8378

### Desierto Florido
- Pasto: #9ACD32, #7CB342, #558B2F
- Flores: #FF69B4, #FF1493, #C71585

### Bahía Inglesa
- Arena: #F5DEB3, #FFE4B5, #FAEBD7
- Agua: #4682B4, #5F9EA0, #87CEEB

## 🔧 Creación de Texturas

### Opción 1: Fotografía
```
1. Toma fotos de texturas reales
2. Edita en Photoshop/GIMP:
   - Ajusta color y contraste
   - Haz la textura tileable
   - Redimensiona a potencia de 2
3. Exporta como JPG (calidad 85%)
```

### Opción 2: Generación Procedural
```
Herramientas:
- Substance Designer
- Materialize
- AwesomeBump (gratuito)
```

### Opción 3: Recursos Gratuitos
```
Sitios recomendados:
- Poly Haven (polyhaven.com)
- Textures.com (15 créditos gratis)
- OpenGameArt.org
```

## 💻 Uso en el Código

```javascript
// Actualizar WorldBuilder.js

async loadTerrainTextures() {
    // Cargar textura de arena
    const sandTexture = await this.assetLoader.loadTexture(
        'assets/textures/terrain/desert_sand.jpg',
        'terrain_sand'
    );
    
    // Configurar repetición
    sandTexture.wrapS = THREE.RepeatWrapping;
    sandTexture.wrapT = THREE.RepeatWrapping;
    sandTexture.repeat.set(20, 20);
    
    // Aplicar al terreno
    const groundMat = new THREE.MeshToonMaterial({
        map: sandTexture
    });
    
    this.ground.material = groundMat;
}
```

## 📦 Estructura de Archivos

```
terrain/
├── desert_sand.jpg             # Textura principal
├── copiapo_ground.jpg          # Zona Copiapó
├── desert_flowers.jpg          # Desierto Florido
├── beach_sand.jpg              # Bahía Inglesa
├── desert_rocks.jpg            # Rocas
├── desert_sand_normal.jpg      # Mapa de normales (opcional)
└── README.md                   # Este archivo
```

## 🎨 Hacer Texturas Tileables

### En Photoshop
```
1. Filtro → Otro → Desplazamiento
2. Desplaza 50% horizontal y vertical
3. Usa Tampón de Clonar para eliminar costuras
4. Repite hasta que sea seamless
```

### En GIMP
```
1. Filtros → Mapa → Hacer Seamless
2. Ajusta manualmente si es necesario
3. Exporta como JPG
```

## 🌟 Mapas Adicionales (Opcional)

### Normal Map
- Agrega profundidad sin geometría
- Archivo: `*_normal.jpg`
- Color: Azul/púrpura

### Roughness Map
- Controla el brillo
- Archivo: `*_roughness.jpg`
- Escala de grises

### Ambient Occlusion
- Sombras en grietas
- Archivo: `*_ao.jpg`
- Escala de grises

## ✅ Checklist

- [ ] Textura principal de arena (2048x2048)
- [ ] Texturas de zonas (1024x1024)
- [ ] Textura de rocas (1024x1024)
- [ ] Todas son tileable (sin costuras)
- [ ] Formato JPG optimizado
- [ ] Colores coherentes con el desierto
- [ ] Probadas en el juego

## 🔗 Recursos Gratuitos

### Texturas de Desierto
- [Poly Haven - Sand](https://polyhaven.com/textures/sand)
- [Textures.com - Desert](https://www.textures.com/category/desert/117)
- [OpenGameArt - Terrain](https://opengameart.org/art-search?keys=desert)

### Herramientas
- [GIMP](https://www.gimp.org/) - Editor gratuito
- [Materialize](http://boundingboxsoftware.com/materialize/) - Generar mapas
- [AwesomeBump](https://github.com/kmkolasinski/AwesomeBump) - Normal maps
