# 📦 Guía Completa de Assets - Ecos de Chile: Atacama

## 🎯 Objetivo

Esta guía te ayudará a preparar, exportar e integrar modelos 3D y texturas en el juego.

---

## 📁 Estructura de Carpetas Creada

```
assets/
├── models/
│   ├── player/              # Modelo del jugador
│   ├── npcs/                # 10 modelos de NPCs
│   └── fragments/           # 5 modelos de fragmentos históricos
│
└── textures/
    ├── terrain/             # Texturas del suelo
    ├── characters/          # Texturas de personajes
    └── ui/                  # Imágenes de interfaz
```

---

## 🚀 Inicio Rápido

### 1. Preparar Assets en Blender

#### Jugador
```
1. Modela o descarga un personaje de Mixamo
2. Escala: 1.8 unidades de altura
3. Orientación: Mirando hacia +Z
4. Exporta como GLTF con animaciones
```

#### NPCs
```
1. Crea 10 personajes distintivos
2. Escala: 1.6-1.9 unidades
3. Estilo: Low-poly, cel-shading
4. Exporta cada uno como GLTF
```

#### Fragmentos
```
1. Modela 5 objetos históricos
2. Tamaño: 0.5-0.8 unidades
3. Muy low-poly (< 1000 polígonos)
4. Exporta como GLTF
```

### 2. Colocar Archivos

```
assets/models/player/player.glb
assets/models/npcs/miner/miner.glb
assets/models/fragments/jarro_pato.glb
assets/textures/terrain/desert_sand.jpg
```

### 3. Actualizar Código

Ver sección "Integración en el Código" más abajo.

---

## 🎨 Preparación en Blender

### Configuración Inicial

```
1. Unidades: Métrica (1 unidad = 1 metro)
2. Escala: Aplicar todas las transformaciones (Ctrl+A)
3. Origen: Centrado en los pies del personaje
```

### Modelado Low-Poly

```
Consejos:
- Usa modificador Subdivision Surface para preview
- Aplica el modificador antes de exportar
- Mantén el conteo de polígonos bajo
- Enfócate en la silueta reconocible
```

### Materiales para Cel-Shading

```
1. Shader Editor → Add → Shader → Toon BSDF
2. Color: El color base del objeto
3. Roughness: 0.5
4. No uses texturas complejas (el juego usa MeshToonMaterial)
```

### Animaciones con Mixamo

```
1. Exporta tu modelo como FBX (sin armature)
2. Ve a mixamo.com
3. Sube el modelo
4. Descarga animaciones:
   - Idle (Breathing Idle)
   - Walking
   - Running
   - Jumping
5. Importa de vuelta a Blender
6. Combina todas las animaciones en un solo archivo
```

### Exportación GLTF

```
Archivo → Exportar → glTF 2.0 (.glb)

Configuración:
┌─────────────────────────────────┐
│ Include                         │
│ ☑ Selected Objects              │
│ ☐ Custom Properties             │
│ ☑ Cameras                       │
│ ☐ Punctual Lights               │
├─────────────────────────────────┤
│ Transform                       │
│ ☑ +Y Up                         │
├─────────────────────────────────┤
│ Geometry                        │
│ ☑ Apply Modifiers               │
│ ☑ UVs                           │
│ ☑ Normals                       │
│ ☑ Tangents                      │
│ ☑ Vertex Colors                 │
│ ☑ Materials                     │
├─────────────────────────────────┤
│ Animation                       │
│ ☑ Use Current Frame             │
│ ☑ Animations                    │
│ ☐ Limit to Playback Range       │
│ ☑ Always Sample Animations      │
│ ☑ Group by NLA Track            │
├─────────────────────────────────┤
│ Compression                     │
│ ☑ Draco mesh compression        │
│   Compression level: 6          │
└─────────────────────────────────┘
```

---

## 💻 Integración en el Código

### 1. Cargar Modelo del Jugador

**Actualizar `index.html`:**

