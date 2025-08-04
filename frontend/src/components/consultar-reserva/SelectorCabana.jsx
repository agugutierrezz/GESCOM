function SelectorCabana({ cabanas, cabanaSeleccionada, onChange }) {
  return (
    <>
      <label>Cabaña</label>
      <select value={cabanaSeleccionada} onChange={e => onChange(e.target.value)} required>
        <option value="">Selecciona una opción...</option>
        {cabanas.map(c => (
          <option key={c.id} value={c.id}>{c.nombre}</option>
        ))}
      </select>
    </>
  );
}
export default SelectorCabana;
