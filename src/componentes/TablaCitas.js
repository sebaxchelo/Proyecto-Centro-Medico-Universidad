import React from 'react';

export default function TablaCitas({
  citas = [],
  onCambiarEstado,
  onReagendar,
  onEliminar,
  esPaciente = false
}) {
  return (
    <div className="card-info">
      <h2>{esPaciente ? 'Mis Citas Médicas' : 'Control General de Citas'}</h2>
      {citas.length === 0 ? (
        <p>No hay citas registradas.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              {!esPaciente && <th>Paciente</th>}
              <th>Médico</th>
              <th>Especialidad</th>
              <th>Centro · Box</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td>{cita.date}</td>
                <td>{cita.time} hrs</td>
                {!esPaciente && <td>{cita.patientName}</td>}
                <td>{cita.profName}</td>
                <td>{cita.specialtyName}</td>
                <td>{cita.centro ? `${cita.centro} · ${cita.box}` : cita.box}</td>
                <td>{cita.reason}</td>
                <td>
                  <span className={`badge badge-${cita.status?.toLowerCase()}`}>{cita.status}</span>
                  {cita.reagendamientos > 0 && (
                    <div className="nota-reagendada">
                      ↻ reagendada{cita.reagendamientos > 1 ? ` (${cita.reagendamientos} veces)` : ''}
                    </div>
                  )}
                </td>
                <td>
                  <div className="acciones">
                    {cita.status === 'Reservada' && onReagendar && (
                      <button className="btn-outline" onClick={() => onReagendar(cita)}>Reagendar</button>
                    )}
                    {cita.status === 'Reservada' && (
                      <button className="btn-secondary" onClick={() => onCambiarEstado(cita.id, 'Cancelada')}>Cancelar</button>
                    )}
                    {!esPaciente && cita.status === 'Reservada' && (
                      <button className="btn-primary" onClick={() => onCambiarEstado(cita.id, 'Completada')}>Atendida</button>
                    )}
                    {onEliminar && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          if (!window.confirm(`¿Eliminar la cita de ${cita.patientName} (${cita.date} ${cita.time})?`)) return;
                          await onEliminar(cita.id);
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
      )}
    </div>
  );
}