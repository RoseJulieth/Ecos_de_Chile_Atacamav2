# ⚖️ Escalas y Configuración Final - Ecos de Chile: Atacama

## ✅ Estado: CONFIGURADO Y OPTIMIZADO

---

## 📏 Escalas del Mapa

### Terreno Base
- **Tamaño:** 100 x 100 unidades
- **Altura del jugador:** ~1.8 unidades (escala humana realista)
- **Unidad de referencia:** 1 unidad = ~1 metro

### Zonas del Mapa
```
Copiapó:        Centro (0, 0)
Desierto:       Norte (+Z)
Bahía Inglesa:  Sur (-Z)
Extensión:      ±50 unidades desde el centro
```

---

## 🎮 Modelos del Jugador

### Male_Casual.fbx
```javascript
Formato: FBX
Escala: 0.01
Altura real: ~1.8 unidades (altura humana)
Posición Y: 0 (sobre el suelo)
```

**Razón de la escala:**
- Modelos de Mixamo vienen en escala 100x
- 0.01 los reduce a tamaño humano realista
- 1 unidad del juego = 1 metro aproximadamente

---

## 👥 Modelos de NPCs

### Configuración Actualizada

```javascript
// js/NPCManager.js
this.npcModels = [
    { path: 'assets/models/npcs/Character.glb', scale: 0.01 },
    { path: 'assets/models/npcs/Animated_Woman.glb', scale: 0.01 }
];
```

### Detalles por Modelo

**1. Character.glb**
- Escala: 0.01
- Altura: ~1.8 unidades
- Tipo: Personaje masculino
- Usado para: NPCs 1, 3, 5, 7, 9

**2. Animated_Woman.glb**
- Escala: 0.01
- Altura: ~1.7 unidades
- Tipo: Personaje femenino
- Usado para: NPCs 2, 4, 6, 8, 10

### Distribución en el Mapa

```
NPC 1 (Character):      (10, 0, 10)   - Guardián de la Historia
NPC 2 (Woman):          (-15, 0, 15)  - Sabio del Desierto
NPC 3 (Character):      (20, 0, -10)  - Cronista de Atacama
NPC 4 (Woman):          (-10, 0, -20) - Narradora de Leyendas
NPC 5 (Character):      (0, 0, 25)    - Guía Turístico
NPC 6 (Woman):          (15, 0, -25)  - Exploradora
NPC 7 (Character):      (-20, 0, 10)  - Historiador Local
NPC 8 (Woman):          (25, 0, 15)   - Guardiana del Paisaje
NPC 9 (Character):      (-25, 0, -5)  - Minero Veterano
NPC 10 (Woman):         (5, 0, -30)   - Poeta del Desierto
```

---

## 🏺 Modelos de Fragmentos

### Configuración Actual

```javascript
// js/FragmentManager.js
fragmentsData = [
    {
        id: 1,
        modelPath: 'assets/models/fragments/Trophy.glb',
        modelScale: 0.8,
        position: (15, 2, 15)
    },
    {
        id: 2,
        modelPath: 'assets/models/fragments/Dagger.glb',
        modelScale: 0.6,
        position: (-20, 2, 20)
    },
    {
        id: 3,
        modelPath: 'assets/models/fragments/Coin.glb',
        modelScale: 1.0,
        position: (25, 2, -25)
    },
    {
        id: 4,
        modelPath: 'assets/models/fragments/Coin.glb',
        modelScale: 1.0,
        position: (-25, 2, -15)
    },
    {
        id: 5,
        modelPath: 'assets/models/fragments/Trophy.glb',
        modelScale: 0.8,
        position: (0, 2, -35)
    }
];
```

### Detalles por Modelo

**Trophy.glb**
- Escala: 0.8
- Tamaño: ~0.8 unidades de alto
- Usado para: Fragmentos 1 y 5
- Representa: Trofeos/Jarros históricos

**Dagger.glb**
- Escala: 0.6
- Tamaño: ~0.6 unidades de largo
- Usado para: Fragmento 2
- Representa: Arma militar histórica

**Coin.glb**
- Escala: 1.0
- Tamaño: ~1.0 unidades de diámetro
- Usado para: Fragmentos 3 y 4
- Representa: Monedas/Medallones

### Altura de Flotación
```javascript
position.y = 2 + Math.sin(Date.now() * 0.003) * 0.3
// Base: 2 unidades sobre el suelo
// Oscilación: ±0.3 unidades
```

---

## 📊 Tabla de Escalas Comparativas

| Elemento | Escala | Altura Real | Proporción |
|----------|--------|-------------|------------|
| **Jugador** | 0.01 | 1.8 u | 100% (referencia) |
| **NPCs** | 0.01 | 1.7-1.8 u | 95-100% |
| **Trophy** | 0.8 | 0.8 u | 44% |
| **Dagger** | 0.6 | 0.6 u | 33% |
| **Coin** | 1.0 | 1.0 u | 56% |
| **Terreno** | 1.0 | 100x100 u | - |

---

## 🎯 Proporciones Realistas

### Escala Humana (Referencia)
```
Jugador:  1.8 unidades (1.80m)
NPCs:     1.7-1.8 unidades (1.70-1.80m)
```

### Objetos Coleccionables
```
Trophy:   0.8 unidades (80cm) - Tamaño de trofeo grande
Dagger:   0.6 unidades (60cm) - Longitud de daga/espada corta
Coin:     1.0 unidades (1m)   - Medallón grande decorativo
```

