const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/adicionales/:reserva_id
router.get('/:reserva_id', async (req, res) => {
  const { reserva_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, monto, fecha_pago, descripcion
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

module.exports = router;

// POST /api/adicionales
router.post('/', async (req, res) => {
  const { reserva_id, monto, fecha_pago, descripcion } = req.body;

  if (!reserva_id || !monto) {
    return res.status(400).json({ message: 'reserva_id y monto son obligatorios' });
  }

  try {
    const fecha = fecha_pago ? new Date(fecha_pago) : new Date();

    await pool.query(
      `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion)
       VALUES ($1, $2, $3, $4)`,
      [reserva_id, parseFloat(monto), fecha, descripcion || null]
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
