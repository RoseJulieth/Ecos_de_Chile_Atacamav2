# ⚙️ Ajuste de Velocidades - Sincronización Movimiento/Animación

## 🎯 Problema Resuelto

**Antes**: El personaje se deslizaba (sliding) porque la velocidad de movimiento no coincidía con la velocidad de las animaciones.

**Ahora**: Velocidades ajustadas para que el movimiento del personaje coincida con los pasos de la animación.

---

## 📊 Valores Ajustados

### Velocidades de Movimiento (js/Player.js)

```javascript
// ANTES
this.speed = 0.15;              // Muy rápido
this.sprintMultiplier = 1.8;    // Sprint no suficientemente rápido
this.jumpForce = 0.35;          // Salto muy alto

// AHORA
this.speed = 0.08;              // Velocidad de caminar reducida
this.sprintMultiplier = 2.0;    // Sprint más rápido
this.jumpForce = 0.30;          // Salto más natural
```

### Velocidades de Animación

```javascript
// Idle
animationSpeed = 1.0;  // Velocidad normal

// Walk
animationSpeed = 1.0;  // Velocidad normal

// Run
animationSpeed = 1.0;  // Velocidad normal

// Jump
animationSpeed = 1.0;  // Velocidad normal
```

---

## 🔧 Cómo Funciona la Sincronización

### 1. Velocidad de Movimiento

La velocidad de movimiento determina qué tan rápido se mueve el personaje en el mundo:

```javascript
// Velocidad base (caminar)
this.speed = 0.08;  // unidades por frame

// Velocidad al correr
const sprintSpeed = this.speed * this.sprintMultiplier;
// = 0.08 * 2.0 = 0.16 unidades por frame
```

### 2. Velocidad de Animación

La velocidad de animación (timeScale) determina qué tan rápido se reproduce la animación:

```javascript
action.timeScale = 1.0;  // Velocidad normal (100%)
action.timeScale = 1.5;  // 50% más rápido
action.timeScale = 0.5;  // 50% más lento
```

### 3. Sincronización

Para que el personaje no se deslice:

```
Velocidad de Movimiento ≈ Velocidad de Animación × Distancia por Paso
```

---

## 🎮 Cómo Probar los Ajustes

### 1. Probar en el Juego

```
1. Abrir: http://localhost:8000
2. Comenzar exploración
3. Probar movimientos:
   - WASD: Caminar
   - Shift + WASD: Correr
   - Espacio: Saltar
```

### 2. Verificar Sincronización

**Caminar (Walk)**:
- Los pies deben tocar el suelo sin deslizarse
- El personaje avanza a la velocidad de los pasos
- No debe parecer que camina en el lugar
- No debe parecer que se desliza sobre hielo

**Correr (Run)**:
- Los pies deben moverse más rápido
- El personaje avanza más rápido que al caminar
- La animación debe verse natural
- No debe haber deslizamiento

**Saltar (Jump)**:
- El salto debe verse natural
- No debe ser muy alto ni muy bajo
- El aterrizaje debe ser suave

---

## 🔧 Ajuste Fino

Si después de probar notas que:

### Problema: Personaje se Desliza (Sliding)

**Síntoma**: Los pies se deslizan sobre el suelo, parece que patina.

**Causa**: Velocidad de movimiento muy alta para la animación.

**Solución**: Reducir velocidad de movimiento
```javascript
// En js/Player.js
this.speed = 0.06;  // Reducir de 0.08 a 0.06
```

O aumentar velocidad de animación:
```javascript
// En js/Player.js, método updateAnimation()
animationSpeed = 1.2;  // Aumentar de 1.0 a 1.2
```

---

### Problema: Personaje Camina en el Lugar

**Síntoma**: Los pies se mueven pero el personaje avanza muy lento.

**Causa**: Velocidad de movimiento muy baja para la animación.

**Solución**: Aumentar velocidad de movimiento
```javascript
// En js/Player.js
this.speed = 0.10;  // Aumentar de 0.08 a 0.10
```

O reducir velocidad de animación:
```javascript
// En js/Player.js, método updateAnimation()
animationSpeed = 0.8;  // Reducir de 1.0 a 0.8
```

---

### Problema: Sprint No Se Siente Rápido

**Síntoma**: Correr no se siente mucho más rápido que caminar.

**Solución**: Aumentar multiplicador de sprint
```javascript
// En js/Player.js
this.sprintMultiplier = 2.5;  // Aumentar de 2.0 a 2.5
```

O aumentar velocidad de animación de run:
```javascript
// En js/Player.js, método updateAnimation()
if (this.isSprinting) {
    targetAnimation = 'run';
    animationSpeed = 1.3;  // Aumentar de 1.0 a 1.3
}
```

---

### Problema: Salto Muy Alto o Muy Bajo