**Nota:** Los fragmentos son intencionalmente más grandes de lo normal para:
1. Ser fácilmente visibles en el mapa
2. Destacar como objetos importantes
3. Facilitar la interacción

---

## 🔧 Ajustes Recomendados

### Si los NPCs se Ven Muy Grandes/Pequeños

**Aumentar tamaño:**
```javascript
{ path: 'assets/models/npcs/Character.glb', scale: 0.012 }
```

**Reducir tamaño:**
```javascript
{ path: 'assets/models/npcs/Character.glb', scale: 0.008 }
```

### Si los Fragmentos se Ven Muy Grandes/Pequeños

**En js/FragmentManager.js:**
```javascript
// Aumentar
modelScale: 1.0  // de 0.8

// Reducir
modelScale: 0.5  // de 0.8
```

---

## 📐 Cálculo de Escalas

### Fórmula General
```
Escala Final = (Tamaño Deseado en Unidades) / (Tamaño Original del Modelo)
```

### Ejemplo: Modelo Mixamo
```
Tamaño original: 180 unidades (180cm en Mixamo)
Tamaño deseado: 1.8 unidades (1.8m en el juego)
Escala = 1.8 / 180 = 0.01
```

### Ejemplo: Fragmento
```
Tamaño original: 10 unidades
Tamaño deseado: 0.8 unidades
Escala = 0.8 / 10 = 0.08

Pero si el modelo ya está en escala correcta:
Escala = 0.8 (ajuste directo)
```

---

## 🗺️ Distribución en el Mapa

### Vista Superior (Aproximada)
```
                    N (+Z)
                     ↑
                     |
    NPC5 -------- Jugador -------- NPC8
     |              (0,0)             |
     |                                |
W ←--+--------------------------------+--→ E
(-X) |                                | (+X)
     |                                |
    NPC4 -------- Frag5 -------- NPC6
                     |
                     ↓
                   S (-Z)

Fragmentos: Distribuidos en las 4 esquinas + centro sur
NPCs: Distribuidos uniformemente por el mapa
```

### Distancias
```
Centro a Fragmento más lejano: ~35 unidades
Centro a NPC más lejano: ~30 unidades
Distancia entre NPCs: ~15-25 unidades
Radio de interacción: 3 unidades
```

---

## 🎮 Velocidades y Movimiento

### Jugador
```javascript
Velocidad caminar: 0.08 unidades/frame
Velocidad correr:  0.16 unidades/frame (2x)
Velocidad salto:   0.30 unidades/s (inicial)
```

### Tiempo de Recorrido
```
Centro a esquina (35u):
- Caminando: ~7 segundos
- Corriendo:  ~4 segundos

Recorrer todo el mapa (100u):
- Caminando: ~20 segundos
- Corriendo:  ~12 segundos
```

---

## ✅ Verificación de Escalas

### En el Juego

1. **Jugador vs NPCs:**
   - Deben tener altura similar
   - NPCs no deben ser gigantes ni enanos

2. **Jugador vs Fragmentos:**
   - Fragmentos deben ser visibles pero no enormes
   - Altura aproximada: cintura a pecho del jugador

3. **Movimiento:**
   - Caminar debe sentirse natural
   - Correr debe ser notablemente más rápido
   - Salto debe alcanzar ~1.5 unidades de altura

### En Consola (F12)

```javascript
// Ver escala del jugador
console.log('Jugador:', player.mesh.scale);
// Esperado: {x: 0.01, y: 0.01, z: 0.01}

// Ver escala de NPCs
scene.children.forEach(child => {
    if (child.userData.type === 'npc') {
        console.log('NPC:', child.userData.name, child.scale);
    }
});
// Esperado: {x: 0.01, y: 0.01, z: 0.01}

// Ver escala de fragmentos
scene.children.forEach(child => {
    if (child.userData.type === 'fragment') {
        console.log('Fragmento:', child.userData.name, child.scale);
    }
});
// Esperado: {x: 0.6-1.0, y: 0.6-1.0, z: 0.6-1.0}
```

---

## 📝 Checklist de Configuración

### Archivos
- [x] NPCManager.js - Nombres actualizados sin espacios
- [x] NPCManager.js - Escalas configuradas (0.01)
- [x] FragmentManager.js - Escalas ajustadas (0.6-1.0)
- [x] Player.js - Escala 0.01
- [x] test_npc_models.html - Actualizado

### Modelos
- [x] Character.glb - Sin espacios en nombre
- [x] Animated_Woman.glb - Sin espacios en nombre
- [x] Trophy.glb - Nombre correcto
- [x] Dagger.glb - Nombre correcto
- [x] Coin.glb - Nombre correcto
- [x] Male_Casual.fbx - Funcionando

### Escalas
- [x] Jugador: 0.01 (1.8u de altura)
- [x] NPCs: 0.01 (1.7-1.8u de altura)
- [x] Fragmentos: 0.6-1.0 (proporcionales)
- [x] Terreno: 100x100u

---

## 🚀 Próximos Pasos

1. **Probar en el juego:**
   ```
   http://localhost:8000
   ```

2. **Verificar escalas:**
   - NPCs deben verse del tamaño del jugador
   - Fragmentos deben ser visibles pero no gigantes

3. **Ajustar si es necesario:**
   - Modificar valores de scale en NPCManager.js
   - Modificar modelScale en FragmentManager.js

4. **Probar test page:**
   ```
   http://localhost:8000/test_npc_models.html
   ```

---

**Estado:** ✅ Escalas configuradas y optimizadas
**Nombres:** ✅ Sin espacios ni caracteres especiales
**Listo para:** Prueba final en el juego
