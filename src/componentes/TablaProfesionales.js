import React, { useState } from 'react';
import {
  DIAS,
  BLOQUES,
  BLOQUES_AM,
  BLOQUES_PM,
  DIAS_POR_DEFECTO,
  TIPOS_AUSENCIA,
  resumenHorario
} from '../horarios';
import { formatearRut } from './Registro';

const LARGO_MINIMO_CLAVE = 8;

const claseBadgeAusencia = (tipo) =>
  tipo === 'Licencia médica'
    ? 'badge-cancelada'
    : tipo === 'Vacaciones'
      ? 'badge-warn'
      : 'badge-off';

export default function TablaProfesionales({
  profesionales = [],
  especialidades = [],
  centros = [],
  onAgregar,
  onActualizar,
  onEliminar
}) {
  const [editandoId, setEditandoId] = useState(null);
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [centrosSel, setCentrosSel] = useState([]);
  const [diasAtencion, setDiasAtencion] = useState(DIAS_POR_DEFECTO);
  const [bloques, setBloques] = useState(BLOQUES_AM);
  const [ausencias, setAusencias] = useState([]);

  // Sub-formulario para agregar una ausencia (vacaciones, día libre o licencia médica)
  const [tipoAusencia, setTipoAusencia] = useState('Vacaciones');
  const [desdeAusencia, setDesdeAusencia] = useState('');
  const [hastaAusencia, setHastaAusencia] = useState('');
  const [motivoAusencia, setMotivoAusencia] = useState('');

  const [error, setError] = useState('');

  const puedeGestionar = Boolean(onAgregar || onActualizar);

  const nombreEspecialidad = (id) =>
    especialidades.find((s) => s.id === id)?.nombre || 'Sin especialidad';

  const nombresCentros = (ids) => {
    if (!ids || ids.length === 0) return 'Todos los centros';
    return ids.map((id) => centros.find((c) => c.id === id)?.nombre || '—').join(', ');
  };

  const toggleItem = (lista, setLista, valor) => {
    setLista((prev) =>
      prev.includes(valor) ? prev.filter((x) => x !== valor) : [...prev, valor]
    );
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setRut('');
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSpecialtyId('');
    setCentrosSel([]);
    setDiasAtencion(DIAS_POR_DEFECTO);
    setBloques(BLOQUES_AM);
    setAusencias([]);
    setTipoAusencia('Vacaciones');
    setDesdeAusencia('');
    setHastaAusencia('');
    setMotivoAusencia('');
    setError('');
  };

  const iniciarEdicion = (medico) => {
    setEditandoId(medico.id);
    setRut(medico.rut || '');
    setName(medico.name || '');
    setEmail(medico.email || '');
    setPhone(medico.phone || '');
    setPassword('');
    setSpecialtyId(medico.specialtyId || '');
    setCentrosSel(Array.isArray(medico.centros) ? medico.centros : []);
    setDiasAtencion(
      medico.diasAtencion?.length ? medico.diasAtencion : DIAS_POR_DEFECTO
    );
    setBloques(medico.bloques?.length ? medico.bloques : BLOQUES_AM);
    setAusencias(Array.isArray(medico.ausencias) ? medico.ausencias : []);
    setTipoAusencia('Vacaciones');
    setDesdeAusencia('');
    setHastaAusencia('');
    setMotivoAusencia('');
    setError('');
  };

  const agregarAusenciaLista = () => {
    setError('');
    const fechaDesde = desdeAusencia;
    const fechaHasta = tipoAusencia === 'Día no trabajado' ? desdeAusencia : hastaAusencia || desdeAusencia;

    if (!fechaDesde) {
      setError('Selecciona la fecha de inicio para la ausencia o licencia.');
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

    if (!rut.trim() || !name.trim() || !email.trim() || !phone.trim()) {
      setError('El RUT, nombre, correo y teléfono son obligatorios.');
      return;
    }
    if (!specialtyId) {
      setError('Selecciona una especialidad.');
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
    if (diasAtencion.length === 0) {
      setError('Selecciona al menos un día de atención.');
      return;
    }
    if (bloques.length === 0) {
      setError('Selecciona al menos un bloque horario (AM o PM).');
      return;
    }

    const datos = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: 'Médico',
      specialtyId,
      centros: centrosSel,
      diasAtencion: [...diasAtencion].sort((a, b) => a - b),
      bloques: BLOQUES.filter((b) => bloques.includes(b)),
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

  const especialidadesActivas = especialidades.filter(
    (e) => e.activa || e.id === specialtyId
  );
  const centrosActivos = centros.filter(
    (c) => c.activo || centrosSel.includes(c.id)
  );

  return (
    <div className="card-info">
      <h2>{editandoId ? 'Editar Médico, Horario y Ausencias' : 'Gestión de Médicos'}</h2>

      {puedeGestionar && (
        <form onSubmit={handleSubmit} className="grid-2-cols" style={{ marginBottom: '18px' }}>
          <div className="form-group">
            <label>RUT {editandoId ? '(no modificable)' : ''}</label>
            <input
              type="text"
              placeholder="Ej: 15.123.456-7"
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
              placeholder="Ej: Dr. Carlos Soto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Correo electrónico</label>
            <input
              type="email"
              placeholder="medico@clinica.cl"
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

          <div className="form-group">
            <label>Especialidad</label>
            <select
              value={specialtyId}
              onChange={(e) => setSpecialtyId(e.target.value)}
              required
            >
              <option value="">-- Seleccionar especialidad --</option>
              {especialidadesActivas.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              {editandoId ? 'Nueva clave (opcional)' : 'Clave de acceso'}
            </label>
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

          {/* SECCIÓN DE CENTROS Y HORARIO AM / PM */}
          <div className="horario-section full-width">
            <h4>🏥 Centros y Horario de Atención (AM / PM)</h4>

            <p className="horario-label">
              Centros donde atiende (si no marcas ninguno, podrá atender en todos):
            </p>
            <div className="check-group">
              {centrosActivos.map((c) => (
                <label key={c.id} className="check-item">
                  <input
                    type="checkbox"
                    checked={centrosSel.includes(c.id)}
                    onChange={() => toggleItem(centrosSel, setCentrosSel, c.id)}
                  />
                  {c.nombre}
                </label>
              ))}
            </div>

            <p className="horario-label">Días que trabaja:</p>
            <div className="check-group">
              {DIAS.map((d) => (
                <label key={d.num} className="check-item">
                  <input
                    type="checkbox"
                    checked={diasAtencion.includes(d.num)}
                    onChange={() => toggleItem(diasAtencion, setDiasAtencion, d.num)}
                  />
                  {d.largo}
                </label>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px',
                marginBottom: '6px'
              }}
            >
              <span className="horario-label" style={{ margin: 0 }}>
                Selección rápida de jornada:
              </span>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setBloques(BLOQUES_AM)}
              >
                ☀️ Solo Mañana (AM)
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setBloques(BLOQUES_PM)}
              >
                🌙 Solo Tarde (PM)
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setBloques(BLOQUES)}
              >
                🕐 Jornada Completa (AM y PM)
              </button>
            </div>

            <p className="horario-label">☀️ Bloques Mañana (AM):</p>
            <div className="check-group">
              {BLOQUES_AM.map((b) => (
                <label key={b} className="check-item">
                  <input
                    type="checkbox"
                    checked={bloques.includes(b)}
                    onChange={() => toggleItem(bloques, setBloques, b)}
                  />
                  {b} hrs
                </label>
              ))}
            </div>

            <p className="horario-label">🌙 Bloques Tarde (PM):</p>
            <div className="check-group">
              {BLOQUES_PM.map((b) => (
                <label key={b} className="check-item">
                  <input
                    type="checkbox"
                    checked={bloques.includes(b)}
                    onChange={() => toggleItem(bloques, setBloques, b)}
                  />
                  {b} hrs
                </label>
              ))}
            </div>
          </div>

          {/* SECCIÓN DE VACACIONES, DÍAS NO TRABAJADOS Y LICENCIAS MÉDICAS */}
          <div className="horario-section full-width">
            <h4>🗓️ Vacaciones, Días que no trabajará y Licencias Médicas</h4>
            <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '8px' }}>
              Los días registrados aquí se bloquearán automáticamente en el agendamiento y reagendamiento de citas.
            </p>

            <div className="grid-2-cols" style={{ alignItems: 'end', marginBottom: '8px' }}>
              <div className="form-group">
                <label>Tipo de bloqueo</label>
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
                  placeholder="Ej: Permiso administrativo, reposo médico..."
                  value={motivoAusencia}
                  onChange={(e) => setMotivoAusencia(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>
                  {tipoAusencia === 'Día no trabajado' ? 'Fecha que no trabajará' : 'Desde'}
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
                    + Añadir fecha bloqueada
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
                    + Añadir período bloqueado ({tipoAusencia})
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
                      title="Quitar bloqueo"
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
              {editandoId ? 'Guardar cambios del médico' : '+ Agregar médico'}
            </button>
            {editandoId && (
              <button type="button" className="btn-outline" onClick={limpiarFormulario}>
                Cancelar edición
              </button>
            )}
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>RUT</th>
            <th>Nombre</th>
            <th>Contacto</th>
            <th>Especialidad</th>
            <th>Centros</th>
            <th>Horario (AM/PM)</th>
            <th>Ausencias / Licencias</th>
            {puedeGestionar && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {profesionales.map((m) => (
            <tr key={m.id} className={editandoId === m.id ? 'fila-sel' : ''}>
              <td className="nowrap">{m.rut}</td>
              <td><strong>{m.name}</strong></td>
              <td>
                <div>{m.email || '—'}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{m.phone || '—'}</div>
              </td>
              <td>{nombreEspecialidad(m.specialtyId)}</td>
              <td>{nombresCentros(m.centros)}</td>
              <td>{resumenHorario(m)}</td>
              <td>
                {!m.ausencias || m.ausencias.length === 0 ? (
                  <span className="badge badge-ok">Activo</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {m.ausencias.map((a, idx) => (
                      <span
                        key={idx}
                        className={`badge ${claseBadgeAusencia(a.tipo)}`}
                      >
                        {a.tipo}: {a.desde === a.hasta ? a.desde : `${a.desde} a ${a.hasta}`}
                      </span>
                    ))}
                  </div>
                )}
              </td>
              {puedeGestionar && (
                <td>
                  <div className="acciones">
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => iniciarEdicion(m)}
                    >
                      Editar
                    </button>
                    {onEliminar && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar al médico ${m.name}?`)) return;
                          if (editandoId === m.id) limpiarFormulario();
                          await onEliminar(m.id);
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
