import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import TicketPago from '../../components/TicketPago'

export default function Cobros() {
  const { user } = useAuth()

  const [dni, setDni] = useState('')
  const [alumno, setAlumno] = useState(null)
  const [inscripciones, setInscripciones] = useState([])
  const [selectedInscripcion, setSelectedInscripcion] = useState(null)

  const [deudas, setDeudas] = useState([])
  const [pagos, setPagos] = useState([])
  const [ticket, setTicket] = useState({
        open: false,
        pago: null
    })
  const [modal, setModal] = useState({ open: false, deuda: null })
  const [loading, setLoading] = useState(false)

  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

  // 🔍 BUSCAR
  const buscarAlumno = async () => {
    if (!dni) return
    setLoading(true)

    try {
      const { data: alumnoData, error } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', dni)
        .single()

      if (error) throw error

      setAlumno(alumnoData)

      const { data: insc } = await supabase
        .from('inscripciones')
        .select(`id, curso:cursos(nombre)`)
        .eq('alumno_id', alumnoData.id)
        .eq('estado', 'activa')

      setInscripciones(insc || [])
      setSelectedInscripcion(null)
      setDeudas([])
      setPagos([])

    } catch (err) {
      console.error(err)
      alert('Alumno no encontrado')
    } finally {
      setLoading(false)
    }
  }
  
  // 📊 CARGAR CURSO
  const loadCursoData = async (inscripcionId) => {
  console.log('🚀 LOAD CURSO:', inscripcionId)

  setSelectedInscripcion(inscripcionId)

  const { data: cuotas, error } = await supabase
    .from('vw_estado_cuotas')
    .select('*')
    .eq('inscripcion_id', inscripcionId)
    .order('anio', { ascending: true })
    .order('mes', { ascending: true })

  if (error) {
    console.error('❌ ERROR CUOTAS:', error)
    return
  }

  const normalizadas = (cuotas || []).map(c => ({
    ...c,
    mes: Number(c.mes),
    anio: Number(c.anio)
  }))

  console.log('✅ CUOTAS:', normalizadas)

  setDeudas(normalizadas)
}
  
  // 💳 PAGAR
  const pagar = async (forma) => {
  if (!modal.deuda) return

  if (modal.deuda.estado === 'pagado') {
    alert('Esta cuota ya está pagada')
    return
  }

  try {
    const { error } = await supabase.rpc('aplicar_pago_a_cuota', {
      p_inscripcion_id: selectedInscripcion,
      p_mes: modal.deuda.mes,
      p_anio: modal.deuda.anio,
      p_forma_pago: forma
    })

    if (error) {
      alert(error.message)
      return
    }

    const { data: pagoGenerado } = await supabase
  .from('pagos')
  .select('*')
  .eq('inscripcion_id', selectedInscripcion)
  .eq('mes', modal.deuda.mes)
  .eq('anio', modal.deuda.anio)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

setTicket({
  open: true,
  pago: pagoGenerado
})

    setModal({ open: false, deuda: null })
    loadCursoData(selectedInscripcion)

  } catch (err) {
    console.error(err)
    alert('Error inesperado')
  }
}
  
  // 🎯 RENDER MES
  const renderMes = (idx) => {
  const mesNum = idx + 1

  const cuota = deudas.find(c => c.mes === mesNum)

  let estado = cuota?.estado || 'sin-cuota'

  return (
    <div
      key={idx}
      onClick={() => {
        if (!cuota) return
        if (estado === 'pagado') return

        setModal({ open: true, deuda: cuota })
      }}
      className={`p-3 rounded text-center cursor-pointer border
        ${estado === 'pagado' && 'bg-green-100 text-green-700'}
        ${estado === 'vencido' && 'bg-red-100 text-red-700'}
        ${estado === 'pendiente' && 'bg-yellow-100 text-yellow-700'}
        ${estado === 'sin-cuota' && 'bg-gray-100 text-gray-400'}
      `}
    >
      <div>{meses[idx]}</div>

      <div className="text-xs mt-1">
        {estado === 'pagado' && '✓'}
        {estado === 'pendiente' && '$'}
        {estado === 'vencido' && '⚠'}
      </div>
    </div>
  )
}

  return (
    <div className="space-y-4">

      {/* BUSCADOR */}
      <div className="flex gap-2">
        <input
          value={dni}
          onChange={e => setDni(e.target.value)}
          placeholder="DNI"
          className="border px-3 py-2 rounded"
        />
        <button onClick={buscarAlumno} className="bg-teal-600 text-white px-4 rounded">
          Buscar
        </button>
      </div>

      {/* ALUMNO */}
      {alumno && (
        <div className="p-3 border rounded bg-white">
          {alumno.nombre} {alumno.apellido}
        </div>
      )}

      {/* CURSOS */}
      {inscripciones.length > 0 && (
        <select
          onChange={(e) => loadCursoData(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">Seleccionar curso</option>
          {inscripciones.map(i => (
            <option key={i.id} value={i.id}>
              {i.curso?.nombre}
            </option>
          ))}
        </select>
      )}

      {/* MESES */}
      {selectedInscripcion && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => renderMes(i))}
        </div>
      )}

      {/* MODAL */}
      {modal.open && modal.deuda && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-80">

            <div className="text-sm mb-2">
                    Estado:
                    <span className="ml-1 font-semibold">
                      {modal.deuda.estado}
                    </span>
                  </div>

                  <div className="text-sm mb-2">
                    Monto: ${Number(modal.deuda.monto).toLocaleString('es-AR')}
                  </div>

                  <div className="text-xs text-gray-500">
                    Vence: {modal.deuda.vencimiento}
                  </div>

                  {modal.deuda.estado === 'vencido' && (
                    <div className="text-xs text-red-500">
                      Incluye mora
                    </div>
                  )}

            <div className="space-y-2">
              {['efectivo','transferencia','debito','credito'].map(f => (
                <button
                  key={f}
                  onClick={() => pagar(f)}
                  className="w-full border p-2 rounded hover:bg-gray-100"
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => setModal({ open: false, deuda: null })}
              className="mt-3 text-sm text-gray-500"
            >
              Cancelar
            </button>

          </div>
        </div>
      )}
      {ticket.open && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

    <div className="bg-white p-4 rounded">

      <TicketPago
        pago={ticket.pago}
        alumno={`${alumno.nombre} ${alumno.apellido}`}
        curso={inscripciones.find(i => i.id === selectedInscripcion)?.curso?.nombre}
      />

      <div className="flex gap-2 mt-4">

        <button
          onClick={() => window.print()}
          className="bg-teal-600 text-white px-4 py-2 rounded"
        >
          Imprimir
        </button>

        <button
          onClick={() => setTicket({ open: false, pago: null })}
          className="border px-4 py-2 rounded"
        >
          Cerrar
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  )
}