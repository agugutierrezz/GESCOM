const bcrypt = require('bcrypt');
const pool = require('./db');

async function crearUsuario() {
  // const username = '';
  // const password = '';

  const hash = await bcrypt.hash(password, 10);

  try {
    await pool.query(
      'INSERT INTO usuarios (username, password_hash) VALUES ($1, $2)',
      [username, hash]
    );
    console.log('✅ Usuario creado correctamente.');
  } catch (err) {
    console.error('❌ Error al crear usuario:', err);
  }
}

crearUsuario();
