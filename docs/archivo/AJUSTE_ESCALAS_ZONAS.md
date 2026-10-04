# Ajuste de Escalas en Zonas Temáticas

## Cambios Realizados

### 1. Casas en Copiapó (Houses.glb y Storage_House.glb)
- **Escala anterior**: 5.0 (muy grandes)
- **Escala nueva**: 2.0
- **Posición Y**: Ajustada de 2.0 a 1.0
- **Resultado**: Casas proporcionales al terreno 40x40

### 2. Playa en Bahía Inglesa (Beach.glb)
- **Escala anterior**: 2.5 (muy grande)
- **Escala nueva**: 1.2
- **Resultado**: Modelo proporcional al terreno 40x40

### 3. Gaviotas (Seagull.glb)
- **Escala anterior**: 0.5 (muy grandes)
- **Escala nueva**: 0.15
- **Resultado**: Tamaño realista respecto al jugador (~3 veces más pequeñas)

## Archivo Modificado
- `js/ZoneManager.js`

## Cómo Probar
1. El servidor ya está corriendo en http://localhost:8000
2. Abre el navegador y recarga la página
3. Camina hacia el oeste para ver Copiapó con las casas
4. Camina hacia el este para ver Bahía Inglesa con la playa y gaviotas
5. Verifica que todos los modelos se vean proporcionales al terreno

## Notas
- Las casas ahora tienen una escala más realista y no dominan todo el terreno
- La playa Beach.glb se ajusta mejor al espacio de 40x40
- Las gaviotas tienen un tamaño realista de aves marinas pequeñas
- Todas las texturas originales de los modelos se preservan
