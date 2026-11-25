const mongoose = require('mongoose');

const centroSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    ubicacion: { type: String, default: '', trim: true },
    activo: { type: Boolean, default: true }
  },
  { timestamps: true }
);

centroSchema.set('toJSON', require('./opcionesJson'));

module.exports = mongoose.model('Centro', centroSchema);