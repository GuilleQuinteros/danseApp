import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

export default function CursoDetalle() {
  const { id: cursoId } = useParams()
  const navigate = useNavigate()

  const [alumnas, setAlumnas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (cursoId) loadData()
  }, [cursoId])

  // 🔄 LOAD DATA
  const loadData = async () => {
    try {
      setLoading(true)

      const { data: inscripciones, error: err1 } = await supabase
        .from('inscripciones')
        .select(`
          id,
          estado,
          fecha_baja,
          alumno:alumnos(nombre, apellido)
        `)
        .eq('curso_id', cursoId)

      if (err1) throw err1

      const { data: deudas, error: err2 } = await supabase
        .from('vw_deudas_detalle')
        .select('inscripcion_id, total_deuda')

      if (err2) throw err2

      const deudaMap = {}
      deudas.forEach(d => {
        deudaMap[d.inscripcion_id] = Number(d.total_deuda || 0)
      })

      const result = inscripciones.map(i => ({
        id: i.id,
        nombre: i.alumno?.nombre || '',
        apellido: i.alumno?.apellido || '',
        estado: i.estado,
        fecha_baja: i.fecha_baja,
        deuda: deudaMap[i.id] || 0
      }))

      setAlumnas(result)

    } catch (err) {
      console.error('Error cargando curso:', err)
    } finally {
      setLoading(false)
    }
  }

  // ⚙️ ACCIONES GENERALES
  const ejecutarAccion = async (rpc, id, mensaje) => {
    const ok = confirm(mensaje)
    if (!ok) return

    try {
      const { error } = await supabase.rpc(rpc, {
        p_inscripcion_id: id
      })

      if (error) throw error

      await loadData()

    } catch (err) {
      console.error(err)
      alert('Error en operación')
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando alumnas...</div>
  }

  const finalizarCurso = async () => {
  if (!confirm('Finalizar curso?')) return

  const { error } = await supabase.rpc('finalizar_curso', {
    p_curso_id: cursoId
  })

  if (error) return alert(error.message)

  alert('Curso finalizado')
  loadData()
}

const eliminarCurso = async () => {
  if (!confirm('Eliminar curso?')) return

  const { error } = await supabase.rpc('eliminar_curso', {
    p_curso_id: cursoId
  })

  if (error) return alert(error.message)

  alert('Curso eliminado')

  navigate('/admin/cursos')
}

  // 📊 MÉTRICAS
  const totalAlumnas = alumnas.length
  const deudoras = alumnas.filter(a => a.deuda > 0).length
  const alDia = totalAlumnas - deudoras

  return (
    <div className="space-y-6">

      <div className="flex gap-2">
          <button className="bg-yellow-500 text-white px-3 py-2 rounded">
            Pausar
          </button>

          <button
            onClick={finalizarCurso}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          >
            Finalizar
          </button>

          <button
            onClick={eliminarCurso}
            className="bg-red-600 text-white px-3 py-2 rounded"
          >
            Eliminar
          </button>
        </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-3 gap-4">
        <Metric label="Alumnas" value={totalAlumnas} />
        <Metric label="Deudoras" value={deudoras} warning />
        <Metric label="Al día" value={alDia} />
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold mb-4">Alumnas del curso</h2>

        {alumnas.length === 0 ? (
          <p className="text-gray-500 text-center py-6">
            No hay alumnas en este curso
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left border-b text-gray-500">
              <tr>
                <th className="py-2">Alumna</th>
                <th>Deuda</th>
                <th>Inscripción</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {alumnas.map(a => (
                <tr key={a.id} className="border-b last:border-0">

                  {/* NOMBRE */}
                  <td className="py-2">
                    {a.apellido} {a.nombre}
                  </td>

                  {/* DEUDA */}
                  <td>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      a.deuda > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {a.deuda > 0 ? 'Debe' : 'Al día'}
                    </span>
                  </td>

                  {/* ESTADO */}
                  <td>
                    <BadgeEstado estado={a.estado} />
                  </td>

                  {/* ACCIONES */}
                  <td className="text-right space-x-2">

                    {/* ACTIVA */}
                    {a.estado === 'activa' && (
                      <>
                        <button
                          onClick={() =>
                            ejecutarAccion(
                              'pausar_inscripcion',
                              a.id,
                              '¿Pausar inscripción?'
                            )
                          }
                          className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                        >
                          Pausar
                        </button>

                        <button
                          onClick={() =>
                            ejecutarAccion(
                              'finalizar_inscripcion',
                              a.id,
                              '¿Finalizar inscripción?'
                            )
                          }
                          className="text-xs bg-gray-700 text-white px-2 py-1 rounded"
                        >
                          Finalizar
                        </button>
                      </>
                    )}

                    {/* PAUSADA */}
                    {a.estado === 'pausada' && (
                      <>
                        <button
                          onClick={() =>
                            ejecutarAccion(
                              'reactivar_inscripcion',
                              a.id,
                              '¿Reactivar inscripción?'
                            )
                          }
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                        >
                          Reactivar
                        </button>

                        <button
                          onClick={() =>
                            ejecutarAccion(
                              'finalizar_inscripcion',
                              a.id,
                              '¿Finalizar inscripción?'
                            )
                          }
                          className="text-xs bg-gray-700 text-white px-2 py-1 rounded"
                        >
                          Finalizar
                        </button>
                      </>
                    )}

                    {/* FINALIZADA */}
                    {a.estado === 'finalizada' && (
                      <span className="text-xs text-gray-400">
                        Sin acciones
                      </span>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// 🎯 BADGE PRO
function BadgeEstado({ estado }) {
  const styles = {
    activa: 'bg-green-100 text-green-700',
    pausada: 'bg-yellow-100 text-yellow-700',
    finalizada: 'bg-gray-200 text-gray-600'
  }

  const labels = {
    activa: 'Activa',
    pausada: 'Pausada',
    finalizada: 'Finalizada'
  }

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[estado]}`}>
      {labels[estado]}
    </span>
  )
}

// 📊 MÉTRICA
function Metric({ label, value, warning }) {
  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-xl font-bold ${
        warning ? 'text-red-600' : 'text-gray-900'
      }`}>
        {value}
      </div>
    </div>
  )
}