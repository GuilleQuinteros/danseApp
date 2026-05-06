# Guía de Instalación y Despliegue - Dansé

## 📋 Requisitos previos

- Node.js 18+ instalado
- Cuenta en Supabase (gratuita)
- Cuenta en Vercel (gratuita, opcional para deploy)
- Git instalado

## 🚀 Paso 1: Configurar Supabase

### 1.1 Crear proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com)
2. Crear una cuenta o iniciar sesión
3. Crear un nuevo proyecto
4. Guardar la contraseña de la base de datos

### 1.2 Ejecutar las migraciones SQL

1. En el dashboard de Supabase, ir a **SQL Editor**
2. Copiar y pegar el contenido completo de `supabase/migrations/001_initial_schema.sql`
3. Hacer clic en **RUN** para ejecutar
4. Verificar que no haya errores (debería mostrar "Success")

### 1.3 Crear usuarios de prueba

1. En Supabase, ir a **Authentication** → **Users**
2. Crear los siguientes usuarios:

   **Usuario Admin:**
   - Email: `admin@danse.com`
   - Password: `admin123`
   - Confirmar email automáticamente ✓

   **Usuario Profesor:**
   - Email: `laura@danse.com`
   - Password: `profesor123`
   - Confirmar email automáticamente ✓

3. **IMPORTANTE:** Copiar los UUIDs de los usuarios creados

### 1.4 Insertar perfiles de usuarios

1. Ir nuevamente a **SQL Editor**
2. Ejecutar este SQL (reemplazando los UUIDs):

```sql
-- Reemplazar 'UUID-DEL-ADMIN' y 'UUID-DEL-PROFESOR' con los IDs reales

-- Insertar perfil de admin
INSERT INTO public.usuarios (id, email, nombre_completo, rol, activo) VALUES
  ('UUID-DEL-ADMIN', 'admin@danse.com', 'Karina Molina', 'admin', true);

-- Insertar perfil de profesor
INSERT INTO public.usuarios (id, email, nombre_completo, rol, activo) VALUES
  ('UUID-DEL-PROFESOR', 'laura@danse.com', 'Laura Gómez', 'profesor', true);

-- Insertar datos del profesor
INSERT INTO public.profesores (usuario_id, especialidad, telefono, dni) VALUES
  ('UUID-DEL-PROFESOR', 'Ballet Clásico', '341-555-1234', '35123456');
```

### 1.5 (Opcional) Insertar datos de ejemplo

Para facilitar las pruebas, puedes ejecutar el archivo `supabase/migrations/002_seed_data.sql` siguiendo las instrucciones en los comentarios del archivo.

### 1.6 Obtener las credenciales de Supabase

1. En Supabase, ir a **Settings** → **API**
2. Copiar:
   - **Project URL** (ejemplo: `https://xxxxx.supabase.co`)
   - **anon public** key (bajo "Project API keys")

## 🔧 Paso 2: Configurar el proyecto localmente

### 2.1 Clonar e instalar dependencias

```bash
cd danse-app
npm install
```

### 2.2 Configurar variables de entorno

1. Copiar el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Editar `.env` y agregar las credenciales de Supabase:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 2.3 Ejecutar en desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## 🧪 Paso 3: Probar la aplicación

### Probar como Admin

1. Ir a `http://localhost:3000/login`
2. Ingresar:
   - Email: `admin@danse.com`
   - Password: `admin123`
3. Verificar que se cargue el dashboard del admin
4. Probar navegar por los módulos del sidebar

### Probar como Profesor

1. Cerrar sesión
2. Ingresar con:
   - Email: `laura@danse.com`
   - Password: `profesor123`
3. Verificar que se cargue el dashboard del profesor
4. **Importante:** Para ver cursos, primero debes crear un curso asignado a este profesor desde el admin

## 🎯 Paso 4: Crear datos de prueba completos

### 4.1 Crear un curso (como Admin)

Si ejecutaste el seed data (002_seed_data.sql), ya tienes datos de prueba.

Si no, necesitas crear manualmente:

1. Loguear como admin
2. Ir a SQL Editor en Supabase
3. Ejecutar estos inserts (reemplazando UUIDs):

```sql
-- Obtener el ID del profesor
SELECT id FROM profesores WHERE dni = '35123456';
-- Copiar ese UUID

-- Crear curso Ballet Inicial
INSERT INTO public.cursos (profesor_id, nombre, descripcion, nivel, estado, cupo_maximo, precio_mensual) VALUES
  ('UUID-PROFESOR-AQUI', 'Ballet Nivel Inicial', 'Introducción al ballet clásico', 'Inicial', 'activo', 16, 4500.00);

-- Obtener el ID del curso creado
SELECT id FROM cursos WHERE nombre = 'Ballet Nivel Inicial';
-- Copiar ese UUID

-- Crear horarios
INSERT INTO public.horarios (curso_id, dia_semana, hora_inicio, hora_fin, aula) VALUES
  ('UUID-CURSO-AQUI', 'lunes', '09:00:00', '10:30:00', 'Aula 1'),
  ('UUID-CURSO-AQUI', 'miercoles', '09:00:00', '10:30:00', 'Aula 1'),
  ('UUID-CURSO-AQUI', 'viernes', '09:00:00', '10:30:00', 'Aula 1');
```

