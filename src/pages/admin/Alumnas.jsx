import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import TicketPago from '../../components/TicketPago'

export default function Alumnas() {

  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)

  const [modalPagos, setModalPagos] = useState({
    open: false,
    inscripcionId: null,
    alumno: null
  })

  const [pagosHistorial, setPagosHistorial] = useState([])
  const [loadingPagos, setLoadingPagos] = useState(false)

  const [ticket, setTicket] = useState({
    open: false,
    pago: null
  })

  // 🔍 BUSCAR
  const buscar = async () => {
    if (!query) return

    setLoading(true)

    try {
      const { data } = await supabase
        .from('alumnos')
        .select(`
          id, nombre, apellido, dni,
          telefono_tutor, nombre_tutor,
          inscripciones (
            id, estado,
            cursos ( nombre )
          )
        `)
        .or(`dni.eq.${query},nombre.ilike.%${query}%,apellido.ilike.%${query}%`)

      const { data: deudas } = await supabase
        .from('vw_deudas_detalle')
        .select('inscripcion_id, total_deuda')

      const deudaMap = {}
      deudas?.forEach(d => {
        deudaMap[d.inscripcion_id] = Number(d.total_deuda || 0)
      })

      const processed = (data || []).map(a => ({
        ...a,
        inscripciones: (a.inscripciones || []).map(i => ({
          ...i,
          curso_nombre: i.cursos?.nombre || 'Sin curso',
          deuda: deudaMap[i.id] || 0
        }))
      }))

      setResultados(processed)
      setSelected(null)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // 📊 HISTORIAL
  const loadPagos = async (inscripcionId, alumno) => {
    setLoadingPagos(true)

    const { data } = await supabase
      .from('pagos')
      .select('*')
      .eq('inscripcion_id', inscripcionId)
      .order('anio', { ascending: false })
      .order('mes', { ascending: false })

    setPagosHistorial(data || [])
    setModalPagos({ open: true, inscripcionId, alumno })
    setLoadingPagos(false)
  }

  const reimprimir = (pago) => {
    setTicket({ open: true, pago })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* BUSCADOR */}
      <div className="space-y-4">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="DNI, nombre o apellido"
          className="border px-3 py-2 rounded w-full"
        />

        <button
          onClick={buscar}
          className="bg-teal-600 text-white w-full py-2 rounded"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>

        {resultados.map(a => (
          <div
            key={a.id}
            onClick={() => setSelected(a)}
            className="p-3 border rounded cursor-pointer hover:bg-gray-50"
          >
            {a.apellido} {a.nombre}
          </div>
        ))}
      </div>

      {/* DETALLE */}
      <div className="md:col-span-2">

        {selected && (
          <div className="bg-white border rounded-xl p-6 space-y-4">

            <div>
              <div className="text-xl font-semibold">
                {selected.apellido} {selected.nombre}
              </div>
              <div className="text-sm">DNI: {selected.dni}</div>
            </div>

            {selected.inscripciones.map(i => (
              <div key={i.id} className="border p-3 rounded flex justify-between">

                <div>
                  <div>{i.curso_nombre}</div>
                  <div className="text-xs text-gray-500">{i.estado}</div>
                </div>

                <div className="flex gap-2 items-center">
                  <span className={`text-xs px-2 py-1 rounded ${
                    i.deuda > 0 ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {i.deuda > 0 ? `$${i.deuda}` : 'Al día'}
                  </span>

                  <button
                    onClick={() => loadPagos(i.id, selected)}
                    className="text-xs text-teal-600"
                  >
                    Ver pagos
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

      </div>

      {/* MODAL HISTORIAL */}
      {modalPagos.open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">

          <div className="bg-white p-6 rounded w-full max-w-2xl">

            <div className="flex justify-between mb-4">
              <h3>Historial</h3>
              <button onClick={() => setModalPagos({ open: false })}>✕</button>
            </div>

            {pagosHistorial.map(p => (
              <div key={p.id} className="flex justify-between border-b py-2">

                <div>{p.mes}/{p.anio}</div>
                <div>${p.monto_final}</div>

                <button onClick={() => reimprimir(p)} className="text-xs text-teal-600">
                  Reimprimir
                </button>

              </div>
            ))}

          </div>
        </div>
      )}

      {/* MODAL TICKET */}
      {ticket.open && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center">

          <div className="bg-white p-4 rounded">

            <TicketPago
              pago={ticket.pago}
              alumno={`${selected?.apellido} ${selected?.nombre}`}
              curso={'---'}
              config={{ width: 80 }}
            />

            <div className="flex gap-2 mt-4">
              <button onClick={() => window.print()} className="bg-teal-600 text-white px-4 py-2 rounded">
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