import React, { useState } from 'react';
import ResumenReportes from './ResumenReportes';
import TablaCitas from './TablaCitas';
import GestionPersonal from './GestionPersonal';
import TablaProfesionales from './TablaProfesionales';
import TablaPacientes from './TablaPacientes';
import GestionEspecialidades from './GestionEspecialidades';
import GestionCentros from './GestionCentros';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'citas', label: 'Citas' },
  { id: 'personal', label: 'Personal' },
  { id: 'medicos', label: 'Médicos' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'especialidades', label: 'Especialidades' },
  { id: 'centros', label: 'Centros y Boxes' }
];

export default function PanelAdmin({
  citas,
  pacientes,
  profesionales,
  personal,
  especialidades,
  centros,
  boxes,
  onAgregarPersonal,
  onActualizarUsuario,
  onEliminarUsuario,
  onCambiarEstadoCita,
  onEliminarCita,
  onGuardarEspecialidad,
  onEliminarEspecialidad,
  onGuardarCentro,
  onEliminarCentro,
  onGuardarBox,
  onEliminarBox
}) {
  const [tab, setTab] = useState('resumen');

  return (
    <>
      <div className="tabs-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div key={tab}>
        {tab === 'resumen' && (
          <ResumenReportes
            citas={citas}
            profesionales={profesionales}
            especialidades={especialidades}
          />
        )}

        {tab === 'citas' && (
          <TablaCitas
            citas={citas}
            onCambiarEstado={onCambiarEstadoCita}
            onEliminar={onEliminarCita}
            esPaciente={false}
          />
        )}

        {tab === 'personal' && (
          <GestionPersonal
            personal={personal}
            onAgregar={onAgregarPersonal}
            onActualizar={onActualizarUsuario}
            onEliminar={onEliminarUsuario}
          />
        )}

        {tab === 'medicos' && (
          <TablaProfesionales
            profesionales={profesionales}
            especialidades={especialidades}
            centros={centros}
            onAgregar={onAgregarPersonal}
            onActualizar={onActualizarUsuario}
            onEliminar={onEliminarUsuario}
          />
        )}

        {tab === 'pacientes' && (
          <TablaPacientes
            pacientes={pacientes}
            onActualizar={onActualizarUsuario}
            onEliminar={onEliminarUsuario}
          />
        )}

        {tab === 'especialidades' && (
          <GestionEspecialidades
            especialidades={especialidades}
            onGuardar={onGuardarEspecialidad}
            onEliminar={onEliminarEspecialidad}
          />
        )}

        {tab === 'centros' && (
          <GestionCentros
            centros={centros}
            boxes={boxes}
            onGuardarCentro={onGuardarCentro}
            onGuardarBox={onGuardarBox}
            onEliminarCentro={onEliminarCentro}
            onEliminarBox={onEliminarBox}
          />
        )}
      </div>
    </>
  );
}