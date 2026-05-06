import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function NuevaInscripcion() {

  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    fecha_nacimiento: '',
    telefono_tutor: '',
    nombre_tutor: '',
    email_tutor: ''
  })

  const [cursoId, setCursoId] = useState('')
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCursos()
  }, [])

  const loadCursos = async () => {
    const { data, error } = await supabase
      .from('cursos')
      .select('id, nombre, nivel, precio_mensual, estado')
      .in('estado', ['activo', 'por_iniciar'])

    if (error) {
      console.error(error)
      alert('Error cargando cursos')
      return
    }

    setCursos(data || [])
  }

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  // 💾 GUARDAR TODO
  const handleSubmit = async () => {

    if (
      !form.nombre ||
      !form.apellido ||
      !form.dni ||
      !form.fecha_nacimiento ||
      !form.telefono_tutor ||
      !form.nombre_tutor ||
      !cursoId
    ) {
      alert('Faltan datos obligatorios')
      return
    }

    setLoading(true)

    try {

      // 🔍 1. BUSCAR O CREAR ALUMNO
      const { data: alumnoExistente, error: errCheck } = await supabase
        .from('alumnos')
        .select('*')
        .eq('dni', form.dni)
        .maybeSingle()

      if (errCheck) throw errCheck

      let alumnoId

      if (alumnoExistente) {
        alumnoId = alumnoExistente.id
      } else {
        const { data: alumno, error: errAlumno } = await supabase
          .from('alumnos')
          .insert({
            ...form,
            activo: true
          })
          .select()
          .single()

        if (errAlumno) throw errAlumno

        alumnoId = alumno.id
      }

      // 🚫 VALIDAR CURSO
      const cursoSeleccionado = cursos.find(c => c.id === cursoId)

      if (!cursoSeleccionado) {
        throw new Error('Curso inválido')
      }

      if (!['activo', 'por_iniciar'].includes(cursoSeleccionado.estado)) {
        throw new Error('El curso no está disponible para inscripción')
      }

      // 🚫 EVITAR DUPLICADO
      const { data: inscExistente } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('alumno_id', alumnoId)
        .eq('curso_id', cursoId)
        .eq('estado', 'activa')
        .maybeSingle()

      if (inscExistente) {
        throw new Error('La alumna ya está inscripta en este curso')
      }

      // 🧾 2. CREAR INSCRIPCIÓN
      const { data: insc, error: errInsc } = await supabase
        .from('inscripciones')
        .insert({
          alumno_id: alumnoId,
          curso_id: cursoId,
          estado: 'activa'
        })
        .select()
        .single()

      if (errInsc) throw errInsc

      // 💰 3. GENERAR CUOTAS
      const { error: errRPC } = await supabase.rpc('generar_cuotas', {
        p_inscripcion_id: insc.id
      })

      if (errRPC) {
        console.error('Error generando cuotas:', errRPC)

        // ⚠️ rollback manual simple (opcional)
        await supabase
          .from('inscripciones')
          .delete()
          .eq('id', insc.id)

        throw new Error('Error generando cuotas')
      }

      alert('Inscripción creada correctamente ✅')

      // 👉 REDIRECCIÓN
      navigate('/admin/cursos')

    } catch (err) {
      console.error(err)
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-md">

      <h2 className="text-xl font-bold">Nueva Alumna / Inscripción</h2>

      {/* 👤 DATOS */}
      <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className="border p-2 w-full" />
      <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className="border p-2 w-full" />
      <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className="border p-2 w-full" />

      <input
        type="date"
        name="fecha_nacimiento"
        value={form.fecha_nacimiento}
        onChange={handleChange}
        className="border p-2 w-full"
      />

      {/* 👨‍👩‍👧 TUTOR */}
      <input name="nombre_tutor" placeholder="Nombre del tutor" value={form.nombre_tutor} onChange={handleChange} className="border p-2 w-full" />
      <input name="telefono_tutor" placeholder="Teléfono del tutor" value={form.telefono_tutor} onChange={handleChange} className="border p-2 w-full" />
      <input name="email_tutor" placeholder="Email (opcional)" value={form.email_tutor} onChange={handleChange} className="border p-2 w-full" />

      {/* 🎓 CURSO */}
      <select
        value={cursoId}
        onChange={(e) => setCursoId(e.target.value)}
        className="border p-2 w-full"
      >
        <option value="">Seleccionar curso</option>
        {cursos.map(c => (
          <option key={c.id} value={c.id}>
            {c.nombre} - {c.nivel} (${c.precio_mensual}) [{c.estado}]
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-teal-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? 'Guardando...' : 'Inscribir'}
      </button>

    </div>
  )
}