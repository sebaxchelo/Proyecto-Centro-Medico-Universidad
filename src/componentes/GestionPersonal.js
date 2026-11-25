import React, { useState } from 'react';
import { TIPOS_AUSENCIA } from '../horarios';
import { formatearRut } from './Registro';

const LARGO_MINIMO_CLAVE = 8;

const claseBadgeAusencia = (tipo) =>
  tipo === 'Licencia médica'
    ? 'badge-cancelada'
    : tipo === 'Vacaciones'
      ? 'badge-warn'
      : 'badge-off';

export default function GestionPersonal({ personal = [], onAgregar, onActualizar, onEliminar }) {
  const [editandoId, setEditandoId] = useState(null);
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Recepcionista');
  const [ausencias, setAusencias] = useState([]);

  // Sub-formulario para agregar vacaciones / ausencias al personal
  const [tipoAusencia, setTipoAusencia] = useState('Vacaciones');
  const [desdeAusencia, setDesdeAusencia] = useState('');
  const [hastaAusencia, setHastaAusencia] = useState('');
  const [motivoAusencia, setMotivoAusencia] = useState('');

  const [error, setError] = useState('');

  const limpiarFormulario = () => {
    setEditandoId(null);
    setRut('');
    setName('');
    setPassword('');
    setRole('Recepcionista');
    setAusencias([]);
    setTipoAusencia('Vacaciones');
    setDesdeAusencia('');
    setHastaAusencia('');
    setMotivoAusencia('');
    setError('');
  };

  const iniciarEdicion = (persona) => {
    setEditandoId(persona.id);
    setRut(persona.rut || '');
    setName(persona.name || '');
    setPassword('');
    setRole(persona.role || 'Recepcionista');
    setAusencias(Array.isArray(persona.ausencias) ? persona.ausencias : []);
    setTipoAusencia('Vacaciones');
    setDesdeAusencia('');
    setHastaAusencia('');
    setMotivoAusencia('');
    setError('');
  };

  const agregarAusenciaLista = () => {
    setError('');
    const fechaDesde = desdeAusencia;
    const fechaHasta =
      tipoAusencia === 'Día no trabajado' ? desdeAusencia : hastaAusencia || desdeAusencia;

    if (!fechaDesde) {
      setError('Selecciona la fecha de inicio para las vacaciones o ausencia.');
      return;
    }
    if (fechaHasta < fechaDesde) {
      setError('La fecha de término no puede ser anterior a la fecha de inicio.');
      return;
    }

    setAusencias((prev) => [
      ...prev,
      {
        tipo: tipoAusencia,
        desde: fechaDesde,
        hasta: fechaHasta,
        motivo: motivoAusencia.trim()
      }
    ]);
    setDesdeAusencia('');
    setHastaAusencia('');
    setMotivoAusencia('');
  };

  const quitarAusenciaLista = (indice) => {
    setAusencias((prev) => prev.filter((_, idx) => idx !== indice));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rut.trim() || !name.trim()) {
      setError('El RUT y el nombre son obligatorios.');
      return;
    }
    if (!editandoId && password.length < LARGO_MINIMO_CLAVE) {
      setError(`La clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
      return;
    }
    if (editandoId && password.trim() && password.trim().length < LARGO_MINIMO_CLAVE) {
      setError(`La nueva clave debe tener al menos ${LARGO_MINIMO_CLAVE} caracteres.`);
      return;
    }

    const datos = {
      name: name.trim(),
      role,
      ausencias
    };

    if (!editandoId) {
      datos.rut = rut.trim();
      datos.password = password;
    } else if (password.trim()) {
      datos.password = password.trim();
    }

    const resultado = editandoId
      ? await onActualizar(editandoId, datos)
      : await onAgregar(datos);

    if (resultado) {
      setError(resultado);
      return;
    }

    limpiarFormulario();
  };

  return (
    <div className="card-info">
      <h2>
        {editandoId
          ? 'Editar Personal y Vacaciones (Admin / Recepcionista)'
          : 'Gestión de Personal y Vacaciones'}
      </h2>

      <form onSubmit={handleSubmit} className="grid-2-cols" style={{ marginBottom: '18px' }}>
        <div className="form-group">
          <label>RUT {editandoId ? '(no modificable)' : ''}</label>
          <input
            type="text"
            placeholder="Ej: 14.555.666-7"
            value={rut}
            disabled={!!editandoId}
            onChange={(e) => setRut(formatearRut(e.target.value))}
            required
          />
        </div>

        <div className="form-group">
          <label>Nombre completo</label>
          <input
            type="text"
            placeholder="Ej: Sofía Valdés"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Rol</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} disabled={!!editandoId}>
            <option value="Recepcionista">Recepcionista</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        <div className="form-group">
          <label>{editandoId ? 'Nueva clave (opcional)' : 'Clave de acceso'}</label>
          <input
            type="password"
            placeholder={
              editandoId
                ? 'Dejar en blanco para mantener actual'
                : `Mínimo ${LARGO_MINIMO_CLAVE} caracteres`
            }
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            required={!editandoId}
          />
        </div>

        {/* SECCIÓN DE VACACIONES Y AUSENCIAS DEL PERSONAL */}
        <div className="horario-section full-width">
          <h4>🗓️ Vacaciones, Días libres y Licencias (Recepcionista / Administrador)</h4>

          <div className="grid-2-cols" style={{ alignItems: 'end', marginBottom: '8px' }}>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={tipoAusencia}
                onChange={(e) => setTipoAusencia(e.target.value)}
              >
                {TIPOS_AUSENCIA.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Motivo / Observación (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Vacaciones anuales, permiso..."
                value={motivoAusencia}
                onChange={(e) => setMotivoAusencia(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>
                {tipoAusencia === 'Día no trabajado' ? 'Fecha' : 'Desde'}
              </label>
              <input
                type="date"
                value={desdeAusencia}
                onChange={(e) => {
                  setDesdeAusencia(e.target.value);
                  if (tipoAusencia === 'Día no trabajado' || !hastaAusencia) {
                    setHastaAusencia(e.target.value);
                  }
                }}
              />
            </div>

            {tipoAusencia !== 'Día no trabajado' ? (
              <div className="form-group">
                <label>Hasta</label>
                <input
                  type="date"
                  value={hastaAusencia}
                  min={desdeAusencia}
                  onChange={(e) => setHastaAusencia(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group">
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: '100%', padding: '7px 12px' }}
                  onClick={agregarAusenciaLista}
                >
                  + Añadir fecha
                </button>
              </div>
            )}

            {tipoAusencia !== 'Día no trabajado' && (
              <div className="form-group full-width">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={agregarAusenciaLista}
                >
                  + Añadir {tipoAusencia.toLowerCase()}
                </button>
              </div>
            )}
          </div>

          {ausencias.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {ausencias.map((a, idx) => (
                <span
                  key={`${a.tipo}-${a.desde}-${idx}`}
                  className={`badge ${claseBadgeAusencia(a.tipo)}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {a.tipo}: {a.desde === a.hasta ? a.desde : `${a.desde} a ${a.hasta}`}
                  {a.motivo ? ` (${a.motivo})` : ''}
                  <button
                    type="button"
                    onClick={() => quitarAusenciaLista(idx)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      padding: '0 2px'
                    }}
                    title="Quitar"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && <div className="error-banner full-width">⚠️ {error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editandoId ? 'Guardar cambios y vacaciones' : '+ Agregar personal'}
          </button>
          {editandoId && (
            <button type="button" className="btn-outline" onClick={limpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>RUT</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Vacaciones / Ausencias</th>
            {onActualizar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {personal.map((p) => (
            <tr key={p.id} className={editandoId === p.id ? 'fila-sel' : ''}>
              <td className="nowrap">{p.rut}</td>
              <td><strong>{p.name}</strong></td>
              <td>{p.role}</td>
              <td>
                {!p.ausencias || p.ausencias.length === 0 ? (
                  <span className="badge badge-ok">Activo</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {p.ausencias.map((a, idx) => (
                      <span key={idx} className={`badge ${claseBadgeAusencia(a.tipo)}`}>
                        {a.tipo}: {a.desde === a.hasta ? a.desde : `${a.desde} a ${a.hasta}`}
                        {a.motivo ? ` (${a.motivo})` : ''}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              {(onActualizar || onEliminar) && (
                <td>
                  <div className="acciones">
                    {onActualizar && (
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => iniciarEdicion(p)}
                      >
                        Editar / Vacaciones
                      </button>
                    )}
                    {onEliminar && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar a ${p.name} (${p.role})?`)) return;
                          if (editandoId === p.id) limpiarFormulario();
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
    </div>
  );
}