### 4.2 Crear una inscripción

```sql
-- Las alumnas ya están creadas si ejecutaste el seed data
-- Inscribir a Ana García en Ballet Inicial

INSERT INTO public.inscripciones (alumno_id, curso_id, fecha_inicio, estado) VALUES
  (
    (SELECT id FROM alumnos WHERE dni = '45123456'),
    (SELECT id FROM cursos WHERE nombre = 'Ballet Nivel Inicial'),
    '2025-01-15',
    'activa'
  );
```

### 4.3 Probar sistema de recargos

1. Loguear como admin
2. Ir a **Cobros**
3. Buscar DNI: `47345678` (Valentina Rodríguez)
4. Verificar que muestre:
   - Meses pagados: Enero, Febrero, Marzo
   - Mes adeudado: Abril con recargo del 10% por día

**Cómo funciona el recargo:**
- Fecha de vencimiento: 1 de cada mes + 5 días de gracia = 6 del mes
- Si hoy es 8 de abril → 2 días de mora
- Recargo = 10% por día × 2 días = 20% de recargo
- Monto base: $4.500 → Monto con recargo: $5.400

## 📱 Paso 5: Probar vista de Profesor

1. Loguear como `laura@danse.com`
2. Verificar que aparezca el curso "Ballet Nivel Inicial"
3. Hacer clic en "Tomar asistencia"
4. Verificar que aparezcan las alumnas inscritas
5. Marcar presente/ausente
6. Hacer clic en "Guardar asistencia"
7. Verificar que se guardó correctamente

**Probar WhatsApp:**
- Los enlaces de WhatsApp funcionan en móvil
- En desktop abrirá WhatsApp Web

## 🚀 Paso 6: Deploy a producción (Vercel)

### 6.1 Preparar para deploy

1. Crear repositorio en GitHub
2. Pushear el código:

```bash
git init
git add .
git commit -m "Initial commit - Dansé app"
git branch -M main
git remote add origin https://github.com/tu-usuario/danse-app.git
git push -u origin main
```

### 6.2 Deploy en Vercel

1. Ir a [https://vercel.com](https://vercel.com)
2. Conectar con GitHub
3. Importar el repositorio `danse-app`
4. Configurar las variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Hacer clic en **Deploy**

### 6.3 Configurar PWA

La app ya está configurada como PWA. Una vez desplegada:

1. Abrir la URL de Vercel en un móvil
2. Chrome/Safari mostrará "Instalar app"
3. Una vez instalada, funciona offline para tomar asistencia

## 🔐 Paso 7: Configurar autenticación biométrica (opcional)

La app ya tiene soporte para WebAuthn (huella digital). Para habilitarlo:

1. En Supabase, ir a **Authentication** → **Providers**
2. No hay configuración adicional necesaria
3. WebAuthn funciona automáticamente en navegadores compatibles

**Limitaciones:**
- Solo funciona en HTTPS (producción)
- Requiere navegador moderno (Chrome 67+, Safari 14+)
- El usuario debe registrar su huella primero

## ⚙️ Configuración adicional

### Ajustar días de gracia

Por defecto son 5 días. Para cambiar:

```sql
UPDATE configuracion 
SET valor = '7' 
WHERE clave = 'dias_gracia_pago';
```

### Ajustar porcentaje de recargo

Por defecto es 10% por día. Para cambiar a 5%:

```sql
UPDATE configuracion 
SET valor = '5' 
WHERE clave = 'recargo_diario_porcentaje';
```

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Verificar que el archivo `.env` exista
- Verificar que las variables empiecen con `VITE_`
- Reiniciar el servidor de desarrollo

### No aparecen cursos en vista profesor
- Verificar que el curso esté asignado al profesor correcto
- Verificar que el curso esté en estado 'activo'
- Verificar en SQL Editor:
```sql
SELECT * FROM obtener_cursos_profesor();
```

### Error al guardar asistencia
- Verificar que el horario tenga un ID válido
- Verificar los permisos RLS en Supabase
- Ver logs en la consola del navegador

### Los recargos no se calculan
- Verificar que la vista `deudas_con_recargo` exista
- Verificar que las funciones `calcular_fecha_vencimiento` y `calcular_recargo_mora` existan
- Ejecutar manualmente:
```sql
SELECT * FROM deudas_con_recargo WHERE dias_mora >= 1;
```

## 📞 Soporte

Para cualquier duda o problema, revisar:
- Los logs de la consola del navegador
- Los logs de Supabase (Database → Logs)
- El código en GitHub

## 🎉 ¡Listo!

Tu sistema Dansé está configurado y funcionando con:
✅ Sistema de recargos automáticos (10% por día)
✅ Roles diferenciados (Admin y Profesor)
✅ Vista de profesor con solo sus cursos
✅ Toma de asistencia con WhatsApp
✅ PWA instalable
✅ Autenticación segura
