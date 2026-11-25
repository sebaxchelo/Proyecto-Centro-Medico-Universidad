import React, { useState } from 'react';

const LARGO_MINIMO_CLAVE = 8;

export default function TablaPacientes({ pacientes = [], onActualizar, onEliminar }) {
  const [editandoId, setEditandoId] = useState(null);
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const cancelar = () => {
    setEditandoId(null);
    setRut('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setError('');
  };

  const editar = (paciente) => {
    setEditandoId(paciente.id);
    setRut(paciente.rut || '');
    setName(paciente.name || '');
    setEmail(paciente.email || '');
    setPhone(paciente.phone || '');
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('El nombre, correo y teléfono son obligatorios.');
      return;
    }
    if (password.trim() && password.trim().length < LARGO_MINIMO_CLAVE) {
      setError(`La nueva clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
      return;
    }

    const cambios = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim()
    };
    if (password.trim()) {
      cambios.password = password.trim();
    }

    const resultado = await onActualizar(editandoId, cambios);
    if (resultado) {
      setError(resultado);
      return;
    }
    cancelar();
  };

  return (
    <div className="card-info">
      <h2>Gestión de Pacientes</h2>

      {onActualizar && editandoId && (
        <form onSubmit={handleSubmit} className="grid-2-cols" style={{ marginBottom: '18px' }}>
          <div className="form-group">
            <label>RUT (no modificable)</label>
            <input type="text" value={rut} disabled />
          </div>

          <div className="form-group">
            <label>Nombre Completo</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              placeholder="correo@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="tel"
              placeholder="+56912345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Nueva clave (opcional)</label>
            <input
              type="password"
              placeholder={`Dejar en blanco para mantener actual (mín. ${LARGO_MINIMO_CLAVE} caracteres)`}
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <div className="error-banner full-width">⚠️ {error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Guardar cambios del paciente
            </button>
            <button type="button" className="btn-outline" onClick={cancelar}>
              Cancelar edición
            </button>
          </div>
        </form>
      )}

      {pacientes.length === 0 ? (
        <p>No hay pacientes.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>RUT</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              {(onActualizar || onEliminar) && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pacientes.map((p) => (
              <tr key={p.id} className={editandoId === p.id ? 'fila-sel' : ''}>
                <td>{p.rut}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.email || '—'}</td>
                <td>{p.phone || '—'}</td>
                {(onActualizar || onEliminar) && (
                  <td>
                    <div className="acciones">
                      {onActualizar && (
                        <button
                          type="button"
                          className="btn-outline"
                          onClick={() => editar(p)}
                        >
                          Editar
                        </button>
                      )}
                      {onEliminar && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={async () => {
                            if (!window.confirm(`¿Eliminar al paciente ${p.name}?`)) return;
                            if (editandoId === p.id) cancelar();
                            await onEliminar(p.id);
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
