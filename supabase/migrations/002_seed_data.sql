-- =====================================================
-- DATOS DE EJEMPLO PARA TESTING
-- =====================================================

-- IMPORTANTE: Este archivo es OPCIONAL y solo para desarrollo/testing
-- NO ejecutar en producción

BEGIN;

-- =====================================================
-- 1. CREAR USUARIOS DE PRUEBA
-- =====================================================

-- Admin: admin@danse.com / admin123
-- NOTA: Estos usuarios se deben crear desde Supabase Auth primero
-- Luego ejecutar este SQL para agregar sus perfiles

-- Ejemplo de cómo crear los perfiles una vez que tengas los IDs de auth.users:

/*
INSERT INTO public.usuarios (id, email, nombre_completo, rol, activo) VALUES
  ('uuid-del-admin-de-auth-users', 'admin@danse.com', 'Karina Molina', 'admin', true),
  ('uuid-del-profesor-de-auth-users', 'laura@danse.com', 'Laura Gómez', 'profesor', true),
  ('uuid-del-profesor2-de-auth-users', 'maria@danse.com', 'María Vidal', 'profesor', true);

-- Insertar datos de profesores
INSERT INTO public.profesores (usuario_id, especialidad, telefono, dni) VALUES
  ('uuid-del-profesor-de-auth-users', 'Ballet Clásico', '341-555-1234', '35123456'),
  ('uuid-del-profesor2-de-auth-users', 'Danza Contemporánea', '341-555-5678', '33987654');
*/

-- =====================================================
-- 2. CREAR ALUMNAS DE PRUEBA
-- =====================================================

INSERT INTO public.alumnos (nombre, apellido, dni, fecha_nacimiento, telefono_tutor, nombre_tutor, email_tutor, activo) VALUES
  ('Ana', 'García', '45123456', '2010-05-15', '3415551234', 'María García', 'maria.garcia@email.com', true),
  ('Lara', 'Méndez', '46234567', '2011-08-22', '342-555-6789', 'Carlos Méndez', 'carlos.mendez@email.com', true),
  ('Sofía', 'Herrera', '44987654', '2009-12-10', '343-555-0011', 'Laura Herrera', 'laura.herrera@email.com', true),
  ('Valentina', 'Rodríguez', '47345678', '2012-03-18', '344-555-4444', 'Roberto Rodríguez', 'roberto.rodriguez@email.com', true),
  ('Camila', 'Torres', '45876543', '2010-07-25', '341-555-7890', 'Susana Torres', 'susana.torres@email.com', true),
  ('Lucía', 'Fernández', '46789012', '2011-11-30', '342-555-3456', 'Diego Fernández', 'diego.fernandez@email.com', true),
  ('Martina', 'López', '45567890', '2010-09-05', '343-555-8901', 'Andrea López', 'andrea.lopez@email.com', true),
  ('Emma', 'González', '47123890', '2012-01-14', '344-555-2345', 'Juan González', 'juan.gonzalez@email.com', true);

-- =====================================================
-- 3. CREAR CURSOS (Primero crear profesores arriba)
-- =====================================================

-- NOTA: Reemplazar 'uuid-profesor-laura' con el ID real del profesor
-- Obtener con: SELECT id FROM profesores WHERE usuario_id = 'uuid-del-usuario-laura';

/*
INSERT INTO public.cursos (profesor_id, nombre, descripcion, nivel, estado, cupo_maximo, precio_mensual) VALUES
  ('uuid-profesor-laura', 'Ballet Nivel Inicial', 'Introducción al ballet clásico para niñas', 'Inicial', 'activo', 16, 4500.00),
  ('uuid-profesor-maria', 'Danza Contemporánea', 'Técnicas modernas de expresión corporal', 'Intermedio', 'activo', 12, 5000.00),
  ('uuid-profesor-laura', 'Ballet Intermedio', 'Perfeccionamiento de técnica clásica', 'Intermedio', 'por_iniciar', 10, 5500.00);
*/

-- =====================================================
-- 4. CREAR HORARIOS
-- =====================================================

-- NOTA: Reemplazar 'uuid-curso-ballet-inicial' con IDs reales de cursos

