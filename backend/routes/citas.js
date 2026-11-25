const express = require('express');
const bcrypt = require('bcryptjs');
const Cita = require('../models/Cita');
const Usuario = require('../models/Usuario');
const Centro = require('../models/Centro');
const Box = require('../models/Box');

const router = express.Router();

const DIAS_POR_DEFECTO = [1, 2, 3, 4, 5];
const BLOQUES_POR_DEFECTO = ['08:30', '09:15', '10:00', '11:30', '14:00', '15:00', '16:00', '17:00'];
const CLAVE_PACIENTE_DEFECTO = 'Clinica123';
const LARGO_MINIMO_CLAVE = 8;

// Fecha y hora actuales en Chile (formato YYYY-MM-DD y HH:MM)
const hoyChile = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });

const horaChile = () =>
  new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });

// Día de la semana de 'YYYY-MM-DD' (0=domingo ... 6=sábado)
const diaSemana = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

// Valida todas las reglas de agendamiento.
// Devuelve null si todo está bien, o { codigo, mensaje } si hay un problema.
// "excluirId" se usa al reagendar para ignorar la propia cita.
async function validarCita({ date, time, patientRut, profName, centro, box, excluirId = null }) {
  date = String(date || '');
  time = String(time || '');
  patientRut = String(patientRut || '');
  profName = String(profName || '');
  centro = String(centro || '');
  box = String(box || '');

  if (!date || !time || !profName || !patientRut || !centro || !box) {
    return { codigo: 400, mensaje: 'Faltan datos de la cita.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { codigo: 400, mensaje: 'Fecha inválida.' };
  }

  // 1. No se permiten fechas ni horas pasadas
  const hoy = hoyChile();
  if (date < hoy) {
    return { codigo: 400, mensaje: 'No se pueden agendar citas en fechas pasadas.' };
  }
  if (date === hoy && time <= horaChile()) {
    return { codigo: 400, mensaje: 'Ese horario ya pasó. Elige uno más tarde.' };
  }

  // 2. Debe respetar el horario de atención del médico
  const medico = await Usuario.findOne({ name: profName, role: 'Médico' });
  if (!medico) {
    return { codigo: 404, mensaje: 'El médico seleccionado no existe.' };
  }
  const dias = medico.diasAtencion && medico.diasAtencion.length
    ? medico.diasAtencion
    : DIAS_POR_DEFECTO;
  const bloques = medico.bloques && medico.bloques.length
    ? medico.bloques
    : BLOQUES_POR_DEFECTO;

  if (!dias.includes(diaSemana(date))) {
    return { codigo: 400, mensaje: `${profName} no atiende ese día.` };
  }
  const ausencia = (medico.ausencias || []).find(
    (a) => date >= a.desde && date <= a.hasta
  );
  if (ausencia) {
    return {
      codigo: 400,
      mensaje: `${profName} no está disponible en esa fecha (${ausencia.tipo}${ausencia.motivo ? `: ${ausencia.motivo}` : ''}).`
    };
  }
  if (!bloques.includes(time)) {
    return { codigo: 400, mensaje: 'Ese bloque horario no está disponible para este médico.' };
  }

  // 3. El centro debe existir, estar activo y ser uno donde el médico atiende
  const centroDoc = await Centro.findOne({ nombre: centro });
  if (!centroDoc || !centroDoc.activo) {
    return { codigo: 400, mensaje: 'Selecciona un centro de atención válido.' };
  }
  if (medico.centros && medico.centros.length && !medico.centros.includes(String(centroDoc._id))) {
    return { codigo: 400, mensaje: `${profName} no atiende en ${centro}.` };
  }

  // 4. El box debe existir en ese centro y estar disponible
  const boxDoc = await Box.findOne({ centro: centroDoc._id, nombre: box });
  if (!boxDoc) {
    return { codigo: 400, mensaje: 'Selecciona un box válido para ese centro.' };
  }
  if (boxDoc.estado !== 'Disponible') {
    return { codigo: 400, mensaje: `El ${box} no está disponible (${boxDoc.estado.toLowerCase()}).` };
  }

  // 5. No puede haber otra cita a la misma hora (médico, paciente ni box)
  const activa = { status: { $ne: 'Cancelada' } };
  if (excluirId) activa._id = { $ne: excluirId };

  if (await Cita.findOne({ profName, date, time, ...activa })) {
    return { codigo: 409, mensaje: 'Ese horario ya está reservado para este médico. Elige otro.' };
  }
  if (await Cita.findOne({ patientRut, date, time, ...activa })) {
    return { codigo: 409, mensaje: 'El paciente ya tiene otra cita a esa misma hora.' };
  }
  if (await Cita.findOne({ centro, box, date, time, ...activa })) {
    return { codigo: 409, mensaje: `El ${box} de ${centro} ya está ocupado a esa hora. Elige otro box.` };
  }

  return null;
}

// Respuesta para errores de duplicado del índice único de MongoDB
const mensajeDuplicado = (err) =>
  err.keyPattern && err.keyPattern.box
    ? 'Ese box ya está ocupado a esa hora. Elige otro.'
    : 'Ese horario ya está reservado para este médico. Elige otro.';

// Listar citas (más nuevas primero)
router.get('/', async (req, res) => {
  try {
    const citas = await Cita.find().sort({ createdAt: -1 });
    res.json(citas);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener las citas.' });
  }
});

// Crear cita (y registrar al paciente en la base de datos si no existe)
router.post('/', async (req, res) => {
  try {
    const {
      date,
      time,
      patientRut,
      patientName,
      patientEmail,
      patientPhone,
      patientPassword,
      profName,
      specialtyName,
      centro,
      box,
      reason
    } = req.body;

    const rutLimpio = String(patientRut || '').trim();
    const nombreLimpio = String(patientName || '').trim();
    const correoLimpio = String(patientEmail || '').trim();
    const telefonoLimpio = String(patientPhone || '').trim();

    if (!rutLimpio || !nombreLimpio) {
      return res.status(400).json({ mensaje: 'El RUT y el nombre del paciente son obligatorios.' });
    }

    const error = await validarCita({
      date,
      time,
      patientRut: rutLimpio,
      profName,
      centro,
      box
    });
    if (error) return res.status(error.codigo).json({ mensaje: error.mensaje });

    // Si el usuario (paciente) no existe en la base de datos, se crea con todos sus datos
    let usuarioPaciente = await Usuario.findOne({ rut: rutLimpio });
    if (!usuarioPaciente) {
      if (!correoLimpio || !telefonoLimpio) {
        return res.status(400).json({
          mensaje: 'El paciente no tiene cuenta: ingresa su correo electrónico y teléfono.'
        });
      }
      const clavePlana = typeof patientPassword === 'string' ? patientPassword.trim() : '';
      if (clavePlana.length < LARGO_MINIMO_CLAVE) {
        return res.status(400).json({
          mensaje: `La clave del nuevo paciente debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`
        });
      }
      const hash = await bcrypt.hash(clavePlana, 10);

      usuarioPaciente = await Usuario.create({
        rut: rutLimpio,
        name: nombreLimpio,
        email: correoLimpio,
        phone: telefonoLimpio,
        role: 'Paciente',
        password: hash
      });
    } else {
      // Si ya existe pero vienen correo o teléfono nuevos, los actualizamos
      let modificado = false;
      if (correoLimpio && usuarioPaciente.email !== correoLimpio) {
        usuarioPaciente.email = correoLimpio;
        modificado = true;
      }
      if (telefonoLimpio && usuarioPaciente.phone !== telefonoLimpio) {
        usuarioPaciente.phone = telefonoLimpio;
        modificado = true;
      }
      if (modificado) await usuarioPaciente.save();
    }

    const cita = await Cita.create({
      date,
      time,
      patientRut: usuarioPaciente.rut,
      patientName: usuarioPaciente.name,
      profName,
      specialtyName,
      centro,
      box,
      reason
    });
    res.status(201).json(cita);
  } catch (err) {
    console.error('ERROR AL CREAR CITA:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ mensaje: mensajeDuplicado(err) });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Datos de la cita inválidos.', detalle: err.message });
    }
    res.status(500).json({ mensaje: 'Error al crear la cita.' });
  }
});

