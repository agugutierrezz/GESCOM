import Flatpickr from 'react-flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import 'flatpickr/dist/themes/material_blue.css';

function CalendarioReserva({
  label,
  value,
  onChange,
  fechasOcupadas,
  diasEstado,
  soloLectura = false,
  mesFijo = null
}) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const options = {
    disable: [
      function (date) {
        const key = date.toISOString().split('T')[0];
        const estado = diasEstado?.[key];
        return date < hoy || estado === 'ocupado';
      }
    ],
    dateFormat: 'd/m/Y',
    locale: Spanish,
    onDayCreate: (_, __, ___, dayElem) => {
      const date = dayElem.dateObj;
      const key = date.toISOString().split('T')[0];
      const estado = diasEstado?.[key];

      if (soloLectura && mesFijo instanceof Date) {
        const esOtroMes = date.getMonth() !== mesFijo.getMonth() || date.getFullYear() !== mesFijo.getFullYear();
        if (esOtroMes) {
          dayElem.remove();
          return;
        }
      }

      if (date < hoy) {
        dayElem.classList.add('pasado', 'flatpickr-disabled');
      } else if (estado === 'ocupado') {
        dayElem.classList.add('ocupado', 'flatpickr-disabled');
      } else if (estado === 'libre-ingreso' || estado === 'libre-egreso') {
        dayElem.classList.add('parcial');
      } else {
        dayElem.classList.add('disponible');
      }
    },
    disableMobile: true,
    static: true,
    monthSelectorType: 'static',
    minDate: 'today',
    maxDate: new Date().fp_incr(365),
  };

  if (soloLectura && mesFijo instanceof Date) {
    const año = mesFijo.getFullYear();
    const mes = mesFijo.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);

    options.inline = true;
    options.showMonths = 1;
    options.defaultDate = primerDia;
    options.clickOpens = false;

    options.enable = [
      function (date) {
        return (
          date.getFullYear() === año &&
          date.getMonth() === mes
        );
      }
    ];

    options.minDate = primerDia;
    options.maxDate = ultimoDia;
  }

  return (
    <div className={`calendario-reserva-wrapper ${soloLectura ? 'solo-lectura' : ''}`}>
      {label && (
        <div className="calendario-label">
          <h3>{label}</h3>
        </div>
      )}
      <div className={soloLectura ? 'flatpickr-wrapper-visual' : ''}>
        <Flatpickr
          value={value}
          onChange={soloLectura ? () => {} : date => {
            const fija = new Date(date[0]);
            fija.setHours(12, 0, 0, 0); 
            onChange(fija);
          }}
          options={options}
        />
      </div>
    </div>
  );
}

export default CalendarioReserva;
