import React, { useState } from 'react';
import FormularioAgendamiento from './FormularioAgendamiento';
import TablaCitas from './TablaCitas';

const TABS = [
  { id: 'citas', label: 'Mis Citas' },
  { id: 'agendar', label: 'Agendar Cita' }
];

export default function PanelMedico({
  propsFormulario,
  citas,
  onCambiarEstadoCita
}) {
  const [tab, setTab] = useState('citas');

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
        {tab === 'citas' && (
          <TablaCitas
            citas={citas}
            onCambiarEstado={onCambiarEstadoCita}
            esPaciente={false}
          />
        )}

        {tab === 'agendar' && <FormularioAgendamiento {...propsFormulario} />}
      </div>
    </>
  );
}
