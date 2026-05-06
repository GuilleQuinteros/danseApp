import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Deudas() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeudas()
  }, [])

  const loadDeudas = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('vw_deudas_detalle')
        .select(`
          inscripcion_id,
          nombre,
          apellido,
          curso,
          cuotas_impagas,
          meses_impagos,
          total_deuda
        `)
        .gt('total_deuda', 0)

      if (error) throw error

      // 🔥 normalizar datos (clave para evitar NaN)
      const processed = (data || []).map(row => ({
        ...row,
        total_deuda: Number(row.total_deuda || 0),
        cuotas_impagas: row.cuotas_impagas || 0,
        meses_impagos: row.meses_impagos || '-'
      }))

      setData(processed)

    } catch (err) {
      console.error('Error loading deudas:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando deudas...</div>
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-xl font-semibold mb-4">Deudas</h2>

      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-6">
          No hay deudas registradas
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left border-b text-gray-500">
              <tr>
                <th className="py-2">Alumna</th>
                <th>Curso</th>
                <th>Cuotas</th>
                <th>Meses</th>
                <th>Deuda</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {data.map(row => (
                <tr key={row.inscripcion_id} className="border-b">
                  
                  <td className="py-2">
                    {row.apellido} {row.nombre}
                  </td>

                  <td>{row.curso || '—'}</td>

                  <td>{row.cuotas_impagas}</td>

                  <td>{row.meses_impagos}</td>

                  <td className="font-semibold">
                    ${row.total_deuda.toLocaleString('es-AR')}
                  </td>

                  <td>
                    <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-700">
                      Debe cuotas
                    </span>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}