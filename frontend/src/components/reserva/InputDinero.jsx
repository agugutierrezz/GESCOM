import { useState, useEffect } from 'react';
import './InputDinero.css';

function InputDinero({ value, onChange }) {
  const [texto, setTexto] = useState('');

  const formatear = (num) => {
    if (!num || isNaN(num)) return '';
    return Number(num).toLocaleString('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    setTexto(formatear(value));
  }, [value]);

  const desformatear = (str) => {
    return str.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
  };

  const handleChange = (e) => {
    const crudo = desformatear(e.target.value);
    const numero = parseFloat(crudo);

    if (!isNaN(numero)) {
      onChange(numero);
    } else {
      onChange('');
    }

    setTexto(e.target.value);
  };

  return (
    <div className="input-dinero-wrapper">
      <input
        type="text"
        inputMode="decimal"
        value={texto}
        onChange={handleChange}
      />
    </div>
  );
}

export default InputDinero;
