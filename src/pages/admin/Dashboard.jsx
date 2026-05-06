import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const [stats, setStats] = useState({
    alumnas: 0,
    cursos: 0,
    deudas: 0,
    ingresos: 0
  })
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Cargar estadísticas
      const [alumnas, cursos, deudas, pagos, horarios] = await Promise.all([
          supabase.from('alumnos').select('id', { count: 'exact', head: true }).eq('activo', true),

          supabase.from('cursos').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),

          // ✅ CORREGIDO
          supabase
            .from('vw_deudas_detalle')
            .select('inscripcion_id')
            .gt('total_deuda', 0),

          supabase
            .from('pagos')
            .select('monto_final')
            .gte('fecha_pago', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
            .lte('fecha_pago', format(endOfMonth(new Date()), 'yyyy-MM-dd')),

          supabase
            .from('horarios')
            .select(`
              *,
              curso:cursos(
                nombre,
                nivel,
                profesor:profesores(
                  usuario:usuarios(nombre_completo)
                )
              ),
              curso_id
            `)
            .eq('dia_semana', getDiaSemana())
        ])

      setStats({
        alumnas: alumnas.count || 0,
        cursos: cursos.count || 0,
        deudas: deudas.data?.length || 0,
        ingresos: pagos.data?.reduce((sum, p) => sum + Number(p.monto_final || 0), 0)
      })

      // Procesar horarios del día
      if (horarios.data) {
        const grouped = horarios.data.reduce((acc, h) => {
          if (!acc[h.curso_id]) {
            acc[h.curso_id] = {
              ...h,
              count: 0
            }
          }
          return acc
        }, {})

        // Contar inscritos por curso
        for (const cursoId in grouped) {
          const { count } = await supabase
            .from('inscripciones')
            .select('id', { count: 'exact', head: true })
            .eq('curso_id', cursoId)
            .eq('estado', 'activa')
          
          grouped[cursoId].count = count || 0
        }

        setSchedule(Object.values(grouped))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="space-y-5">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          icon="👩"
          value={stats.alumnas}
          label="Alumnas activas"
          trend="+8 este mes"
          trendUp
        />
        <StatCard
          icon="🎵"
          value={stats.cursos}
          label="Cursos activos"
        />
        <StatCard
          icon="⚠️"
          value={stats.deudas}
          label="Cuotas adeudadas"
          trend="Requieren atención"
          warning
        />
        <StatCard
          icon="💰"
          value={`$${stats.ingresos.toLocaleString('es-AR')}`}
          label="Ingresos este mes"
          trend="+12% vs anterior"
          trendUp
          small
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Calendar */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold mb-3">Estado general</h3>

          <div className="space-y-2 text-sm">
            <div>💰 Ingresos del mes: ${stats.ingresos.toLocaleString()}</div>
            <div>⚠️ Deudoras: {stats.deudas}</div>
            <div>🎵 Cursos activos: {stats.cursos}</div>
          </div>
        </div>

        {/* Today's schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            Clases de hoy
            <div className="flex-1 h-px bg-gray-200 ml-1"></div>
          </div>
          
          <div className="space-y-3">
            {schedule.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No hay clases programadas para hoy</p>
            ) : (
              schedule.map((item, idx) => (
                <ScheduleItem key={idx} item={item} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label, trend, trendUp, warning, small }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-14 h-14 bg-teal-50 rounded-bl-full"></div>
      <div className="absolute top-3 right-3 text-lg z-10">{icon}</div>
      <div className={`font-serif font-bold text-teal-700 leading-none ${small ? 'text-lg' : 'text-2xl'}`}>
        {value}
      </div>
      <div className="text-[11px] text-gray-500 mt-1.5 font-medium uppercase tracking-wide">
        {label}
      </div>
      {trend && (
        <div className={`text-[11px] mt-1.5 flex items-center gap-1 ${
          trendUp ? 'text-green-600' : warning ? 'text-amber-600' : 'text-gray-500'
        }`}>
          {trendUp && '↑'} {trend}
        </div>
      )}
    </div>
  )
}

function Calendar() {
  const [currentDate] = useState(new Date())
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="font-serif text-base font-medium text-gray-900">
          {format(currentDate, 'MMMM yyyy', { locale: es })}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {/* Padding días del mes anterior */}
        {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square"></div>
        ))}
        
        {days.map(day => (
          <div
            key={day.toISOString()}
            className={`aspect-square flex items-center justify-center text-xs rounded-lg cursor-pointer transition-all ${
              isToday(day)
                ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white font-bold shadow-md shadow-teal-200'
                : 'text-gray-700 hover:bg-teal-50'
            }`}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  )
}

function ScheduleItem({ item }) {
  const profesorNombre = item.curso?.profesor?.usuario?.nombre_completo || 'Sin asignar'
  
  return (
    <div className="flex gap-2.5 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
      <div className="text-[11px] font-semibold text-gray-500 min-w-[42px] pt-1 text-right leading-tight">
        {item.hora_inicio?.slice(0, 5)}<br/>{item.hora_fin?.slice(0, 5)}
      </div>
      <div className="w-2.5 h-11 bg-teal-400 rounded-full flex-shrink-0 shadow-sm"></div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-gray-900 truncate">
          {item.curso?.nombre}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">
          {item.aula} · {item.count} alumnas
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-[8px] font-bold text-teal-700">
            {profesorNombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <span className="text-[11px] text-gray-600">{profesorNombre}</span>
        </div>
      </div>
    </div>
  )
}

function getDiaSemana() {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']
  return dias[new Date().getDay()]
}
