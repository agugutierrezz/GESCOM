const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, isAdmin } = require('../auth-helpers');

router.use(requireAuth);

// helper: normalizar hora a HH:MM:SS o null
function toTime(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return `${String(v).padStart(2, '0')}:00:00`;
  if (/^\d{1,2}$/.test(v)) return `${String(v).padStart(2, '0')}:00:00`;
  if (/^\d{1,2}:\d{2}$/.test(v)) return `${v}:00`;
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(v)) return v;
  return null;
}

function normalizarMoneda(v) {
  const up = String(v || '').trim().toUpperCase();
  return (up === 'USD' || up === 'ARS') ? up : 'ARS';
}

async function cabanaEsDelUsuario(cabanaId, uid) {
  const { rowCount } = await pool.query(
    'SELECT 1 FROM cabanas WHERE id=$1 AND usuario_id=$2',
    [cabanaId, uid]
  );
  return rowCount > 0;
}

/**
 * POST /api/reservas
 * Body: {
 *   cliente, descripcion, cabana_id, fecha_inicio, fecha_fin,
 *   hora_inicio?, hora_fin?, costo_total, sena, tipo_moneda?, adicionales?[
 *     { monto, fecha_pago?, descripcion?, tipo_moneda? }
 *   ]
 * }
 * - Setea usuario_id desde la sesión
 * - La reserva guarda un tipo_moneda (ARS/USD). costo_total y seña "heredan" ese tipo.
 * - Cada adicional puede venir con su propio tipo_moneda; si no viene, hereda el de la reserva.
 */
router.post('/', async (req, res) => {
  const uid = req.session.user.id;
  const admin = isAdmin(req);

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
    tipo_moneda,      // ← NUEVO
    adicionales
  } = req.body;

  try {
    if (!admin) {
      const ok = await cabanaEsDelUsuario(cabana_id, uid);
      if (!ok) return res.status(403).json({ message: 'Cabaña no pertenece al usuario' });
    }

    const horaInicioStr = toTime(hora_inicio);
    const horaFinStr = toTime(hora_fin);
    const moneda = normalizarMoneda(tipo_moneda);

    // Insert reserva con tipo_moneda
    const result = await pool.query(
      `INSERT INTO reservas
        (cliente, descripcion, cabana_id, usuario_id,
         fecha_inicio, hora_inicio, fecha_fin, hora_fin,
         costo_total, sena, esactiva, tipo_moneda)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,$11)
       RETURNING id`,
      [
        cliente,
        descripcion || null,
        cabana_id,
        uid,
        fecha_inicio,
        horaInicioStr,
        fecha_fin,
        horaFinStr,
        costo_total,
        sena,
        moneda
      ]
    );

    const reservaId = result.rows[0].id;

    // Insert adicionales (cada uno puede tener su propia moneda; default = moneda de reserva)
    if (Array.isArray(adicionales) && adicionales.length > 0) {
      for (const a of adicionales) {
        const monto = parseFloat(a.monto);
        if (Number.isNaN(monto)) continue;
        const fecha = a.fecha_pago ? new Date(a.fecha_pago) : new Date();
        const desc = a.descripcion || null;
        const monAdic = normalizarMoneda(a.tipo_moneda || moneda);

        await pool.query(
          `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion, tipo_moneda)
           VALUES ($1, $2, $3, $4, $5)`,
          [reservaId, monto, fecha, desc, monAdic]
        );
      }
    }

    return res.status(201).json({ message: 'Reserva creada exitosamente', id: reservaId });
  } catch (err) {
    console.error('❌ Error al crear reserva:', err);
    return res.status(500).json({ message: 'Error al crear reserva' });
  }
});

/**
 * GET /api/reservas?cabana_id=...
 * - Admin: ve todas o por cabaña
 * - User: sólo propias
 */
router.get('/', async (req, res) => {
  const uid = req.session.user.id;
  const admin = isAdmin(req);
  const cabanaId = req.query.cabana_id;

  try {
    // Expirar reservas viejas
    await pool.query(`
      UPDATE reservas
      SET esactiva = false
      WHERE esactiva = true AND fecha_fin < CURRENT_DATE
    `);

    if (cabanaId && !admin) {
      const ok = await cabanaEsDelUsuario(cabanaId, uid);
      if (!ok) return res.status(404).json({ message: 'Cabaña no encontrada' });
    }

    let result;
    if (cabanaId) {
      result = await pool.query(
        `SELECT 
          r.id,
          to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
          to_char(r.fecha_fin,     'YYYY-MM-DD') AS fecha_fin,
          r.hora_inicio, r.hora_fin,
          r.costo_total, r.sena,
          r.tipo_moneda,                 -- ← NUEVO
          r.cliente, r.descripcion, r.esactiva,
          json_build_object('id', b.id, 'nombre', b.nombre) AS cabana
        FROM reservas r
        JOIN cabanas b ON r.cabana_id = b.id
        WHERE b.id = $1
          ${admin ? '' : 'AND r.usuario_id = $2'}
        ORDER BY r.fecha_inicio ASC`,
        admin ? [cabanaId] : [cabanaId, uid]
      );
    } else {
      result = await pool.query(
        `SELECT 
          r.id,
          to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
          to_char(r.fecha_fin,     'YYYY-MM-DD') AS fecha_fin,
          r.hora_inicio, r.hora_fin,
          r.costo_total, r.sena,
          r.tipo_moneda,                 -- ← NUEVO
          r.cliente, r.descripcion, r.esactiva,
          b.nombre AS cabana
        FROM reservas r
        JOIN cabanas b ON r.cabana_id = b.id
        ${admin ? '' : 'WHERE r.usuario_id = $1'}
        ORDER BY r.fecha_inicio ASC`,
        admin ? [] : [uid]
      );
    }

    return res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener reservas:', err);
    return res.status(500).json({ message: 'Error al obtener reservas' });
  }
});

