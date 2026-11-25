import React, { useState } from 'react';
import FormularioAgendamiento from './FormularioAgendamiento';
import TablaCitas from './TablaCitas';
import PerfilPaciente from './PerfilPaciente';

const TABS = [
  { id: 'agendar', label: 'Agendar Hora' },
  { id: 'citas', label: 'Mis Citas' },
  { id: 'datos', label: 'Mis Datos' }
];

export default function PanelPaciente({
  usuario,
  propsFormulario,
  citas,
  onCambiarEstadoCita,
  onReagendar,
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
            esPaciente={true}
          />
        )}

        {tab === 'datos' && (
          <PerfilPaciente
            usuario={usuario}
            onActualizar={onActualizarUsuario}
          />
        )}
      </div>
    </>
  );
}
