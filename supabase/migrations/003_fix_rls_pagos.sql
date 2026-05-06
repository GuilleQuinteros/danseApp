-- =====================================================
-- FIX: Corregir política RLS de pagos
-- =====================================================

-- Primero eliminar la política con error
DROP POLICY IF EXISTS "Profesores ven pagos de sus cursos" ON pagos;

-- Recrear la política correctamente
CREATE POLICY "Profesores ven pagos de sus cursos"
  ON pagos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM inscripciones i
      INNER JOIN cursos c ON i.curso_id = c.id
      INNER JOIN profesores p ON c.profesor_id = p.id
      WHERE pagos.inscripcion_id = i.id  -- ← CORREGIDO: era p.inscripcion_id (error)
        AND p.usuario_id = auth.uid()
    )
  );
