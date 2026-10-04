# 🚀 Guía de Despliegue - Ecos de Chile: Atacama

## 📦 Opciones de Despliegue

### 1. 🌐 GitHub Pages (Recomendado - Gratis)

#### Paso a Paso:

1. **Crear repositorio en GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Ecos de Chile Atacama"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ecos-chile-atacama.git
git push -u origin main
```

2. **Activar GitHub Pages**
   - Ve a Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)
   - Save

3. **Acceder al juego**
   - URL: `https://TU_USUARIO.github.io/ecos-chile-atacama/`
   - Espera 2-3 minutos para el primer despliegue

#### Ventajas:
- ✅ Gratis
- ✅ HTTPS automático
- ✅ Fácil de actualizar
- ✅ Sin configuración de servidor

---

### 2. 🔷 Netlify (Muy Fácil - Gratis)

#### Opción A: Drag & Drop

1. Ve a [netlify.com](https://netlify.com)
2. Arrastra la carpeta del proyecto
3. ¡Listo! URL automática generada

#### Opción B: Git Integration

1. Conecta tu repositorio de GitHub
2. Build settings:
   - Build command: (dejar vacío)
   - Publish directory: `/`
3. Deploy

#### Ventajas:
- ✅ Despliegue instantáneo
- ✅ HTTPS automático
- ✅ Dominio personalizado gratis
- ✅ Actualizaciones automáticas

---

### 3. ▲ Vercel (Rápido - Gratis)

#### Despliegue:

1. Instala Vercel CLI:
```bash
npm i -g vercel
```

2. Despliega:
```bash
vercel
```

3. Sigue las instrucciones en pantalla

#### Ventajas:
- ✅ Muy rápido
- ✅ Edge network global
- ✅ Analytics incluido
- ✅ Dominio personalizado

---

### 4. 🔥 Firebase Hosting (Google - Gratis)

#### Setup:

1. Instala Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Inicializa:
```bash
firebase login
firebase init hosting
```

3. Configura:
   - Public directory: `.` (directorio actual)
   - Single-page app: No
   - GitHub integration: Opcional

4. Despliega:
```bash
firebase deploy
```

#### Ventajas:
- ✅ CDN global de Google
- ✅ SSL automático
- ✅ Muy rápido
- ✅ Integración con otros servicios

---

### 5. 💧 DigitalOcean App Platform (Pago)

#### Despliegue:

1. Crea una cuenta en DigitalOcean
2. App Platform → Create App
3. Conecta tu repositorio
4. Configura:
   - Type: Static Site
   - Build command: (vacío)
   - Output directory: `/`

#### Ventajas:
- ✅ Muy confiable
- ✅ Escalable
- ✅ Soporte profesional
- ❌ Costo: ~$5/mes

---

## 🛠️ Preparación para Producción

### Optimizaciones Recomendadas

#### 1. Minificar Código (Opcional)

Crear `build.js`:
```javascript
// Usar herramientas como Terser para minificar
import { minify } from 'terser';
// ... código de minificación
```

#### 2. Comprimir Assets

```bash
# Instalar herramienta de compresión
npm install -g imagemin-cli

# Comprimir imágenes (si las agregas)
imagemin assets/*.png --out-dir=assets/optimized
```

#### 3. Configurar Cache

Crear `.htaccess` (para Apache):
```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
</IfModule>
```

---

## 📊 Monitoreo y Analytics

### Google Analytics (Opcional)

Agregar en `<head>` de `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=TU_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'TU_ID');
</script>
```

---

## 🔒 Seguridad

### Headers de Seguridad

Crear `netlify.toml` (para Netlify):
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## 🌍 Dominio Personalizado

### Configurar Dominio Propio

#### En Netlify:
1. Domain settings → Add custom domain
2. Configura DNS:
   - Type: A
   - Name: @
   - Value: 75.2.60.5

#### En GitHub Pages:
1. Settings → Pages → Custom domain
2. Agrega tu dominio
3. Configura DNS en tu proveedor

---

## 📱 PWA (Progressive Web App) - Opcional

### Hacer el juego instalable

1. Crear `manifest.json`:
```json
{
  "name": "Ecos de Chile: Atacama",
  "short_name": "Ecos Atacama",
  "description": "Prototipo educativo 3D",
  "start_url": "/",
  "display": "fullscreen",
  "background_color": "#2B1A0A",
  "theme_color": "#FFD700",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. Agregar en `<head>`:
```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#FFD700">
```

---

## 🧪 Testing Pre-Despliegue

### Checklist de Verificación:

```bash
# 1. Verificar que no hay errores
# Abrir consola del navegador (F12)

# 2. Probar en diferentes navegadores
- Chrome ✓
- Firefox ✓
- Safari ✓
- Edge ✓

# 3. Probar funcionalidades
- Movimiento ✓
- Recolección ✓
- Guardado ✓
- Menús ✓

# 4. Verificar rendimiento
# Usar Chrome DevTools → Performance
```

---

## 📈 Optimización de Rendimiento

### Lighthouse Score

Ejecutar en Chrome DevTools:
1. F12 → Lighthouse
2. Generate report
3. Objetivo: >90 en Performance

### Mejoras Sugeridas:
- ✅ Lazy loading de assets
- ✅ Comprimir texturas
- ✅ Reducir draw calls
- ✅ Optimizar geometrías

---

## 🔄 Actualización Continua

### Workflow Recomendado:

```bash
# 1. Hacer cambios localmente
git add .
git commit -m "Descripción del cambio"

# 2. Probar localmente
python -m http.server 8000

# 3. Subir a producción
git push origin main

# 4. Verificar despliegue
# Esperar 2-3 minutos y verificar URL
```

---

## 📞 Soporte Post-Despliegue

### Monitoreo de Errores

Usar servicios como:
- **Sentry**: Tracking de errores JavaScript
- **LogRocket**: Grabación de sesiones
- **Google Analytics**: Métricas de uso

### Ejemplo con Sentry:

```html
<script src="https://browser.sentry-cdn.com/7.x.x/bundle.min.js"></script>
<script>
  Sentry.init({ dsn: 'TU_DSN' });
</script>
```

---

## 🎯 Recomendación Final

### Para Evaluación Académica:
**GitHub Pages** es la mejor opción:
- Gratis
- Fácil de compartir
- Profesional
- Sin configuración compleja

### Para Producción Real:
**Netlify** o **Vercel**:
- Mejor rendimiento
- Más características
- Actualizaciones automáticas
- Analytics incluido

---

## 📝 Ejemplo de Despliegue Completo

### GitHub Pages (Paso a Paso Completo):

```bash
# 1. Inicializar Git
git init

# 2. Agregar archivos
git add .

# 3. Commit inicial
git commit -m "🎮 Ecos de Chile: Atacama - Prototipo completo"

# 4. Crear repositorio en GitHub
# (Hacerlo desde la web: github.com/new)

# 5. Conectar y subir
git remote add origin https://github.com/TU_USUARIO/ecos-chile-atacama.git
git branch -M main
git push -u origin main

# 6. Activar GitHub Pages
# Settings → Pages → Source: main → Save

# 7. Esperar 2-3 minutos

# 8. Acceder a:
# https://TU_USUARIO.github.io/ecos-chile-atacama/
```

---

## ✅ Verificación Post-Despliegue

### Checklist:
- [ ] El juego carga correctamente
- [ ] No hay errores en consola
- [ ] Los controles funcionan
- [ ] Los fragmentos se recolectan
- [ ] El guardado persiste
- [ ] Los menús son navegables
- [ ] Las animaciones son suaves
- [ ] El rendimiento es aceptable

---

## 🎉 ¡Listo para Compartir!

Una vez desplegado, puedes compartir tu juego con:
- 🎓 Profesores y evaluadores
- 👥 Compañeros de clase
- 🌍 Cualquier persona con el link

**URL de ejemplo:**
`https://tu-usuario.github.io/ecos-chile-atacama/`

---

**¡Éxito con tu despliegue! 🚀**
