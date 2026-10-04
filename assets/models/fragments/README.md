# 🏺 Modelos de Fragmentos Históricos

## 📋 Fragmentos a Modelar

### 1. Cultura Diaguita (Dorado)
**Archivo:** `jarro_pato.glb`
- **Objeto:** Jarro-pato (cerámica característica)
- **Color:** Dorado (#FFD700)
- **Detalles:** Forma de pato, decoraciones geométricas

### 2. Batallón Atacama (Rojo)
**Archivo:** `medalla_atacama.glb`
- **Objeto:** Medalla militar o insignia
- **Color:** Rojo oscuro (#8B0000)
- **Detalles:** Estrella, cinta, inscripción "Atacama"

### 3. Desierto Florido (Rosa)
**Archivo:** `flor_añañuca.glb`
- **Objeto:** Flor añañuca
- **Color:** Rosa (#FF69B4)
- **Detalles:** Pétalos delicados, tallo

### 4. Plata Chañarcillo (Plateado)
**Archivo:** `pepita_plata.glb`
- **Objeto:** Pepita de plata o mineral
- **Color:** Plateado (#C0C0C0)
- **Detalles:** Textura cristalina, brillante

### 5. Bahía Inglesa (Azul)
**Archivo:** `concha_marina.glb`
- **Objeto:** Concha marina o ancla pequeña
- **Color:** Azul (#1E90FF)
- **Detalles:** Espiral, textura marina

## 📐 Especificaciones Técnicas

- **Tamaño:** ~0.5 - 0.8 unidades
- **Polígonos:** 200 - 1,000 (muy low-poly)
- **Orientación:** Centrado en el origen
- **Escala:** Proporcional al tamaño real
- **Pivot:** En el centro del objeto

## 🎨 Estilo Visual

- **Cel-Shading:** Renderizado estilo cartoon
- **Emisivo:** Brillo sutil del color característico
- **Detalles:** Simplificados pero reconocibles

## 🔧 Preparación en Blender

### 1. Modelado
```
- Mantén el modelo muy simple (low-poly)
- Enfócate en la silueta reconocible
- Usa modificadores para suavizar si es necesario
```

### 2. Materiales
```
- Color base: El color característico del fragmento
- Emisivo: Mismo color con intensidad 0.4
- Roughness: 0.5 (semi-brillante)
```

### 3. Exportación
```
Archivo → Exportar → glTF 2.0 (.glb)

Opciones:
☑ Include: Selected Objects
☑ Transform: +Y Up
☑ Geometry: Apply Modifiers
☑ Materials: Export
☑ Compression: Draco
```

## 💻 Uso en el Código

```javascript
// Actualizar FragmentManager.js

async loadFragmentModels() {
    // Cargar modelo de jarro-pato
    const jarroGLTF = await this.assetLoader.loadGLTF(
        'assets/models/fragments/jarro_pato.glb',
        'fragment_diaguita'
    );
    
    // Usar en createFragments
    const mesh = jarroGLTF.scene.clone();
    mesh.scale.set(0.6, 0.6, 0.6);
    
    // Aplicar material toon con emisivo
    mesh.traverse((child) => {
        if (child.isMesh) {
            child.material = new THREE.MeshToonMaterial({
                color: data.color,
                emissive: data.color,
                emissiveIntensity: 0.4
            });
        }
    });
}
```

## 📦 Estructura de Archivos

```
fragments/
├── jarro_pato.glb              # Cultura Diaguita
├── medalla_atacama.glb         # Batallón Atacama
├── flor_añañuca.glb            # Desierto Florido
├── pepita_plata.glb            # Plata Chañarcillo
├── concha_marina.glb           # Bahía Inglesa
└── README.md                   # Este archivo
```

## 🎨 Referencias Visuales

### Jarro-Pato Diaguita
- Forma: Cuerpo redondeado con cuello de pato
- Decoración: Patrones geométricos (zigzag, líneas)
- Color: Terracota con detalles dorados

### Medalla Batallón Atacama
- Forma: Estrella de 5 puntas
- Inscripción: "Batallón Atacama 1879"
- Cinta: Roja con bordes dorados

### Flor Añañuca
- Forma: 6 pétalos alargados
- Centro: Amarillo
- Pétalos: Rosa intenso

### Pepita de Plata
- Forma: Irregular, cristalina
- Textura: Facetas brillantes
- Efecto: Metálico reflectante

### Concha Marina
- Forma: Espiral caracol
- Textura: Estrías naturales
- Color: Azul turquesa con blanco

## ✅ Checklist por Fragmento

- [ ] Modelo exportado en GLTF/GLB
- [ ] Tamaño correcto (0.5-0.8 unidades)
- [ ] Centrado en el origen
- [ ] Polígonos < 1,000
- [ ] Material con color característico
- [ ] Archivo < 500KB
- [ ] Silueta reconocible
- [ ] Probado en el juego

## 🎬 Animaciones en el Juego

Los fragmentos ya tienen animaciones procedurales:
- **Rotación:** Giro constante en eje Y
- **Flotación:** Movimiento vertical suave
- **Glow:** Efecto de brillo pulsante

## 🔗 Recursos

- [Sketchfab](https://sketchfab.com/) - Buscar referencias
- [Poly Pizza](https://poly.pizza/) - Modelos low-poly
- [Museo Chileno de Arte Precolombino](http://www.precolombino.cl/) - Referencias Diaguita
