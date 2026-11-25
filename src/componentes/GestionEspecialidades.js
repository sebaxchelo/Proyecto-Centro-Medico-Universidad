import React, { useState } from 'react';

const VACIO = { nombre: '', descripcion: '', duracionMin: 30, activa: true };

export default function GestionEspecialidades({ especialidades = [], onGuardar, onEliminar }) {
  const [form, setForm] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState('');

  const cambiar = (campo, valor) => setForm((prev) => ({ ...prev, [campo]: valor }));

  const cancelar = () => {
    setEditandoId(null);
    setForm(VACIO);
    setError('');
  };

  const editar = (esp) => {
    setEditandoId(esp.id);
    setForm({
      nombre: esp.nombre,
      descripcion: esp.descripcion || '',
      duracionMin: esp.duracionMin,
      activa: esp.activa
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const duracion = Number(form.duracionMin);
    if (!form.nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if (!duracion || duracion < 10 || duracion > 240) {
      setError('La duración debe estar entre 10 y 240 minutos.');
      return;
    }

    const resultado = await onGuardar(
      {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        duracionMin: duracion,
        activa: form.activa
      },
      editandoId
    );

    if (resultado) {
      setError(resultado);
      return;
    }
    cancelar();
  };

  return (
    <div className="card-info">
      <h2>Especialidades</h2>

      <form onSubmit={handleSubmit} className="grid-2-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label>Nombre</label>
          <input
            type="text"
            placeholder="Ej: Dermatología"
            value={form.nombre}
            onChange={(e) => cambiar('nombre', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Duración estándar (minutos)</label>
          <input
            type="number"
            min="10"
            max="240"
            value={form.duracionMin}
            onChange={(e) => cambiar('duracionMin', e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Descripción</label>
          <input
            type="text"
            placeholder="Breve descripción de la especialidad"
            value={form.descripcion}
            onChange={(e) => cambiar('descripcion', e.target.value)}
          />
        </div>

        <div className="form-group full-width">
          <label>Estado</label>
          <select
            value={form.activa ? 'activa' : 'inactiva'}
            onChange={(e) => cambiar('activa', e.target.value === 'activa')}
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>

        {error && <div className="error-banner full-width">⚠️ {error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editandoId ? 'Guardar cambios' : '+ Agregar especialidad'}
          </button>
          {editandoId && (
            <button type="button" className="btn-outline" onClick={cancelar}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Duración</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {especialidades.map((esp) => (
            <tr key={esp.id}>
              <td><strong>{esp.nombre}</strong></td>
              <td>{esp.descripcion || '—'}</td>
              <td>{esp.duracionMin} min</td>
              <td>
                <span className={`badge ${esp.activa ? 'badge-ok' : 'badge-off'}`}>
                  {esp.activa ? 'Activa' : 'Inactiva'}
                </span>
              </td>
              <td>
                <div className="acciones">
                  <button className="btn-outline" onClick={() => editar(esp)}>Editar</button>
                  {onEliminar && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar la especialidad "${esp.nombre}"?`)) return;
                        if (editandoId === esp.id) cancelar();
                        await onEliminar(esp.id);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}