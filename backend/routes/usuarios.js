const express = require('express');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const Cita = require('../models/Cita');

const router = express.Router();

const DIAS_VALIDOS = [1, 2, 3, 4, 5];
const BLOQUES_VALIDOS = ['08:30', '09:15', '10:00', '11:30', '14:00', '15:00', '16:00', '17:00'];
const TIPOS_AUSENCIA = ['Vacaciones', 'Día no trabajado', 'Licencia médica'];
const LARGO_MINIMO_CLAVE = 8;

const limpiarAusencias = (ausencias) => {
  if (!Array.isArray(ausencias)) return [];
  return ausencias
    .filter(
      (a) =>
        a &&
        TIPOS_AUSENCIA.includes(a.tipo) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(a.desde || '')) &&
        /^\d{4}-\d{2}-\d{2}$/.test(String(a.hasta || '')) &&
        String(a.desde) <= String(a.hasta)
    )
    .map((a) => ({
      tipo: a.tipo,
      desde: String(a.desde),
      hasta: String(a.hasta),
      motivo: String(a.motivo || '').trim()
    }));
};

// Listar todos los usuarios (sin claves)
router.get('/', async (req, res) => {
  try {
    const usuarios = await Usuario.find().sort({ createdAt: 1 });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al obtener los usuarios.' });
  }
});

// Iniciar sesión (RUT + clave)
router.post('/login', async (req, res) => {
  try {
    const { rut, password } = req.body;

    const usuario = await Usuario.findOne({ rut: String(rut || '') }).select('+password');
    const claveCorrecta = usuario
      ? await bcrypt.compare(String(password || ''), usuario.password)
      : false;

    // Mismo mensaje si falla el RUT o la clave
    if (!usuario || !claveCorrecta) {
      return res.status(401).json({ mensaje: 'RUT o clave incorrectos.' });
    }

    res.json(usuario);
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión.' });
  }
});

// Registrar usuario
router.post('/', async (req, res) => {
  try {
    const { rut, name, email, phone, role, password, specialtyId, centros, box, diasAtencion, bloques, ausencias } = req.body;

    if (typeof password !== 'string' || password.length < LARGO_MINIMO_CLAVE) {
      return res
        .status(400)
        .json({ mensaje: `La clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.` });
    }

    const hash = await bcrypt.hash(password, 10);
    const datos = { rut, name, email, phone, role, specialtyId, box, password: hash };

    // Los médicos llevan horario de atención (si no viene, se usa el estándar)
    if (role === 'Médico') {
      const dias = Array.isArray(diasAtencion)
        ? diasAtencion.map(Number).filter((d) => DIAS_VALIDOS.includes(d))
        : [];
      const bl = Array.isArray(bloques)
        ? bloques.filter((b) => BLOQUES_VALIDOS.includes(b))
        : [];
      const ctrs = Array.isArray(centros) ? centros.filter(Boolean) : [];
      datos.diasAtencion = dias.length ? dias : DIAS_VALIDOS;
      datos.bloques = bl.length ? bl : BLOQUES_VALIDOS;
      datos.centros = ctrs;
    }

    if (role === 'Médico' || role === 'Recepcionista' || role === 'Administrador') {
      datos.ausencias = limpiarAusencias(ausencias);
    }

    const usuario = await Usuario.create(datos);
    res.status(201).json(usuario);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ mensaje: 'Este RUT ya está registrado. Inicia sesión.' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ mensaje: 'Datos inválidos.' });
    }
    res.status(500).json({ mensaje: 'Error al registrar el usuario.' });
  }
});

// Actualizar datos de un usuario (Médico o Paciente; el RUT nunca se modifica)
router.put('/:id', async (req, res) => {
  try {
    const actual = await Usuario.findById(req.params.id);
    if (!actual) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }

    const { name, email, phone, password, specialtyId, centros, diasAtencion, bloques, ausencias } = req.body;
    const nombreAnterior = actual.name;
    const cambios = {};

    if (typeof name === 'string') {
      if (!name.trim()) {
        return res.status(400).json({ mensaje: 'El nombre es obligatorio.' });
      }
      cambios.name = name.trim();
    }
    if (typeof email === 'string') cambios.email = email.trim();
    if (typeof phone === 'string') cambios.phone = phone.trim();

    if (typeof password === 'string' && password.trim()) {
      if (password.trim().length < LARGO_MINIMO_CLAVE) {
        return res
          .status(400)
          .json({ mensaje: `La clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.` });
      }
      cambios.password = await bcrypt.hash(password.trim(), 10);
    }

    if (actual.role === 'Médico') {
      if (specialtyId !== undefined) cambios.specialtyId = specialtyId;
      if (Array.isArray(centros)) cambios.centros = centros.filter(Boolean);
      if (Array.isArray(diasAtencion)) {
        const dias = diasAtencion.map(Number).filter((d) => DIAS_VALIDOS.includes(d));
        if (!dias.length) {
          return res.status(400).json({ mensaje: 'Selecciona al menos un día de atención.' });
        }
        cambios.diasAtencion = dias;
      }
      if (Array.isArray(bloques)) {
        const bl = bloques.filter((b) => BLOQUES_VALIDOS.includes(b));
        if (!bl.length) {
          return res.status(400).json({ mensaje: 'Selecciona al menos un bloque horario.' });
        }
        cambios.bloques = bl;
      }
    }

    if (
      (actual.role === 'Médico' ||
        actual.role === 'Recepcionista' ||
        actual.role === 'Administrador') &&
      ausencias !== undefined
    ) {
      cambios.ausencias = limpiarAusencias(ausencias);
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { $set: cambios },
      { new: true, runValidators: true }
    );

    // Si cambió el nombre del paciente o del médico, actualizamos sus citas asociadas
    if (usuario.name !== nombreAnterior) {
      if (usuario.role === 'Paciente') {
        await Cita.updateMany({ patientRut: usuario.rut }, { patientName: usuario.name });
      } else if (usuario.role === 'Médico') {
        await Cita.updateMany({ profName: nombreAnterior }, { profName: usuario.name });
      }
    }

    res.json(usuario);
  } catch (err) {
    console.error('ERROR AL ACTUALIZAR USUARIO:', err.message);
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Datos inválidos.' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar el usuario.' });
  }
});

// Eliminar usuario (Paciente, Médico, Recepcionista o Administrador)
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await Usuario.findByIdAndDelete(req.params.id);
    if (!eliminado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado.' });
    }
    res.json({ id: req.params.id, eliminado: true });
  } catch (err) {
    res.status(500).json({ mensaje: 'Error al eliminar el usuario.' });
  }
});

module.exports = router;