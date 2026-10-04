# 🏜️ Ecos de Chile: Atacama

## Experiencia Educativa Interactiva 3D

**Desarrollado por:** Jennifer Astudillo  
**Tecnología:** Three.js r160+  
**Estilo Visual:** Cel-Shading (inspirado en Wind Waker)  
**Año:** 2025

---

## 📋 Descripción del Proyecto

"Ecos de Chile: Atacama" es un prototipo de videojuego educativo en 3D que permite a los jugadores explorar la historia y cultura de la Región de Atacama a través de la recolección de 5 fragmentos históricos distribuidos en tres zonas jugables.

### 🎯 Objetivos Educativos

- Aprender sobre la **Cultura Diaguita** (1000-1540 d.C)
- Conocer el **Batallón Atacama** de la Guerra del Pacífico
- Descubrir el fenómeno del **Desierto Florido**
- Explorar la historia minera de **Chañarcillo**
- Visitar virtualmente **Bahía Inglesa**

---

## 🎮 Características Implementadas

### ✅ 3.1.1 Programación del Videojuego

#### Sistema de Movimiento y Cámara

- **WASD**: Movimiento del jugador relativo a la cámara
- **Shift**: Sprint (velocidad aumentada 1.8x)
- **Espacio**: Salto con física realista
- **Mouse**: Control de cámara en tercera persona
- **Cámara inteligente**: Evita atravesar geometrías mediante Raycast

#### Física y Colisiones

- Gravedad: -9.8 u/s²
- Detección de suelo mediante Raycasting
- Sistema de salto con cooldown
- Colisiones con el terreno

#### Arquitectura Modular

```
js/
├── Player.js                    # Lógica del jugador y física
├── CameraController.js          # Sistema de cámara tercera persona
├── InventorySystem.js           # Sistema de inventario 50 slots
├── FragmentManager.js           # Gestión de fragmentos históricos
├── UIManager.js                 # Interfaz de usuario
├── GameStateManager.js          # Persistencia y estados del juego
├── WorldBuilder.js              # Construcción del mundo 3D
├── AssetLoader.js               # Carga de modelos 3D (GLB/FBX)
├── AnimationController.js       # Sistema de animaciones
├── NPCManager.js                # Gestión de NPCs
├── InteractionSystem.js         # Sistema de interacciones
├── TerrainDecorationManager.js  # Decoración del terreno
├── ZoneManager.js               # Gestión de zonas temáticas
└── AudioManager.js              # Sistema de audio completo
```

### ✅ 3.1.2 Modelos y Elementos Visuales

#### Estilo Visual Cel-Shading

- **MeshToonMaterial**: Efecto de sombreado tipo cartoon
- **Paleta de colores cálidos**: Naranjas, amarillos, marrones del desierto
- **Iluminación atmosférica**: Luz cálida que simula el sol de Atacama

#### Escenario y Ambientación

- **3 Zonas Jugables**:
  - 🏛️ **Copiapó** (Centro): Zona histórica con tonos marrones
  - 🌸 **Desierto Florido** (Norte): Flores rosadas y violetas
  - 🌊 **Bahía Inglesa** (Sur): Efecto de agua azul turquesa

#### Modelos de Fragmentos

- **Modelos 3D GLB detallados**:
  - 🏺 **Trophy.glb**: Cultura Diaguita (escala 1.2)
  - ⚔️ **Dagger.glb**: Batallón Atacama (escala 0.9)
  - 🌸 **Simple_red_flower.glb**: Desierto Florido (escala 0.8)
  - 💎 **Coin.glb**: Plata Chañarcillo (escala 1.4)
  - 🏖️ **Seashell.glb**: Bahía Inglesa (escala 0.8)
- **Colores distintivos** con efectos de emisión
- **Animaciones**: Rotación y flotación suave
- **Glow effect** para mejor visibilidad

### ✅ 3.1.3 Interacciones Implementadas

#### Recolección de Fragmentos

- **Interacción con tecla E** para recolectar fragmentos
- **Detección por proximidad** con indicador visual
- **Modelos 3D detallados**: Trophy, Dagger, Flower, Coin, Seashell
- **Escalas optimizadas** para mejor visibilidad (excepto Bahía Inglesa)
- **Efecto visual**: Glow effect alrededor de cada fragmento
- **Información completa**: Texto educativo, período histórico, dato curioso

#### Sistema de Inventario

- **50 slots** organizados en 3 categorías:
  - 🏺 Fragmentos Históricos
  - 🎒 Items
  - ⛏️ Recursos
