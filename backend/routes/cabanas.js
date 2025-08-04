const express = require('express');
const router = express.Router();
const pool = require('../db');

const USUARIO_ID = 1; // Usuario fijo, por ahora, puntapiedra con id=1

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cabanas WHERE usuario_id = $1 ORDER BY nombre',
      [USUARIO_ID]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener cabañas:', err);
    res.status(500).json({ message: 'Error al obtener cabañas' });
  }
});

module.exports = router;
