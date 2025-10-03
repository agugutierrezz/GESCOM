export function etiquetaMoneda(tipo) {
  return String(tipo).toUpperCase() === 'USD' ? 'U$D' : 'AR$';
}

export function formatearMonto(n, tipo) {
  const pref = etiquetaMoneda(tipo);
  const num = Number(n ?? 0);
  return `${pref} ${num.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
}
