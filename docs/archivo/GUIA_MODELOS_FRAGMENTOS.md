# 🏺 Guía Completa - Modelos de Fragmentos Históricos

## 📍 RESPUESTA RÁPIDA

**¿Dónde van los modelos de objetos a recoger?**

```
assets/models/fragments/
```

Esta es la carpeta correcta para todos los modelos de fragmentos históricos (objetos coleccionables).

---

## 📦 Estructura de Archivos

```
tu-proyecto/
└── assets/
    └── models/
        └── fragments/              ← AQUÍ VAN LOS MODELOS
            ├── jarro_pato.glb
            ├── medalla_atacama.glb
            ├── flor_añañuca.glb
            ├── pepita_plata.glb
            ├── concha_marina.glb
            └── README.md
```

---

## 🎯 Los 5 Fragmentos a Modelar

| # | Nombre | Archivo | Color | Objeto |
|---|--------|---------|-------|--------|
| 1 | Cultura Diaguita | `jarro_pato.glb` | 🟡 Dorado | Jarro-pato cerámico |
| 2 | Batallón Atacama | `medalla_atacama.glb` | 🔴 Rojo | Medalla militar |
| 3 | Desierto Florido | `flor_añañuca.glb` | 🌸 Rosa | Flor añañuca |
| 4 | Plata Chañarcillo | `pepita_plata.glb` | ⚪ Plateado | Pepita de plata |
| 5 | Bahía Inglesa | `concha_marina.glb` | 🔵 Azul | Concha marina |

---

## 📐 Especificaciones Técnicas

### Formato
- **Recomendado:** `.glb` (GLTF Binary)
- **Alternativas:** `.gltf`, `.fbx`, `.obj`
- **Ventaja GLB:** Archivo único con texturas embebidas

### Tamaño
- **Dimensiones:** 0.5 - 0.8 unidades en el juego
- **Polígonos:** 200 - 1,000 (low-poly)
- **Archivo:** < 500 KB cada uno

### Orientación
- **Pivot:** Centro del objeto
- **Eje Y:** Hacia arriba
- **Rotación inicial:** 0°, 0°, 0°
- **Escala:** 1, 1, 1

---

## 🎨 Cómo Obtener los Modelos

### Opción 1: Modelar en Blender ⭐ RECOMENDADO

**Ventajas:**
- Control total del diseño
- Optimizado para el juego
- Aprenderás modelado 3D

**Pasos:**

1. **Crear el modelo**
   ```
   - Abrir Blender
   - Crear forma básica (Add → Mesh)
   - Modelar con pocas caras (low-poly)
   - Mantener silueta reconocible
   ```

2. **Centrar el modelo**
   ```
   - Seleccionar objeto
   - Object → Set Origin → Origin to Geometry
   - Shift+S → Cursor to World Origin
   - Shift+S → Selection to Cursor
   ```

3. **Aplicar material**
   ```
   - Cambiar a Shading workspace
   - Agregar material nuevo
   - Base Color: Color del fragmento
   - Emission: Mismo color
   - Emission Strength: 0.4
   ```

4. **Exportar**
   ```
   - File → Export → glTF 2.0 (.glb)
   - Configuración:
     ☑ Format: glTF Binary (.glb)
     ☑ Include: Selected Objects
     ☑ Transform: +Y Up
     ☑ Geometry: Apply Modifiers
     ☑ Materials: Export
   - Guardar en: assets/models/fragments/
   ```

### Opción 2: Descargar Modelos Gratuitos

**Sitios Recomendados:**

