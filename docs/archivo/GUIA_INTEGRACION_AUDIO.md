# 🔊 Guía de Integración del Sistema de Audio

## Sistema Creado

Se ha creado un sistema completo de audio para el juego con la siguiente estructura:

### 📁 Estructura de Carpetas

```
assets/sounds/
├── music/          # Música de fondo (loops largos)
├── sfx/            # Efectos de sonido (sonidos cortos)
├── ambient/        # Sonidos ambientales (loops de ambiente)
└── ui/             # Sonidos de interfaz (clicks, notificaciones)
```

### 📄 Archivos Creados

1. **`data/soundConfig.json`** - Configuración de todos los sonidos
2. **`js/AudioManager.js`** - Sistema de gestión de audio
3. **`assets/sounds/README.md`** - Documentación de sonidos

## 🎮 Cómo Integrar en index.html

### Paso 1: Importar AudioManager

Agregar al inicio del script en `index.html`:

```javascript
import { AudioManager } from './js/AudioManager.js';
```

### Paso 2: Inicializar AudioManager

En la función `initGame()`, después de crear la cámara:

```javascript
async function initGame() {
    // ... código existente ...
    
    // Crear cámara
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // 🔊 INICIALIZAR AUDIO
    audioManager = new AudioManager();
    await audioManager.loadSoundConfig();
    audioManager.attachToCamera(camera);
    
    // Precargar sonidos (opcional, puede hacerse después)
    await audioManager.preloadAllSounds();
    
    // ... resto del código ...
}
```

### Paso 3: Agregar Variable Global

Al inicio del script, con las otras variables:

```javascript
let audioManager;
```

## 🎵 Ejemplos de Uso

### Música de Fondo

```javascript
// Reproducir música del menú principal
audioManager.play('main_theme');

// Cambiar música con fade al entrar a una zona
audioManager.changeMusicWithFade('copiapo_theme', 2.0);

// Detener música
audioManager.stopMusic();
```

### Efectos de Sonido

```javascript
// Al recolectar fragmento
audioManager.play('collect_fragment');

// Al interactuar con NPC
audioManager.play('npc_interact');

// Al saltar
audioManager.play('jump');
```

### Sonidos Ambientales

```javascript
// Reproducir ambiente de desierto
audioManager.play('desert_wind');

// Reproducir olas del mar en Bahía Inglesa
audioManager.play('ocean_waves');

// Detener ambiente actual
audioManager.stopAmbient();
```

### Sonidos de UI

```javascript
// Click en botón
document.getElementById('btn-start').addEventListener('click', () => {
    audioManager.play('button_click');
    startNewGame();
});

// Abrir diálogo
audioManager.play('dialog_open');
```

## 🎛️ Controles de Volumen

### Ajustar Volúmenes

```javascript
// Volumen master (0.0 a 1.0)
audioManager.setMasterVolume(0.8);

// Volumen de música
audioManager.setMusicVolume(0.5);

// Volumen de efectos
audioManager.setSFXVolume(0.7);

// Volumen de ambiente
audioManager.setAmbientVolume(0.4);
```

### Mute/Unmute

```javascript
// Toggle mute
const isMuted = audioManager.toggleMute();
console.log(`Audio ${isMuted ? 'muteado' : 'activado'}`);
```

## 🗺️ Integración por Zonas

### Cambiar Música Según Zona

En `js/ZoneManager.js` o donde detectes cambio de zona:

```javascript
// Detectar zona actual del jugador
function updatePlayerZone(playerPosition) {
    // Copiapó (Oeste)
    if (playerPosition.x < -60) {
        if (currentZone !== 'copiapo') {
            currentZone = 'copiapo';
            audioManager.changeMusicWithFade('copiapo_theme', 2.0);
            audioManager.play('city_ambient');
        }
    }
    // Bahía Inglesa (Este)
    else if (playerPosition.x > 60) {
        if (currentZone !== 'bahia') {
            currentZone = 'bahia';
            audioManager.changeMusicWithFade('bahia_theme', 2.0);
            audioManager.play('ocean_waves');
            audioManager.play('seagulls');
        }
    }
    // Desierto Florido (Norte)
    else if (playerPosition.z < -40) {
        if (currentZone !== 'desierto') {
            currentZone = 'desierto';
            audioManager.changeMusicWithFade('desierto_theme', 2.0);
            audioManager.play('desert_wind');
        }
    }
    // Centro
    else {
        if (currentZone !== 'center') {
            currentZone = 'center';
            audioManager.changeMusicWithFade('main_theme', 2.0);
            audioManager.stopAmbient();
        }
    }
}
```

