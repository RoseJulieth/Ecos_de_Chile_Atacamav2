#!/usr/bin/env python3
"""Genera los efectos de sonido sencillos del juego (sin dependencias, requiere ffmpeg).

Uso:  python3 tools/generar_sfx.py
Salida: assets/sounds/sfx/*.mp3 y assets/sounds/ui/*.mp3
"""
import math, os, struct, subprocess, tempfile, wave

SR = 22050
RAIZ = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'sounds')


def nota(freq, dur, vol=0.5, decay=6.0, armonicos=((1, 1.0), (2, 0.35), (3, 0.12))):
    """Tono tipo campana: ataque rápido y caída exponencial."""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-decay * t) * min(1.0, t / 0.004)
        s = sum(a * math.sin(2 * math.pi * freq * k * t) for k, a in armonicos)
        out.append(vol * env * s / 1.5)
    return out


def barrido(f0, f1, dur, vol=0.4):
    """Tono que sube o baja de frecuencia con envolvente suave."""
    n = int(SR * dur)
    out, fase = [], 0.0
    for i in range(n):
        t = i / n
        fase += 2 * math.pi * (f0 + (f1 - f0) * t) / SR
        env = math.sin(math.pi * t) ** 0.7
        out.append(vol * env * math.sin(fase))
    return out


def mezclar(*pistas):
    """Suma pistas con (retraso_en_segundos, muestras)."""
    largo = max(int(SR * d) + len(m) for d, m in pistas)
    out = [0.0] * largo
    for d, m in pistas:
        o = int(SR * d)
        for i, v in enumerate(m):
            out[o + i] += v
    return out


def guardar(muestras, ruta):
    pico = max(abs(v) for v in muestras) or 1.0
    k = min(1.0, 0.9 / pico)
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, 'x.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
            w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, v * k)) * 32767)) for v in muestras))
        os.makedirs(os.path.dirname(ruta), exist_ok=True)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '64k', ruta], check=True)
    print(f'{os.path.relpath(ruta, RAIZ)}: {os.path.getsize(ruta)} bytes')


C5, E5, G5, A5, C6, E6 = 523.25, 659.25, 783.99, 880.0, 1046.5, 1318.5
G4 = 392.0

SONIDOS = {
    # Recolectar fragmento: arpegio ascendente brillante
    'sfx/collect_fragment.mp3': mezclar(
        (0.00, nota(C5, 0.9, decay=5)), (0.09, nota(E5, 0.9, decay=5)),
        (0.18, nota(G5, 0.9, decay=5)), (0.27, nota(C6, 1.1, decay=4))),
    # Salto: barrido corto hacia arriba
    'sfx/jump.mp3': barrido(220, 520, 0.22, 0.45),
    # Notificación: dos "ding"
    'sfx/notification.mp3': mezclar((0.0, nota(A5, 0.5, decay=7)), (0.14, nota(E6, 0.7, decay=6))),
    # Diálogo con NPC / letrero
    'ui/dialog_open.mp3': mezclar((0.0, nota(G4, 0.35, decay=9)), (0.08, nota(C5, 0.45, decay=8))),
    'ui/dialog_close.mp3': mezclar((0.0, nota(C5, 0.3, decay=10)), (0.07, nota(G4, 0.4, decay=9))),
    # Menú de pausa / inventario
    'ui/menu_open.mp3': barrido(300, 700, 0.18, 0.35),
    'ui/menu_close.mp3': barrido(700, 300, 0.18, 0.35),
}

if __name__ == '__main__':
    for rel, datos in SONIDOS.items():
        guardar(datos, os.path.normpath(os.path.join(RAIZ, rel)))
