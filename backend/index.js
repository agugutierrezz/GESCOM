const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
require('dotenv').config();

const usuariosRouter = require('./routes/usuarios');
const cabanasRouter = require('./routes/cabanas');
const reservasRouter = require('./routes/reservas');
const adicionalesRoutes = require('./routes/adicionales');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Configurar CORS una sola vez y SIN app.options('*', ...)
const whitelist = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);                  // permite curl / same-origin
    if (whitelist.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-CSRF-Token'],
  optionsSuccessStatus: 204,
  // preflightContinue: false // por defecto; cors responde el OPTIONS
};
app.use(cors(corsOptions));

// --- SESSION ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
const sessionDays = Number(process.env.SESSION_DAYS || 30);
const cookieMaxAge = sessionDays * 24 * 60 * 60 * 1000;

app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  name: process.env.SESSION_NAME || 'sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: cookieMaxAge,
    path: '/',
  },
  rolling: true,
}));

// --- RUTAS ---
app.use('/api/usuarios', usuariosRouter);
app.use('/api/cabanas', cabanasRouter);
app.use('/api/reservas', reservasRouter);
app.use('/api/adicionales', adicionalesRoutes);

// --- LISTEN ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en http://localhost:${PORT}`);
});
