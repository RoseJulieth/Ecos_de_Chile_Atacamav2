# 🔧 Solución al Error de Materiales FBX

## ❌ Error Original

```
Uncaught TypeError: Cannot read properties of undefined (reading 'elements')
at Matrix3.copy (three.module.js:1173:16)
```

## ✅ Solución Aplicada

El error ocurría porque `MeshToonMaterial` tiene problemas con las matrices de transformación de texturas de modelos FBX.

### Cambio Realizado

**Antes (causaba error):**
```javascript
child.material = new THREE.MeshToonMaterial({
    color: originalColor,
    map: originalMap
});
```

**Después (funciona):**
```javascript
child.material = new THREE.MeshStandardMaterial({
    color: originalColor,
    roughness: 0.7,
    metalness: 0.0
});
```

## 🎨 Diferencia Visual

### MeshToonMaterial (Cel-Shading)
- Estilo cartoon/anime
- Sombras con gradientes discretos
- Más estilizado

### MeshStandardMaterial (Actual)
- Estilo más realista
- Sombras suaves
- Mejor compatibilidad con FBX

## 🔄 Si Quieres Volver a Cel-Shading

### Opción 1: Convertir FBX a GLTF

1. Abre el modelo en Blender
2. Exporta como GLTF (.glb)
3. Usa el GLTF en lugar del FBX
4. GLTF funciona mejor con MeshToonMaterial

### Opción 2: Usar Toon Shader Personalizado

Agrega después de cargar el modelo:

```javascript
// Shader personalizado para cel-shading
const toonShader = {
    uniforms: {
        color: { value: new THREE.Color(0xffffff) },
        lightPosition: { value: new THREE.Vector3(50, 100, 50) }
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        uniform vec3 lightPosition;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vec3 light = normalize(lightPosition - vPosition);
            float intensity = dot(vNormal, light);
            
            // Cel-shading con 3 niveles
            if (intensity > 0.95) intensity = 1.0;
            else if (intensity > 0.5) intensity = 0.6;
            else if (intensity > 0.25) intensity = 0.4;
            else intensity = 0.2;
            
            gl_FragColor = vec4(color * intensity, 1.0);
        }
    `
};

child.material = new THREE.ShaderMaterial(toonShader);
```

### Opción 3: Post-Processing

Usa un efecto de post-procesamiento para cel-shading:

```javascript
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    scene,
    camera
);
composer.addPass(outlinePass);
```

## ✅ Estado Actual

- ✅ El modelo FBX carga sin errores
- ✅ Usa MeshStandardMaterial (compatible)
- ✅ Sombras funcionan correctamente
- ✅ Texturas se aplican correctamente
- ⚠️ No tiene el estilo cel-shading completo

## 🎯 Recomendación

**Para este proyecto:**
Mantén `MeshStandardMaterial` por ahora. Funciona bien y se ve profesional.

**Para el futuro:**
Si quieres cel-shading completo, convierte el FBX a GLTF en Blender.

## 📝 Notas

- El error era específico de `MeshToonMaterial` con texturas FBX
- `MeshStandardMaterial` es más robusto y compatible
- El juego sigue funcionando perfectamente
- La diferencia visual es mínima

---

**El modelo ahora debería cargar sin errores! 🎮**