```javascript
// Después de crear el AssetLoader
const assetLoader = new AssetLoader();

// Cargar modelo del jugador
async function loadPlayerModel() {
    try {
        const playerGLTF = await assetLoader.loadGLTF(
            'assets/models/player/player.glb',
            'player'
        );
        
        // Reemplazar placeholder
        scene.remove(player.mesh);
        player.mesh = playerGLTF.scene;
        player.mesh.scale.set(1, 1, 1);
        player.mesh.position.set(0, 0, 0);
        player.mesh.castShadow = true;
        player.mesh.receiveShadow = true;
        
        // Aplicar material Toon a todos los meshes
        player.mesh.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshToonMaterial({
                    color: child.material.color || 0x00ff88
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(player.mesh);
        
        // Configurar animaciones
        if (playerGLTF.animations && playerGLTF.animations.length > 0) {
            const animController = new AnimationController(
                player.mesh,
                playerGLTF.animations
            );
            player.setAnimationController(animController);
            console.log('✅ Animaciones del jugador cargadas');
        }
        
        console.log('✅ Modelo del jugador cargado');
    } catch (error) {
        console.warn('⚠️ No se pudo cargar el modelo del jugador, usando placeholder');
    }
}

// Llamar después de crear el jugador
loadPlayerModel();
```

### 2. Cargar Modelos de NPCs

**Actualizar `js/NPCManager.js`:**

```javascript
async createNPC(data) {
    let npcMesh;
    
    // Intentar cargar modelo real
    try {
        const modelPath = `assets/models/npcs/${data.model || 'default'}/model.glb`;
        const npcGLTF = await this.assetLoader.loadGLTF(modelPath, `npc_${data.npc_id}`);
        
        npcMesh = npcGLTF.scene.clone();
        npcMesh.scale.set(1, 1, 1);
        
        // Aplicar material Toon
        npcMesh.traverse((child) => {
            if (child.isMesh) {
                child.material = new THREE.MeshToonMaterial({
                    color: child.material.color || this.getColorByDialogType(data.dialog_type)
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        console.log(`✅ Modelo de NPC cargado: ${data.name}`);
    } catch (error) {
        // Usar placeholder si falla
        console.warn(`⚠️ Usando placeholder para NPC: ${data.name}`);
        npcMesh = this.assetLoader.createPlaceholder('npc', {
            color: this.getColorByDialogType(data.dialog_type)
        });
    }
    
    // ... resto del código
}
```

**Actualizar `data/npcDialogs.json`:**

```json
{
  "npcs": [
    {
      "npc_id": "npc_001",
      "name": "Don Pedro - Minero Veterano",
      "model": "miner",
      "location": "copiapo",
      ...
    }
  ]
}
```

### 3. Cargar Modelos de Fragmentos

**Actualizar `js/FragmentManager.js`:**

```javascript
async createFragments() {
    for (const data of this.fragmentsData) {
        let mesh;
        
        // Intentar cargar modelo real
        try {
            const modelPath = `assets/models/fragments/${data.model || 'default'}.glb`;
            const fragmentGLTF = await this.assetLoader.loadGLTF(modelPath, `fragment_${data.id}`);
            
            mesh = fragmentGLTF.scene.clone();
            mesh.scale.set(0.6, 0.6, 0.6);
            
            // Aplicar material con emisivo
            mesh.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshToonMaterial({
                        color: data.color,
                        emissive: data.color,
                        emissiveIntensity: 0.4
                    });
                    child.castShadow = true;
                }
            });
            
            console.log(`✅ Modelo de fragmento cargado: ${data.name}`);
        } catch (error) {
            // Usar placeholder si falla
            console.warn(`⚠️ Usando placeholder para fragmento: ${data.name}`);
            const geometry = new THREE.OctahedronGeometry(0.6, 0);
            const material = new THREE.MeshToonMaterial({ 
                color: data.color, 
                emissive: data.color, 
                emissiveIntensity: 0.4 
            });
            mesh = new THREE.Mesh(geometry, material);
        }
        
        mesh.position.set(data.x, 2, data.z);
        // ... resto del código
    }
}
```

**Actualizar `fragmentsData` en `FragmentManager.js`:**

```javascript
this.fragmentsData = [
    { 
        id: 1, 
        name: "Cultura Diaguita", 
        model: "jarro_pato",
        color: 0xFFD700, 
        ...
    },
    // ...
];
```

### 4. Cargar Texturas del Terreno

