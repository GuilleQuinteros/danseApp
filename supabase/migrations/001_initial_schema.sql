-- =====================================================
-- DANSÉ - ESTUDIO DE DANZA
-- Schema completo con sistema de recargos automáticos
-- y control de acceso por roles
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TIPOS ENUMERADOS
-- =====================================================

CREATE TYPE user_role AS ENUM ('admin', 'profesor');
CREATE TYPE curso_estado AS ENUM ('activo', 'por_iniciar', 'finalizado', 'cancelado');
CREATE TYPE inscripcion_estado AS ENUM ('activa', 'pausada', 'finalizada');
CREATE TYPE dia_semana AS ENUM ('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo');
CREATE TYPE asistencia_estado AS ENUM ('presente', 'ausente', 'justificada');
CREATE TYPE forma_pago AS ENUM ('efectivo', 'transferencia', 'debito', 'credito', 'mercadopago');

-- =====================================================
-- TABLA: usuarios
-- Extiende auth.users de Supabase
-- =====================================================

CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre_completo TEXT NOT NULL,
  rol user_role NOT NULL DEFAULT 'profesor',
  avatar_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por rol
CREATE INDEX idx_usuarios_rol ON public.usuarios(rol);
CREATE INDEX idx_usuarios_activo ON public.usuarios(activo);

-- =====================================================
-- TABLA: profesores
-- Información adicional de profesores
-- =====================================================

CREATE TABLE public.profesores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  especialidad TEXT,
  telefono TEXT,
  dni TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id)
);

CREATE INDEX idx_profesores_usuario ON public.profesores(usuario_id);

-- =====================================================
-- TABLA: alumnos
-- =====================================================

CREATE TABLE public.alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  telefono_tutor TEXT NOT NULL,
  nombre_tutor TEXT NOT NULL,
  email_tutor TEXT,
  foto_url TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alumnos_dni ON public.alumnos(dni);
CREATE INDEX idx_alumnos_activo ON public.alumnos(activo);
CREATE INDEX idx_alumnos_nombre ON public.alumnos(nombre, apellido);

-- =====================================================
-- TABLA: cursos
-- =====================================================

CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profesor_id UUID NOT NULL REFERENCES public.profesores(id) ON DELETE RESTRICT,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  nivel TEXT,
  estado curso_estado DEFAULT 'por_iniciar',
  cupo_maximo INTEGER DEFAULT 20,
  precio_mensual DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cursos_profesor ON public.cursos(profesor_id);
CREATE INDEX idx_cursos_estado ON public.cursos(estado);

-- =====================================================
-- TABLA: horarios
-- Un curso puede tener múltiples horarios
-- =====================================================

CREATE TABLE public.horarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  dia_semana dia_semana NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  aula TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_horarios_curso ON public.horarios(curso_id);
CREATE INDEX idx_horarios_dia ON public.horarios(dia_semana);

-- =====================================================
-- TABLA: inscripciones
-- =====================================================

CREATE TABLE public.inscripciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES public.alumnos(id) ON DELETE CASCADE,
  curso_id UUID NOT NULL REFERENCES public.cursos(id) ON DELETE CASCADE,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  estado inscripcion_estado DEFAULT 'activa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, curso_id)
);

CREATE INDEX idx_inscripciones_alumno ON public.inscripciones(alumno_id);
CREATE INDEX idx_inscripciones_curso ON public.inscripciones(curso_id);
CREATE INDEX idx_inscripciones_estado ON public.inscripciones(estado);

-- =====================================================
-- TABLA: pagos
-- Sistema con recargo automático del 10% por día
-- =====================================================

