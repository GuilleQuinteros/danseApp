export default function DanseLogo({ className = "w-[38px] h-[44px]" }) {
  return (
    <svg className={className} viewBox="0 0 38 44" fill="none">
      {/* Cabeza */}
      <circle cx="22" cy="5" r="4" fill="#3dcfc0"/>
      
      {/* Brazo izquierdo arriba */}
      <path 
        d="M20 8 Q8 4 4 10" 
        stroke="#2aada0" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Torso */}
      <path 
        d="M20 9 Q18 16 16 22" 
        stroke="#1a7a72" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Brazo derecho abajo */}
      <path 
        d="M20 12 Q30 18 36 22" 
        stroke="#3dcfc0" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Pierna izquierda */}
      <path 
        d="M16 22 Q10 30 6 38" 
        stroke="#1a7a72" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Pierna derecha / falda */}
      <path 
        d="M16 22 Q22 30 20 42" 
        stroke="#2aada0" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        fill="none"
      />
      
      {/* Acento decorativo */}
      <path 
        d="M4 10 Q2 14 4 18" 
        stroke="#3dcfc0" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        fill="none" 
        opacity="0.6"
      />
    </svg>
  )
}
