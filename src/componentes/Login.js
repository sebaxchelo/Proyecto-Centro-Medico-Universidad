import React, { useState } from 'react';
import { formatearRut } from './Registro';

export default function Login({ onLogin, onIrARegistro }) {
  const [rut, setRut] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rut.trim() || !password) {
      setError('Ingresa tu RUT y tu clave.');
      return;
    }

    setEnviando(true);
    const resultado = await onLogin(rut, password);
    setEnviando(false);
    if (resultado) setError(resultado);
  };

  return (
    <div className="login-form">
      <h2 style={{ textAlign: 'center', marginBottom: '14px', fontSize: '1.3rem' }}>
        Iniciar Sesión
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>RUT Usuario</label>
          <input
            type="text"
            placeholder="Ej: 19.876.543-0"
            value={rut}
            className={error ? 'input-error' : ''}
            onChange={(e) => {
              setRut(formatearRut(e.target.value));
              setError('');
            }}
          />
        </div>

        <div className="form-group">
          <label>Clave</label>
          <input
            type="password"
            placeholder="Tu clave"
            value={password}
            autoComplete="current-password"
            className={error ? 'input-error' : ''}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
          />
        </div>

        {error && <div className="error-banner">🔒 {error}</div>}

        <button
          type="submit"
          className="btn-primary"
          style={{ width: '100%', marginTop: '10px' }}
          disabled={enviando}
        >
          {enviando ? 'Ingresando...' : 'Ingresar al Sistema'}
        </button>
      </form>

      <p className="auth-switch">
        ¿No tienes cuenta?{' '}
        <button type="button" className="link-btn" onClick={onIrARegistro}>
          Regístrate
        </button>
      </p>

      <div className="auth-hint">
        <strong>Usuarios de prueba</strong> (clave para todos: Clinica123)
        <br />19.876.543-0 (Paciente) · 15.123.456-7 (Médico)
        <br />14.555.666-7 (Recepcionista) · 11.111.111-1 (Administrador)
      </div>
    </div>
  );
}