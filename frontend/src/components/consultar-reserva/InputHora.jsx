function InputHora({ label, value, onChange }) {
  return (
    <>
      <label>{label}</label>
      <input type="number" min="1" max="24" value={value} onChange={e => onChange(parseInt(e.target.value))} required />
    </>
  );
}
export default InputHora;
