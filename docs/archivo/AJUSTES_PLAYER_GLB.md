# 🎮 Guía de Ajustes - Modelo GLB del Jugador

## ✅ Implementación Completada

El código está configurado para cargar `player.glb` con todos los ajustes necesarios.

---

## 🚀 Prueba Ahora

1. **Recarga la página** (Ctrl + R o F5)
2. **Abre la consola** (F12)
3. **Click en "Comenzar Exploración"**

### Mensajes Esperados en la Consola:

```
🎮 Cargando modelo del jugador (GLB)...
⏳ Cargando player: XX%
✅ Modelo GLTF cargado: player
✅ Modelo GLB cargado, configurando...
Configurando mesh: [nombre del mesh]
  - Tiene textura (si aplica)
✅ Modelo agregado a la escena
   Escala: Vector3 {x: 0.01, y: 0.01, z: 0.01}
   Posición: Vector3 {x: 0, y: 0, z: 0}
✅ X animaciones encontradas: (si tiene)
   1. [nombre de animación]
✅ Modelo del jugador cargado exitosamente
```

---

## 🔧 Ajustes Comunes

### 1. El Modelo es Muy Pequeño o Muy Grande

Edita en `index.html`, línea ~395:

```javascript
// AJUSTAR AQUÍ
player.mesh.scale.set(0.01, 0.01, 0.01);
```

**Valores de prueba:**
- Muy pequeño: `0.001` o `0.005`
- Pequeño: `0.01` (actual)
- Mediano: `0.1`
- Normal: `1.0`
- Grande: `10.0`

**Tamaño ideal:** El jugador debe tener ~1.8 unidades de altura en el juego.

### 2. El Modelo Está Invisible o Muy Oscuro

**Causa:** Falta de iluminación o materiales oscuros.

**Solución 1 - Agregar luz ambiental más fuerte:**

Busca en `index.html` donde se crea `ambientLight` y aumenta la intensidad:

```javascript
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Aumentar de 0.6 a 0.8
```

**Solución 2 - Agregar emisión al material:**

Ya está implementado en el código:
```javascript
child.material.emissive = new THREE.Color(0x222222);
child.material.emissiveIntensity = 0.2;
```

Si sigue oscuro, aumenta la intensidad:
```javascript
child.material.emissiveIntensity = 0.5; // Más brillo
```

**Solución 3 - Agregar luz puntual al jugador:**

Agrega después de `scene.add(player.mesh);`:

```javascript
// Luz que sigue al jugador
const playerLight = new THREE.PointLight(0xffffff, 0.5, 10);
playerLight.position.set(0, 2, 0);
player.mesh.add(playerLight);
console.log('✅ Luz del jugador agregada');
```

### 3. El Modelo Mira en Dirección Incorrecta

Edita en `index.html`, línea ~400:

```javascript
// Descomentar y ajustar:
player.mesh.rotation.y = Math.PI;      // 180 grados
// o
player.mesh.rotation.y = Math.PI / 2;  // 90 grados
// o
player.mesh.rotation.y = -Math.PI / 2; // -90 grados
```

### 4. El Modelo Está Flotando o Hundido

Ajusta la posición Y:

```javascript
player.mesh.position.set(0, 0.5, 0);  // Subir
// o
player.mesh.position.set(0, -0.5, 0); // Bajar
```

### 5. Las Animaciones No Funcionan

**Verifica en la consola:**
```
✅ X animaciones encontradas:
   1. [nombre]
```

**Si no aparecen animaciones:**
- El modelo no tiene animaciones (está bien, funcionará sin ellas)
- Exporta de nuevo desde Blender con animaciones incluidas

**Si aparecen pero no se reproducen:**

Verifica los nombres en la consola y ajusta en el código:

```javascript
// Prueba con el nombre exacto que aparece en la consola
animController.play('Idle');           // Mayúscula
// o
animController.play('Armature|idle');  // Con prefijo
// o
animController.play('mixamo.com|idle'); // De Mixamo
```

---

## 🎨 Mejorar la Apariencia

### Opción 1: Usar MeshToonMaterial (Cel-Shading)

Si el modelo se ve bien con la iluminación actual, puedes probar cel-shading:

```javascript
// Reemplazar en la sección de materiales:
child.material = new THREE.MeshToonMaterial({
    color: child.material.color || 0xffffff,
    map: child.material.map
});
```