CREATE TABLE public.pagos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscripcion_id UUID NOT NULL REFERENCES public.inscripciones(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL CHECK (anio >= 2020),
  monto_base DECIMAL(10, 2) NOT NULL, -- Monto sin recargos
  recargo_aplicado DECIMAL(10, 2) DEFAULT 0, -- Recargo calculado
  monto_total DECIMAL(10, 2) NOT NULL, -- Monto final pagado
  forma_pago forma_pago NOT NULL,
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento DATE NOT NULL, -- Fecha límite de pago
  registrado_por UUID REFERENCES public.usuarios(id),
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inscripcion_id, mes, anio)
);

CREATE INDEX idx_pagos_inscripcion ON public.pagos(inscripcion_id);
CREATE INDEX idx_pagos_fecha ON public.pagos(fecha_pago);
CREATE INDEX idx_pagos_vencimiento ON public.pagos(fecha_vencimiento);

-- =====================================================
-- TABLA: asistencias
-- =====================================================

CREATE TABLE public.asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inscripcion_id UUID NOT NULL REFERENCES public.inscripciones(id) ON DELETE CASCADE,
  horario_id UUID NOT NULL REFERENCES public.horarios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  estado asistencia_estado DEFAULT 'presente',
  registrado_por UUID REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(inscripcion_id, fecha, horario_id)
);

CREATE INDEX idx_asistencias_inscripcion ON public.asistencias(inscripcion_id);
CREATE INDEX idx_asistencias_fecha ON public.asistencias(fecha);
CREATE INDEX idx_asistencias_horario ON public.asistencias(horario_id);

-- =====================================================
-- TABLA: configuracion
-- Configuración del sistema (plazo de gracia, recargos, etc)
-- =====================================================

CREATE TABLE public.configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuración inicial
INSERT INTO public.configuracion (clave, valor, descripcion) VALUES
  ('dias_gracia_pago', '5', 'Días de gracia desde el día 1 del mes antes de aplicar recargos'),
  ('recargo_diario_porcentaje', '10', 'Porcentaje de recargo por cada día de mora (10 = 10%)'),
  ('dia_vencimiento_cuota', '1', 'Día del mes en que vence la cuota (default: día 1)');

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función: calcular fecha de vencimiento
CREATE OR REPLACE FUNCTION calcular_fecha_vencimiento(p_mes INTEGER, p_anio INTEGER)
RETURNS DATE AS $$
DECLARE
  v_dia_vencimiento INTEGER;
  v_dias_gracia INTEGER;