- **Panel compacto** en HUD (esquina superior derecha)
- **Inventario completo** accesible con tecla 'I'

#### Persistencia

- **Auto-guardado** al recolectar fragmentos
- **Guardado manual** desde menú de pausa
- **Continuación de partida** desde menú principal
- **localStorage**: Guarda posición del jugador y fragmentos recolectados

#### Sistema de Confirmaciones Personalizadas

- **Cuadros de confirmación elegantes** en lugar de popups del navegador
- **Reiniciar Progreso**: Cuadro rojo con advertencia clara
- **Guardar Progreso**: Cuadro verde con información de guardado
- **Salir al Menú**: Cuadro con opciones de guardar/no guardar/cancelar
- **Notificaciones en el juego** para feedback inmediato

#### Sistema de Audio (Implementado)

- **Controles de volumen independientes**:
  - 🔊 Volumen Master
  - 🎵 Música de fondo
  - 🌬️ Sonidos ambientales
  - 🔊 Efectos de sonido
- **Botón de mutear** general
- **Música dinámica** que cambia entre menú y juego
- **Efectos de sonido** para botones e interacciones

### ✅ 3.1.4 Interfaces de Usuario / HUD

#### HUD (Heads-Up Display)

- **Panel de Inventario**: Muestra progreso X/5
- **Lista de fragmentos**: Con estado (recolectado/bloqueado)
- **Controles en pantalla**: Guía de teclas
- **Notificaciones Toast**: Aparecen 5 segundos al recolectar

#### Menús

- **Menú Principal**:
  - 🎮 Comenzar Exploración
  - 📂 Continuar Partida (si existe guardado)
  - 🔄 Reiniciar Progreso (con confirmación personalizada)
  - ℹ️ Créditos
- **Menú de Pausa** (ESC):
  - ▶️ Continuar
  - 📦 Ver Inventario Completo
  - 💾 Guardar Progreso
  - � Contr oles de Audio (Master, Música, Ambiente, Efectos)
  - 🏠 Volver al Menú Principal

#### Diseño Visual

