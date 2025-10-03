const express = require('express');
const router = express.Router();
const pool = require('../db');

function normalizarMoneda(v) {
  const up = String(v || '').trim().toUpperCase();
  return (up === 'USD' || up === 'ARS') ? up : 'ARS';
}

// GET /api/adicionales/:reserva_id
router.get('/:reserva_id', async (req, res) => {
  const { reserva_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, monto, fecha_pago, descripcion, tipo_moneda
       FROM adicionales
       WHERE reserva_id = $1
       ORDER BY fecha_pago ASC`,
      [reserva_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener adicionales:', err);
    res.status(500).json({ message: 'Error al obtener adicionales' });
  }
});

// POST /api/adicionales
// Body: { reserva_id, monto, fecha_pago?, descripcion?, tipo_moneda? }
router.post('/', async (req, res) => {
  const { reserva_id, monto, fecha_pago, descripcion, tipo_moneda } = req.body;

  if (!reserva_id || !monto) {
    return res.status(400).json({ message: 'reserva_id y monto son obligatorios' });
  }

  try {
    // Si no viene tipo_moneda, hereda el de la reserva
    let mon = normalizarMoneda(tipo_moneda);
    if (!tipo_moneda) {
      const cur = await pool.query('SELECT tipo_moneda FROM reservas WHERE id = $1', [reserva_id]);
      mon = cur.rowCount ? normalizarMoneda(cur.rows[0].tipo_moneda) : 'ARS';
    }

    const fecha = fecha_pago ? new Date(fecha_pago) : new Date();

    await pool.query(
      `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion, tipo_moneda)
       VALUES ($1, $2, $3, $4, $5)`,
      [reserva_id, parseFloat(monto), fecha, descripcion || null, mon]
    );

    res.status(201).json({ message: 'Adicional creado exitosamente' });
  } catch (err) {
    console.error('❌ Error al crear adicional:', err);
    res.status(500).json({ message: 'Error al crear adicional' });
  }
});

// DELETE /api/adicionales/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM adicionales WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Adicional no encontrado' });
    }

    res.status(200).json({ message: 'Adicional eliminado correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar adicional:', err);
    res.status(500).json({ message: 'Error al eliminar adicional' });
  }
});

module.exports = router;