1. **Sketchfab** (https://sketchfab.com/)
   - Buscar: "low poly pottery", "low poly medal", etc.
   - Filtrar: Downloadable, Free
   - Descargar formato GLB o FBX

2. **Poly Pizza** (https://poly.pizza/)
   - Modelos low-poly gratuitos
   - Descarga directa en GLB

3. **Free3D** (https://free3d.com/)
   - Sección gratuita
   - Múltiples formatos

**Búsquedas Sugeridas:**
- "low poly pottery" → Jarro
- "low poly medal star" → Medalla
- "low poly flower" → Flor
- "low poly crystal gem" → Mineral
- "low poly shell" → Concha

**Después de Descargar:**
1. Importar a Blender
2. Ajustar escala (debe ser pequeño)
3. Simplificar si tiene muchos polígonos:
   - Add Modifier → Decimate
   - Ratio: 0.5 (reduce a la mitad)
4. Exportar como GLB

### Opción 3: Usar Placeholders (Temporal)

El juego ya usa octaedros como placeholders. Puedes:
- Dejar los placeholders por ahora
- Reemplazarlos más tarde con modelos reales
- El juego funciona perfectamente con placeholders

---

## 💻 Implementación en el Código

### Paso 1: Colocar los Archivos

Copia tus modelos GLB a:
```
assets/models/fragments/
```

### Paso 2: Actualizar FragmentManager.js

Actualmente usa placeholders (octaedros). Para usar modelos reales:

```javascript
import * as THREE from 'three';

export class FragmentManager {
    constructor(scene, inventory, assetLoader) {
        this.scene = scene;
        this.inventory = inventory;
        this.assetLoader = assetLoader;  // ← Agregar AssetLoader
        this.fragments = [];
        this.fragmentsData = [
            {
                id: 1,
                name: "Cultura Diaguita",
                color: 0xFFD700,
                x: 15, z: 15,
                modelPath: 'assets/models/fragments/jarro_pato.glb',  // ← Agregar ruta
                info: "Pueblo originario (1000-1540 d.C)...",
                // ... resto de datos
            },
            // ... otros fragmentos
        ];
    }

    async createFragments() {
        for (const data of this.fragmentsData) {
            let mesh;

            // Intentar cargar modelo real
            if (data.modelPath && this.assetLoader) {
                try {
                    const gltf = await this.assetLoader.loadGLTF(
                        data.modelPath,
                        `fragment_${data.id}`
                    );
                    mesh = gltf.scene;
                    mesh.scale.set(0.6, 0.6, 0.6);  // Ajustar escala
                } catch (error) {
                    console.warn(`No se pudo cargar ${data.modelPath}, usando placeholder`);
                    mesh = this.createPlaceholder(data.color);
                }
            } else {
                // Usar placeholder
                mesh = this.createPlaceholder(data.color);
            }

            mesh.position.set(data.x, 2, data.z);
            mesh.userData = {
                ...data,
                collected: false,
                type: 'fragment',
                interactable: true
            };

            // Aplicar material toon
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.material = new THREE.MeshToonMaterial({
                        color: data.color,
                        emissive: data.color,
                        emissiveIntensity: 0.4
                    });
                }
            });

            this.scene.add(mesh);
            this.fragments.push(mesh);

            // Verificar si ya fue recolectado
            if (this.inventory.hasFragment(data.id)) {
                mesh.visible = false;
                mesh.userData.collected = true;
            }
        }
    }

    createPlaceholder(color) {
        const geometry = new THREE.OctahedronGeometry(0.6, 0);
        const material = new THREE.MeshToonMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4
        });
        return new THREE.Mesh(geometry, material);
    }

    // ... resto del código
}
```

### Paso 3: Actualizar index.html

Pasar AssetLoader al FragmentManager:

```javascript
// En index.html, buscar:
const fragmentManager = new FragmentManager(scene, inventory);

// Cambiar a:
const fragmentManager = new FragmentManager(scene, inventory, assetLoader);

// Y cambiar:
fragmentManager.createFragments();

// A:
await fragmentManager.createFragments();  // Ahora es async
```

---

## 🧪 Cómo Probar

### 1. Sin Modelos (Placeholders)
```
- El juego funciona con octaedros
- Puedes jugar normalmente
- Los fragmentos se ven como formas geométricas
```

### 2. Con Modelos
```
1. Coloca los archivos GLB en assets/models/fragments/
2. Actualiza FragmentManager.js (código arriba)
3. Actualiza index.html (código arriba)
4. Recarga el juego
5. Los modelos deberían aparecer en lugar de octaedros
```

### 3. Verificar en Consola
```
Abre F12 y busca:
✅ Modelo GLTF cargado: fragment_1
✅ Modelo GLTF cargado: fragment_2
...

O si falla:
⚠️ No se pudo cargar [ruta], usando placeholder
```

---

## 🔧 Solución de Problemas

### Problema: Modelo No Aparece

**Verificar:**
1. Archivo existe en `assets/models/fragments/`
2. Nombre del archivo coincide con `modelPath`
3. Servidor está corriendo
4. Consola muestra errores

**Solución:**
- Verificar ruta del archivo
- Verificar que el archivo no esté corrupto
- Probar abrir el GLB en Blender

### Problema: Modelo Muy Grande o Pequeño

**Solución:**
Ajustar escala en `createFragments()`:
```javascript
mesh.scale.set(0.3, 0.3, 0.3);  // Más pequeño
mesh.scale.set(1.0, 1.0, 1.0);  // Más grande
```

### Problema: Modelo Muy Oscuro

**Solución:**
Aumentar emisión:
```javascript
child.material.emissiveIntensity = 0.6;  // Más brillo
```

### Problema: Modelo en Posición Incorrecta

**Solución:**
Ajustar posición Y:
```javascript
mesh.position.set(data.x, 1.5, data.z);  // Más bajo
mesh.position.set(data.x, 3.0, data.z);  // Más alto
```

---

## 📊 Checklist de Implementación

### Preparación
- [ ] Carpeta `assets/models/fragments/` existe
- [ ] Tienes los 5 modelos GLB (o usarás placeholders)
- [ ] Modelos son low-poly (< 1000 polígonos)
- [ ] Archivos < 500 KB cada uno

### Código
- [ ] FragmentManager.js actualizado con carga de modelos
- [ ] index.html pasa AssetLoader a FragmentManager
- [ ] createFragments() es async
- [ ] Manejo de errores implementado (fallback a placeholder)

### Pruebas
- [ ] Servidor corriendo
- [ ] Modelos cargan sin errores
- [ ] Escala correcta (no muy grandes ni pequeños)
- [ ] Colores y brillo correctos
- [ ] Animaciones funcionan (rotación, flotación)
- [ ] Recolección funciona con tecla E

---

## 🎨 Referencias Visuales

### Jarro-Pato Diaguita
```
Forma: Cuerpo redondeado + cuello de pato
Decoración: Patrones geométricos (zigzag)
Color: Terracota con detalles dorados
Referencia: Museo Chileno de Arte Precolombino
```

### Medalla Batallón Atacama
```
Forma: Estrella de 5 puntas
Inscripción: "Batallón Atacama 1879"
Cinta: Roja con bordes dorados
Referencia: Medallas militares chilenas
```

### Flor Añañuca
```
Forma: 6 pétalos alargados
Centro: Amarillo
Pétalos: Rosa intenso
Referencia: Rhodophiala rhodolirion
```

### Pepita de Plata
```
Forma: Irregular, cristalina
Textura: Facetas brillantes
Efecto: Metálico reflectante
Referencia: Minerales de plata nativa
```

### Concha Marina
```
Forma: Espiral caracol
Textura: Estrías naturales
Color: Azul turquesa con blanco
Referencia: Conchas del Pacífico
```

---

## 💡 Consejos Finales

1. **Empieza con placeholders**: El juego funciona perfectamente sin modelos reales

2. **Modela uno a la vez**: No necesitas los 5 de inmediato

3. **Mantén low-poly**: Menos polígonos = mejor rendimiento

4. **Prueba en Blender primero**: Verifica que el modelo se vea bien antes de exportar

5. **Usa referencias**: Busca imágenes reales de los objetos

6. **Documenta tus cambios**: Anota las escalas y ajustes que funcionan

---

## 📚 Recursos Adicionales

**Tutoriales de Blender:**
- [Blender Guru - Beginner Tutorial](https://www.youtube.com/watch?v=nIoXOplUvAw)
- [Grant Abbitt - Low Poly Modeling](https://www.youtube.com/watch?v=1jHUY3qoBu8)

**Referencias Culturales:**
- [Museo Chileno de Arte Precolombino](http://www.precolombino.cl/)
- [Memoria Chilena](http://www.memoriachilena.gob.cl/)

**Modelos 3D:**
- [Sketchfab](https://sketchfab.com/)
- [Poly Pizza](https://poly.pizza/)
- [Free3D](https://free3d.com/)

---

**Estado**: ✅ Guía completa - Lista para implementar modelos
**Carpeta**: `assets/models/fragments/`
**Próximo paso**: Colocar modelos GLB y actualizar código