## 🎯 Integración en Eventos del Juego

### En FragmentManager.js

```javascript
collectFragment(fragment, callback) {
    // ... código existente ...
    
    // 🔊 Reproducir sonido de recolección
    if (window.audioManager) {
        window.audioManager.play('collect_fragment');
    }
    
    // ... resto del código ...
}
```

### En InteractionSystem.js

```javascript
openDialog(npcData) {
    // 🔊 Reproducir sonido de diálogo
    if (window.audioManager) {
        window.audioManager.play('dialog_open');
    }
    
    // ... código existente ...
}

closeDialog() {
    // 🔊 Reproducir sonido de cierre
    if (window.audioManager) {
        window.audioManager.play('dialog_close');
    }
    
    // ... código existente ...
}
```

### En Player.js

```javascript
update(keys, cameraAngle, delta, ground, canMove = true) {
    // ... código existente ...
    
    // Salto
    if (keys.space && this.isGrounded && this.canJump && canMove) {
        this.velocity.y = this.jumpForce;
        this.canJump = false;
        this.isJumping = true;
        
        // 🔊 Reproducir sonido de salto
        if (window.audioManager) {
            window.audioManager.play('jump');
        }
    }
    
    // ... resto del código ...
}
```

## 🎨 UI de Controles de Audio (Opcional)

Puedes agregar controles de audio en el menú de pausa:

```html
<!-- En index.html, dentro del pause-menu -->
<div id="audio-controls" style="margin: 20px 0;">
    <h3 style="color: #FFD700;">🔊 Audio</h3>
    
    <label>Volumen Master: <span id="master-vol">100</span>%</label>
    <input type="range" id="master-volume" min="0" max="100" value="100">
    
    <label>Música: <span id="music-vol">70</span>%</label>
    <input type="range" id="music-volume" min="0" max="100" value="70">
    
    <label>Efectos: <span id="sfx-vol">80</span>%</label>
    <input type="range" id="sfx-volume" min="0" max="100" value="80">
    
    <button id="btn-mute">🔇 Mutear</button>
</div>
```

```javascript
// Event listeners para controles
document.getElementById('master-volume').addEventListener('input', (e) => {
    const vol = e.target.value / 100;
    audioManager.setMasterVolume(vol);
    document.getElementById('master-vol').textContent = e.target.value;
});

document.getElementById('music-volume').addEventListener('input', (e) => {
    const vol = e.target.value / 100;
    audioManager.setMusicVolume(vol);
    document.getElementById('music-vol').textContent = e.target.value;
});

document.getElementById('sfx-volume').addEventListener('input', (e) => {
    const vol = e.target.value / 100;
    audioManager.setSFXVolume(vol);
    document.getElementById('sfx-vol').textContent = e.target.value;
});

document.getElementById('btn-mute').addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    document.getElementById('btn-mute').textContent = isMuted ? '🔊 Activar' : '🔇 Mutear';
});
```

## ⚠️ Notas Importantes

1. **Archivos de Audio Opcionales**: El sistema funciona sin archivos de audio. Solo mostrará advertencias en consola.

2. **Carga Asíncrona**: Los sonidos se cargan de forma asíncrona. Puedes precargarlos todos al inicio o cargarlos bajo demanda.

3. **Rendimiento**: Precargar todos los sonidos puede aumentar el tiempo de carga inicial. Considera cargar solo los esenciales primero.

4. **Autoplay Policy**: Los navegadores modernos bloquean autoplay de audio. La música debe iniciarse después de una interacción del usuario (click en "Comenzar").

5. **Formatos**: MP3 es el más compatible. OGG es más eficiente pero menos compatible.

## 🚀 Implementación Rápida

Para una implementación rápida sin archivos de audio:

```javascript
// En initGame()
audioManager = new AudioManager();
await audioManager.loadSoundConfig();
audioManager.attachToCamera(camera);
// NO precargar sonidos aún
// await audioManager.preloadAllSounds();

// Hacer audioManager global para acceso fácil
window.audioManager = audioManager;
```

Luego, cuando tengas archivos de audio, simplemente agrégalos a las carpetas correspondientes y el sistema los cargará automáticamente.

## 📊 Verificación

Para verificar que el sistema está funcionando:

```javascript
// En la consola del navegador
console.log(audioManager.getLoadedSounds());
```

Esto mostrará todos los sonidos cargados y su estado.
