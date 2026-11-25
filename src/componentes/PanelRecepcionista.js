import React, { useState } from 'react';
import FormularioAgendamiento from './FormularioAgendamiento';
import TablaCitas from './TablaCitas';
import TablaProfesionales from './TablaProfesionales';
import TablaPacientes from './TablaPacientes';
import GestionPersonal from './GestionPersonal';

const TABS = [
  { id: 'agendar', label: 'Agendar Hora' },
  { id: 'citas', label: 'Citas' },
  { id: 'medicos', label: 'Médicos' },
  { id: 'personal', label: 'Personal' },
  { id: 'pacientes', label: 'Pacientes' }
];

export default function PanelRecepcionista({
  propsFormulario,
  citas,
  pacientes,
  profesionales,
  personal,
  especialidades,
  centros,
  onCambiarEstadoCita,
  onReagendar,
  onAgregarMedico,
  onActualizarUsuario
}) {
  const [tab, setTab] = useState('agendar');

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
        {tab === 'agendar' && <FormularioAgendamiento {...propsFormulario} />}

        {tab === 'citas' && (
          <TablaCitas
            citas={citas}
            onCambiarEstado={onCambiarEstadoCita}
            onReagendar={onReagendar}
            esPaciente={false}
          />
        )}

        {tab === 'medicos' && (
          <TablaProfesionales
            profesionales={profesionales}
            especialidades={especialidades}
            centros={centros}
            onAgregar={onAgregarMedico}
            onActualizar={onActualizarUsuario}
          />
        )}

        {tab === 'personal' && (
          <GestionPersonal
            personal={personal}
            onAgregar={onAgregarMedico}
            onActualizar={onActualizarUsuario}
          />
        )}

        {tab === 'pacientes' && (
          <TablaPacientes pacientes={pacientes} onActualizar={onActualizarUsuario} />
        )}
      </div>
    </>
  );
}
