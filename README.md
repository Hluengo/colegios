# Convivencia Escolar - SaaS de Gestión de Casos

Sistema de gestión de casos de convivencia escolar para instituciones educativas.

## 🚀 Características

- **Gestión de Casos**: Crear, seguir y cerrar casos de convivencia
- **Dashboard**: Vista general con estadísticas en tiempo real
- **Alertas de Plazos**: Notificaciones de vencimiento de plazos procesales
- **Reportes**: Generación de documentos PDF con estadísticas
- **Multi-rol**: Perfiles para diferentes usuarios del sistema

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Estado**: TanStack Query v5
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **PDF**: @react-pdf/renderer
- **Testing**: Vitest + React Testing Library

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Tests
npm run test
```

## 🎨 Componentes UI

La aplicación incluye componentes modernos de UI:

### Componentes de UX
- `Skeleton` - Estados de carga skeleton
- `EmptyState` - Estados vacíos reutilizables
- `Tooltip` - Tooltips accesibles
- `ConfirmDialog` - Diálogos de confirmación

### Componentes de Accesibilidad
- `SkipLink` - Navegación por teclado
- `LiveRegion` - Announcements para screen readers
- `AccessibilitySettings` - Panel de configuración

## ♿ Accesibilidad

La aplicación cumple con WCAG 2.1 nivel AA:

- Contraste de colores >= 4.5:1
- Soporte para `prefers-reduced-motion`
- Modo de alto contraste
- Navegación por teclado completa
- Screen reader compatible

## 📱 PWA

La aplicación es una PWA instalable:

- Funciona offline
- Cacheo de recursos estáticos
- Cacheo de API para datos
- Instalable en dispositivos móviles

## 📁 Estructura

```
src/
├── api/          # Clientes API y helpers
├── components/   # Componentes reutilizables
├── config/       # Configuración global
├── context/      # React Context
├── hooks/        # Custom hooks
├── lib/         # Librerías (queryClient, sentry)
├── pages/        # Páginas de rutas
├── types/        # Tipos TypeScript
└── utils/        # Utilidades
```

## 🧪 Testing

```bash
# Tests unitarios
npm run test

# Coverage
npm run test -- --coverage
```

## 📄 Licencia

MIT
