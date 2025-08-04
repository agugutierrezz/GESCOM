const express = require('express');
const cors = require('cors');
require('dotenv').config();

const usuariosRouter = require('./routes/usuarios');
const cabanasRouter = require('./routes/cabanas');
const reservasRouter = require('./routes/reservas');
const adicionalesRoutes = require('./routes/adicionales');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/usuarios', usuariosRouter);
app.use('/api/cabanas', cabanasRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api/adicionales', adicionalesRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

const pool = require('./db');

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error de conexión a la base:', err);
  } else {
    console.log('Conectado a la base:', res.rows);
  }
});
