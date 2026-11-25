require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Usuario = require('./models/Usuario');
const Cita = require('./models/Cita');
const Especialidad = require('./models/Especialidad');
const Centro = require('./models/Centro');
const Box = require('./models/Box');

const CLAVE_DEMO = 'Clinica123';

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  await Promise.all([
    Usuario.deleteMany({}),
    Cita.deleteMany({}),
    Especialidad.deleteMany({}),
    Centro.deleteMany({}),
    Box.deleteMany({})
  ]);

  // Elimina índices antiguos y crea los nuevos
  await Promise.all([
    Usuario.syncIndexes(),
    Cita.syncIndexes(),
    Especialidad.syncIndexes(),
    Centro.syncIndexes(),
    Box.syncIndexes()
  ]);

  // 1. Especialidades
  const [general, pediatria, cardiologia, odontologia] = await Especialidad.insertMany([
    { nombre: 'Medicina General', descripcion: 'Atención primaria y controles preventivos.', duracionMin: 30 },
    { nombre: 'Pediatría', descripcion: 'Atención médica de niños y adolescentes.', duracionMin: 30 },
    { nombre: 'Cardiología', descripcion: 'Evaluación y control de enfermedades del corazón.', duracionMin: 45 },
    { nombre: 'Odontología', descripcion: 'Salud bucal y tratamientos dentales.', duracionMin: 45 }
  ]);

  // 2. Centros
  const [central, norte] = await Centro.insertMany([
    { nombre: 'Sede Central', ubicacion: "Av. Libertador B. O'Higgins 1000, Santiago" },
    { nombre: 'Sede Norte', ubicacion: 'Av. Pedro Fontova 5000, Huechuraba' }
  ]);

  // 3. Boxes
  await Box.insertMany([
    { centro: central._id, nombre: 'Box 101', tipo: 'Consulta general', caracteristicas: 'Camilla, escritorio y lavamanos' },
    { centro: central._id, nombre: 'Box 102', tipo: 'Pediátrico', caracteristicas: 'Balanza pediátrica y camilla baja' },
    { centro: central._id, nombre: 'Box 103', tipo: 'Cardiología', caracteristicas: 'Electrocardiógrafo' },
    { centro: central._id, nombre: 'Box 104', tipo: 'Odontológico', caracteristicas: 'Sillón dental y escupidera' },
    { centro: central._id, nombre: 'Box 105', tipo: 'Consulta general', caracteristicas: 'Consulta de apoyo' },
    { centro: central._id, nombre: 'Box 106', tipo: 'Procedimientos', caracteristicas: 'Sala de curaciones', estado: 'Mantención' },
    { centro: norte._id, nombre: 'Box 201', tipo: 'Consulta general', caracteristicas: 'Camilla y escritorio' },
    { centro: norte._id, nombre: 'Box 202', tipo: 'Consulta general', caracteristicas: 'Camilla y escritorio' }
  ]);

  // 4. Usuarios
  const usuarios = [
    // Pacientes
    { rut: '19.876.543-0', name: 'Juan Pérez', email: 'juan.perez@gmail.com', phone: '+56912345678', role: 'Paciente' },
    { rut: '17.654.321-3', name: 'Camila Rojas', email: 'camila.rojas@gmail.com', phone: '+56987654321', role: 'Paciente' },
    { rut: '20.111.222-2', name: 'Matías González', email: 'matias.gonzalez@gmail.com', phone: '+56911223344', role: 'Paciente' },
    { rut: '18.222.333-6', name: 'Valentina Muñoz', email: 'valentina.munoz@gmail.com', phone: '+56955667788', role: 'Paciente' },
    { rut: '12.345.678-5', name: 'Eduardo Varga', email: 'eduardo.varga@gmail.com', phone: '+56999887766', role: 'Paciente' },

    // Médicos (con especialidad, centros y horario de atención AM / PM)
    { rut: '15.123.456-7', name: 'Dr. Carlos Soto', email: 'carlos.soto@clinica.cl', phone: '+56922334455', role: 'Médico', specialtyId: general.id, centros: [central.id, norte.id], diasAtencion: [1, 2, 3, 4, 5], bloques: ['08:30', '09:15', '10:00', '11:30'] },
    { rut: '16.789.012-3', name: 'Dra. María Paz', email: 'maria.paz@clinica.cl', phone: '+56933445566', role: 'Médico', specialtyId: pediatria.id, centros: [central.id], diasAtencion: [1, 2, 3, 4, 5], bloques: ['08:30', '09:15', '10:00', '11:30', '14:00', '15:00', '16:00', '17:00'] },
    { rut: '13.579.246-2', name: 'Dra. Ana Rojas', email: 'ana.rojas@clinica.cl', phone: '+56944556677', role: 'Médico', specialtyId: cardiologia.id, centros: [central.id], diasAtencion: [1, 3, 5], bloques: ['08:30', '10:00', '11:30', '14:00', '15:00', '16:00'] },
    { rut: '10.203.040-0', name: 'Dr. Luis Fuentes', email: 'luis.fuentes@clinica.cl', phone: '+56955667799', role: 'Médico', specialtyId: odontologia.id, centros: [central.id], diasAtencion: [2, 4, 5], bloques: ['10:00', '11:30', '14:00', '15:00', '16:00', '17:00'] },

    // Personal
    { rut: '14.555.666-7', name: 'Sofía Valdés', role: 'Recepcionista' },
    { rut: '21.000.000-3', name: 'Pedro Araya', role: 'Recepcionista' },
    { rut: '11.111.111-1', name: 'Admin Sistema', role: 'Administrador' }
  ];

  const claveHash = await bcrypt.hash(CLAVE_DEMO, 10);
  await Usuario.insertMany(usuarios.map((u) => ({ ...u, password: claveHash })));

  // 5. Citas
  const citas = [
    {
      date: '2026-10-20', time: '08:30',
      patientRut: '19.876.543-0', patientName: 'Juan Pérez',
      profName: 'Dr. Carlos Soto', specialtyName: 'Medicina General', centro: 'Sede Central', box: 'Box 101',
      reason: 'Chequeo preventivo', status: 'Completada'
    },
    {
      date: '2026-10-26', time: '09:15',
      patientRut: '12.345.678-5', patientName: 'Eduardo Varga',
      profName: 'Dr. Carlos Soto', specialtyName: 'Medicina General', centro: 'Sede Central', box: 'Box 101',
      reason: 'Control de presión', status: 'Cancelada'
    },
    {
      date: '2026-10-28', time: '10:00',
      patientRut: '17.654.321-3', patientName: 'Camila Rojas',
      profName: 'Dr. Carlos Soto', specialtyName: 'Medicina General', centro: 'Sede Central', box: 'Box 101',
      reason: 'Certificado médico', status: 'Completada'
    },
    {
      date: '2026-11-03', time: '09:15',
      patientRut: '17.654.321-3', patientName: 'Camila Rojas',
      profName: 'Dra. María Paz', specialtyName: 'Pediatría', centro: 'Sede Central', box: 'Box 102',
      reason: 'Control pediátrico', status: 'Reservada'
    },
    {
      date: '2026-11-04', time: '10:00',
      patientRut: '20.111.222-2', patientName: 'Matías González',
      profName: 'Dra. Ana Rojas', specialtyName: 'Cardiología', centro: 'Sede Central', box: 'Box 103',
      reason: 'Evaluación cardiológica', status: 'Reservada'
    },
    {
      date: '2026-11-05', time: '11:30',
      patientRut: '18.222.333-6', patientName: 'Valentina Muñoz',
      profName: 'Dr. Luis Fuentes', specialtyName: 'Odontología', centro: 'Sede Central', box: 'Box 104',
      reason: 'Limpieza dental', status: 'Reservada'
    },
    {
      date: '2026-11-06', time: '08:30',
      patientRut: '19.876.543-0', patientName: 'Juan Pérez',
      profName: 'Dra. Ana Rojas', specialtyName: 'Cardiología', centro: 'Sede Central', box: 'Box 103',
      reason: 'Electrocardiograma', status: 'Reservada'
    },
    {
      date: '2026-11-10', time: '11:30',
      patientRut: '20.111.222-2', patientName: 'Matías González',
      profName: 'Dr. Luis Fuentes', specialtyName: 'Odontología', centro: 'Sede Central', box: 'Box 104',
      reason: 'Dolor de muela', status: 'Reservada'
    }
  ];
  await Cita.insertMany(citas);

  console.log(`✅ Datos cargados: ${usuarios.length} usuarios, 4 especialidades, 2 centros, 8 boxes y ${citas.length} citas`);
  console.log(`🔑 Clave de todos los usuarios de ejemplo: ${CLAVE_DEMO}`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error('❌ Error en el seed:', err.message);
  process.exit(1);
});