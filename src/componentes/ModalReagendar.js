import React, { useState } from 'react';
import {
  DIAS,
  BLOQUES,
  DIAS_POR_DEFECTO,
  fechaHoy,
  horaAhora,
  diaDeSemana,
  buscarAusencia
} from '../horarios';

export default function ModalReagendar({
  cita,
  profesionales = [],
  centros = [],
  boxes = [],
  citas = [],
  onConfirmar,
  onCerrar
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [box, setBox] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const profesional = profesionales.find(p => p.name === cita.profName);
  const centro = centros.find(c => c.nombre === cita.centro);

  const diasAtiende = profesional?.diasAtencion?.length ? profesional.diasAtencion : DIAS_POR_DEFECTO;
  const bloquesProf = profesional?.bloques?.length ? profesional.bloques : BLOQUES;
  const nombresDias = DIAS.filter(d => diasAtiende.includes(d.num)).map(d => d.largo).join(', ');

  const hoy = fechaHoy();
  const ausenciaEnFecha = date && profesional ? buscarAusencia(profesional, date) : null;

  let errorFecha = '';
  if (date) {
    if (date < hoy) {
      errorFecha = 'No puedes elegir una fecha pasada.';
    } else if (ausenciaEnFecha) {
      const rango =
        ausenciaEnFecha.desde === ausenciaEnFecha.hasta
          ? ausenciaEnFecha.desde
          : `${ausenciaEnFecha.desde} al ${ausenciaEnFecha.hasta}`;
      errorFecha = `${cita.profName} no está disponible en esa fecha (${ausenciaEnFecha.tipo}: ${rango}).`;
    } else if (!diasAtiende.includes(diaDeSemana(date))) {
      errorFecha = `${cita.profName} no atiende ese día. Atiende: ${nombresDias}.`;
    }
  }

  // Se ignora la propia cita: así su horario y box actuales quedan como libres
  const activas = citas.filter(c => c.status !== 'Cancelada' && c.id !== cita.id);

  const boxesCentro = boxes
    .filter(b => b.centro === centro?.id)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const medicoOcupado = (hora) =>
    activas.some(c => c.profName === cita.profName && c.date === date && c.time === hora);

  const pacienteOcupado = (hora) =>
    activas.some(c => c.patientRut === cita.patientRut && c.date === date && c.time === hora);

  const boxOcupado = (b, hora) =>
    activas.some(c => c.centro === cita.centro && c.box === b.nombre && c.date === date && c.time === hora);

  const boxesLibres = (hora) =>
    boxesCentro.filter(b => b.estado === 'Disponible' && !boxOcupado(b, hora));

  const yaPaso = (hora) => date === hoy && hora <= horaAhora();

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setTime('');
    setBox('');
    setError('');
  };

  // Al elegir la hora se conserva el box actual si está libre; si no, el primero libre
  const handleTimeChange = (e) => {
    const hora = e.target.value;
    setTime(hora);
    if (!hora) {
      setBox('');
      return;
    }
    const libres = boxesLibres(hora);
    setBox(libres.some(b => b.nombre === cita.box) ? cita.box : (libres[0]?.nombre || ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (errorFecha) {
      setError(errorFecha);
      return;
    }

    setEnviando(true);
    const resultado = await onConfirmar(cita.id, { date, time, box });
    setEnviando(false);

    if (resultado) {
      setError(resultado);
      return;
    }
    onCerrar();
  };

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>Reagendar cita</h2>

        <div className="cita-actual">
          <strong>{cita.profName}</strong> · {cita.specialtyName}
          <br />
          Cita actual: {cita.date} · {cita.time} hrs · {cita.centro} · {cita.box}
        </div>

        <form onSubmit={handleSubmit} className="grid-2-cols">
          <div className="form-group">
            <label>Nueva fecha</label>
            <input
              type="date"
              value={date}
              min={hoy}
              className={errorFecha ? 'input-error' : ''}
              onChange={handleDateChange}
              required
            />
            {errorFecha && <span className="field-error">{errorFecha}</span>}
          </div>

          <div className="form-group">
            <label>Nuevo bloque horario</label>
            <select
              value={time}
              onChange={handleTimeChange}
              required
              disabled={!date || !!errorFecha}
            >
              <option value="">{date ? '-- Hora --' : '-- Elige una fecha --'}</option>
              {bloquesProf.map(b => {
                const ocupado = medicoOcupado(b);
                const propia = !ocupado && pacienteOcupado(b);
                const pasado = yaPaso(b);
                const sinBox = !ocupado && !propia && !pasado && boxesLibres(b).length === 0;
                return (
                  <option key={b} value={b} disabled={ocupado || propia || pasado || sinBox}>
                    {b} hrs
                    {ocupado
                      ? ' (ocupado)'
                      : propia
                        ? ' (ya tienes una cita)'
                        : pasado
                          ? ' (ya pasó)'
                          : sinBox
                            ? ' (sin boxes libres)'
                            : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Box de atención ({cita.centro})</label>
            <select
              value={box}
              onChange={(e) => setBox(e.target.value)}
              required
              disabled={!time}
            >
              <option value="">
                {time ? '-- Elige un box --' : '-- Elige primero la fecha y la hora --'}
              </option>
              {boxesCentro.map(b => {
                const ocupado = time ? boxOcupado(b, time) : false;
                const noDisponible = b.estado !== 'Disponible';
                return (
                  <option key={b.id} value={b.nombre} disabled={ocupado || noDisponible}>
                    {b.nombre} · {b.tipo}
                    {noDisponible ? ` (${b.estado.toLowerCase()})` : ocupado ? ' (ocupado a esa hora)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {error && <div className="error-banner full-width">⚠️ {error}</div>}

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={enviando}>
              {enviando ? 'Reagendando...' : 'Confirmar nuevo horario'}
            </button>
            <button type="button" className="btn-outline" onClick={onCerrar}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}