import React, { useState } from 'react';

const ESTADOS = [
  { clave: 'Completada', etiqueta: 'Atendidas', clase: 'ok' },
  { clave: 'Cancelada', etiqueta: 'Canceladas', clase: 'bad' },
  { clave: 'Reservada', etiqueta: 'En proceso', clase: 'info' }
];

const contar = (lista) => ({
  total: lista.length,
  Completada: lista.filter(c => c.status === 'Completada').length,
  Cancelada: lista.filter(c => c.status === 'Cancelada').length,
  Reservada: lista.filter(c => c.status === 'Reservada').length
});

export default function ResumenReportes({ citas = [], profesionales = [], especialidades = [] }) {
  const [medicoSel, setMedicoSel] = useState('todos');
  const [estadoSel, setEstadoSel] = useState('todos');

  const nombreEspecialidad = (id) =>
    especialidades.find(e => e.id === id)?.nombre || '—';

  // Citas según el médico elegido
  const citasMedico = medicoSel === 'todos'
    ? citas
    : citas.filter(c => c.profName === medicoSel);

  const resumen = contar(citasMedico);

  // Desglose por médico (incluye médicos sin citas)
  const filas = profesionales.map(m => ({
    medico: m,
    ...contar(citas.filter(c => c.profName === m.name))
  }));

  // Detalle: se muestra al filtrar por médico o por estado
  const mostrarDetalle = medicoSel !== 'todos' || estadoSel !== 'todos';
  const detalle = citasMedico
    .filter(c => estadoSel === 'todos' || c.status === estadoSel)
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));

  const limpiar = () => {
    setMedicoSel('todos');
    setEstadoSel('todos');
  };

  const alternarEstado = (clave) => setEstadoSel(estadoSel === clave ? 'todos' : clave);

  return (
    <div className="card-info">
      <h2>Resumen de Atenciones</h2>

      <div className="filtro-bar">
        <div>
          <label>Filtrar por médico</label>
          <select value={medicoSel} onChange={(e) => setMedicoSel(e.target.value)}>
            <option value="todos">Todos los médicos</option>
            {profesionales.map(m => (
              <option key={m.id} value={m.name}>
                {m.name} — {nombreEspecialidad(m.specialtyId)}
              </option>
            ))}
          </select>
        </div>

        {(medicoSel !== 'todos' || estadoSel !== 'todos') && (
          <button type="button" className="btn-outline" onClick={limpiar}>
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="stats-grid">
        <button
          type="button"
          className={`stat-card ${estadoSel === 'todos' ? 'active' : ''}`}
          onClick={() => setEstadoSel('todos')}
        >
          <div className="stat-label">Total de consultas</div>
          <div className="stat-value">{resumen.total}</div>
        </button>

        {ESTADOS.map(e => (
          <button
            key={e.clave}
            type="button"
            className={`stat-card ${e.clase} ${estadoSel === e.clave ? 'active' : ''}`}
            onClick={() => alternarEstado(e.clave)}
          >
            <div className="stat-label">{e.etiqueta}</div>
            <div className="stat-value">{resumen[e.clave]}</div>
          </button>
        ))}
      </div>

      <h3>Desglose por médico</h3>
      <p className="form-hint" style={{ marginBottom: '10px' }}>
        "En proceso" son las citas reservadas que aún no se atienden ni se cancelan. Haz clic en un médico para ver su detalle.
      </p>

      <table>
        <thead>
          <tr>
            <th>Médico</th>
            <th>Especialidad</th>
            <th>Total</th>
            <th>Atendidas</th>
            <th>Canceladas</th>
            <th>En proceso</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(f => (
            <tr
              key={f.medico.id}
              className={`fila-click ${medicoSel === f.medico.name ? 'fila-sel' : ''}`}
              onClick={() => setMedicoSel(medicoSel === f.medico.name ? 'todos' : f.medico.name)}
            >
              <td><strong>{f.medico.name}</strong></td>
              <td>{nombreEspecialidad(f.medico.specialtyId)}</td>
              <td>{f.total}</td>
              <td>{f.Completada}</td>
              <td>{f.Cancelada}</td>
              <td>{f.Reservada}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {mostrarDetalle && (
        <>
          <h3 style={{ marginTop: '22px' }}>
            Detalle
            {medicoSel !== 'todos' ? ` · ${medicoSel}` : ''}
            {estadoSel !== 'todos'
              ? ` · ${ESTADOS.find(e => e.clave === estadoSel)?.etiqueta}`
              : ''}
          </h3>

          {detalle.length === 0 ? (
            <p>No hay consultas con ese filtro.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  {medicoSel === 'todos' && <th>Médico</th>}
                  <th>Paciente</th>
                  <th>Centro · Box</th>
                  <th>Motivo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map(c => (
                  <tr key={c.id}>
                    <td>{c.date}</td>
                    <td>{c.time} hrs</td>
                    {medicoSel === 'todos' && <td>{c.profName}</td>}
                    <td>{c.patientName}</td>
                    <td>{c.centro ? `${c.centro} · ${c.box}` : c.box}</td>
                    <td>{c.reason}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}