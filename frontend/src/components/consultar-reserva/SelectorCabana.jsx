function SelectorCabana({ cabanas, cabanaSeleccionada, onChange }) {
  return (
    <select
      className="select"                        
      value={cabanaSeleccionada}
      onChange={e => onChange(e.target.value)}
      required
    >
      <option value="">Seleccionar cabaña...</option>
      {cabanas.map(c => (
        <option key={c.id} value={c.id}>
          {c.nombre} (Descripción: {c.descripcion} - Capacidad: {c.capacidad})
        </option>
      ))}
    </select>
  );
}
export default SelectorCabana;
