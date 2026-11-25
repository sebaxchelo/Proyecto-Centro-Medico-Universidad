const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    time: { type: String, required: true },
    patientRut: { type: String, required: true },
    patientName: { type: String, required: true },
    profName: { type: String, required: true },
    specialtyName: { type: String, required: true },
    centro: { type: String, required: true },
    box: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['Reservada', 'Completada', 'Cancelada'],
      default: 'Reservada'
    },
    // Cuántas veces se ha reagendado la cita
    reagendamientos: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Un médico no puede tener dos citas "Reservada" a la misma fecha y hora
citaSchema.index(
  { profName: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'Reservada' } }
);

// Un box (de un centro) no puede usarse en dos citas "Reservada" a la misma fecha y hora
citaSchema.index(
  { centro: 1, box: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { status: 'Reservada' } }
);

citaSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

module.exports = mongoose.model('Cita', citaSchema);