**Síntoma**: El personaje salta demasiado alto o apenas despega.

**Solución**: Ajustar fuerza de salto
```javascript
// En js/Player.js
this.jumpForce = 0.25;  // Más bajo (de 0.30)
this.jumpForce = 0.35;  // Más alto (de 0.30)
```

---

## 📐 Fórmula de Ajuste

Para encontrar la velocidad perfecta:

```
1. Observar cuántos pasos da el personaje por segundo en la animación
2. Medir cuánta distancia debe recorrer por paso
3. Calcular: velocidad = pasos_por_segundo × distancia_por_paso / 60
```

**Ejemplo**:
- Animación de caminar: 2 pasos por segundo
- Distancia por paso: 0.5 unidades
- Velocidad = 2 × 0.5 / 60 = 0.0167 unidades por frame
- A 60 FPS = 1 unidad por segundo

---

## 🎯 Valores Recomendados por Tipo de Modelo

### Modelos Mixamo (Escala 0.01)
```javascript
this.speed = 0.08;              // Caminar
this.sprintMultiplier = 2.0;    // Correr
this.jumpForce = 0.30;          // Saltar
```

### Modelos Grandes (Escala 0.1)
```javascript
this.speed = 0.12;              // Caminar
this.sprintMultiplier = 2.0;    // Correr
this.jumpForce = 0.35;          // Saltar
```

### Modelos Pequeños (Escala 0.001)
```javascript
this.speed = 0.05;              // Caminar
this.sprintMultiplier = 2.0;    // Correr
this.jumpForce = 0.25;          // Saltar
```

---

## 🧪 Modo de Prueba Rápida

Para probar diferentes velocidades sin editar código:

### En la Consola del Navegador (F12)

```javascript
// Cambiar velocidad de caminar
player.speed = 0.10;

// Cambiar multiplicador de sprint
player.sprintMultiplier = 2.5;

// Cambiar fuerza de salto
player.jumpForce = 0.35;

// Cambiar velocidad de animación actual
if (player.animationController.currentAction) {
    player.animationController.currentAction.timeScale = 1.2;
}
```

Prueba diferentes valores en tiempo real y anota los que funcionen mejor.

---

## 📊 Tabla de Referencia Rápida

| Velocidad | Walk Speed | Sprint Mult | Resultado |
|-----------|------------|-------------|-----------|
| Muy Lento | 0.05 | 1.5 | Personaje muy lento |
| Lento | 0.06 | 1.8 | Caminar pausado |
| **Normal** | **0.08** | **2.0** | **Equilibrado** ✓ |
| Rápido | 0.10 | 2.2 | Caminar ágil |
| Muy Rápido | 0.12 | 2.5 | Personaje veloz |

---

## ✅ Checklist de Verificación

Después de ajustar las velocidades, verifica:

- [ ] Al caminar, los pies no se deslizan
- [ ] Al caminar, el personaje no parece estar en el lugar
- [ ] Al correr, se siente notablemente más rápido
- [ ] Al correr, los pies siguen sin deslizarse
- [ ] El salto se ve natural (no muy alto ni muy bajo)
- [ ] Las transiciones entre animaciones son suaves
- [ ] El personaje responde bien a los controles
- [ ] La velocidad se siente cómoda para jugar

---

## 🎮 Valores Actuales Implementados

```javascript
// js/Player.js
this.speed = 0.08;              // Velocidad de caminar
this.sprintMultiplier = 2.0;    // Multiplicador para correr
this.jumpForce = 0.30;          // Fuerza de salto

// Velocidades de animación
idle:  1.0x
walk:  1.0x
run:   1.0x
jump:  1.0x
```

Estos valores están optimizados para modelos Mixamo con escala 0.01.

---

## 💡 Consejos Adicionales

1. **Prueba en diferentes terrenos**: La velocidad puede sentirse diferente en espacios abiertos vs cerrados.

2. **Considera el gameplay**: Velocidades más altas = juego más dinámico, velocidades más bajas = más control.

3. **Ajusta según el modelo**: Cada modelo puede tener animaciones con diferentes velocidades de paso.

4. **Usa la esfera de debug**: Te ayuda a ver exactamente dónde está el personaje mientras ajustas.

5. **Prueba con otros jugadores**: Lo que te parece bien a ti puede ser muy rápido o lento para otros.

---

## 🔄 Proceso de Ajuste Recomendado

1. **Probar valores actuales** (0.08 walk, 2.0 sprint)
2. **Observar si hay deslizamiento**
3. **Ajustar en incrementos pequeños** (±0.01 o ±0.02)
4. **Probar nuevamente**
5. **Repetir hasta encontrar el equilibrio perfecto**
6. **Documentar los valores finales**

---

**Estado**: ✅ Velocidades ajustadas y listas para probar
**Próximo paso**: Probar en el juego y afinar si es necesario
