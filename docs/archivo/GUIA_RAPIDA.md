# 🎮 Guía Rápida - Ecos de Chile: Atacama

## 🚀 Inicio Rápido

### 1. Ejecutar el Juego

**Opción más simple (Python):**
```bash
python -m http.server 8000
```
Luego abre: http://localhost:8000

**Opción alternativa (Node.js):**
```bash
npx http-server -p 8000
```

### 2. Primeros Pasos

1. **Haz clic en "Comenzar Exploración"**
2. **Haz clic en la pantalla** para capturar el mouse
3. **Mueve el mouse** para mirar alrededor
4. **Usa WASD** para moverte

---

## 🎯 Objetivo del Juego

**Recolectar los 5 fragmentos históricos** distribuidos por el mapa:

1. 🟡 **Cultura Diaguita** (Zona Este)
2. 🔴 **Batallón Atacama** (Zona Noroeste)
3. 🌸 **Desierto Florido** (Zona Noreste - con flores)
4. ⚪ **Plata Chañarcillo** (Zona Suroeste)
5. 🔵 **Bahía Inglesa** (Zona Sur - cerca del agua)

---

## 🎮 Controles Esenciales

| Tecla | Función |
|-------|---------|
| **W** | Avanzar |
| **A** | Izquierda |
| **S** | Retroceder |
| **D** | Derecha |
| **Shift** | Correr |
| **Espacio** | Saltar |
| **Mouse** | Mirar alrededor |
| **ESC** | Pausa |
| **I** | Inventario |

---

## 💡 Consejos

### Navegación
- Los fragmentos **brillan** y **flotan** en el aire
- Cada fragmento tiene un **color único**
- Acércate a menos de **2.5 metros** para recolectar automáticamente

### Exploración
- **Zona Central (Marrón)**: Copiapó - Busca el fragmento dorado
- **Zona con Flores (Rosa)**: Desierto Florido - Busca el fragmento rosa
- **Zona con Agua (Azul)**: Bahía Inglesa - Busca el fragmento azul

### Progreso
- Tu progreso se **guarda automáticamente** al recolectar
- Puedes **guardar manualmente** desde el menú de pausa (ESC)
- Usa **"Continuar Partida"** para retomar donde lo dejaste

---

## 📊 Interfaz

### Panel Superior Derecho
- Lista de fragmentos recolectados
- Progreso actual (X/5)
- Estado de cada fragmento (🔒 bloqueado / ✅ recolectado)

### Notificaciones
- Aparecen al **recolectar un fragmento**
- Muestran **información educativa**
- Desaparecen automáticamente después de 5 segundos

### Inventario Completo (Tecla I)
- Muestra **todos los items** organizados por categoría
- Indica **slots usados** (máximo 50)
- Información detallada de cada fragmento

---

## 🏆 Completar el Juego

Cuando recolectes los **5 fragmentos**, aparecerá un mensaje de victoria.

Has aprendido sobre:
- ✅ Cultura Diaguita (1000-1540 d.C)
- ✅ Batallón Atacama (Guerra del Pacífico)
- ✅ Desierto Florido (Fenómeno natural)
- ✅ Plata Chañarcillo (Historia minera)
- ✅ Bahía Inglesa (Puerto histórico)

---

## 🐛 Solución de Problemas

### El juego no carga
- Asegúrate de usar un **servidor local** (no abrir directamente el HTML)
- Verifica que tengas **conexión a internet** (Three.js se carga desde CDN)

### La cámara no se mueve
- **Haz clic en la pantalla** para capturar el mouse
- Verifica que el **pointer lock** esté activo

### El jugador se cae del mapa
- Presiona **ESC** y selecciona "Salir al Menú"
- Comienza una nueva exploración

### No encuentro un fragmento
- Busca objetos que **brillan y flotan**
- Revisa las **zonas de colores** en el suelo
- Los fragmentos están en las coordenadas:
  - Diaguita: Este (15, 15)
  - Batallón: Noroeste (-20, 20)
  - Desierto: Noreste (25, -25)
  - Chañarcillo: Suroeste (-25, -15)
  - Bahía: Sur (0, -35)

---

## 📱 Compatibilidad

### Navegadores Recomendados
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Requisitos Mínimos
- WebGL 2.0
- JavaScript habilitado
- Conexión a internet (primera carga)

---

## 🎓 Contenido Educativo

Cada fragmento incluye:
- **Nombre histórico**
- **Período temporal**
- **Información contextual**
- **Dato curioso**

Lee las notificaciones con atención para aprender sobre la historia de Atacama.

---

## ⌨️ Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| **ESC** | Abrir menú de pausa |
| **I** | Abrir inventario completo |
| **Shift + W** | Correr hacia adelante |
| **Espacio** | Saltar (solo en el suelo) |

---

## 🎨 Características Visuales

- **Estilo Cel-Shading**: Inspirado en Wind Waker
- **Paleta cálida**: Colores del desierto de Atacama
- **Iluminación dinámica**: Simula el sol intenso del norte de Chile
- **Animaciones suaves**: Fragmentos flotantes y rotatorios

---

## 💾 Sistema de Guardado

### Auto-Guardado
- Se activa al **recolectar un fragmento**
- Guarda tu **posición** y **progreso**

### Guardado Manual
1. Presiona **ESC**
2. Selecciona **"💾 Guardar Progreso"**
3. Confirma el mensaje

### Cargar Partida
1. En el menú principal
2. Selecciona **"📂 Continuar Partida"**
3. Aparecerás donde lo dejaste

---

## 🌟 Disfruta la Experiencia

Este es un prototipo educativo diseñado para:
- ✨ Aprender jugando
- 🏜️ Explorar la historia de Atacama
- 🎮 Disfrutar de una experiencia 3D inmersiva

**¡Buena suerte en tu exploración! 🚀**

---

## 📞 Soporte

Si tienes problemas o sugerencias:
- Revisa el archivo **README.md** para más detalles
- Verifica la consola del navegador (F12) para errores
- Asegúrate de cumplir los requisitos mínimos

---

**Desarrollado por Jennifer Astudillo - 2024**
