# 🎨 Guía de Configuración de Branding - Sistema SGCE

**Versión:** 2.0  
**Última actualización:** Febrero 2026  
**Responsable:** Engineering Team

---

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Estructura de Configuración](#estructura-de-configuración)
3. [Pasos de Setup Para Nueva Institución](#pasos-de-setup-para-nueva-institución)
4. [Assets Gráficos Requeridos](#assets-gráficos-requeridos)
5. [Variables de Entorno](#variables-de-entorno)
6. [Pruebas de Validación](#pruebas-de-validación)
7. [Solución de Problemas](#solución-de-problemas)
8. [FAQ](#faq)

---

## Introducción

El sistema SGCE soporta **configuración de branding centralizada** que permite:

✅ Customizar logos por institución  
✅ Cambiar colores y fuentes vía CSS  
✅ Configurar favicon por deployment  
✅ Soportar múltiples instancias con branding diferente  
✅ Cambios de branding SIN código deployment  

**Flujo de Configuración:**
```
.env.local (variables)
    ↓
src/config/branding.ts (centraliza valores)
    ↓
Componentes React (Login, PDF, etc)
    ↓
Usuarios ven branding customizado
```

---

## Estructura de Configuración

### 1. Archivo Central: `src/config/branding.ts`

Este archivo exporta un objeto `BRANDING` que contiene todas las referencias:

```typescript
export const BRANDING = {
  appName: string,           // Nombre app "Convivencia Escolar"
  schoolName: string,        // Nombre institución "Colegio X"
  logoApp: string,          // Logo para header app
  logoPdf: string,          // Logo para reportes PDF
  logoAuth: string,         // Logo para página login
  logoAuthFallback: string, // Fallback si logo auth falla
  favicon: string           // Icono navegador
};
```

**Ubicación:** [src/config/branding.ts](src/config/branding.ts)

### 2. Variables de Entorno

Todas se cargan desde `.env.local` o variables de sistema:

```bash
VITE_APP_NAME=Institución X
VITE_SCHOOL_NAME=Colegio Las Flores
VITE_LOGO_APP=/branding/logo-app.png
VITE_LOGO_PDF=/branding/logo-pdf.png
VITE_LOGO_AUTH=/branding/logo-auth.png
VITE_LOGO_AUTH_FALLBACK=/default-logo.png
VITE_FAVICON=/branding/favicon.png
```

### 3. Ubicación de Archivos Gráficos

```
public/
├── branding/                    ← CARPETA PRINCIPAL
│   ├── logo-app.png           ← Logo header (200x80px)
│   ├── logo-pdf.png           ← Logo reportes (800x320px)
│   ├── logo-auth.png          ← Logo login (300x100px)
│   └── favicon.png            ← Icono browser (32+ pixels)
├── default-logo.png           ← Fallback universal
└── [otros assets]
```

---

## Pasos de Setup Para Nueva Institución

### 📌 Paso 1: Preparar Assets Gráficos (5 min)

**Requerimientos:**

| Logo | Tamaño | Formato | Propósito |
|------|--------|---------|-----------|
| `logo-app.png` | 200x80px | PNG con fondo transparente | Header app |
| `logo-pdf.png` | 800x320px | PNG con fondo transparente | Doctos PDF |
| `logo-auth.png` | 300x100px | PNG con fondo transparente | Login page |
| `favicon.png` | 32x32px+ | PNG, ICO, JPG | Pestaña browser |

**Checklist:**
- [ ] Logos en formato PNG con fondo transparente (excepto favicon)
- [ ] Tamaños exactos respetados
- [ ] Resolución mínima 96 DPI para calidad
- [ ] Sin textos copyrighted
- [ ] Nombres coinciden con estructura

**Herramientas recomendadas:**
- Redimensionar: [TinyPNG](https://tinypng.com/) o ImageMagick
- Transparencia: Photoshop, GIMP, o Figma
- Favicon: [Favicon.io](https://favicon.io/)

---

### 📌 Paso 2: Subir Assets (5 min)

**Opción A: Local Development**
```bash
cd public/branding/
# Copiar los 4 archivos aquí
ls -la  # Verificar que existen
```

**Opción B: CDN o Servidor Externo**
```bash
# Subir a CloudFront, S3, CDN, etc
# Tomar nota de las URLs públicas:
# - https://cdn.institución.com/logo-app.png
# - https://cdn.institución.com/logo-pdf.png
# - etc.
```

---

### 📌 Paso 3: Crear `.env.local`

**Copiar desde plantilla:**
```bash
cp .env.example .env.local
```

**Editar valores:**
```bash
# .env.local
VITE_APP_NAME=Colegio Los Laureles
VITE_SCHOOL_NAME=Institución Educativa Pública
VITE_LOGO_APP=/branding/logo-app.png
VITE_LOGO_PDF=/branding/logo-pdf.png
VITE_LOGO_AUTH=/branding/logo-auth.png
VITE_LOGO_AUTH_FALLBACK=/default-logo.png
VITE_FAVICON=/branding/favicon.png
```

**Si usando CDN:**
```bash
VITE_LOGO_AUTH=https://cdn.institución.com/logos/auth.png
VITE_FAVICON=https://cdn.institución.com/favicons/32x32.png
```

---

### 📌 Paso 4: Validar Configuración

**Build local:**
```bash
npm run build
```

**Revisar en navegador:**
```bash
npm run dev
# Abrir http://localhost:5173/
# Verificar:
# - Logo aparece en login
# - Favicon en pestaña browser
# - App name en título
```

**Validar logs de consola:**
```javascript
// En browser console
console.log(window.__BRANDING__)  // Debe mostrar config
```

---

### 📌 Paso 5: Deploy

**Validación Pre-Deploy:**
```bash
# 1. Build final
npm run build

# 2. Previsualizar
npm run preview

# 3. Acceder a http://localhost:4173 y verificar todo

# 4. Commit cambios
git add .env.local
git commit -m "chore: Configurar branding para [Institución X]"

# 5. Push
git push origin main
```

**Deployment en Vercel/Netlify:**
1. Ir a settings del proyecto
2. Agregar variables en "Environment Variables":
   - `VITE_LOGO_AUTH`
   - `VITE_LOGO_AUTH_FALLBACK`
   - `VITE_FAVICON`
   - etc.
3. Redeployar

---

## Assets Gráficos Requeridos

### Logo App (Header)
- **Uso:** Aparece en top-left del dashboard
- **Tamaño:** 200x80px (aspect ratio 2.5:1)
- **Formato:** PNG con fondo transparente
- **Recomendación:** Logotipo sin texto, solo icono
- **Tests:** Verificar en desktop y tablet

```tsx
// Ubicación en código: src/components/Layout.tsx
<img src={BRANDING.logoApp} alt="Logo App" />
```

### Logo PDF (Documentos)
- **Uso:** Encabezado de reportes y casos exportados
- **Tamaño:** 800x320px (aspect ratio 2.5:1, escala x4 de logo-app)
- **Formato:** PNG con fondo transparente
- **Recomendación:** Versión horizontal, mejor calidad
- **Tests:** Exportar PDF y verificar que logo aparece nítido

```tsx
// Ubicación en código: src/components/InformeCasoDocument.tsx
<Image src={BRANDING.logoPdf} width={200} height={80} />
```

### Logo Auth (Login)
- **Uso:** Panel de autenticación, parte superior
- **Tamaño:** 300x100px
- **Formato:** PNG con fondo transparente
- **Recomendación:** Logo principal con texto si es legible
- **Tests:** Testar en mobile (320px), tablet (768px), desktop (1024px)
- **Fallback:** CRÍTICO - debe existir una alternativa si éste falla

```tsx
// Ubicación en código: src/pages/Login.tsx
<img 
  src={BRANDING.logoAuth} 
  onError={(e) => e.currentTarget.src = BRANDING.logoAuthFallback}
  alt="Logo"
/>
```

### Favicon (Browser Tab)
- **Uso:** Icono en pestaña del navegador
- **Tamaño:** 32x32px mínimo (64x64px recomendado)
- **Formato:** PNG, ICO, JPG, SVG, GIF
- **Recomendación:** Diseño simple, versión marca monograma
- **Tests:** Limpiar cache browser y verificar que actualiza

```html
<!-- Ubicación en código: index.html -->
<link rel="icon" type="image/png" href="/branding/favicon.png" />
```

---

## Variables de Entorno

### Jerarquía de Carga

```
1. .env.local (más específico, versión control IGNORADO)
2. .env.production (si existe)
3. Valores por defecto en branding.ts
```

### Referencia Completa

```bash
# =========== BRANDING ===========
VITE_APP_NAME
# - Nombre mostrado en título app
# - Usado en: <title>, headers, footers
# - Default: "Convivencia Escolar"
# - Ejemplo: "SGCE - Colegio San José"

VITE_SCHOOL_NAME
# - Nombre institución educativa completo
# - Usado en: Documentos PDF, reportes
# - Default: "Institución Educativa"
# - Ejemplo: "Colegio Rural Las Flores"

VITE_LOGO_APP
# - Path URL del logo para header
# - Debe retornar HTTP 200 OK
# - Tamaño: 200x80px
# - Default: "/default-logo.png"
# - Ejemplo: "/branding/logo-app.png"

VITE_LOGO_PDF
# - Path URL del logo para PDFs
# - Debe retornar HTTP 200 OK
# - Tamaño: 800x320px
# - Default: "/default-logo.png"
# - Ejemplo: "/branding/logo-pdf.png"

VITE_LOGO_AUTH
# - Path URL del logo en login
# - Debe retornar HTTP 200 OK
# - Tamaño: 300x100px, PNG con transparencia
# - Default: "/branding/logo-auth.png"
# - Crítico: Si falla, mostrará VITE_LOGO_AUTH_FALLBACK

VITE_LOGO_AUTH_FALLBACK
# - ESTA PATH DEBE EXISTIR SIEMPRE
# - Se usa si VITE_LOGO_AUTH retorna error
# - Default: "/default-logo.png"
# - ⚠️ CRÍTICO: Verificar que existe en public/

VITE_FAVICON
# - Path URL para favicon
# - Debe retornar HTTP 200 OK
# - Tamaño: 32x32px (mínimo), 64x64px (recomendado)
# - Default: "/veritas.jpg"
# - Ejemplo: "/branding/favicon.png"

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
# - Backend database & auth
# - No relacionados a branding
# - Requeridos para operatividad app
```

---

## Pruebas de Validación

### ✅ Checklist Pre-Production

```markdown
## Testing Branding Configuration

### Desktop (1440px+)
- [ ] Logo aparece en header app (Login > Dashboard > Casos)
- [ ] Logo aparece en footer
- [ ] Favicon visible en pestaña browser
- [ ] App name correcto en <title>
- [ ] Colores y tipografía se ven bien
- [ ] No hay imágenes rotas (broken images)

### Tablet (768px)
- [ ] Logo responsive (no overflow)
- [ ] Login page layout intacto
- [ ] Favicon visible
- [ ] Texto legible

### Mobile (375px)
- [ ] Logo se redimensiona correctamente
- [ ] Login no tiene scroll horizontal
- [ ] Favicon visible e icono correcto
- [ ] Buttons y inputs accesibles

### Cross-Browser
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### PDF Export
- [ ] Logo aparece en reportes PDF
- [ ] Resolución nítida
- [ ] No hay distorsión
- [ ] Alojamiento (local vs CDN) funciona

### Network
- [ ] Todos los logos retornan 200 OK
- [ ] Sin errores 404 en DevTools Console
- [ ] Sin errores CORS
- [ ] Carga < 2s (con compresión)
```

### 🧪 Script de Validación

```bash
# Guardar como: scripts/validate-branding.sh

#!/bin/bash
set -e

echo "🔍 Validando configuración de branding..."

# 1. Verificar archivo .env.local existe
if [ ! -f .env.local ]; then
    echo "❌ ERROR: .env.local no encontrado"
    echo "   Ejecutar: cp .env.example .env.local"
    exit 1
fi

# 2. Verificar variables requeridas
REQUIRED_VARS=(
    "VITE_LOGO_AUTH_FALLBACK"
    "VITE_FAVICON"
)

for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^$var=" .env.local; then
        echo "⚠️  WARNING: Variable $var no definida"
    fi
done

# 3. Verificar archivos en public/
REQUIRED_FILES=(
    "public/default-logo.png"
    "public/veritas.jpg"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ ERROR: Archivo requerido no existe: $file"
        exit 1
    fi
done

# 4. Build test
echo "📦 Ejecutando build..."
npm run build > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build exitoso"
else
    echo "❌ Build falló"
    exit 1
fi

echo ""
echo "✅ Validación completada exitosamente"
echo ""
echo "Próximos pasos:"
echo "1. npm run dev para pruebas locales"
echo "2. Verificar logos en Login page"
echo "3. Exportar PDF y validar logo"
echo "4. npm run build && npm run preview para simulación production"
```

**Ejecutar validación:**
```bash
chmod +x scripts/validate-branding.sh
./scripts/validate-branding.sh
```

---

## Solución de Problemas

### ❌ Logo no aparece en Login

**Síntoma:** Login page muestra imagen rota (X)

**Causas posibles:**
1. Path en .env.local es incorrecto
2. Archivo no existe en `public/branding/`
3. Servidor no sirve archivo (404)

**Solución:**
```bash
# 1. Verificar archivo existe
ls -la public/branding/logo-auth.png

# 2. Verificar variable en .env.local
grep VITE_LOGO_AUTH .env.local

# 3. Ver error en console del navegador (F12)
# Debe mostrar el path real intentado: 
# "Failed to load image: /branding/logo-auth.png"

# 4. Reconstruir y recargar
npm run build
# Limpiar cache browser: Ctrl+Shift+Del
```

### ❌ Favicon no actualiza

**Síntoma:** Favicon viejo sigue mostrando aunque cambié .env.local

**Causa:** Browser cachea favicon

**Solución:**
```bash
# 1. Limpiar cache del navegador
# Chrome: Ctrl+Shift+Delete > "All time" > Cookies and cached images

# 2. Hard refresh
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)

# 3. Cierre tab completamente y reabre

# 4. Si sigue fallando, verificar:
# - Archivo existe: ls public/branding/favicon.png
# - Path es correcto en .env.local
```

### ❌ Logo aparece pixelado en PDF

**Síntoma:** Logo se ve borroso/pixelado al exportar PDF

**Causa:** Resolución insuficiente o tamaño incorrecto

**Solución:**
```bash
# 1. Generar logo con mayor resolución
# - Mínimo: 800x320px (300 DPI)
# - Recomendado: 1600x640px (300 DPI)

# 2. Verificar formato
# - Usar PNG (mejor que JPG para logos)
# - Incluir alpha channel (fondo transparente)

# 3. Re-subir archivo:
cp ~/Downloads/logo-pdf-hq.png public/branding/
npm run build
# Exportar PDF nuevamente
```

### ⚠️ CORS Error con logos en CDN

**Síntoma:** Console muestra:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows 
reading the remote resource at https://cdn.example.com/logo.png
```

**Causa:** CDN no tiene headers CORS correctos

**Soluciones:**
1. **Contactar admin CDN:** Agregar header `Access-Control-Allow-Origin: *`
2. **Usar mismo origen:** Copiar logos a `public/branding/` en lugar de CDN
3. **Proxy request:** Crear endpoint backend que sirva las imágenes

```javascript
// Workaround temporal: src/config/branding.ts
export const BRANDING = {
  // ...
  logoAuth: "/branding/logo-auth.png",  // Servir localmente, no desde CDN
};
```

### ⚠️ Build falla sin especificar ruta de logo

**Síntoma:**
```
Error: Cannot find module '/branding/logo-auth.png'
Error during build: ENOENT: no such file or directory
```

**Causa:** Vite valida que las imágenes existan

**Solución:**
```bash
# 1. Asegurar que todos los logos existen:
ls -la public/branding/

# 2. Si faltan arquivos, crear placeholder:
touch public/branding/logo-auth.png
# (Luego reemplazar con imagen real)

# 3. Verificar .env.local apunta a archivos existentes
cat .env.local | grep VITE_LOGO
```

---

## FAQ

### ❓ ¿Puedo cambiar branding sin redeployar código?

**Respuesta:** Sí, en ciertos casos:

✅ **Sí, cambiable sin redeploy:**
- Colores (CSS tailwind)
- Tipografía (CSS fonts)
- Textos mostrados (strings en config)

❌ **Requiere redeploy:**
- Logos/imágenes (necesita nuevo build)
- Favicon (necesita actualizar HTML)
- Estructura layout

**Recomendación:** Para máxima flexibilidad, usar variables de CSS:
```css
:root {
  --primary-color: #0b1220;
  --secondary-color: #3b82f6;
}
```

### ❓ ¿Cuál es el mejor formato para logos?

**Respuesta:**

| Caso | Formato | Razón |
|------|---------|-------|
| Logos con transparencia | PNG | Fondo transparente, buen soporte |
| Favicon | ICO o PNG | ICO es estándar, PNG más moderno |
| Logo PDF | PNG | Mejor calidad que JPG |
| Logo simple/monograma | SVG | Escalable, tamaño mínimo |

**Convertidor recomendado:** [CloudConvert](https://cloudconvert.com/)

### ❓ ¿Qué hacer si la institución cambia logo frecuentemente?

**Respuesta:** Opciones:

1. **CDN con versionado:**
   ```
   VITE_LOGO_AUTH=https://cdn.example.com/logos/v2/auth.png
   Actualizar .env.local cuando hay cambio
   Redeploy automático vía CI/CD
   ```

2. **Admin Panel (futuro):**
   ```
   Crear página /admin/branding donde subir logos
   Guardar en DB o storage Supabase
   Sin necesidad de redeploy
   ```

3. **Sistema de versiones:**
   ```
   public/branding/v1/
   public/branding/v2/
   public/branding/latest/ → symlink a la última
   VITE_LOGO_AUTH=/branding/latest/auth.png
   ```

### ❓ ¿Cómo configurar para multi-tenant?

**Respuesta:** Hay varias estrategias:

**Opción 1: Subdominio + Variables por rama**
```
colegio1.app.com → branch: branding/colegio1
colegio2.app.com → branch: branding/colegio2
Cada rama tiene su .env.local
```

**Opción 2: Query param + Lookup en DB**
```typescript
// src/config/branding.ts
const tenantId = new URLSearchParams(window.location.search).get('tenant_id');
const tenantBranding = await fetch(`/api/tenants/${tenantId}/branding`).then(r => r.json());
export const BRANDING = tenantBranding;
```

**Opción 3: Supabase Storage**
```typescript
// Guardar logos en Supabase Storage
// Cargar vía URL pública con tenant ID
VITE_LOGO_AUTH=https://storage.supabase.co/tenants/{tenant_id}/logos/auth.png
```

### ❓ ¿Cómo priorizar fallbacks de imágenes?

**Respuesta:** Orden de carga en Login.tsx:

```typescript
// Intentar cargar logo auth
// Si falla (404, timeout, CORS), cargar fallback
// Si fallback también falla, mostrar texto genérico

<img 
  src={BRANDING.logoAuth}
  onError={(e) => {
    // Log para monitoreo
    console.warn(`Logo auth fallido: ${BRANDING.logoAuth}`);
    // Cambiar a fallback
    e.currentTarget.src = BRANDING.logoAuthFallback;
  }}
  onError={(e) => {
    // Si fallback también falla
    console.error(`Logo fallback también fallido: ${BRANDING.logoAuthFallback}`);
    // Último recurso: ocultar imagen
    e.currentTarget.style.display = 'none';
  }}
/>
```

### ❓ ¿Hay performance impact de cambios de branding?

**Respuesta:** Mínimo si:

✅ Logos están optimizados (< 100KB cada uno)  
✅ Se usan paths servidor local primero (no CDN)  
✅ Imágenes tienen cache headers correctos  

**Verificar:**
```bash
# DevTools > Network tab
# Hacer login
# Verificar que imagen se carga < 1 segundo
# Size mostrado debe ser < 250KB con compresión
```

---

## Contacto & Soporte

**Problemas técnicos:** Contactar al equipo de engineering  
**Cuestiones de diseño:** Contactar a UX team  
**Deployment en producción:** Seguir checklist arriba + code review

---

**Instituto Educativo SGCE**  
Sistema Centralizado de Gestión de Convivencia Escolar  
Versión 2.0 - Febrero 2026