### Opción 2: Ajustar Roughness y Metalness

```javascript
child.material.roughness = 0.5; // Más brillante (0.0 - 1.0)
child.material.metalness = 0.1; // Ligeramente metálico (0.0 - 1.0)
```

### Opción 3: Agregar Contorno (Outline)

```javascript
// Después de configurar el modelo
const outlineMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    side: THREE.BackSide
});

player.mesh.traverse((child) => {
    if (child.isMesh) {
        const outlineMesh = child.clone();
        outlineMesh.material = outlineMaterial;
        outlineMesh.scale.multiplyScalar(1.05);
        child.add(outlineMesh);
    }
});
```

---

## 🐛 Solución de Problemas

### Problema: No veo el modelo

**Checklist:**
1. ✅ ¿El archivo `player.glb` está en `assets/models/player/`?
2. ✅ ¿La consola muestra "✅ Modelo GLB cargado"?
3. ✅ ¿La escala es correcta? (prueba `1.0`)
4. ✅ ¿La cámara está mirando al jugador?

**Debug:**
```javascript
// Agregar después de scene.add(player.mesh);
console.log('Bounding Box:', new THREE.Box3().setFromObject(player.mesh));
```

### Problema: El modelo parpadea o desaparece

**Causa:** Problema con el frustum culling.

**Solución:**
```javascript
player.mesh.traverse((child) => {
    if (child.isMesh) {
        child.frustumCulled = false;
    }
});
```

### Problema: El modelo tiene agujeros o partes faltantes

**Causa:** Materiales con un solo lado visible.

**Solución:** Ya implementado:
```javascript
child.material.side = THREE.DoubleSide;
```

### Problema: Las texturas se ven pixeladas

**Solución:**
```javascript
if (child.material.map) {
    child.material.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    child.material.map.needsUpdate = true;
}
```

---

## 📊 Información de Debug

El código ya incluye logs detallados. En la consola verás:

```
✅ Modelo agregado a la escena
   Escala: Vector3 {x: 0.01, y: 0.01, z: 0.01}
   Posición: Vector3 {x: 0, y: 0, z: 0}
```

**Para más información:**

Agrega después de `scene.add(player.mesh);`:

```javascript
// Ver estructura del modelo
console.log('Estructura del modelo:', player.mesh);

// Ver todos los meshes
player.mesh.traverse((child) => {
    if (child.isMesh) {
        console.log('Mesh:', child.name);
        console.log('  Material:', child.material.type);
        console.log('  Geometría:', child.geometry.type);
        console.log('  Vértices:', child.geometry.attributes.position.count);
    }
});

// Ver bounding box
const bbox = new THREE.Box3().setFromObject(player.mesh);
console.log('Tamaño del modelo:', {
    width: bbox.max.x - bbox.min.x,
    height: bbox.max.y - bbox.min.y,
    depth: bbox.max.z - bbox.min.z
});
```

---

## ✅ Checklist Final

- [ ] Archivo `player.glb` en la carpeta correcta
- [ ] Consola muestra "✅ Modelo GLB cargado"
- [ ] Modelo visible en el juego
- [ ] Tamaño correcto (~1.8 unidades)
- [ ] Orientación correcta (mira hacia adelante)
- [ ] Se mueve con WASD
- [ ] Sombras visibles
- [ ] Animaciones funcionan (si las tiene)
- [ ] No hay errores en la consola

---

## 🎯 Valores Recomendados

### Para modelos de Mixamo:
```javascript
player.mesh.scale.set(0.01, 0.01, 0.01);
player.mesh.position.set(0, 0, 0);
player.mesh.rotation.y = 0;
```

### Para modelos personalizados de Blender:
```javascript
player.mesh.scale.set(1, 1, 1);
player.mesh.position.set(0, 0, 0);
player.mesh.rotation.y = Math.PI; // Si mira hacia atrás
```

---

## 📞 Siguiente Paso

Una vez que el modelo se vea correctamente:

1. ✅ Ajusta la escala final
2. ✅ Verifica las animaciones
3. ✅ Ajusta la iluminación si es necesario
4. ✅ ¡Disfruta tu personaje personalizado!

---

**¡El modelo GLB debería verse perfectamente ahora! 🎮✨**
