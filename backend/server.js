require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const crud = require('./routes/crud');
const Especialidad = require('./models/Especialidad');
const Centro = require('./models/Centro');
const Box = require('./models/Box');

const app = express();

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/especialidades', crud(Especialidad, ['nombre', 'descripcion', 'duracionMin', 'activa']));
app.use('/api/centros', crud(Centro, ['nombre', 'ubicacion', 'activo']));
app.use('/api/boxes', crud(Box, ['centro', 'nombre', 'tipo', 'caracteristicas', 'estado']));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(process.env.PORT || 4000, () => {
      console.log(`🚀 API corriendo en http://localhost:${process.env.PORT || 4000}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
    process.exit(1);
  });