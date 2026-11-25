const express = require('express');

module.exports = function crearRutasCrud(Modelo, campos) {
  const router = express.Router();

  // Solo se aceptan los campos permitidos
  const limpiar = (body) => {
    const datos = {};
    campos.forEach((campo) => {
      if (body[campo] !== undefined) datos[campo] = body[campo];
    });
    return datos;
  };

  const responderError = (err, res) => {
    if (err.code === 11000) {
      return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos.' });
    }
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ mensaje: 'Datos inválidos. Revisa los campos del formulario.' });
    }
    console.error(err.message);
    res.status(500).json({ mensaje: 'Error en el servidor.' });
  };

  router.get('/', async (req, res) => {
    try {
      res.json(await Modelo.find().sort({ createdAt: 1 }));
    } catch (err) {
      responderError(err, res);
    }
  });

  router.post('/', async (req, res) => {
    try {
      const doc = await Modelo.create(limpiar(req.body));
      res.status(201).json(doc);
    } catch (err) {
      responderError(err, res);
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const doc = await Modelo.findByIdAndUpdate(req.params.id, limpiar(req.body), {
        new: true,
        runValidators: true
      });
      if (!doc) return res.status(404).json({ mensaje: 'Registro no encontrado.' });
      res.json(doc);
    } catch (err) {
      responderError(err, res);
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const doc = await Modelo.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ mensaje: 'Registro no encontrado.' });
      // Si se elimina un Centro (sucursal), también se eliminan sus boxes asociados
      if (Modelo.modelName === 'Centro') {
        const Box = require('../models/Box');
        await Box.deleteMany({ centro: req.params.id });
      }
      res.json({ id: req.params.id, eliminado: true });
    } catch (err) {
      responderError(err, res);
    }
  });

  return router;
};