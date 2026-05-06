import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Asistencia() {

  const [cursos, setCursos] = useState([])
  const [cursoId, setCursoId] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCursos()
  }, [])

  const loadCursos = async () => {
    const { data } = await supabase
      .from('cursos')
      .select('id, nombre')
      .neq('estado', 'eliminado')

    setCursos(data || [])
  }

  const loadAsistencia = async () => {
  if (!cursoId) return

  setLoading(true)

  try {
    // 🔹 traer inscripciones correctamente
    const { data: inscripciones, error: err1 } = await supabase
      .from('vw_asistencias_detalle')
      .select('inscripcion_id, nombre, apellido')
      .eq('curso_id', cursoId)

    if (err1) throw err1

    if (!inscripciones || inscripciones.length === 0) {
      setData([])
      return
    }

    const inscripcionIds = inscripciones.map(i => i.inscripcion_id)

    // 🔹 traer asistencias SOLO de ese curso
    const { data: asistencias, error: err2 } = await supabase
      .from('asistencias')
      .select('inscripcion_id, estado')
      .in('inscripcion_id', inscripcionIds)

    if (err2) throw err2

    // 🔹 agrupar
    const map = {}

    asistencias?.forEach(a => {
      if (!map[a.inscripcion_id]) {
        map[a.inscripcion_id] = {
          presentes: 0,
          faltas: 0,
          justificadas: 0
        }
      }

      if (a.estado === 'presente') map[a.inscripcion_id].presentes++
      else if (a.estado === 'ausente') map[a.inscripcion_id].faltas++
      else if (a.estado === 'justificada') map[a.inscripcion_id].justificadas++
    })

    // 🔹 armar resultado
    const result = inscripciones.map(i => ({
      id: i.inscripcion_id,
      nombre: i.nombre,
      apellido: i.apellido,
      presentes: map[i.inscripcion_id]?.presentes || 0,
      faltas: map[i.inscripcion_id]?.faltas || 0,
      justificadas: map[i.inscripcion_id]?.justificadas || 0
    }))

    setData(result)

  } catch (err) {
    console.error(err)
    alert('Error cargando asistencia')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="space-y-6">

      <h2 className="text-xl font-semibold">Reporte de asistencia</h2>

      {/* FILTROS */}
      <div className="flex gap-3">

        <select
          value={cursoId}
          onChange={e => setCursoId(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">Seleccionar curso</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

        <button
          onClick={loadAsistencia}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Ver
        </button>

      </div>

      {/* TABLA */}
      {loading ? (
        <div className="text-center py-6">Cargando...</div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">

          <table className="w-full text-sm">
            <thead className="border-b text-gray-500 bg-gray-50">
              <tr>
                <th className="p-3 text-left">Alumna</th>
                <th className="text-center">Presentes</th>
                <th className="text-center">Faltas</th>
                <th className="text-center">Justificadas</th>
              </tr>
            </thead>

            <tbody>
              {data.map(a => (
                <tr key={a.id} className="border-b last:border-0">

                  <td className="p-3">
                    {a.apellido} {a.nombre}
                  </td>

                  <td className="text-center text-green-600 font-medium">
                    {a.presentes}
                  </td>

                  <td className="text-center text-red-600 font-semibold">
                    {a.faltas}
                  </td>

                  <td className="text-center text-yellow-600">
                    {a.justificadas}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

          {data.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              Sin datos
            </div>
          )}

        </div>
      )}

    </div>
  )
}