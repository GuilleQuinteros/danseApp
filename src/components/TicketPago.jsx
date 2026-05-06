export default function TicketPago({ pago, alumno, curso, config }) {

  const width = config?.width === 58 ? 220 : 300

  const fecha = pago?.fecha_pago
    ? new Date(pago.fecha_pago).toLocaleDateString('es-AR')
    : '-'

  return (
    <>
      {/* 🖨️ ESTILOS DE IMPRESIÓN */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }

            .ticket-print, .ticket-print * {
              visibility: visible;
            }

            .ticket-print {
              position: absolute;
              left: 0;
              top: 0;
              width: ${width}px;
              font-family: monospace;
              font-size: 12px;
            }
          }
        `}
      </style>

      <div className="ticket-print bg-white p-2 text-xs" style={{ width }}>

        {/* HEADER */}
        <div className="text-center mb-2">
          <div className="font-bold text-base">DANSE Studio</div>
          <div>Comprobante de pago</div>
        </div>

        <div className="border-t border-dashed my-2"></div>

        {/* INFO */}
        <div>
          <div><b>Alumno:</b> {alumno}</div>
          <div><b>Curso:</b> {curso}</div>
          <div><b>Fecha:</b> {fecha}</div>
          <div><b>Comprobante:</b> #{pago?.nro_comprobante || '-'}</div>
        </div>

        <div className="border-t border-dashed my-2"></div>

        {/* DETALLE */}
        <div>
          <div className="flex justify-between">
            <span>Periodo</span>
            <span>{String(pago.mes).padStart(2,'0')}/{pago.anio}</span>
          </div>

          <div className="flex justify-between">
            <span>Cuota</span>
            <span>${Number(pago.monto_base || 0).toLocaleString('es-AR')}</span>
          </div>

          {Number(pago.recargo_aplicado) > 0 && (
            <div className="flex justify-between">
              <span>Mora</span>
              <span>${Number(pago.recargo_aplicado).toLocaleString('es-AR')}</span>
            </div>
          )}

          <div className="flex justify-between font-bold mt-1">
            <span>Total</span>
            <span>${Number(pago.monto_final || 0).toLocaleString('es-AR')}</span>
          </div>
        </div>

        <div className="border-t border-dashed my-2"></div>

        {/* PAGO */}
        <div>
          <div><b>Forma:</b> {pago.forma_pago}</div>
        </div>

        <div className="border-t border-dashed my-2"></div>

        {/* FOOTER */}
        <div className="text-center mt-2">
          Gracias por su pago
        </div>

      </div>
    </>
  )
}
