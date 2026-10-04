# 🎮 Guía de Prueba del Modelo Male_Casual.fbx

## ✅ Estado Actual de la Implementación

### Archivos Implementados
- ✅ `index.html` - Función `loadPlayerModel()` configurada para FBX
- ✅ `js/AssetLoader.js` - FBXLoader integrado
- ✅ `js/AnimationController.js` - Sistema de animaciones con búsqueda por keywords
- ✅ `js/Player.js` - Integración de animaciones (idle, walk, run, jump)
- ✅ `test_male_casual.html` - Página de prueba aislada
- ✅ `assets/models/player/Male_Casual.fbx` - Archivo presente (1.98 MB)

### Controles Implementados
- **WASD / Flechas**: Movimiento
- **Shift**: Correr (sprint)
- **Espacio**: Saltar
- **Mouse**: Rotar cámara (click para capturar)
- **E**: Interactuar
- **ESC**: Pausa
- **I**: Inventario

---

## 🧪 PASO 1: Probar el Modelo en Aislamiento

### Abrir la Página de Prueba
```
http://localhost:8000/test_male_casual.html
```

### Qué Verificar
1. **¿Se carga el modelo?**
   - Debe aparecer "✅ Modelo cargado exitosamente"
   - Si aparece error, verificar la ruta del archivo

2. **¿Es visible el modelo?**
   - Debe verse el personaje en el centro
   - Usa los controles de órbita (arrastrar mouse) para rotar la vista
   - Si no se ve, puede estar muy pequeño o muy grande

3. **Información del Modelo**
   - Escala actual
   - Tamaño en unidades
   - Número de animaciones
   - Lista de animaciones disponibles

4. **Probar Animaciones**
   - Click en cada animación de la lista
   - Verificar que se reproduce correctamente
   - Anotar los nombres exactos de las animaciones

5. **Ajustar Escala**
   - Botón "Escala ×2": Duplicar tamaño
   - Botón "Escala ÷2": Reducir a la mitad
   - Botón "Reset": Volver a escala 0.01
   - **Encuentra la escala óptima donde el modelo se vea bien**

6. **Ajustar Rotación**
   - Si el modelo mira en dirección incorrecta
   - Probar rotaciones de 90°, 180°, etc.

---

## 🎮 PASO 2: Probar en el Juego Principal

### Abrir el Juego
```
http://localhost:8000
```

### Qué Verificar
1. **Consola del Navegador** (F12)
   - Buscar mensajes de carga del modelo
   - Verificar que no haya errores
   - Debe mostrar:
     ```
     🎮 Cargando modelo del jugador (FBX)...
     ✅ Modelo FBX cargado, configurando...
     ✅ X animaciones encontradas:
        1. [nombre] (duración: Xs)
        ...
     🎬 Animaciones detectadas:
        ✅ Idle: [nombre]
        ✅ Walk: [nombre]
        ✅ Run: [nombre]
        ✅ Jump: [nombre]
     ✅ Modelo agregado a la escena
     🔴 Esfera de debug agregada (roja, wireframe)
     ```

2. **Esfera de Debug Roja**
   - Debe verse una esfera roja wireframe
   - Esta marca la posición del jugador
   - Si ves la esfera pero no el modelo:
     - El modelo está cargado pero invisible
     - Problema de escala, materiales o iluminación

3. **Movimiento**
   - Presiona WASD o Flechas
   - La esfera roja debe moverse
   - Si el modelo está visible, debe moverse con la esfera

4. **Animaciones**
   - **Idle**: Cuando no te mueves
   - **Walk**: Al moverte con WASD
   - **Run**: Al moverte + mantener Shift
   - **Jump**: Al presionar Espacio

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Problema 1: Modelo No Visible (pero esfera roja sí)

**Causa**: Escala incorrecta

**Solución**:
1. Abre `index.html`
2. Busca la línea: `player.mesh.scale.set(0.01, 0.01, 0.01);`
3. Prueba diferentes valores:
   - `0.001` - Muy pequeño
   - `0.01` - Pequeño (Mixamo estándar)
   - `0.1` - Mediano
   - `1` - Grande
   - `10` - Muy grande

**Cómo encontrar la escala correcta**:
1. Usa `test_male_casual.html`
2. Ajusta con los botones hasta que se vea bien
3. Anota la escala final
4. Usa ese valor en `index.html`

---

### Problema 2: Modelo Muy Oscuro

**Causa**: Materiales sin iluminación adecuada

**Solución**: Ya implementada en el código
- Emisión agregada automáticamente
- DoubleSide habilitado
- Roughness y metalness ajustados

Si sigue oscuro, aumenta la emisión:
```javascript
child.material.emissive = new THREE.Color(0x444444);
child.material.emissiveIntensity = 0.5;
```

