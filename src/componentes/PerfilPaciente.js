import React, { useState, useEffect } from 'react';

const LARGO_MINIMO_CLAVE = 8;

export default function PerfilPaciente({ usuario, onActualizar }) {
  const [name, setName] = useState(usuario?.name || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [phone, setPhone] = useState(usuario?.phone || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setName(usuario?.name || '');
    setEmail(usuario?.email || '');
    setPhone(usuario?.phone || '');
  }, [usuario]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

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

    setGuardando(true);
    const resultado = await onActualizar(usuario.id, cambios);
    setGuardando(false);

    if (resultado) {
      setError(resultado);
      return;
    }

    setPassword('');
    setExito('✓ Tus datos se actualizaron correctamente.');
  };

  return (
    <div className="card-info" style={{ maxWidth: '720px' }}>
      <h2>Mis Datos Personales</h2>

      <form onSubmit={handleSubmit} className="grid-2-cols">
        <div className="form-group">
          <label>RUT (no modificable)</label>
          <input type="text" value={usuario?.rut || ''} disabled />
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
        {exito && (
          <div
            className="badge badge-ok full-width"
            style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.85rem' }}
          >
            {exito}
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar mis datos'}
          </button>
        </div>
      </form>
    </div>
  );
}
