import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function NuevoCurso() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [profesores, setProfesores] = useState([])

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    nivel: '',
    profesor_id: '',
    precio_mensual: '',
    estado: 'por_iniciar',
    cupo_maximo: ''
  })

  // 🔥 cargar profesores
  useEffect(() => {
    loadProfesores()
  }, [])

  const loadProfesores = async () => {
    const { data, error } = await supabase
      .from('profesores')
      .select(`
        id,
        usuario:usuarios(nombre_completo)
      `)
      .order('created_at')

    if (error) {
      console.error(error)
      alert('Error cargando profesores')
      return
    }

    setProfesores(data || [])
  }

  // 🔧 manejar cambios
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 💾 guardar curso
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nombre || !form.profesor_id || !form.precio_mensual) {
      alert('Completá los campos obligatorios')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('cursos')
        .insert([
          {
            nombre: form.nombre,
            fecha_inicio: form.fecha_inicio,
            descripcion: form.descripcion,
            nivel: form.nivel,
            profesor_id: form.profesor_id,
            precio_mensual: Number(form.precio_mensual),
            estado: form.estado,
            cupo_maximo: form.cupo_maximo
              ? Number(form.cupo_maximo)
              : null
          }
        ])

      if (error) throw error

      alert('Curso creado correctamente ✅')

      // 🚀 volver al listado
      navigate('/admin/cursos')

    } catch (err) {
      console.error(err)
      alert('Error al crear curso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">

      <h2 className="text-xl font-semibold">Nuevo Curso</h2>

      <form onSubmit={handleSubmit} className="space-y-3">

        <input
          name="nombre"
          placeholder="Nombre del curso"
          value={form.nombre}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        
          <input
          type="date"
          name="fecha_inicio"
          value={form.fecha_inicio}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="nivel"
          placeholder="Nivel"
          value={form.nivel}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* 👨‍🏫 PROFESOR */}
        <select
          name="profesor_id"
          value={form.profesor_id}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="">Seleccionar profesor</option>
          {profesores.map(p => (
            <option key={p.id} value={p.id}>
              {p.usuario?.nombre_completo}
            </option>
          ))}
        </select>

        <input
          name="precio_mensual"
          type="number"
          placeholder="Precio mensual"
          value={form.precio_mensual}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          name="cupo_maximo"
          type="number"
          placeholder="Cupo máximo (opcional)"
          value={form.cupo_maximo}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* 📊 ESTADO */}
        <select
          name="estado"
          value={form.estado}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="por_iniciar">Por iniciar</option>
          <option value="activo">Activo</option>
          <option value="finalizado">Finalizado</option>
          <option value="cancelado">Cancelado</option>
        </select>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 text-white py-2 rounded"
        >
          {loading ? 'Guardando...' : 'Crear curso'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/admin/cursos')}
          className="w-full border py-2 rounded"
        >
          Cancelar
        </button>

      </form>
    </div>
  )
}