import React, { useState } from 'react';
import Login from './Login';
import Registro from './Registro';

export default function AccesoSistema({ especialidades, onLogin, onRegistrar }) {
  const [vista, setVista] = useState('login');

  return (
    <div>
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${vista === 'login' ? 'active' : ''}`}
          onClick={() => setVista('login')}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          className={`auth-tab ${vista === 'registro' ? 'active' : ''}`}
          onClick={() => setVista('registro')}
        >
          Registrarse
        </button>
      </div>

      {vista === 'login' ? (
        <Login onLogin={onLogin} onIrARegistro={() => setVista('registro')} />
      ) : (
        <Registro
          especialidades={especialidades}
          onRegistrar={onRegistrar}
          onIrALogin={() => setVista('login')}
        />
      )}
    </div>
  );
}