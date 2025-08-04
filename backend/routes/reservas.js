const express = require('express');
const router = express.Router();
const pool = require('../db');

const USUARIO_ID = 1; // Usuario fijo por ahora

// POST /api/reservas
router.post('/', async (req, res) => {
  const {
    cliente,
    cabana_id,
    fecha_inicio,
    fecha_fin,
    hora_inicio, // número como 10
    hora_fin,    // número como 14
    costo_total,
    sena
  } = req.body;

  try {
    // Convertimos a formato hora con minutos en 00
    const horaInicioStr = `${hora_inicio.toString().padStart(2, '0')}:00:00`;
    const horaFinStr = `${hora_fin.toString().padStart(2, '0')}:00:00`;

    await pool.query(
      `INSERT INTO reservas 
        (cliente, cabana_id, fecha_inicio, hora_inicio, fecha_fin, hora_fin, costo_total, sena)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [cliente, cabana_id, fecha_inicio, horaInicioStr, fecha_fin, horaFinStr, costo_total, sena]
    );

    res.status(201).json({ message: 'Reserva creada exitosamente' });

  } catch (err) {
    console.error('❌ Error al crear reserva:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
});

// GET /api/reservas?cabana_id=...
router.get('/', async (req, res) => {
  const cabanaId = req.query.cabana_id;

  try {
    let result;
    if (cabanaId) {
      result = await pool.query(
        `SELECT 
          r.id, r.fecha_inicio, r.fecha_fin, r.hora_inicio, r.hora_fin,
          r.costo_total, r.sena,
          r.cliente,
          json_build_object('id', b.id, 'nombre', b.nombre) AS cabana
        FROM reservas r
        JOIN cabanas b ON r.cabana_id = b.id
        WHERE b.id = $1
        ORDER BY r.fecha_inicio ASC`,
        [cabanaId]
      );
    } else {
      result = await pool.query(
        `SELECT 
           r.id, r.fecha_inicio, r.fecha_fin, r.hora_inicio, r.hora_fin,
           r.costo_total, r.sena,
           r.cliente,
           b.nombre AS cabana
         FROM reservas r
         JOIN cabanas b ON r.cabana_id = b.id
         WHERE b.usuario_id = $1
         ORDER BY r.fecha_inicio ASC`,
        [USUARIO_ID]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener reservas:', err);
    res.status(500).json({ message: 'Error al obtener reservas' });
  }
});

// DELETE /api/reservas/:id
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query('DELETE FROM reservas WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.status(200).json({ message: 'Reserva eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar reserva:', err);
    res.status(500).json({ message: 'Error al eliminar reserva' });
  }
});

// PUT /api/reservas/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    cliente,
    cabana_id,
    fecha_inicio,
    fecha_fin,
    hora_inicio,
    hora_fin,
    costo_total,
    sena
  } = req.body;

  try {
    const horaInicioStr = `${hora_inicio.toString().padStart(2, '0')}:00:00`;
    const horaFinStr = `${hora_fin.toString().padStart(2, '0')}:00:00`;

    const result = await pool.query(
      `UPDATE reservas
       SET cliente = $1,
           cabana_id = $2,
           fecha_inicio = $3,
           hora_inicio = $4,
           fecha_fin = $5,
           hora_fin = $6,
           costo_total = $7,
           sena = $8
       WHERE id = $9`,
      [cliente, cabana_id, fecha_inicio, horaInicioStr, fecha_fin, horaFinStr, costo_total, sena, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json({ message: 'Reserva actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar reserva:', err);
    res.status(500).json({ message: 'Error al actualizar reserva' });
  }
});



module.exports = router;