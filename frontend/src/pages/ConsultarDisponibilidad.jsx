import { useEffect, useState, useRef, useContext } from 'react';
import SelectorCabana from '../components/consultar-reserva/SelectorCabana';
import ReservaResumenCard from '../components/reserva/ReservaResumenCard';
import BotonVolver from '../components/BotonVolver';
import CalendarioReserva from '../components/consultar-reserva/CalendarioReserva';
import { CabanasContext } from '../context/CabanasContext';
import html2pdf from 'html2pdf.js';
import '../styles/reserva.css';

function ConsultarDisponibilidad() {
  const [cabana, setCabana] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [diasEstado, setDiasEstado] = useState({});
  const [fechasOcupadas, setFechasOcupadas] = useState([]);
  const calendarioRef = useRef(null);

  const cabanas = useContext(CabanasContext);
  const capitalizar = str => str.charAt(0).toUpperCase() + str.slice(1);

  useEffect(() => {
    if (!cabana || !cabana.id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/reservas?cabana_id=${cabana.id}`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('❌ La respuesta no es un array:', data);
          setReservas([]);
          return;
        }
        setReservas(data);
        const estado = {};

        data.forEach(r => {
          const inicio = new Date(r.fecha_inicio);
          const fin = new Date(r.fecha_fin);

          const rInicio = new Date(inicio);
          rInicio.setHours(14);
          const rFin = new Date(fin);
          rFin.setHours(10);

          const keyInicio = rInicio.toISOString().split('T')[0];
          const keyFin = rFin.toISOString().split('T')[0];

          estado[keyInicio] = estado[keyInicio] === 'libre-egreso' ? 'ocupado'
            : estado[keyInicio] === 'ocupado' ? 'ocupado'
            : 'libre-ingreso';

          estado[keyFin] = estado[keyFin] === 'libre-ingreso' ? 'ocupado'
            : estado[keyFin] === 'ocupado' ? 'ocupado'
            : 'libre-egreso';

          let actual = new Date(rInicio);
          actual.setDate(actual.getDate() + 1);
          while (actual < rFin) {
            const key = actual.toISOString().split('T')[0];
            estado[key] = 'ocupado';
            actual.setDate(actual.getDate() + 1);
          }
        });

        setDiasEstado(estado);

        const ocupadas = Object.entries(estado)
          .filter(([_, estado]) => estado === 'ocupado')
          .map(([fecha]) => new Date(fecha));

        setFechasOcupadas(ocupadas);
      });
  }, [cabana]);

  const descargarPDF = () => {
    if (!calendarioRef.current || !cabana?.nombre) return;
    const fechaActual = new Date();
    const formatoFecha = fechaActual.toLocaleDateString('es-AR').replaceAll('/', '-');
    const nombreArchivo = `Disponibilidad_${cabana.nombre}_${formatoFecha}.pdf`;

    html2pdf().from(calendarioRef.current).set({
      margin: 0.5,
      filename: nombreArchivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  return (
    <>
      <div><BotonVolver /></div>
      <div className="reserva-container">
        <h2>Consultar Disponibilidad</h2>

        <div className="selector-cabana-container">
          <SelectorCabana
            cabanas={cabanas}
            cabanaSeleccionada={cabana?.id || ''}
            onChange={id => {
              const seleccionada = cabanas.find(c => c.id === parseInt(id));
              setCabana(seleccionada || null);
              setDiasEstado({});
              setReservas([]);
            }}
          />
        </div>

        {cabana && (
          <>
            <div className="calendarios-mes" ref={calendarioRef}>
              {[0, 1, 2].map(mesOffset => {
                const fecha = new Date();
                fecha.setMonth(fecha.getMonth() + mesOffset);
                fecha.setDate(1);
                return (
                  <CalendarioReserva
                    key={mesOffset}
                    label={capitalizar(fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }))}
                    value={null}
                    onChange={() => {}}
                    fechasOcupadas={fechasOcupadas}
                    diasEstado={diasEstado}
                    mesFijo={fecha}
                    soloLectura={true}
                  />
                );
              })}
            </div>

            <button onClick={descargarPDF}>Descargar calendario en PDF</button>

            <h3>Reservas existentes</h3>
            {reservas.length === 0 && <p>No hay reservas para esta cabaña.</p>}
            {reservas.map(reserva => (
              <ReservaResumenCard key={reserva.id} reserva={reserva} />
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default ConsultarDisponibilidad;
