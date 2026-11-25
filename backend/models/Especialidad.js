const mongoose = require('mongoose');

const especialidadSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, default: '', trim: true },
    duracionMin: { type: Number, required: true, min: 10, max: 240, default: 30 },
    activa: { type: Boolean, default: true }
  },
  { timestamps: true }
);

especialidadSchema.set('toJSON', require('./opcionesJson'));

module.exports = mongoose.model('Especialidad', especialidadSchema);