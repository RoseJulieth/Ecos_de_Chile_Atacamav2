# 🏜️ Ecos de Chile: Atacama

Juego educativo en 3D (Three.js) sobre la historia y la naturaleza de la Región de Atacama.
Proyecto de Jennifer Astudillo · INACAP.

**Jugar online:** https://rosejulieth.github.io/Ecos_de_Chile_Atacamav2/

## Cómo se juega

Explora **Copiapó**, el pueblo central, y cruza los portales hacia cinco escenas. En cada una hay un
**fragmento histórico** que recoger, personajes que te cuentan su historia (y te dan misiones) y animales de la zona.

| Escena | Fragmento | Fauna |
|---|---|---|
| Copiapó (pueblo central) | — | gatos y perros |
| Cultura Diaguita | Jarro-pato | diucas |
| Batallón Atacama | Sable | zorros culpeo |
| Plata de Chañarcillo | Plata | — |
| Desierto Florido | Flor | abejas nativas |
| Bahía Inglesa | Caracola | gaviotas |

| Tecla | Acción |
|---|---|
| W A S D / flechas | Moverse |
| Shift · Espacio | Correr · Saltar |
| Mouse | Mover la cámara (hacer clic primero) |
| E | Hablar, leer, recoger |
| I · M · Esc | Inventario · Mapa · Pausa (volumen, hora y clima) |
| F3 | Mostrar FPS y dibujos por cuadro |

## Ejecutarlo en tu computador

Necesita un servidor local (abrir `index.html` con doble clic no funciona). **No necesita internet**: Three.js
viene incluido en `vendor/three/`.

```bash
node server.js                  # o:  python -m http.server 8000
# abrir http://localhost:8000
```

También sirve la extensión *Live Server* de VS Code o el programa *Simple Web Server*.
(Los videos de YouTube de algunos diálogos sí requieren internet; el resto del juego, no.)

## Publicarlo en GitHub Pages

Settings → Pages → *Deploy from a branch* → elegir la rama y la carpeta `/ (root)`. El archivo `.nojekyll` ya está incluido.

## Estructura

```
index.html            Pantalla principal, menús e interfaz
server.js             Servidor local sin dependencias
js/
  main.js             Arranque, bucle del juego, interacción y guardado
  scenes.js           Las 6 escenas (qué hay y dónde)
  World.js            Motor de escenas: construcción, colisiones, NPC, portales
  Characters.js       Personajes y la "receta" de cada NPC
  Buildings.js        Casas, iglesia, palmeras, botes, mina, carpas, portales, reliquias…
  ProceduralAssets.js Cactus, rocas, flores, cerros y utilidades de dibujo
  Fauna.js            Animales y su comportamiento
  Quests.js           Misiones de los NPC y recompensas
  Atmosphere.js       Día y noche, clima
  Minimap.js          Mapa con brújula
  PlayerController.js Movimiento y colisiones del jugador
  CameraController.js · AudioManager.js · UIManager.js · InventorySystem.js · …
data/                 Diálogos de los NPC y configuración de sonidos
assets/sounds/        Música, ambientes y efectos
vendor/three/         Three.js r160 (copia local, licencia MIT)
tools/                Generador de efectos de sonido y ambientes
preview_*.html        Vistas previas de objetos, personajes y fauna
```

Todos los personajes, animales, edificios y objetos se generan por código (estilo low-poly con sombreado toon),
así que el juego no usa modelos 3D externos.

## Sonidos

Los efectos (recolectar, saltar, menús…) y los ambientes (viento, olas, lluvia) se generan con
`python3 tools/generar_sfx.py` (requiere `ffmpeg`). La música y otros sonidos están en `assets/sounds/`; ver su `README.md`.

## Créditos y licencias

- Three.js — MIT, © mrdoob y colaboradores (`vendor/three/LICENSE`).
- Referencia visual: *The Legend of Zelda: Wind Waker* (estilo cel-shading).
