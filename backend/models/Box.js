const mongoose = require('mongoose');

const boxSchema = new mongoose.Schema(
  {
    centro: { type: mongoose.Schema.Types.ObjectId, ref: 'Centro', required: true },
    nombre: { type: String, required: true, trim: true },
    tipo: { type: String, default: 'Consulta general', trim: true },
    caracteristicas: { type: String, default: '', trim: true },
    estado: {
      type: String,
      enum: ['Disponible', 'Mantención', 'Inactivo'],
      default: 'Disponible'
    }
  },
  { timestamps: true }
);

// Dentro de un mismo centro no pueden repetirse los nombres de box
boxSchema.index({ centro: 1, nombre: 1 }, { unique: true });

boxSchema.set('toJSON', require('./opcionesJson'));

module.exports = mongoose.model('Box', boxSchema);