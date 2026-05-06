import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function CursoFinanzasModal({ open, onClose, cursoId }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && cursoId) {
      loadData()
    }
  }, [open, cursoId])

  const loadData = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('vw_estado_financiero')
        .select('*')
        .eq('curso_id', cursoId)

      if (error) throw error

      setRows(data || [])

    } catch (err) {
      console.error('Error modal:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-3xl">

        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">Detalle financiero</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div className="text-center py-6">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th>Alumna</th>
                <th>Cuotas</th>
                <th>Pagado</th>
                <th>Deuda</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.inscripcion_id}>
                  <td>{r.apellido} {r.nombre}</td>
                  <td>${Number(r.total_cuotas).toLocaleString('es-AR')}</td>
                  <td>${Number(r.total_pagado).toLocaleString('es-AR')}</td>
                  <td>${Number(r.deuda).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}