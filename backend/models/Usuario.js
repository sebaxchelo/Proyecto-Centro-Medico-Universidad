const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema(
  {
    rut: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    role: {
      type: String,
      required: true,
      enum: ['Paciente', 'Médico', 'Recepcionista', 'Administrador']
    },
    // Hash de la clave (nunca la clave real). No se devuelve en las consultas.
    password: { type: String, required: true, select: false },

    // Solo médicos
    specialtyId: { type: String, default: null },      // id de la especialidad
    centros: { type: [String], default: undefined },   // ids de los centros donde atiende
    diasAtencion: { type: [Number], default: undefined },
    bloques: { type: [String], default: undefined },
    ausencias: {
      type: [
        {
          tipo: {
            type: String,
            enum: ['Vacaciones', 'Día no trabajado', 'Licencia médica'],
            required: true
          },
          desde: { type: String, required: true },
          hasta: { type: String, required: true },
          motivo: { type: String, trim: true, default: '' }
        }
      ],
      default: undefined
    }
  },
  { timestamps: true }
);

usuarioSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.password; // la clave jamás sale hacia el frontend
    return ret;
  }
});

module.exports = mongoose.model('Usuario', usuarioSchema);