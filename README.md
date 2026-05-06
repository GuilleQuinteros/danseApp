# Dansé - Sistema de Gestión de Estudio de Danzas

## Características principales

### 🎯 Gestión completa
- Dashboard con métricas en tiempo real
- Gestión de cursos, horarios y profesores
- Inscripciones y seguimiento de alumnas
- Sistema de cobros con recargo automático por mora
- Reportes de asistencia, deudas e ingresos

### 💰 Sistema de recargos automáticos
- **10% de recargo por cada día de mora** desde el vencimiento
- Cálculo automático en tiempo real
- Alertas visuales de deudas vencidas
- Configuración de días de gracia

### 👥 Roles diferenciados
- **Admin**: acceso completo a todo el sistema
- **Profesor**: acceso limitado a sus cursos asignados y toma de asistencia

### 📱 PWA (Progressive Web App)
- Instalable en Android, iOS y Desktop
- Funciona offline (asistencia sin conexión)
- Autenticación biométrica con WebAuthn
- Interfaz responsive optimizada para móviles

### 🔐 Seguridad
- Row Level Security (RLS) en Supabase
- Profesores solo ven sus propios cursos
- Admin controla todo el sistema
- Autenticación segura con Supabase Auth

## Stack tecnológico

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Despliegue**: Vercel
- **PWA**: Workbox + Vite PWA Plugin

## Estructura del proyecto

```
danse-app/
├── src/
│   ├── components/       # Componentes reutilizables
│   ├── pages/           # Páginas principales
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilidades y configuración
│   ├── contexts/        # Context API
│   └── App.jsx          # Componente principal
├── supabase/
│   └── migrations/      # Migraciones SQL
└── public/              # Assets estáticos
```

## Variables de entorno

Crear archivo `.env` con:

```
VITE_SUPABASE_URL=tu_url_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## Instalación

```bash
npm install
npm run dev
```

## Configuración de Supabase

1. Crear proyecto en Supabase
2. Ejecutar las migraciones SQL de `supabase/migrations/`
3. Configurar Row Level Security según las políticas incluidas
4. Agregar las variables de entorno

## Features destacados

### Sistema de recargos
El sistema calcula automáticamente un 10% de recargo por cada día de mora:
- Si la cuota vence el día 5 y hoy es día 8 → 3 días de mora → 30% de recargo
- Se configura el plazo de gracia (default: 5 días)
- Los recargos se calculan en tiempo real al consultar deudas

### Vista de profesor
Los profesores inician sesión y automáticamente:
- Ven solo los cursos donde son asignados
- Pueden tomar asistencia de sus alumnas
- Acceso a WhatsApp directo del tutor desde la lista
- Toggle presente/ausente con contadores en tiempo real

## Licencia

Proyecto desarrollado para Dansé Estudio de Danza - Dir. Karina Molina
