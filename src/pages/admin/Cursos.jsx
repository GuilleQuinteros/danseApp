import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Cursos() {
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('activos')

  const navigate = useNavigate()

  useEffect(() => {
    loadCursos()
  }, [filtroEstado])

  const loadCursos = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('cursos')
        .select(`
          *,
          profesor:profesores(
            usuario:usuarios(nombre_completo)
          )
        `)
        .order('nombre')

      // 🎯 FILTROS
      if (filtroEstado === 'activos') {
        query = query.not('estado', 'eq', 'eliminado')
      }

      if (filtroEstado === 'finalizados') {
        query = query.eq('estado', 'finalizado')
      }

      if (filtroEstado === 'todos') {
        // no filtra
      }

      const { data, error } = await query

      if (error) throw error

      setCursos(data || [])
    } catch (error) {
      console.error('Error cargando cursos:', error)
    } finally {
      setLoading(false)
    }
  }

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-700'
      case 'por_iniciar':
        return 'bg-blue-100 text-blue-700'
      case 'finalizado':
        return 'bg-gray-200 text-gray-600'
      case 'cancelado':
        return 'bg-red-100 text-red-700'
      case 'eliminado':
        return 'bg-black text-white'
      default:
        return 'bg-gray-100 text-gray-500'
    }
  }

  if (loading) {
    return <div className="p-8">Cargando cursos...</div>
  }

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Cursos</h2>

        <div className="flex gap-2">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            <option value="activos">Activos</option>
            <option value="finalizados">Finalizados</option>
            <option value="todos">Todos</option>
          </select>

          <button
            onClick={loadCursos}
            className="border px-3 py-1 rounded"
          >
            Recargar
          </button>

          <button
            onClick={() => navigate('/admin/cursos/nuevo')}
            className="bg-teal-600 text-white px-4 py-2 rounded"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {cursos.map((curso) => (
          <div
            key={curso.id}
            className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition cursor-pointer"
            onClick={() => navigate(`/admin/cursos/${curso.id}`)}
          >
            <div className="text-lg font-semibold">
              {curso.nombre}
            </div>

            <div className="text-sm text-gray-500">
              {curso.nivel || 'Sin nivel'}
            </div>

            <div className="text-xs text-gray-400 mt-2">
              {curso.profesor?.usuario?.nombre_completo || 'Sin profesor'}
            </div>

            <div className="mt-2 text-sm font-medium">
              ${Number(curso.precio_mensual).toLocaleString('es-AR')}
            </div>

            <div className="mt-3">
              <span className={`px-2 py-1 text-xs rounded ${getEstadoStyle(curso.estado)}`}>
                {curso.estado}
              </span>
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}