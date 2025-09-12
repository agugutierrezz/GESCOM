import { useState, useEffect } from 'react';

function InputDinero({ value, onChange, label = '', placeholder, className = '' }) {
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

  const desformatear = (str) =>
    str.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');

  const handleChange = (e) => {
    const crudo = desformatear(e.target.value);
    const numero = parseFloat(crudo);
    onChange(!isNaN(numero) ? numero : '');
    setTexto(e.target.value);
  };

  const ph = placeholder || label || '';

  return (
    <input
      className={`input ${className}`}
      value={texto}
      onChange={handleChange}
      placeholder={ph}                     
      aria-label={ph || 'Monto'}
      inputMode="decimal"
      type="text"
    />
  );
}

export default InputDinero;
