const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth, isAdmin } = require('../auth-helpers');

router.use(requireAuth);

/**
 * GET /api/cabanas
 * - Admin: todas
 * - User: solo las propias
 */
router.get('/', async (req, res) => {
  try {
    if (isAdmin(req)) {
      const { rows } = await pool.query('SELECT * FROM cabanas ORDER BY nombre');
      return res.json(rows);
    }
    const uid = req.session.user.id;
    const { rows } = await pool.query(
      'SELECT * FROM cabanas WHERE usuario_id = $1 ORDER BY nombre',
      [uid]
    );
    return res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener cabañas:', err);
    return res.status(500).json({ message: 'Error al obtener cabañas' });
  }
});

/**
 * POST /api/cabanas
 * - Admin: puede crear para cualquier usuario_id (si lo manda en body)
 * - User: crea solo para sí mismo (se ignora usuario_id del body)
 * Body: { nombre, capacidad, descripcion, usuario_id? }
 */
router.post('/', async (req, res) => {
  try {
    const { nombre, capacidad, descripcion = null } = req.body;
    const ownerId = isAdmin(req) ? (req.body.usuario_id ?? req.session.user.id) : req.session.user.id;

    const { rows } = await pool.query(
      `INSERT INTO cabanas (nombre, capacidad, usuario_id, descripcion)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [nombre, capacidad, ownerId, descripcion]
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error('❌ Error creando cabaña:', err);
    return res.status(500).json({ message: 'Error creando cabaña' });
  }
});

/**
 * PUT /api/cabanas/:id
 * - Admin o dueño pueden editar nombre/capacidad/descripcion
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, capacidad, descripcion = null } = req.body;

    // Chequear propiedad (si no es admin)
    if (!isAdmin(req)) {
      const { rowCount } = await pool.query(
        'SELECT 1 FROM cabanas WHERE id=$1 AND usuario_id=$2',
        [id, req.session.user.id]
      );
      if (!rowCount) return res.status(403).json({ message: 'Cabaña no pertenece al usuario' });
    }

    const { rowCount, rows } = await pool.query(
      `UPDATE cabanas
         SET nombre=$1, capacidad=$2, descripcion=$3
       WHERE id=$4
       RETURNING *`,
      [nombre, capacidad, descripcion, id]
    );

    if (!rowCount) return res.status(404).json({ message: 'Cabaña no encontrada' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error actualizando cabaña:', err);
    return res.status(500).json({ message: 'Error actualizando cabaña' });
  }
});

/**
 * DELETE /api/cabanas/:id
 * - Admin o dueño
 * (Si hay reservas dependientes, la DB puede impedir borrar por FK)
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      const { rowCount } = await pool.query(
        'SELECT 1 FROM cabanas WHERE id=$1 AND usuario_id=$2',
        [id, req.session.user.id]
      );
      if (!rowCount) return res.status(403).json({ message: 'Cabaña no pertenece al usuario' });
    }

    const { rowCount } = await pool.query('DELETE FROM cabanas WHERE id=$1', [id]);
    if (!rowCount) return res.status(404).json({ message: 'Cabaña no encontrada' });
    return res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error eliminando cabaña:', err);
    if (err.code === '23503') {
      return res.status(409).json({
        message: 'No se puede eliminar la cabaña porque tiene reservas asociadas.'
      });
    }
    return res.status(500).json({ message: 'Error eliminando cabaña' });
  }
});

module.exports = router;
