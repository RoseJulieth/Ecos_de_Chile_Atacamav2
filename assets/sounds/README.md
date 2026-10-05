# 🔊 Sonidos

```
music/     Main_theme.mp3                       música del menú y del juego
ambient/   desert_ambience.mp3                  ambiente base del desierto
           desert_wind.mp3  ocean_waves.mp3  rain_loop.mp3    capas que cambian según la zona y el clima (generadas)
sfx/       Walking_in_Sand_Sound_Effect.mp3     pasos
           collect_fragment.mp3  jump.mp3  notification.mp3    (generados)
ui/        Button Click  Sound Effect.mp3       click de botón
           dialog_open/close.mp3  menu_open/close.mp3          (generados)
```

- La lista y los volúmenes están en `data/soundConfig.json`.
- Los archivos marcados como *generados* los crea `python3 tools/generar_sfx.py` (requiere `ffmpeg`); se pueden
  editar o reemplazar por grabaciones propias manteniendo el mismo nombre.
- **Música y sonidos no generados** (`Main_theme.mp3`, `desert_ambience.mp3`, pasos y click): verificar que se tenga
  permiso para usarlos y, si corresponde, agregar su fuente en la pantalla de Créditos.
