import React from 'react';

export default function Cabecera({ usuario, onCerrarSesion }) {
  return (
    <header className="cabecera-container">
      <div className="cabecera-brand">
        <span className="cabecera-icon">🏥</span>
        <h1 className="cabecera-title">Clínica Salud Integral</h1>
      </div>

      {usuario && (
        <div className="cabecera-user-section">
          <span className="cabecera-user-info">
            Bienvenido(a), <strong>{usuario.name}</strong> ({usuario.role})
          </span>
          <button onClick={onCerrarSesion} className="btn-logout">
            Cerrar Sesión
          </button>
        </div>
      )}
    </header>
  );
}