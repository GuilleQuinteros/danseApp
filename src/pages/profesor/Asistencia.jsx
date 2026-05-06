import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ProfesorAsistencia() {
  const { cursoId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [curso, setCurso] = useState(null)
  const [alumnas, setAlumnas] = useState([])
  const [asistencias, setAsistencias] = useState({}) // { inscripcionId: 'presente' | 'ausente' }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCursoYAlumnas()
  }, [cursoId])

  const loadCursoYAlumnas = async () => {
    try {
      // Cargar curso
      const { data: cursoData } = await supabase
        .from('cursos')
        .select(`
          *,
          horarios(*)
        `)
        .eq('id', cursoId)
        .single()

      setCurso(cursoData)

      // Cargar alumnas del curso usando la función segura
      const { data: alumnasData, error } = await supabase
        .rpc('obtener_alumnas_curso', { p_curso_id: cursoId })

      if (error) throw error

      setAlumnas(alumnasData || [])

      // Inicializar asistencias del día si ya existen
      const today = new Date().toISOString().split('T')[0]
      const { data: asistenciasHoy } = await supabase
        .from('asistencias')
        .select('inscripcion_id, estado')
        .eq('fecha', today)
        .in('inscripcion_id', alumnasData.map(a => a.inscripcion_id))

      const asistenciasMap = {}
      asistenciasHoy?.forEach(a => {
        asistenciasMap[a.inscripcion_id] = a.estado
      })
      setAsistencias(asistenciasMap)

    } catch (error) {
      console.error('Error loading data:', error)
      alert('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const toggleAsistencia = (inscripcionId) => {
    setAsistencias(prev => ({
      ...prev,
      [inscripcionId]: prev[inscripcionId] === 'presente' ? 'ausente' : 'presente'
    }))
  }

  const guardarAsistencias = async () => {
    if (Object.keys(asistencias).length === 0) {
      alert('Por favor marca la asistencia de al menos una alumna')
      return
    }

    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const horarioId = curso.horarios[0]?.id // Simplificación: tomar primer horario

      // Preparar registros de asistencia
      const registros = Object.entries(asistencias).map(([inscripcionId, estado]) => ({
        inscripcion_id: inscripcionId,
        horario_id: horarioId,
        fecha: today,
        estado: estado,
        registrado_por: user.id
      }))

      // Usar upsert para insertar o actualizar
      const { error } = await supabase
        .from('asistencias')
        .upsert(registros, {
          onConflict: 'inscripcion_id,fecha,horario_id',
          ignoreDuplicates: false
        })

      if (error) throw error

      alert('✓ Asistencia guardada correctamente')
      navigate('/profesor/dashboard')
    } catch (error) {
      console.error('Error guardando asistencia:', error)
      alert('Error al guardar la asistencia')
    } finally {
      setSaving(false)
    }
  }

  const countPresentes = Object.values(asistencias).filter(a => a === 'presente').length
  const countAusentes = Object.values(asistencias).filter(a => a === 'ausente').length

  const getDiaHoy = () => {
  const dias = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado']
  return dias[new Date().getDay()]
}

const horariosHoy = curso?.horarios?.filter(h => h.dia_semana === getDiaHoy()) || []

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-300 border-r-transparent"></div>
        <p className="mt-2 text-sm text-teal-200">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Info del curso */}
      <div className="bg-white/12 backdrop-blur-sm rounded-xl border border-teal-300/25 p-4">
        <div className="text-base font-bold text-white">{curso?.nombre}</div>
        {curso?.horarios && (
          <div className="text-sm text-teal-200 mt-1">
            {curso.horarios.map(h => `${h.hora_inicio?.slice(0, 5)} - ${h.hora_fin?.slice(0, 5)}`).join(', ')} · 
            {curso.horarios[0]?.aula && ` ${curso.horarios[0].aula}`} · {alumnas.length} alumnas
          </div>
        )}
        
        <div className="flex gap-3.5 mt-2.5">
          <div className="text-xs text-white/60">
            Presentes: <span className="text-green-400 font-bold text-sm">{countPresentes}</span>
          </div>
          <div className="text-xs text-white/60">
            Ausentes: <span className="text-red-400 font-bold text-sm">{countAusentes}</span>
          </div>
        </div>
      </div>

      {/* Lista de alumnas */}
      <div className="space-y-0">
        {alumnas.map((alumna, idx) => {
          const estado = asistencias[alumna.inscripcion_id] || null
          
          return (
            <div
              key={alumna.inscripcion_id}
              className="flex items-center gap-2.5 py-3 border-b border-white/7 last:border-0"
            >
              {/* Avatar */}
              <div className="w-[34px] h-[34px] rounded-full bg-teal-300/20 flex items-center justify-center text-[11px] font-bold text-teal-200 flex-shrink-0">
                {alumna.nombre.charAt(0)}{alumna.apellido.charAt(0)}
              </div>

              {/* Nombre */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">
                  {alumna.nombre} {alumna.apellido}
                </div>
              </div>

              {/* WhatsApp */}
              {alumna.telefono_tutor && (
                <a
                  href={`https://wa.me/${alumna.telefono_tutor.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-teal-200 hover:text-teal-100 transition-colors px-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l5.09-1.35C8.44 21.52 10.18 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
                  </svg>
                  {alumna.telefono_tutor}
                </a>
              )}

              {/* Botón de asistencia */}
              <button
                onClick={() => toggleAsistencia(alumna.inscripcion_id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all min-w-[80px] ${
                  estado === 'presente'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : estado === 'ausente'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {estado === 'presente' ? 'Presente' : estado === 'ausente' ? 'Ausente' : 'Marcar'}
              </button>
            </div>
          )
        })}
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => navigate('/profesor/dashboard')}
          className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-medium transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={guardarAsistencias}
          disabled={saving || Object.keys(asistencias).length === 0}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-500/30"
        >
          {saving ? 'Guardando...' : `Guardar asistencia ✓`}
        </button>
      </div>
    </div>
  )
}
