# 🔊 Carpeta de Sonidos - Ecos de Chile: Atacama

Esta carpeta contiene todos los archivos de audio del juego organizados por categorías.

## 📁 Estructura de Carpetas

```
assets/sounds/
├── music/          # Música de fondo
├── sfx/            # Efectos de sonido (Sound Effects)
├── ambient/        # Sonidos ambientales
└── ui/             # Sonidos de interfaz de usuario
```

## 🎵 Categorías de Sonidos

### 1. Music (Música de Fondo)
Música que se reproduce en loop durante el juego.

**Archivos necesarios:**
- `main_theme.mp3` - Tema principal del menú
- `copiapo_theme.mp3` - Música de la zona de Copiapó
- `desierto_theme.mp3` - Música del Desierto Florido
- `bahia_theme.mp3` - Música de Bahía Inglesa

**Características recomendadas:**
- Formato: MP3 o OGG
- Bitrate: 128-192 kbps
- Duración: 2-4 minutos (loop)
- Volumen normalizado

### 2. SFX (Efectos de Sonido)
Sonidos cortos que se reproducen en eventos específicos.

**Archivos necesarios:**
- `footstep_sand.mp3` - Pasos en arena
- `footstep_ground.mp3` - Pasos en tierra
- `collect_fragment.mp3` - Recolectar fragmento histórico
- `npc_interact.mp3` - Interactuar con NPC
- `jump.mp3` - Salto del jugador
- `notification.mp3` - Notificación general

**Características recomendadas:**
- Formato: MP3 o OGG
- Bitrate: 96-128 kbps
- Duración: 0.1-2 segundos
- Sin silencio al inicio/final

### 3. Ambient (Sonidos Ambientales)
Sonidos de ambiente que se reproducen en loop según la zona.

**Archivos necesarios:**
- `desert_wind.mp3` - Viento del desierto
- `ocean_waves.mp3` - Olas del mar
- `seagulls.mp3` - Gaviotas en la playa
- `city_ambient.mp3` - Ambiente de ciudad

**Características recomendadas:**
- Formato: MP3 o OGG
- Bitrate: 128 kbps
- Duración: 30-60 segundos (loop seamless)
- Volumen bajo para no interferir con música

### 4. UI (Interfaz de Usuario)
Sonidos de interacción con la interfaz.

**Archivos necesarios:**
- `button_click.mp3` - Click en botón
- `button_hover.mp3` - Hover sobre botón
- `menu_open.mp3` - Abrir menú
- `menu_close.mp3` - Cerrar menú
- `dialog_open.mp3` - Abrir diálogo con NPC
- `dialog_close.mp3` - Cerrar diálogo con NPC

**Características recomendadas:**
- Formato: MP3 o OGG
- Bitrate: 96 kbps
- Duración: 0.1-0.5 segundos
- Sonidos sutiles y no invasivos

## 🎛️ Configuración de Volúmenes

Los volúmenes están configurados en `data/soundConfig.json`:

```json
{
    "music": { "volume": 0.3 },      // 30% del volumen máximo
    "ambient": { "volume": 0.2 },    // 20% del volumen máximo
    "sfx": { "volume": 0.4 },        // 40% del volumen máximo
    "ui": { "volume": 0.3 }          // 30% del volumen máximo
}
```

## 🔧 Cómo Agregar Nuevos Sonidos

1. **Agregar el archivo de audio** a la carpeta correspondiente
2. **Actualizar `data/soundConfig.json`** con la nueva entrada:

```json
{
    "sfx": {
        "nuevo_sonido": {
            "path": "assets/sounds/sfx/nuevo_sonido.mp3",
            "volume": 0.5,
            "loop": false,
            "description": "Descripción del sonido"
        }
    }
}
```

3. **Usar en el código**:

```javascript
// Reproducir sonido
audioManager.play('nuevo_sonido');

// Detener sonido
audioManager.stop('nuevo_sonido');
```

## 🎨 Recursos Gratuitos para Sonidos

### Música
- [Incompetech](https://incompetech.com/) - Música libre de Kevin MacLeod
- [Free Music Archive](https://freemusicarchive.org/)
- [Bensound](https://www.bensound.com/)

### Efectos de Sonido
- [Freesound](https://freesound.org/) - Biblioteca colaborativa
- [Zapsplat](https://www.zapsplat.com/) - SFX gratuitos
- [Sonniss](https://sonniss.com/gameaudiogdc) - Packs GDC gratuitos

### Herramientas de Edición
- [Audacity](https://www.audacityteam.org/) - Editor de audio gratuito
- [Ocenaudio](https://www.ocenaudio.com/) - Editor simple y rápido

## 📝 Notas Importantes

1. **Formatos soportados**: MP3, OGG, WAV (MP3 recomendado para web)
2. **Tamaño de archivos**: Mantener archivos pequeños para carga rápida
3. **Loops**: Asegurar que loops sean seamless (sin cortes audibles)
4. **Licencias**: Verificar que los sonidos tengan licencia apropiada
5. **Normalización**: Normalizar volumen de todos los archivos

## 🎮 Integración en el Juego

El sistema de audio se integra automáticamente:

```javascript
// En index.html
import { AudioManager } from './js/AudioManager.js';

const audioManager = new AudioManager();
await audioManager.loadSoundConfig();
await audioManager.preloadAllSounds();
audioManager.attachToCamera(camera);

// Reproducir música de fondo
audioManager.play('main_theme');

// Cambiar música según zona
audioManager.changeMusicWithFade('copiapo_theme', 2.0);

// Reproducir efecto de sonido
audioManager.play('collect_fragment');
```

## 🔊 Controles de Audio

- **Volumen Master**: Controla todo el audio
- **Volumen Música**: Solo música de fondo
- **Volumen SFX**: Solo efectos de sonido
- **Volumen Ambiente**: Solo sonidos ambientales
- **Volumen UI**: Solo sonidos de interfaz
- **Mute**: Silenciar todo el audio

## ⚠️ Placeholder

Si no tienes archivos de audio aún, el juego funcionará sin errores. Los sonidos simplemente no se reproducirán y verás advertencias en la consola:

```
⚠️ Música no disponible: main_theme
⚠️ SFX no disponible: collect_fragment
```

Esto permite desarrollar el juego sin audio y agregarlo después.
