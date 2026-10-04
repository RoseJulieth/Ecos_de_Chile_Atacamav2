# Guía de Verificación - NPCs Visibles

## 🎯 Objetivo
Verificar que los 10 NPCs están visibles en el juego con el nuevo cielo azul.

## ✅ Cambios Aplicados

### 1. Cielo Azul
- Color: `0x87CEEB` (azul cielo)
- Niebla: `0xB0E0E6` (azul suave)

### 2. NPCs Posicionados en Y=1
Todos los NPCs ahora están en Y=1 (sobre el terreno)

### 3. Esferas de Debug Rojas
Cada NPC tiene una esfera roja wireframe para facilitar su localización

### 4. Logs Detallados
La consola muestra información completa de cada NPC creado

## 🧪 Pasos para Verificar

### Paso 1: Abrir el Juego
1. El servidor está corriendo en: **http://localhost:8000**
2. Abre el navegador
3. Ve a esa dirección
4. Presiona **F12** para abrir la consola

### Paso 2: Revisar la Consola
Al iniciar el juego, deberías ver:

```
👥 Creando NPCs con modelos GLB...

🎭 === CREANDO NPC 1: Don Pedro - Minero Veterano ===
   Modelo: assets/models/npcs/Character.glb
   Escala configurada: 0.01
   ⏳ Cargando modelo GLB...
   ✅ Modelo procesado: X meshes, Y texturas
   📍 Posición final: (-10, 1, 5)
   📏 Escala final: (0.01, 0.01, 0.01)
   ✅ Indicador agregado en Y=2.5
   🔴 Esfera de debug agregada (roja, wireframe)
   ✅ Bounding box creado
   ✅ NPC agregado a la escena (Total NPCs: 1)
   🎭 === FIN CREACIÓN NPC 1 ===

[... repetir para NPCs 2-10 ...]

✅ 10 NPCs creados en el mundo
```

### Paso 3: Buscar NPCs en el Juego

#### Controles:
- **WASD / Flechas**: Moverse
- **Shift**: Correr
- **Mouse**: Rotar cámara (click primero en la pantalla)

#### Ubicaciones de NPCs:

| NPC | Nombre | Posición (X, Z) | Distancia del Centro |
|-----|--------|-----------------|---------------------|
| 1 | Don Pedro | (-10, 5) | ~11 unidades |
| 2 | Doña Rosa | (8, -8) | ~11 unidades |
| 3 | Capitán Vargas | (-18, 18) | ~25 unidades |
| 4 | María | (22, -22) | ~31 unidades |
| 5 | Don Esteban | (28, -18) | ~33 unidades |
| 6 | Capitán Morales | (-3, -33) | ~33 unidades |
| 7 | Elena | (4, -37) | ~37 unidades |
| 8 | Abuelo Tomás | (5, 12) | ~13 unidades |
| 9 | Profesora Carla | (-5, -5) | ~7 unidades |
| 10 | Javier | (20, -28) | ~34 unidades |

#### NPCs más Cercanos al Centro:
1. **Profesora Carla** (-5, -5) - ~7 unidades
2. **Don Pedro** (-10, 5) - ~11 unidades
3. **Doña Rosa** (8, -8) - ~11 unidades
4. **Abuelo Tomás** (5, 12) - ~13 unidades

### Paso 4: Qué Buscar

#### Deberías Ver:
1. **🔴 Esferas rojas wireframe** - Marcan la posición de cada NPC
2. **Iconos flotantes** sobre los NPCs:
   - 📜 Historia (marrón)
   - ✨ Leyenda (morado)
   - 🗺️ Turismo (turquesa)
   - 🌄 Paisaje (verde)
3. **Modelos 3D** de personajes (si la escala es correcta)

#### Si NO ves nada:
- Busca las **esferas rojas** - son grandes (0.5 unidades) y fáciles de ver
- Si no ves esferas rojas, los NPCs no se están creando
- Revisa la consola para ver errores

## 🐛 Solución de Problemas

### Problema: No veo esferas rojas

**Causa**: Los NPCs no se están creando

**Solución**:
1. Revisar consola para errores
2. Verificar que los archivos GLB existen:
   - `assets/models/npcs/Character.glb`
   - `assets/models/npcs/Animated_Woman.glb`
3. Verificar que `data/npcDialogs.json` existe

### Problema: Veo esferas rojas pero no modelos

**Causa**: Escala 0.01 es demasiado pequeña

**Solución**: Aumentar escala en `js/NPCManager.js`:
```javascript
this.npcModels = [
    { path: 'assets/models/npcs/Character.glb', scale: 0.1 },  // ← Cambiar aquí
    { path: 'assets/models/npcs/Animated_Woman.glb', scale: 0.1 }
];
```

### Problema: Veo modelos pero son muy pequeños

**Causa**: Escala 0.01 es correcta para algunos modelos pero muy pequeña para otros

**Solución**: Ajustar escala individualmente:
```javascript
this.npcModels = [
    { path: 'assets/models/npcs/Character.glb', scale: 0.05 },
    { path: 'assets/models/npcs/Animated_Woman.glb', scale: 0.08 }
];
```

### Problema: NPCs están enterrados

**Causa**: Terreno está más alto que Y=1

**Solución**: Aumentar Y en `js/NPCManager.js`:
```javascript
npcMesh.position.set(data.position.x, 2, data.position.z); // ← Cambiar de 1 a 2
```

### Problema: No puedo llegar a los NPCs

**Causa**: Están muy lejos del centro

**Solución**: Modificar posiciones en `data/npcDialogs.json` para acercarlos:
```json
{
    "position": {
        "x": -5,  // ← Valores más pequeños
        "z": 5
    }
}
```

## 📸 Capturas de Pantalla Recomendadas

Para verificar que todo funciona:
1. Captura del cielo azul
2. Captura de una esfera roja (NPC)
3. Captura de un modelo NPC visible
4. Captura del icono flotante sobre un NPC
5. Captura de la consola con los logs

## ✅ Checklist de Verificación

- [ ] Servidor corriendo en http://localhost:8000
- [ ] Consola abierta (F12)
- [ ] Juego iniciado
- [ ] 10 mensajes "CREANDO NPC" en consola
- [ ] "10 NPCs creados en el mundo" en consola
- [ ] Cielo es azul (no beige)
- [ ] Veo al menos una esfera roja en el mapa
- [ ] Puedo acercarme a un NPC
- [ ] Veo el icono flotante sobre el NPC
- [ ] Puedo interactuar con E

## 🎉 Si Todo Funciona

¡Excelente! Los NPCs están visibles. Ahora puedes:
1. Remover las esferas de debug (opcional)
2. Ajustar escalas para mejor apariencia
3. Ajustar posiciones para mejor distribución
4. Agregar más NPCs si lo deseas

## 📞 Siguiente Paso

Si después de verificar todo:
- ✅ **Funciona**: Reporta qué ves y si necesitas ajustes
- ❌ **No funciona**: Comparte los logs de la consola y describe qué ves