BEGIN
  SELECT valor::INTEGER INTO v_dia_vencimiento 
  FROM configuracion WHERE clave = 'dia_vencimiento_cuota';
  
  SELECT valor::INTEGER INTO v_dias_gracia 
  FROM configuracion WHERE clave = 'dias_gracia_pago';
  
  RETURN make_date(p_anio, p_mes, v_dia_vencimiento) + (v_dias_gracia || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Función: calcular recargo por mora
-- Retorna el porcentaje total de recargo (10% por día)
CREATE OR REPLACE FUNCTION calcular_recargo_mora(p_fecha_vencimiento DATE)
RETURNS DECIMAL AS $$
DECLARE
  v_dias_mora INTEGER;
  v_recargo_diario DECIMAL;
  v_recargo_total DECIMAL;
BEGIN
  -- Si no está vencida, no hay recargo
  IF p_fecha_vencimiento >= CURRENT_DATE THEN
    RETURN 0;
  END IF;
  
  -- Calcular días de mora
  v_dias_mora := CURRENT_DATE - p_fecha_vencimiento;
  
  -- Obtener porcentaje de recargo diario
  SELECT valor::DECIMAL INTO v_recargo_diario 
  FROM configuracion WHERE clave = 'recargo_diario_porcentaje';
  
  -- Calcular recargo total (10% por día = 0.10 * días)
  v_recargo_total := v_recargo_diario * v_dias_mora;
  
  RETURN v_recargo_total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: deudas_con_recargo
-- Calcula automáticamente el recargo para cuotas adeudadas
-- =====================================================

CREATE OR REPLACE VIEW deudas_con_recargo AS
SELECT 
  i.id as inscripcion_id,
  i.alumno_id,
  i.curso_id,
  a.nombre,
  a.apellido,
  a.dni,
  c.nombre as curso_nombre,
  c.precio_mensual as monto_base,
  EXTRACT(MONTH FROM generate_series.mes_fecha) as mes,
  EXTRACT(YEAR FROM generate_series.mes_fecha) as anio,
  calcular_fecha_vencimiento(
    EXTRACT(MONTH FROM generate_series.mes_fecha)::INTEGER,
    EXTRACT(YEAR FROM generate_series.mes_fecha)::INTEGER
  ) as fecha_vencimiento,
  calcular_recargo_mora(
    calcular_fecha_vencimiento(
      EXTRACT(MONTH FROM generate_series.mes_fecha)::INTEGER,
      EXTRACT(YEAR FROM generate_series.mes_fecha)::INTEGER
    )
  ) as recargo_porcentaje,
  ROUND(
    c.precio_mensual * (1 + calcular_recargo_mora(
      calcular_fecha_vencimiento(
        EXTRACT(MONTH FROM generate_series.mes_fecha)::INTEGER,
        EXTRACT(YEAR FROM generate_series.mes_fecha)::INTEGER
      )
    ) / 100),
    2
  ) as monto_total_con_recargo,
  CURRENT_DATE - calcular_fecha_vencimiento(
    EXTRACT(MONTH FROM generate_series.mes_fecha)::INTEGER,
    EXTRACT(YEAR FROM generate_series.mes_fecha)::INTEGER
  ) as dias_mora
FROM inscripciones i
INNER JOIN alumnos a ON i.alumno_id = a.id
INNER JOIN cursos c ON i.curso_id = c.id
CROSS JOIN LATERAL generate_series(
  i.fecha_inicio,
  CURRENT_DATE,
  '1 month'::interval
) as generate_series(mes_fecha)
WHERE i.estado = 'activa'
  AND NOT EXISTS (
    SELECT 1 FROM pagos p 
    WHERE p.inscripcion_id = i.id 
      AND p.mes = EXTRACT(MONTH FROM generate_series.mes_fecha)
      AND p.anio = EXTRACT(YEAR FROM generate_series.mes_fecha)
  );

-- =====================================================
-- TRIGGER: actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON alumnos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON cursos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON inscripciones
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON configuracion
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- Control de acceso por roles
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS: usuarios
-- =====================================================

-- Admin puede ver todos los usuarios
CREATE POLICY "Admin puede ver todos los usuarios"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios ven su perfil"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- Admin puede actualizar cualquier usuario
CREATE POLICY "Admin actualiza usuarios"
  ON usuarios FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- =====================================================
-- POLÍTICAS: profesores
-- =====================================================

CREATE POLICY "Admin ve todos los profesores"
  ON profesores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "Profesores ven su perfil"
  ON profesores FOR SELECT
  USING (usuario_id = auth.uid());

-- =====================================================
-- POLÍTICAS: alumnos
-- =====================================================

CREATE POLICY "Admin ve todos los alumnos"
  ON alumnos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Profesores solo ven alumnos de sus cursos
CREATE POLICY "Profesores ven alumnos de sus cursos"
  ON alumnos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE i.alumno_id = alumnos.id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: cursos
-- =====================================================

CREATE POLICY "Admin ve y gestiona todos los cursos"
  ON cursos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Profesores solo ven sus propios cursos
CREATE POLICY "Profesores ven sus cursos"
  ON cursos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profesores p
      WHERE p.id = cursos.profesor_id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: horarios
-- =====================================================

CREATE POLICY "Admin gestiona horarios"
  ON horarios FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "Profesores ven horarios de sus cursos"
  ON horarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cursos c
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE c.id = horarios.curso_id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: inscripciones
-- =====================================================

CREATE POLICY "Admin gestiona inscripciones"
  ON inscripciones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "Profesores ven inscripciones de sus cursos"
  ON inscripciones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cursos c
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE c.id = inscripciones.curso_id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: pagos
-- =====================================================

CREATE POLICY "Admin gestiona pagos"
  ON pagos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Profesores solo ven pagos de alumnos en sus cursos (solo lectura)
CREATE POLICY "Profesores ven pagos de sus cursos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE pagos.inscripcion_id = i.id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: asistencias
-- =====================================================

CREATE POLICY "Admin gestiona asistencias"
  ON asistencias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

-- Profesores pueden insertar/actualizar asistencias de sus cursos
CREATE POLICY "Profesores gestionan asistencias de sus cursos"
  ON asistencias FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE i.id = asistencias.inscripcion_id
        AND p.usuario_id = auth.uid()
    )
  );