/**
 * GET /api/reservas/:id
 * - Admin o dueño
 */
router.get('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.cliente,
        r.descripcion,
        r.cabana_id,
        r.usuario_id,
        to_char(r.fecha_inicio, 'YYYY-MM-DD') AS fecha_inicio,
        to_char(r.fecha_fin,     'YYYY-MM-DD') AS fecha_fin,
        r.hora_inicio,
        r.hora_fin,
        r.costo_total,
        r.sena,
        r.tipo_moneda,                 -- ← NUEVO
        r.esactiva,
        json_build_object('id', b.id, 'nombre', b.nombre) AS cabana
      FROM reservas r
      JOIN cabanas b ON r.cabana_id = b.id
      WHERE r.id = $1
      AND ($2::boolean OR r.usuario_id = $3);
    `, [id, isAdmin(req), req.session.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error al obtener reserva:', err);
    return res.status(500).json({ message: 'Error al obtener reserva' });
  }
});

/**
 * DELETE /api/reservas/:id
 * - Admin o dueño
 */
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query(
      `DELETE FROM adicionales a
       USING reservas r
       WHERE a.reserva_id = r.id
         AND r.id = $1
         AND ($2::boolean OR r.usuario_id = $3)`,
      [id, isAdmin(req), req.session.user.id]
    );
    const result = await pool.query(
      `DELETE FROM reservas r
       WHERE r.id = $1
         AND ($2::boolean OR r.usuario_id = $3)`,
      [id, isAdmin(req), req.session.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    return res.json({ message: 'Reserva eliminada correctamente' });
  } catch (err) {
    console.error('❌ Error al eliminar reserva:', err);
    return res.status(500).json({ message: 'Error al eliminar reserva' });
  }
});

/**
 * PUT /api/reservas/:id
 * - Admin o dueño
 * - No permite cambiar tipo_moneda (se valida en backend además del front)
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
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
    tipo_moneda,   // si viene distinto al actual → 400
    adicionales    // reemplazo total de adicionales
  } = req.body;

  try {
    // Traer moneda actual para bloquear cambios
    const cur = await pool.query(
      'SELECT usuario_id, tipo_moneda FROM reservas WHERE id = $1',
      [id]
    );
    if (cur.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const reservaActual = cur.rows[0];
    const monedaActual = reservaActual.tipo_moneda;
    const monedaNueva = (tipo_moneda ?? monedaActual);
    const normalNueva = normalizarMoneda(monedaNueva);

    // Seguridad adicional: impedir cambio de ARS↔USD
    if (normalNueva !== monedaActual) {
      return res.status(400).json({ message: 'No se puede cambiar la moneda de la reserva' });
    }

    // Validar nueva cabaña (si cambia) para usuarios no admin
    if (!isAdmin(req)) {
      const ok = await cabanaEsDelUsuario(cabana_id, req.session.user.id);
      if (!ok) return res.status(403).json({ message: 'Cabaña no pertenece al usuario' });
    }

    const horaInicioStr = toTime(hora_inicio);
    const horaFinStr = toTime(hora_fin);

    const result = await pool.query(
      `UPDATE reservas
         SET cliente = $1,
             descripcion = $2,
             cabana_id = $3,
             usuario_id = $11,
             fecha_inicio = $4,
             hora_inicio = $5,
             fecha_fin = $6,
             hora_fin = $7,
             costo_total = $8,
             sena = $9
       WHERE id = $10
         AND ($12::boolean OR usuario_id = $11)
       RETURNING id`,
      [
        cliente, descripcion || null, cabana_id,
        fecha_inicio, horaInicioStr, fecha_fin, horaFinStr,
        costo_total, sena,
        id,
        req.session.user.id,
        isAdmin(req)
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // Reemplazar adicionales (manteniendo su propia moneda)
    await pool.query(
      `DELETE FROM adicionales
       WHERE reserva_id = $1
         AND EXISTS (SELECT 1 FROM reservas r WHERE r.id=$1 AND ($2::boolean OR r.usuario_id=$3))`,
      [id, isAdmin(req), req.session.user.id]
    );

    if (Array.isArray(adicionales) && adicionales.length > 0) {
      for (const a of adicionales) {
        const monto = parseFloat(a.monto);
        if (Number.isNaN(monto)) continue;

        const fecha_pago = a.fecha_pago ? new Date(a.fecha_pago) : new Date();
        const desc = a.descripcion || null;
        const monAdic = normalizarMoneda(a.tipo_moneda || monedaActual);

        await pool.query(
          `INSERT INTO adicionales (reserva_id, monto, fecha_pago, descripcion, tipo_moneda)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, monto, fecha_pago, desc, monAdic]
        );
      }
    }

    return res.json({ message: 'Reserva actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error al actualizar reserva:', err);
    return res.status(500).json({ message: 'Error al actualizar reserva' });
  }
});

module.exports = router;