---

### Problema 3: Modelo Mira en Dirección Incorrecta

**Causa**: Rotación inicial del modelo

**Solución**:
1. En `index.html`, busca:
   ```javascript
   // Rotación inicial (si el modelo mira en dirección incorrecta)
   // player.mesh.rotation.y = Math.PI; // Descomentar si mira hacia atrás
   ```

2. Descomenta y ajusta:
   - `Math.PI` = 180°
   - `Math.PI / 2` = 90°
   - `-Math.PI / 2` = -90°

---

### Problema 4: Animaciones No Funcionan

**Causa**: Nombres de animaciones no coinciden

**Solución**:
1. Abre la consola en `test_male_casual.html`
2. Anota los nombres exactos de las animaciones
3. El sistema busca por keywords:
   - "idle", "standing", "breathe" → Idle
   - "walk", "walking" → Walk
   - "run", "running", "jog" → Run
   - "jump", "jumping", "leap" → Jump

4. Si los nombres no coinciden, actualiza `AnimationController.js`:
   ```javascript
   const idleAnim = findAnimation(['idle', 'tu_nombre_aqui']);
   ```

---

### Problema 5: Modelo Carga pero No Se Mueve

**Causa**: El modelo no está asignado correctamente al player

**Verificar**:
1. Consola debe mostrar: "✅ Modelo agregado a la escena"
2. La esfera roja debe moverse
3. Si la esfera se mueve pero el modelo no:
   - El modelo no está como hijo del player.mesh
   - Verificar que `player.mesh = playerFBX;` se ejecutó

---

## 📊 Valores Recomendados (Mixamo)

### Escala
```javascript
player.mesh.scale.set(0.01, 0.01, 0.01);
```

### Posición Inicial
```javascript
player.mesh.position.set(0, 0, 0);
```

### Rotación (si es necesario)
```javascript
player.mesh.rotation.y = 0; // o Math.PI si mira hacia atrás
```

---

## 🎬 Nombres Comunes de Animaciones Mixamo

- **Idle**: "Idle", "Standing Idle", "Breathing Idle"
- **Walk**: "Walking", "Walk Forward", "Standard Walk"
- **Run**: "Running", "Fast Run", "Sprint"
- **Jump**: "Jumping", "Jump Up", "Standing Jump"

---

## 📝 Checklist de Verificación

- [ ] Servidor corriendo en puerto 8000
- [ ] Archivo Male_Casual.fbx existe (1.98 MB)
- [ ] test_male_casual.html carga el modelo
- [ ] Modelo visible en test page
- [ ] Animaciones se reproducen en test page
- [ ] Escala óptima encontrada
- [ ] Rotación correcta (si es necesario)
- [ ] Modelo visible en juego principal
- [ ] Esfera de debug roja visible
- [ ] Movimiento funciona (WASD)
- [ ] Sprint funciona (Shift)
- [ ] Salto funciona (Espacio)
- [ ] Animación idle se reproduce
- [ ] Animación walk se reproduce al moverse
- [ ] Animación run se reproduce con Shift
- [ ] Animación jump se reproduce al saltar

---

## 🚀 Próximos Pasos

Una vez que el modelo funcione correctamente:

1. **Remover esfera de debug**:
   ```javascript
   // Comentar o eliminar estas líneas en index.html
   const debugSphere = new THREE.Mesh(...);
   player.mesh.add(debugSphere);
   ```

2. **Ajustar cámara** (si es necesario):
   - Distancia de seguimiento
   - Altura de la cámara
   - Offset de posición

3. **Optimizar materiales**:
   - Aplicar MeshToonMaterial para cel-shading
   - Ajustar colores y texturas

4. **Agregar más animaciones**:
   - Interacción (recoger objetos)
   - Hablar con NPCs
   - Caída

---

## 💡 Comandos Útiles

### Ver logs en tiempo real
```javascript
// En la consola del navegador
console.log(player.mesh.scale);
console.log(player.mesh.position);
console.log(player.mesh.rotation);
```

### Cambiar escala en tiempo real
```javascript
// En la consola del navegador
player.mesh.scale.set(0.02, 0.02, 0.02);
```

### Ver animaciones disponibles
```javascript
// En la consola del navegador
player.animationController.actions.forEach((action, name) => {
    console.log(name);
});
```

---

## 📞 Soporte

Si después de seguir esta guía el modelo sigue sin funcionar:

1. Captura de pantalla de la consola (F12)
2. Captura de pantalla del test page
3. Anota los valores de escala probados
4. Verifica que el archivo FBX sea de Mixamo o compatible

---

**Última actualización**: Implementación completa con FBX, animaciones y controles