/*
INSERT INTO public.horarios (curso_id, dia_semana, hora_inicio, hora_fin, aula) VALUES
  ('uuid-curso-ballet-inicial', 'lunes', '09:00:00', '10:30:00', 'Aula 1'),
  ('uuid-curso-ballet-inicial', 'miercoles', '09:00:00', '10:30:00', 'Aula 1'),
  ('uuid-curso-ballet-inicial', 'viernes', '09:00:00', '10:30:00', 'Aula 1'),
  ('uuid-curso-contemporanea', 'martes', '10:30:00', '12:00:00', 'Aula 2'),
  ('uuid-curso-contemporanea', 'jueves', '10:30:00', '12:00:00', 'Aula 2');
*/

-- =====================================================
-- 5. CREAR INSCRIPCIONES
-- =====================================================

-- NOTA: Reemplazar UUIDs con los IDs reales

/*
INSERT INTO public.inscripciones (alumno_id, curso_id, fecha_inicio, estado) VALUES
  ((SELECT id FROM alumnos WHERE dni = '45123456'), 'uuid-curso-ballet-inicial', '2025-01-15', 'activa'),
  ((SELECT id FROM alumnos WHERE dni = '46234567'), 'uuid-curso-ballet-inicial', '2025-01-15', 'activa'),
  ((SELECT id FROM alumnos WHERE dni = '44987654'), 'uuid-curso-ballet-inicial', '2025-01-15', 'activa'),
  ((SELECT id FROM alumnos WHERE dni = '47345678'), 'uuid-curso-ballet-inicial', '2025-01-15', 'activa'),
  ((SELECT id FROM alumnos WHERE dni = '45876543'), 'uuid-curso-contemporanea', '2025-02-01', 'activa');
*/

-- =====================================================
-- 6. CREAR ALGUNOS PAGOS DE EJEMPLO
-- =====================================================

-- Ejemplo: Ana García pagó Enero, Febrero y Marzo
-- Valentina Rodríguez solo pagó Enero, Febrero y Marzo (Abril adeudado)

/*
INSERT INTO public.pagos (
  inscripcion_id, 
  mes, 
  anio, 
  monto_base, 
  recargo_aplicado,
  monto_total,
  forma_pago, 
  fecha_pago,
  fecha_vencimiento
) VALUES
  -- Ana García - Ballet Inicial - Enero a Marzo pagados
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '45123456')),
    1, 2025, 4500.00, 0, 4500.00, 'efectivo', '2025-01-05', '2025-01-06'
  ),
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '45123456')),
    2, 2025, 4500.00, 0, 4500.00, 'transferencia', '2025-02-03', '2025-02-06'
  ),
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '45123456')),
    3, 2025, 4500.00, 0, 4500.00, 'efectivo', '2025-03-04', '2025-03-06'
  ),
  
  -- Valentina Rodríguez - Ballet Inicial - Solo Enero, Feb, Marzo pagados (Abril ADEUDADO)
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '47345678')),
    1, 2025, 4500.00, 0, 4500.00, 'efectivo', '2025-01-08', '2025-01-06'
  ),
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '47345678')),
    2, 2025, 4500.00, 0, 4500.00, 'efectivo', '2025-02-05', '2025-02-06'
  ),
  (
    (SELECT id FROM inscripciones WHERE alumno_id = (SELECT id FROM alumnos WHERE dni = '47345678')),
    3, 2025, 4500.00, 0, 4500.00, 'efectivo', '2025-03-06', '2025-03-06'
  );
  -- Abril NO pagado -> aparecerá en deudas con recargo del 10% por cada día
*/

COMMIT;

-- =====================================================
-- VERIFICAR DATOS
-- =====================================================

-- Ver todas las alumnas
-- SELECT * FROM alumnos;

-- Ver cursos con sus profesores
-- SELECT c.*, u.nombre_completo as profesor 
-- FROM cursos c 
-- JOIN profesores p ON c.profesor_id = p.id 
-- JOIN usuarios u ON p.usuario_id = u.id;

-- Ver inscripciones activas
-- SELECT a.nombre, a.apellido, c.nombre as curso, i.fecha_inicio
-- FROM inscripciones i
-- JOIN alumnos a ON i.alumno_id = a.id
-- JOIN cursos c ON i.curso_id = c.id
-- WHERE i.estado = 'activa';

-- Ver deudas con recargo
-- SELECT * FROM deudas_con_recargo;

-- Ver pagos realizados
-- SELECT a.nombre, a.apellido, p.mes, p.anio, p.monto_total, p.fecha_pago
-- FROM pagos p
-- JOIN inscripciones i ON p.inscripcion_id = i.id
-- JOIN alumnos a ON i.alumno_id = a.id
-- ORDER BY p.anio DESC, p.mes DESC;