- Paleta: Dorados (#FFD700), marrones (#8B4513), negros
- Animaciones suaves (glow, pulse, slideUp)
- Bordes y sombras para profundidad
- Tipografía clara y legible

---

## 🎮 Controles

| Tecla                 | Acción                                                |
| --------------------- | ----------------------------------------------------- |
| **W A S D / Flechas** | Movimiento del jugador (controles duales)             |
| **Shift**             | Correr (sprint)                                       |
| **Espacio**           | Saltar                                                |
| **E**                 | Interactuar (Recolectar fragmentos / Hablar con NPCs) |
| **Mouse**             | Rotar cámara (requiere click para capturar)           |
| **ESC**               | Abrir/cerrar menú de pausa / Cerrar diálogo           |
| **I**                 | Abrir/cerrar inventario completo                      |

---

## 🚀 Cómo Ejecutar

### Opción 1: Servidor Local Simple

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server -p 8000
```

Luego abre: `http://localhost:8000`

### Opción 2: Live Server (VS Code)

1. Instala la extensión "Live Server"
2. Click derecho en `index.html`
3. Selecciona "Open with Live Server"

### Opción 3: Navegador Directo

⚠️ **Nota**: Algunos navegadores bloquean módulos ES6 desde `file://`. Se recomienda usar un servidor local.

---

## 📚 Contenido Educativo

### 1. 🏺 Cultura Diaguita

- **Período**: 1000-1540 d.C
- **Info**: Pueblo originario famoso por su cerámica 'jarro-pato'
- **Dato Curioso**: Sus jarros combinaban funcionalidad con arte, representando patos nadando

### 2. ⚔️ Batallón Atacama

- **Período**: 1879 - Guerra del Pacífico
- **Info**: Unidad militar conocida como 'Los Curitas' por sus uniformes negros
- **Dato Curioso**: Participaron heroicamente en la Batalla de Tacna

### 3. 🌸 Desierto Florido

- **Período**: Fenómeno Natural Cíclico
- **Info**: Semillas latentes florecen tras lluvias inusuales
- **Dato Curioso**: Ocurre cada 5-7 años cuando El Niño trae lluvias al desierto más árido

### 4. ⛏️ Plata Chañarcillo

- **Período**: 1832-1875
- **Info**: Descubrimiento que convirtió a Copiapó en capital minera
- **Dato Curioso**: Descubierto por Juan Godoy, un arriero que cambió la historia de Chile

### 5. 🌊 Bahía Inglesa

- **Período**: Siglo XVII - Actualidad
- **Info**: Puerto histórico nombrado por el corsario Edward Davis en 1687
- **Dato Curioso**: Sus aguas turquesas la convierten en una de las playas más hermosas de Chile

---

## ✅ Características Avanzadas Implementadas

### NPCs Informativos

- ✅ **NPCs con diálogos contextuales** distribuidos por el mundo
- ✅ **Sistema de conversación** con interfaz elegante
- ✅ **Información histórica adicional** por zona
- ✅ **Modelos 3D detallados** para NPCs

### Sistema de Interacciones

- ✅ **Detección de proximidad** para objetos interactuables
- ✅ **Indicadores visuales** cuando puedes interactuar
- ✅ **Tecla E** para interacciones consistentes
- ✅ **Múltiples tipos de interacción**: fragmentos, NPCs, letreros

### Decoración y Ambientación

- ✅ **Decoración del terreno** con cactus y flores
- ✅ **Zonas temáticas** diferenciadas (Copiapó, Bahía Inglesa)
- ✅ **Modelos arquitectónicos** (casas, estructuras)
- ✅ **Sistema de colisiones** con obstáculos

### Mejoras Visuales Implementadas

- ✅ **Modelos 3D detallados** para todos los fragmentos
- ✅ **Texturas preservadas** en modelos GLB
- ✅ **Efectos de emisión** para mejor visibilidad
- ✅ **Iluminación mejorada** con sombras suaves

## 🔮 Trabajo Futuro (Planificado)

### Mini-mapa

- [ ] Tamaño: 150x150px
- [ ] Posición del jugador en tiempo real
- [ ] Marcadores de fragmentos
- [ ] Indicadores de zonas

### Contenido Adicional

- [ ] Más fragmentos históricos (objetivo: 15-20)
- [ ] Sistema de logros
- [ ] Galería de descubrimientos
- [ ] Modo foto
- [ ] Videos educativos integrados
- [ ] Modo foto

---

## 🛠️ Tecnologías Utilizadas

- **Three.js r160**: Motor 3D WebGL
- **JavaScript ES6+**: Módulos y clases
- **HTML5 & CSS3**: Interfaz de usuario
- **localStorage API**: Persistencia de datos

---

## 📝 Estructura del Proyecto

```
ecos-de-chile-atacama/
├── index.html              # Archivo principal
├── README.md              # Documentación
├── js/
│   ├── Player.js          # Sistema del jugador
│   ├── CameraController.js # Control de cámara
│   ├── InventorySystem.js  # Inventario
│   ├── FragmentManager.js  # Fragmentos históricos
│   ├── UIManager.js        # Interfaz de usuario
│   ├── GameStateManager.js # Estados y guardado
│   └── WorldBuilder.js     # Construcción del mundo
└── .vscode/               # Configuración VS Code
```

---

## 🎓 Créditos

**Desarrollado por:** Jennifer Astudillo  
**Institución:** Universidad Tecnológica de Chile INACAP  
**Carrera:** Ingeniería en Informática  
**Asignatura:** Desarrollo de Video Juegos  
**Año:** 2025

### Inspiración Visual

- **Wind Waker** (Nintendo): Estilo cel-shading
- **Journey** (thatgamecompany): Ambientación desértica

### Recursos Educativos

- Información histórica de la Región de Atacama
- Datos culturales de pueblos originarios
- Historia minera de Chile

---

## 📄 Licencia

Este proyecto es un prototipo educativo desarrollado con fines académicos.

---

## 🐛 Reporte de Problemas

Si encuentras algún bug o tienes sugerencias:

1. Describe el problema detalladamente
2. Indica los pasos para reproducirlo
3. Incluye capturas de pantalla si es posible

---

## ✨ Características Destacadas

- ✅ **Arquitectura modular** y escalable
- ✅ **Sistema de física** realista con gravedad
- ✅ **Persistencia completa** con localStorage
- ✅ **UI/UX pulida** con animaciones
- ✅ **Contenido educativo** verificado
- ✅ **Sistema de audio completo** con controles independientes
- ✅ **Cuadros de confirmación personalizados** (no popups nativos)
- ✅ **NPCs interactivos** con diálogos contextuales
- ✅ **Modelos 3D detallados** para fragmentos y decoración
- ✅ **Sistema de colisiones** avanzado con obstáculos
- ✅ **Optimizado** para navegadores modernos
- ✅ **Responsive** y adaptable

---

**¡Disfruta explorando la historia de Atacama! 🏜️✨**