-- =====================================================
-- POLÍTICAS: configuracion
-- =====================================================

CREATE POLICY "Admin gestiona configuración"
  ON configuracion FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() AND u.rol = 'admin'
    )
  );

CREATE POLICY "Todos leen configuración"
  ON configuracion FOR SELECT
  USING (true);

-- =====================================================
-- FUNCIONES PARA EL FRONTEND
-- =====================================================

-- Función: obtener cursos del profesor logueado
CREATE OR REPLACE FUNCTION obtener_cursos_profesor()
RETURNS TABLE (
  curso_id UUID,
  nombre TEXT,
  nivel TEXT,
  estado curso_estado,
  cupo_maximo INTEGER,
  cant_inscritos BIGINT,
  horarios JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nombre,
    c.nivel,
    c.estado,
    c.cupo_maximo,
    COUNT(DISTINCT i.id) as cant_inscritos,
    jsonb_agg(
      jsonb_build_object(
        'dia', h.dia_semana,
        'hora_inicio', h.hora_inicio,
        'hora_fin', h.hora_fin,
        'aula', h.aula
      )
    ) as horarios
  FROM cursos c
  INNER JOIN profesores p ON c.profesor_id = p.id
  LEFT JOIN inscripciones i ON c.id = i.curso_id AND i.estado = 'activa'
  LEFT JOIN horarios h ON c.id = h.curso_id
  WHERE p.usuario_id = auth.uid()
  GROUP BY c.id, c.nombre, c.nivel, c.estado, c.cupo_maximo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función: obtener alumnas de un curso (para tomar asistencia)
CREATE OR REPLACE FUNCTION obtener_alumnas_curso(p_curso_id UUID)
RETURNS TABLE (
  inscripcion_id UUID,
  alumno_id UUID,
  nombre TEXT,
  apellido TEXT,
  telefono_tutor TEXT,
  ultima_asistencia asistencia_estado,
  porcentaje_asistencia DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    a.id,
    a.nombre,
    a.apellido,
    a.telefono_tutor,
    (
      SELECT estado FROM asistencias 
      WHERE inscripcion_id = i.id 
      ORDER BY fecha DESC LIMIT 1
    ) as ultima_asistencia,
    CASE 
      WHEN COUNT(ast.id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(CASE WHEN ast.estado = 'presente' THEN 1 END)::DECIMAL / COUNT(ast.id)) * 100,
        2
      )
    END as porcentaje_asistencia
  FROM inscripciones i
  INNER JOIN alumnos a ON i.alumno_id = a.id
  LEFT JOIN asistencias ast ON i.id = ast.inscripcion_id
  WHERE i.curso_id = p_curso_id AND i.estado = 'activa'
  GROUP BY i.id, a.id, a.nombre, a.apellido, a.telefono_tutor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - COMENTAR EN PRODUCCIÓN)
-- =====================================================

/*
-- Usuario admin de ejemplo
-- Contraseña: admin123 (cambiar en producción)
INSERT INTO auth.users (id, email) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@danse.com');

INSERT INTO usuarios (id, email, nombre_completo, rol) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@danse.com', 'Karina Molina', 'admin');
*/

COMMIT;