**Actualizar `js/WorldBuilder.js`:**

```javascript
async createTerrain() {
    const groundSize = 200;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 50, 50);
    
    // Cargar textura
    let groundMat;
    try {
        const sandTexture = await this.assetLoader.loadTexture(
            'assets/textures/terrain/desert_sand.jpg',
            'terrain_sand'
        );
        
        // Configurar repetición
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(20, 20);
        
        groundMat = new THREE.MeshToonMaterial({ 
            map: sandTexture
        });
        
        console.log('✅ Textura del terreno cargada');
    } catch (error) {
        console.warn('⚠️ Usando color plano para el terreno');
        groundMat = new THREE.MeshToonMaterial({ 
            color: 0xD4A574
        });
    }
    
    this.ground = new THREE.Mesh(groundGeo, groundMat);
    // ... resto del código
}
```

---

## 🔧 AssetLoader Mejorado

El `AssetLoader` ya está preparado para manejar errores y usar placeholders automáticamente.

**Características:**
- ✅ Carga GLTF/GLB con animaciones
- ✅ Carga OBJ con materiales
- ✅ Carga texturas PNG/JPG
- ✅ Manejo de errores con fallback a placeholders
- ✅ Progreso de carga en consola
- ✅ Cache de assets cargados

---

## 📊 Checklist de Integración

### Jugador
- [ ] Modelo exportado como GLTF
- [ ] 4 animaciones incluidas
- [ ] Código actualizado en index.html
- [ ] Probado en el juego
- [ ] Animaciones funcionando

### NPCs (x10)
- [ ] 10 modelos exportados
- [ ] Campo "model" agregado al JSON
- [ ] Código actualizado en NPCManager.js
- [ ] Todos probados en el juego
- [ ] Indicadores visibles

### Fragmentos (x5)
- [ ] 5 modelos exportados
- [ ] Campo "model" agregado a fragmentsData
- [ ] Código actualizado en FragmentManager.js
- [ ] Todos probados en el juego
- [ ] Animaciones funcionando

### Terreno
- [ ] Textura principal creada
- [ ] Código actualizado en WorldBuilder.js
- [ ] Textura se repite correctamente
- [ ] Probado en el juego

---

## 🐛 Solución de Problemas

### El modelo no aparece
```
1. Verifica la ruta del archivo
2. Abre la consola (F12) y busca errores
3. Verifica que el archivo existe
4. Comprueba que el modelo está en escala correcta
```

### El modelo aparece negro
```
1. Verifica que tiene materiales
2. Asegúrate de aplicar MeshToonMaterial
3. Verifica la iluminación de la escena
```

### Las animaciones no funcionan
```
1. Verifica que el GLTF incluye animaciones
2. Comprueba los nombres de las animaciones
3. Asegúrate de llamar animController.update(delta)
```

### La textura no se ve
```
1. Verifica la ruta del archivo
2. Comprueba que es JPG o PNG
3. Verifica que el tamaño es potencia de 2
4. Asegúrate de configurar wrapS y wrapT
```

---

## 📚 Recursos Adicionales

### Modelos Gratuitos
- **Mixamo:** https://www.mixamo.com/
- **Sketchfab:** https://sketchfab.com/
- **Poly Pizza:** https://poly.pizza/

### Texturas Gratuitas
- **Poly Haven:** https://polyhaven.com/
- **Textures.com:** https://www.textures.com/
- **OpenGameArt:** https://opengameart.org/

### Tutoriales
- **Blender → GLTF:** https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html
- **Three.js Loaders:** https://threejs.org/docs/#examples/en/loaders/GLTFLoader
- **Mixamo Tutorial:** https://www.youtube.com/watch?v=Gb152Qncn2s

---

## ✅ Resultado Final

Con todos los assets integrados, tendrás:

- ✅ Jugador con modelo 3D y 4 animaciones
- ✅ 10 NPCs con modelos únicos
- ✅ 5 fragmentos históricos con modelos temáticos
- ✅ Terreno con textura realista del desierto
- ✅ Estilo visual cel-shading coherente
- ✅ Rendimiento optimizado (low-poly)

---

**¡Tu juego se verá profesional y pulido! 🎮✨**
