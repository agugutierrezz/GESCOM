function SelectorCabana({ cabanas, cabanaSeleccionada, onChange }) {
  return (
    <>
      <select value={cabanaSeleccionada} onChange={e => onChange(e.target.value)} required>
        <option value="">Seleccionar cabaña...</option>
        {cabanas.map(c => (
          <option key={c.id} value={c.id}>{c.nombre} (Capacidad: {c.capacidad} - Color: {c.color})</option>
        ))}
      </select>
    </>
  );
}
export default SelectorCabana;
