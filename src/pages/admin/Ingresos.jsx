import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function Ingresos() {

  const [data, setData] = useState([])
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(false)

  const [filtros, setFiltros] = useState({
    mes: '',
    anio: new Date().getFullYear(),
    curso_id: ''
  })

  const reportRef = useRef()

  useEffect(() => {
    loadCursos()
    loadIngresos()
  }, [])

  // 🎯 LOAD CURSOS
  const loadCursos = async () => {
    const { data } = await supabase
      .from('cursos')
      .select('id, nombre')
      .neq('estado', 'eliminado')

    setCursos(data || [])
  }

  // 💰 LOAD INGRESOS
  const loadIngresos = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('vw_ingresos_detalle')
        .select('*')
        .order('fecha_pago', { ascending: false })

      if (filtros.mes) {
        query = query.eq('mes', filtros.mes)
      }

      if (filtros.anio) {
        query = query.eq('anio', filtros.anio)
      }

      if (filtros.curso_id) {
        query = query.eq('curso_id', filtros.curso_id)
      }

      const { data, error } = await query

      if (error) throw error

      setData(data || [])

    } catch (err) {
      console.error(err)
      alert('Error cargando ingresos')
    } finally {
      setLoading(false)
    }
  }

  // 📊 MÉTRICAS
  const total = data.reduce((acc, i) => acc + Number(i.monto_final || 0), 0)
  const recargos = data.reduce((acc, i) => acc + Number(i.recargo || 0), 0)
  const base = total - recargos

  // 📄 EXPORT PDF
  const exportPDF = async () => {
    const element = reportRef.current

    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')

    const pdf = new jsPDF('p', 'mm', 'a4')

    const width = 210
    const height = (canvas.height * width) / canvas.width

    pdf.addImage(imgData, 'PNG', 0, 0, width, height)
    pdf.save(`reporte_ingresos_${Date.now()}.pdf`)
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Reporte de ingresos</h2>

        <div className="flex gap-2">
          <button
            onClick={loadIngresos}
            className="border px-3 py-2 rounded"
          >
            Filtrar
          </button>

          <button
            onClick={exportPDF}
            className="bg-teal-600 text-white px-4 py-2 rounded"
          >
            Exportar PDF
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white border rounded-xl p-4 flex gap-4 flex-wrap">

        <select
          onChange={e => setFiltros({ ...filtros, mes: e.target.value })}
          className="border px-3 py-2 rounded"
        >
          <option value="">Mes</option>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>
              {String(i + 1).padStart(2, '0')}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={filtros.anio}
          onChange={e => setFiltros({ ...filtros, anio: e.target.value })}
          className="border px-3 py-2 rounded w-28"
        />

        <select
          onChange={e => setFiltros({ ...filtros, curso_id: e.target.value })}
          className="border px-3 py-2 rounded"
        >
          <option value="">Curso</option>
          {cursos.map(c => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>

      </div>

      {/* 📄 REPORTE (ESTE ES EL QUE SE EXPORTA) */}
      <div ref={reportRef} className="bg-white p-6 border rounded-xl">

        {/* CABECERA CONTABLE */}
        <div className="text-center mb-6">
          <div className="text-lg font-bold">DANSE Studio</div>
          <div className="text-sm">Reporte de ingresos</div>
          <div className="text-xs text-gray-500">
            {filtros.mes || 'Todos'} / {filtros.anio}
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">

          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Base</div>
            <div className="font-bold">
              ${base.toLocaleString('es-AR')}
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Recargos</div>
            <div className="font-bold text-red-600">
              ${recargos.toLocaleString('es-AR')}
            </div>
          </div>

          <div className="border rounded p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-bold text-green-600">
              ${total.toLocaleString('es-AR')}
            </div>
          </div>

        </div>

        {/* TABLA */}
        <table className="w-full text-sm">
          <thead className="border-b text-gray-500">
            <tr>
              <th>Fecha</th>
              <th>Alumno</th>
              <th>Curso</th>
              <th>Comprobante</th>
              <th>Base</th>
              <th>Recargo</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {data.map(i => (
              <tr key={i.id} className="border-b">

                <td>
                  {new Date(i.fecha_pago).toLocaleDateString('es-AR')}
                </td>

                <td>
                  {i.apellido} {i.nombre}
                </td>

                <td>{i.curso_nombre}</td>

                <td>#{i.nro_comprobante}</td>

                <td>
                  ${Number(i.monto_base).toLocaleString('es-AR')}
                </td>

                <td className="text-red-600">
                  ${Number(i.recargo || 0).toLocaleString('es-AR')}
                </td>

                <td className="font-semibold">
                  ${Number(i.monto_final).toLocaleString('es-AR')}
                </td>

              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}