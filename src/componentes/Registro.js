import React, { useState } from 'react';

const REGEX_EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)+$/;
const REGEX_TELEFONO = /^(\+?56)?9\d{8}$/;
const LARGO_MINIMO_CLAVE = 8;

export const formatearRut = (valor) => {
  const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (limpio.length <= 1) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpo}-${limpio.slice(-1)}`;
};

export const validarRut = (rut) => {
  const limpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (limpio.length < 8) return false;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }

  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? '0' : resto === 10 ? 'K' : String(resto);
  return dv === dvEsperado;
};

export default function Registro({ onRegistrar, onIrALogin }) {
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  const [errores, setErrores] = useState({});
  const [errorAcceso, setErrorAcceso] = useState('');
  const [enviando, setEnviando] = useState(false);

  const validar = () => {
    const nuevos = {};
    if (!rut.trim()) nuevos.rut = 'El RUT es obligatorio.';
    else if (!validarRut(rut)) nuevos.rut = 'RUT inválido.';

    if (!name.trim()) nuevos.name = 'El nombre es obligatorio.';
    else if (!REGEX_NOMBRE.test(name.trim())) nuevos.name = 'Ingresa nombre y apellido.';

    if (!email.trim()) nuevos.email = 'El correo es obligatorio.';
    else if (!REGEX_EMAIL.test(email.trim())) nuevos.email = 'Correo inválido.';

    if (phone.trim() && !REGEX_TELEFONO.test(phone.replace(/\s/g, ''))) {
      nuevos.phone = 'Celular inválido.';
    }

    if (!password) nuevos.password = 'La clave es obligatoria.';
    else if (password.length < LARGO_MINIMO_CLAVE) {
      nuevos.password = `Mínimo ${LARGO_MINIMO_CLAVE} caracteres.`;
    }

    if (!password2) nuevos.password2 = 'Repite tu clave.';
    else if (password && password2 !== password) nuevos.password2 = 'Las claves no coinciden.';

    return nuevos;
  };

  const limpiarError = (campo) => {
    if (errores[campo]) setErrores((prev) => ({ ...prev, [campo]: '' }));
    if (errorAcceso) setErrorAcceso('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorAcceso('');

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    const error = await onRegistrar({
      rut,
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\s/g, ''),
      password,
      role: 'Paciente'
    });
    setEnviando(false);

    if (error) setErrorAcceso(error);
  };

  return (
    <div className="login-form">
      <h2 style={{ textAlign: 'center', marginBottom: '8px', fontSize: '1.3rem' }}>
        Crear Cuenta de Paciente
      </h2>
      <p className="form-hint" style={{ textAlign: 'center', marginBottom: '12px' }}>
        El personal de la clínica es registrado por el administrador.
      </p>

      <form onSubmit={handleSubmit} className="grid-2-cols" noValidate>
        <div className="form-group">
          <label>RUT</label>
          <input
            type="text"
            placeholder="Ej: 19.876.543-0"
            value={rut}
            className={errores.rut ? 'input-error' : ''}
            onChange={(e) => {
              setRut(formatearRut(e.target.value));
              limpiarError('rut');
            }}
          />
          {errores.rut && <span className="field-error">{errores.rut}</span>}
        </div>

        <div className="form-group">
          <label>Nombre Completo</label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez"
            value={name}
            className={errores.name ? 'input-error' : ''}
            onChange={(e) => {
              setName(e.target.value);
              limpiarError('name');
            }}
          />
          {errores.name && <span className="field-error">{errores.name}</span>}
        </div>

        <div className="form-group">
          <label>Correo Electrónico</label>
          <input
            type="text"
            placeholder="correo@gmail.com"
            value={email}
            className={errores.email ? 'input-error' : ''}
            onChange={(e) => {
              setEmail(e.target.value);
              limpiarError('email');
            }}
          />
          {errores.email && <span className="field-error">{errores.email}</span>}
        </div>

        <div className="form-group">
          <label>Teléfono (opcional)</label>
          <input
            type="tel"
            placeholder="+56912345678"
            value={phone}
            className={errores.phone ? 'input-error' : ''}
            onChange={(e) => {
              setPhone(e.target.value);
              limpiarError('phone');
            }}
          />
          {errores.phone && <span className="field-error">{errores.phone}</span>}
        </div>

        <div className="form-group">
          <label>Clave</label>
          <input
            type="password"
            placeholder={`Mínimo ${LARGO_MINIMO_CLAVE} caracteres`}
            value={password}
            autoComplete="new-password"
            className={errores.password ? 'input-error' : ''}
            onChange={(e) => {
              setPassword(e.target.value);
              limpiarError('password');
            }}
          />
          {errores.password && <span className="field-error">{errores.password}</span>}
        </div>

        <div className="form-group">
          <label>Repetir Clave</label>
          <input
            type="password"
            placeholder="Repite tu clave"
            value={password2}
            autoComplete="new-password"
            className={errores.password2 ? 'input-error' : ''}
            onChange={(e) => {
              setPassword2(e.target.value);
              limpiarError('password2');
            }}
          />
          {errores.password2 && <span className="field-error">{errores.password2}</span>}
        </div>

        {errorAcceso && (
          <div className="error-banner full-width">
            🔒 {errorAcceso}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary full-width"
          style={{ marginTop: '10px' }}
          disabled={enviando}
        >
          {enviando ? 'Creando cuenta...' : 'Crear Cuenta'}
        </button>
      </form>

      <p className="auth-switch">
        ¿Ya tienes cuenta?{' '}
        <button type="button" className="link-btn" onClick={onIrALogin}>
          Inicia sesión
        </button>
      </p>
    </div>
  );
}
