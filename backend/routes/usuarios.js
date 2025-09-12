const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { promisify } = require('util');
const { requireAuth, isAdmin } = require('../auth-helpers');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, username, password_hash FROM usuarios WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      await new Promise(r => setTimeout(r, 150));
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    // === Serializar con await para evitar doble respuesta ===
    const regenerate = promisify(req.session.regenerate).bind(req.session);
    const save = promisify(req.session.save).bind(req.session);
    await regenerate(); // si falla, salta al catch
    req.session.user = { id: user.id, username: user.username };
    await save();
    return res.status(200).json({ message: 'Login exitoso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

router.get('/me', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  const { id, username } = req.session.user;
  return res.json({ id, username });
});

router.post('/logout', (req, res) => {
  const cookieName = process.env.SESSION_NAME || 'sid';
  if (!req.session) {
     // Limpio cookie igual (por si quedó) y respondo
     res.clearCookie(cookieName, {
       path: '/',
       httpOnly: true,
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
       secure: process.env.NODE_ENV === 'production'
     });
     return res.json({ message: 'Logout' });
   }
   req.session.destroy(err => {
     if (err) {
       console.error('Error destroying session', err);
       return res.status(500).json({ message: 'Error en el servidor' });
     }
     res.clearCookie(cookieName, {
       path: '/',
       httpOnly: true,
       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
       secure: process.env.NODE_ENV === 'production'
     });
     return res.json({ message: 'Logout' });
   });
});

router.use(requireAuth);
router.use((req,res,next)=>{
  if (!isAdmin(req)) return res.status(403).json({ message: 'Solo administradores' });
  next();
});

// GET /api/usuarios  (lista todos, sin password_hash)
router.get('/', async (req,res)=>{
  try {
    const { rows } = await pool.query('SELECT id, username FROM usuarios ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error obteniendo usuarios' });
  }
});

// POST /api/usuarios  (crear)
router.post('/', async (req,res)=>{
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Datos incompletos' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (username, password_hash) VALUES ($1,$2) RETURNING id, username',
      [username, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Usuario ya existe' });
    console.error(e);
    res.status(500).json({ message: 'Error creando usuario' });
  }
});

// PUT /api/usuarios/:id  (renombrar)
router.put('/:id', async (req,res)=>{
  try {
    const { id } = req.params;
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: 'Falta username' });

    const { rows, rowCount } = await pool.query(
      'UPDATE usuarios SET username=$1 WHERE id=$2 RETURNING id, username',
      [username, id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Usuario ya existe' });
    console.error(e);
    res.status(500).json({ message: 'Error actualizando usuario' });
  }
});

// PATCH /api/usuarios/:id/password  (resetear password)
router.patch('/:id/password', async (req,res)=>{
  try {
    const { id } = req.params;
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Falta password' });
    const hash = await bcrypt.hash(password, 10);
    const { rowCount } = await pool.query(
      'UPDATE usuarios SET password_hash=$1 WHERE id=$2',
      [hash, id]
    );
    if (!rowCount) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ ok:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error reseteando password' });
  }
});

// DELETE /api/usuarios/:id  (eliminar) — prevení borrarte a vos o al admin “dueño”
router.delete('/:id', async (req,res)=>{
  try {
    const { id } = req.params;
    const myId = req.session.user?.id;
    if (Number(id) === Number(myId)) {
      return res.status(400).json({ message: 'No podés eliminar tu propia cuenta' });
    }
    const { rows } = await pool.query('SELECT username FROM usuarios WHERE id=$1',[id]);
    if (!rows.length) return res.status(404).json({ message: 'Usuario no encontrado' });
    if (String(rows[0].username).toLowerCase() === 'admin') {
      return res.status(400).json({ message: 'No podés eliminar el usuario admin' });
    }

    const r = await pool.query('DELETE FROM usuarios WHERE id=$1',[id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Error eliminando usuario' });
  }
});

module.exports = router;