// Reagendar cita: cambia fecha, hora y box (mismo médico y mismo centro)
router.patch('/:id/reagendar', async (req, res) => {
  try {
    const { date, time, box } = req.body;

    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });

    if (cita.status !== 'Reservada') {
      return res.status(400).json({ mensaje: 'Solo se pueden reagendar citas en estado Reservada.' });
    }
    if (cita.date < hoyChile()) {
      return res.status(400).json({ mensaje: 'No se pueden reagendar citas que ya pasaron.' });
    }
    if (date === cita.date && time === cita.time && box === cita.box) {
      return res.status(400).json({ mensaje: 'Elige una fecha, hora o box distintos a los actuales.' });
    }

    const error = await validarCita({
      date,
      time,
      box,
      patientRut: cita.patientRut,
      profName: cita.profName,
      centro: cita.centro,
      excluirId: cita._id
    });
    if (error) return res.status(error.codigo).json({ mensaje: error.mensaje });

    cita.date = String(date);
    cita.time = String(time);
    cita.box = String(box);
    cita.reagendamientos = (cita.reagendamientos || 0) + 1;
    await cita.save();

    res.json(cita);
  } catch (err) {
    console.error('ERROR AL REAGENDAR:', err.message);
    if (err.code === 11000) {
      return res.status(409).json({ mensaje: mensajeDuplicado(err) });
    }
    if (err.name === 'CastError') {
      return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    }
    res.status(500).json({ mensaje: 'Error al reagendar la cita.' });
  }
});

// Cambiar estado (Cancelada / Completada)
router.patch('/:id/estado', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Reservada', 'Completada', 'Cancelada'].includes(status)) {
      return res.status(400).json({ mensaje: 'Estado inválido.' });
    }
    const cita = await Cita.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    res.json(cita);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al actualizar la cita.' });
  }
});

// Eliminar cita
router.delete('/:id', async (req, res) => {
  try {
    const cita = await Cita.findByIdAndDelete(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada.' });
    res.json({ id: req.params.id, eliminado: true });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar la cita.' });
  }
});

module.exports = router;