const express = require('express');
const router = express.Router();
const pool = require('../db');

const USUARIO_ID = 1; // Usuario fijo por ahora

// POST /api/reservas
router.post('/', async (req, res) => {
  const {
    cliente,
    descripcion,
    cabana_id,
    fecha_inicio,
    fecha_fin,
    hora_inicio,
    hora_fin,
    costo_total,
    sena,
    adicionales
  } = req.body;

  try {
    const horaInicioStr = `${hora_inicio.toString().padStart(2, '0')}:00:00`;
    const horaFinStr = `${hora_fin.toString().padStart(2, '0')}:00:00`;

    const result = await pool.query(
      `INSERT INTO reservas 
        (cliente, descripcion, cabana_id, fecha_inicio, hora_inicio, fecha_fin, hora_fin, costo_total, sena, esactiva)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
       RETURNING id`,
      [cliente, descripcion || null, cabana_id, fecha_inicio, horaInicioStr, fecha_fin, horaFinStr, costo_total, sena]
    );

    const reservaId = result.rows[0].id;

    if (Array.isArray(adicionales) && adicionales.length > 0) {
      for (const a of adicionales) {
        await pool.query(
          `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion)
           VALUES ($1, $2, $3, $4)`,
          [reservaId, a.monto, a.fecha_pago, a.descripcion || null]
        );
      }
    }

    res.status(201).json({ message: 'Reserva creada exitosamente' });

  } catch (err) {
    console.error('❌ Error al crear reserva:', err);
    res.status(500).json({ message: 'Error al crear reserva' });
  }
});

// GET /api/reservas
router.get('/', async (req, res) => {
  const cabanaId = req.query.cabana_id;

  try {
    await pool.query(`
      UPDATE reservas
      SET esactiva = false
      WHERE esactiva = true AND fecha_fin < CURRENT_DATE
    `);

    let result;
    if (cabanaId) {
      result = await pool.query(
        `SELECT 
          r.id, r.fecha_inicio, r.fecha_fin, r.hora_inicio, r.hora_fin,
          r.costo_total, r.sena,
          r.cliente, r.descripcion, r.esactiva,
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
          r.cliente, r.descripcion, r.esactiva,
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

// GET /api/reservas/:id
router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(`
      SELECT 
        r.*, 
        json_build_object('id', b.id, 'nombre', b.nombre) AS cabana
      FROM reservas r
      JOIN cabanas b ON r.cabana_id = b.id
      WHERE r.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error al obtener reserva:', err);
    res.status(500).json({ message: 'Error al obtener reserva' });
  }
});


// DELETE /api/reservas/:id
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query('DELETE FROM adicionales WHERE reserva_id = $1', [id]);
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
  console.log('📥 PUT /api/reservas/:id - Body recibido:', req.body); // 🟢 Agregado
  const {
    cliente,
    descripcion,
    cabana_id,
    fecha_inicio,
    fecha_fin,
    hora_inicio,
    hora_fin,
    costo_total,
    sena,
    adicionales
  } = req.body;

  try {
    const horaInicioStr = `${hora_inicio.toString().padStart(2, '0')}:00:00`;
    const horaFinStr = `${hora_fin.toString().padStart(2, '0')}:00:00`;

    const result = await pool.query(
      `UPDATE reservas
       SET cliente = $1,
           descripcion = $2,
           cabana_id = $3,
           fecha_inicio = $4,
           hora_inicio = $5,
           fecha_fin = $6,
           hora_fin = $7,
           costo_total = $8,
           sena = $9
       WHERE id = $10`,
      [cliente, descripcion || null, cabana_id, fecha_inicio, horaInicioStr, fecha_fin, horaFinStr, costo_total, sena, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    console.log('🔧 Recibidos adicionales para actualizar:', adicionales);

    await pool.query('DELETE FROM adicionales WHERE reserva_id = $1', [id]);

    if (Array.isArray(adicionales) && adicionales.length > 0) {
      for (const a of adicionales) {
        console.log('🟡 Procesando adicional:', a);

        const monto = parseFloat(a.monto);
        const fecha_pago = a.fecha_pago ? new Date(a.fecha_pago) : new Date();
        const descripcion = a.descripcion || null;

        if (isNaN(monto)) {
          console.warn('⚠️ Adicional ignorado: monto inválido', a);
          continue;
        }

        await pool.query(
          `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion)
          VALUES ($1, $2, $3, $4)`,
          [id, monto, fecha_pago, descripcion]
        );
      }
    }

    res.json({ message: 'Reserva actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar reserva:', err);
    res.status(500).json({ message: 'Error al actualizar reserva' });
  }
});

module.exports = router;
