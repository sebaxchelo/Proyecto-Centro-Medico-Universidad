import React, { useState, useEffect } from 'react';
import {
  DIAS,
  BLOQUES,
  DIAS_POR_DEFECTO,
  fechaHoy,
  horaAhora,
  diaDeSemana,
  resumenHorario,
  buscarAusencia,
  obtenerJornada
} from '../horarios';
import { formatearRut } from './Registro';

export default function FormularioAgendamiento({
  usuario,
  pacientes = [],
  especialidades = [],
  profesionales = [],
  centros = [],
  boxes = [],
  citas = [],
  onAgendar
}) {
  const esMedico = usuario?.role === 'Médico';

  const [specialtyId, setSpecialtyId] = useState('');
  const [profName, setProfName] = useState('');
  const [centroId, setCentroId] = useState('');
  const [box, setBox] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const [patientRut, setPatientRut] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientPassword, setPatientPassword] = useState('');

  const [errorForm, setErrorForm] = useState('');
  const [enviando, setEnviando] = useState(false);

  const pacienteExistente = pacientes.find((p) => p.rut === patientRut.trim());

  const handlePatientRutChange = (e) => {
    const rutFormateado = formatearRut(e.target.value);
    const anteriorExistente = pacientes.find((p) => p.rut === patientRut.trim());
    setPatientRut(rutFormateado);
    const encontrado = pacientes.find((p) => p.rut === rutFormateado);
    if (encontrado) {
      setPatientName(encontrado.name || '');
      setPatientEmail(encontrado.email || '');
      setPatientPhone(encontrado.phone || '');
      setPatientPassword('');
    } else if (anteriorExistente) {
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setPatientPassword('');
    }
  };

  useEffect(() => {
    if (esMedico) {
      setProfName(usuario.name);
      setSpecialtyId(usuario.specialtyId || '');
    }
  }, [usuario, esMedico]);

  // ----- Especialidad y médico -----
  const opcionesEspecialidad = especialidades.filter(e => e.activa || e.id === specialtyId);
  const espSel = especialidades.find(e => e.id === specialtyId);
  const medicosFiltrados = profesionales.filter(p => p.specialtyId === specialtyId);
  const profesional = profesionales.find(p => p.name === profName);

  // ----- Horario del médico -----
  const diasAtiende = profesional?.diasAtencion?.length ? profesional.diasAtencion : DIAS_POR_DEFECTO;
  const bloquesProf = profesional?.bloques?.length ? profesional.bloques : BLOQUES;
  const nombresDias = DIAS.filter(d => diasAtiende.includes(d.num)).map(d => d.largo).join(', ');

  const hoy = fechaHoy();
  const ausenciaEnFecha = date && profesional ? buscarAusencia(profesional, date) : null;
  const ausenciasVigentes = (profesional?.ausencias || []).filter((a) => a.hasta >= hoy);

  let errorFecha = '';
  if (date) {
    if (date < hoy) {
      errorFecha = 'No puedes elegir una fecha pasada.';
    } else if (ausenciaEnFecha) {
      const rango =
        ausenciaEnFecha.desde === ausenciaEnFecha.hasta
          ? ausenciaEnFecha.desde
          : `${ausenciaEnFecha.desde} al ${ausenciaEnFecha.hasta}`;
      errorFecha = `${profName} no está disponible en esa fecha (${ausenciaEnFecha.tipo}: ${rango}${
        ausenciaEnFecha.motivo ? ` — ${ausenciaEnFecha.motivo}` : ''
      }).`;
    } else if (profesional && !diasAtiende.includes(diaDeSemana(date))) {
      errorFecha = `${profName} no atiende ese día. Atiende: ${nombresDias}.`;
    }
  }

  // ----- Centros donde atiende el médico -----
  const centrosMedico = profesional
    ? centros.filter(c => c.activo && (!profesional.centros?.length || profesional.centros.includes(c.id)))
    : [];
  // Si el médico atiende en un solo centro, se selecciona solo
  const centroIdEfectivo = centroId || (centrosMedico.length === 1 ? centrosMedico[0].id : '');
  const centroSel = centros.find(c => c.id === centroIdEfectivo);

  // ----- Boxes del centro y su disponibilidad por fecha y hora -----
  const boxesCentro = boxes
    .filter(b => b.centro === centroIdEfectivo)
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const activas = citas.filter(c => c.status !== 'Cancelada');

  const ocupados = activas
    .filter(c => c.profName === profName && c.date === date)
    .map(c => c.time);

  const boxOcupado = (b, fecha, hora) =>
    activas.some(c =>
      c.centro === centroSel?.nombre && c.box === b.nombre && c.date === fecha && c.time === hora
    );

  const boxesLibres = (fecha, hora) =>
    boxesCentro.filter(b => b.estado === 'Disponible' && !boxOcupado(b, fecha, hora));

  const yaPaso = (hora) => date === hoy && hora <= horaAhora();

  // ----- Handlers -----
  const handleSpecialtyChange = (e) => {
    setSpecialtyId(e.target.value);
    setCentroId('');
    setTime('');
    setBox('');
    if (!esMedico) setProfName('');
  };

  const handleProfChange = (e) => {
    setProfName(e.target.value);
    setCentroId('');
    setTime('');
    setBox('');
  };

  const handleCentroChange = (e) => {
    setCentroId(e.target.value);
    setTime('');
    setBox('');
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
    setTime('');
    setBox('');
    setErrorForm('');
  };

  // Al elegir la hora se propone el primer box libre del centro
  const handleTimeChange = (e) => {
    const hora = e.target.value;
    setTime(hora);
    if (!hora) {
      setBox('');
      return;
    }
    const libres = boxesLibres(date, hora);
    setBox(libres[0]?.nombre || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (errorFecha) {
      setErrorForm(errorFecha);
      return;
    }
    if (!centroSel) {
      setErrorForm('Selecciona un centro de atención.');
      return;
    }

    if (esMedico) {
      if (!pacienteExistente) {
        setErrorForm('No existe ningún paciente registrado con ese RUT. Verifica el RUT ingresado.');
        return;
      }
    } else if (usuario.role !== 'Paciente' && !pacienteExistente) {
      if (!patientRut.trim() || !patientName.trim() || !patientEmail.trim() || !patientPhone.trim()) {
        setErrorForm('Completa todos los datos del nuevo paciente (RUT, nombre, correo y teléfono).');
        return;
      }
      if (patientPassword.trim().length < 8) {
        setErrorForm('La clave del nuevo paciente es obligatoria y debe tener al menos 8 caracteres.');
        return;
      }
    }

    setEnviando(true);
    const error = await onAgendar({
      specialtyName: espSel ? espSel.nombre : 'General',
      profName: esMedico ? usuario.name : profName,
      centro: centroSel.nombre,
      box,
      reason,
      date,
      time,
      patientRut: usuario.role === 'Paciente' ? usuario.rut : patientRut,
      patientName: usuario.role === 'Paciente' ? usuario.name : patientName,
      patientEmail: usuario.role === 'Paciente' ? usuario.email : patientEmail,
      patientPhone: usuario.role === 'Paciente' ? usuario.phone : patientPhone,
      patientPassword: usuario.role === 'Paciente' ? undefined : patientPassword
    });
    setEnviando(false);

    // Si el servidor rechazó la cita, se muestra el motivo y NO se borra el formulario
    if (error) {
      setErrorForm(error);
      return;
    }

    setReason('');
    setDate('');
    setTime('');
    setBox('');
    setCentroId('');
    setPatientRut('');
    setPatientName('');
    setPatientEmail('');
    setPatientPhone('');
    setPatientPassword('');
    if (!esMedico) {
      setSpecialtyId('');
      setProfName('');
    }
  };

  return (
    <div className="card-form">
      <h2>Reserva de Hora Médica</h2>
      <form onSubmit={handleSubmit} className="grid-2-cols">
        <div className="form-group">
          <label>Especialidad</label>
          <select value={specialtyId} onChange={handleSpecialtyChange} required disabled={esMedico}>
            <option value="">-- Seleccionar --</option>
            {opcionesEspecialidad.map(s => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {esMedico ? (
          <div className="form-group">
            <label>Médico Tratante</label>
            <input type="text" value={usuario.name} disabled style={{ backgroundColor: '#e9ecef', fontWeight: 'bold' }} />
          </div>
        ) : (
          <div className="form-group">
            <label>Profesional de Salud</label>
            <select value={profName} onChange={handleProfChange} required>
              <option value="">-- Seleccionar Médico --</option>
              {medicosFiltrados.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name} ({obtenerJornada(p)})
                </option>
              ))}
            </select>
          </div>
        )}

        {profesional && (
          <div className="form-hint full-width">
            <div>
              🕒 Horario: {resumenHorario(profesional)}
              {espSel ? ` · Duración estándar: ${espSel.duracionMin} min` : ''}
            </div>
            {ausenciasVigentes.length > 0 && (
              <div style={{ marginTop: '4px', color: '#b91c1c', fontWeight: 600 }}>
                🚫 Fechas no disponibles:{' '}
                {ausenciasVigentes
                  .map((a) =>
                    `${a.tipo} (${a.desde === a.hasta ? a.desde : `${a.desde} a ${a.hasta}`}${
                      a.motivo ? `: ${a.motivo}` : ''
                    })`
                  )
                  .join(' · ')}
              </div>
            )}
          </div>
        )}

        <div className="form-group full-width">
          <label>Centro de Atención</label>
          <select
            value={centroIdEfectivo}
            onChange={handleCentroChange}
            required
            disabled={!profName}
          >
            <option value="">
              {!profName
                ? '-- Elige primero un médico --'
                : centrosMedico.length === 0
                  ? '-- Sin centros disponibles --'
                  : '-- Seleccionar centro --'}
            </option>
            {centrosMedico.map(c => (
              <option key={c.id} value={c.id}>
                {c.nombre}{c.ubicacion ? ` — ${c.ubicacion}` : ''}
              </option>
            ))}
          </select>
        </div>

        {esMedico && (
          <div className="patient-section grid-2-cols full-width">
            <h4 className="full-width">
              📋 Datos del Paciente{' '}
              {pacienteExistente ? (
                <span className="badge badge-ok" style={{ marginLeft: '8px' }}>
                  ✓ Paciente encontrado
                </span>
              ) : patientRut.trim() ? (
                <span className="badge badge-cancelada" style={{ marginLeft: '8px' }}>
                  RUT no registrado
                </span>
              ) : null}
            </h4>
            <div className="form-group full-width">
              <label>RUT Paciente</label>
              <input
                type="text"
                placeholder="Ingresa el RUT del paciente (ej: 19.876.543-0)"
                value={patientRut}
                className={patientRut.trim() && !pacienteExistente ? 'input-error' : ''}
                onChange={handlePatientRutChange}
                required
              />
              {patientRut.trim() && !pacienteExistente && (
                <span className="field-error">
                  No existe ningún paciente registrado con este RUT.
                </span>
              )}
            </div>
            {pacienteExistente && (
              <>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input
                    type="text"
                    value={ pacienteExistente.name || '' }
                    disabled
                    style={{ backgroundColor: '#e9ecef', fontWeight: '600' }}
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="text"
                    value={ pacienteExistente.email || '—' }
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={ pacienteExistente.phone || '—' }
                    disabled
                    style={{ backgroundColor: '#e9ecef' }}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {!esMedico && usuario.role !== 'Paciente' && (
          <div className="patient-section grid-2-cols full-width">
            <h4 className="full-width">
              📋 Datos del Paciente{' '}
              {pacienteExistente ? (
                <span className="badge badge-ok" style={{ marginLeft: '8px' }}>
                  Paciente registrado
                </span>
              ) : patientRut.trim() ? (
                <span className="badge badge-reservada" style={{ marginLeft: '8px' }}>
                  Nuevo paciente (se creará automáticamente)
                </span>
              ) : null}
            </h4>
            <div className="form-group">
              <label>RUT Paciente</label>
              <input
                type="text"
                placeholder="Ej: 19.876.543-0"
                value={patientRut}
                onChange={handlePatientRutChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                placeholder="correo@gmail.com"
                value={patientEmail}
                onChange={(e) => setPatientEmail(e.target.value)}
                required={!pacienteExistente}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                placeholder="+56912345678"
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
                required={!pacienteExistente}
              />
            </div>
            {!pacienteExistente && (
              <div className="form-group full-width">
                <label>Clave de acceso del paciente</label>
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres (ej: Clinica123)"
                  value={patientPassword}
                  autoComplete="new-password"
                  onChange={(e) => setPatientPassword(e.target.value)}
                  required
                />
              </div>
            )}
          </div>
        )}

        <div className="form-group full-width">
          <label>Motivo Consulta</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Fecha</label>
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
          <label>Bloque Horario</label>
          <select
            value={time}
            onChange={handleTimeChange}
            required
            disabled={!profName || !centroIdEfectivo || !date || !!errorFecha}
          >
            <option value="">
              {!profName
                ? '-- Elige un médico --'
                : !centroIdEfectivo
                  ? '-- Elige un centro --'
                  : !date
                    ? '-- Elige una fecha --'
                    : '-- Hora --'}
            </option>
            {bloquesProf.map(b => {
              const ocupado = ocupados.includes(b);
              const pasado = yaPaso(b);
              const sinBox = !ocupado && !pasado && boxesLibres(date, b).length === 0;
              return (
                <option key={b} value={b} disabled={ocupado || pasado || sinBox}>
                  {b} hrs
                  {ocupado ? ' (ocupado)' : pasado ? ' (ya pasó)' : sinBox ? ' (sin boxes libres)' : ''}
                </option>
              );
            })}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Box de Atención</label>
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
              const ocupado = time ? boxOcupado(b, date, time) : false;
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

        {errorForm && (
          <div className="error-banner full-width">⚠️ {errorForm}</div>
        )}

        <button type="submit" className="btn-primary full-width" style={{ marginTop: '8px' }} disabled={enviando}>
          {enviando ? 'Reservando...' : 'Confirmar Reserva'}
        </button>
      </form>
    </div>
  );
}