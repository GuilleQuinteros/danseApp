import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function ProfesorDashboard() {
  
  const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const getDiaActual = () => {
  return dias[new Date().getDay()]
  }

const diaActivo = diaSeleccionado || getDiaActual()
  useEffect(() => {
  if (!diaActivo) return
  loadCursos()
}, [diaActivo])

  const loadCursos = async () => {
  try {
    setLoading(true)

    const { data, error } = await supabase
      .rpc('obtener_cursos_por_dia_profesor', { p_dia: diaActivo })

    if (error) throw error

    setCursos(data || [])

  } catch (error) {
    console.error('Error loading cursos:', error)
    setCursos([]) // importante

  } finally {
    setLoading(false) // 🔥 CRÍTICO
  }
}

 

  const goToAsistencia = (cursoId) => {
    navigate(`/profesor/asistencia/${cursoId}`)
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-300 border-r-transparent"></div>
        <p className="mt-2 text-sm text-teal-200">Cargando tus cursos...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-teal-200 mb-4">
        Hoy es {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
  {dias.map((dia) => (
    <button
      key={dia}
      onClick={() => setDiaSeleccionado(dia)}
      className={`px-3 py-1.5 rounded-full text-xs capitalize transition-all ${
        diaActivo === dia
          ? 'bg-teal-500 text-white'
          : 'bg-white/10 text-teal-200 hover:bg-white/20'
      }`}
    >
      {dia}
    </button>
  ))}
</div>
      <div className="space-y-3">
        {cursos.length === 0 ? (
          <div className="bg-white/10 rounded-xl p-8 text-center">
            <p className="text-teal-200">No tenés clases programadas para hoy</p>
          </div>
        ) : (
          cursos.map((curso) => (
            <div
              key={curso.curso_id}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-teal-300/25 p-5 hover:bg-white/15 transition-all cursor-pointer"
              onClick={() => goToAsistencia(curso.curso_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-base font-semibold text-white mb-1">
                    {curso.nombre}
                  </div>
                  {/* Horarios 
                  {curso.nivel && (
                    <div className="text-xs text-teal-200 mb-2">{curso.nivel}</div>
                  )}*/}
                  
                  {/* Horarios */}
                  {curso.horarios && (
                    <div className="space-y-1 mt-2">
                      {curso.horarios.map((horario, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-teal-100">
                          <div className="w-1.5 h-1.5 bg-teal-300 rounded-full"></div>
                          <span>{horario.hora_inicio?.slice(0, 5)} - {horario.hora_fin?.slice(0, 5)}</span>
                          {horario.aula && (
                            <>
                              <span>·</span>
                              <span>{horario.aula}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/*
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-xs text-teal-200">
                      {curso.cant_inscritos || 0} / {curso.cupo_maximo} alumnas
                    </div>
                    <div className="flex-1 bg-teal-900/30 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-teal-300 h-full rounded-full"
                        style={{ width: `${((curso.cant_inscritos || 0) / curso.cupo_maximo) * 100}%` }}
                      ></div>
                    </div>
                  </div>*/}
                </div>
                      
                <button 
                  className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg hover:bg-teal-600 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    goToAsistencia(curso.curso_id)
                  }}
                >
                  Tomar asistencia →
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
