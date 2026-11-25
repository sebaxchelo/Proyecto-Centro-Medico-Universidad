import React, { useState, useEffect } from 'react';
import './App.css';
import { api } from './api';
import Cabecera from './componentes/Cabecera';
import AccesoSistema from './componentes/AccesoSistema';
import PanelPaciente from './componentes/PanelPaciente';
import PanelMedico from './componentes/PanelMedico';
import PanelRecepcionista from './componentes/PanelRecepcionista';
import PanelAdmin from './componentes/PanelAdmin';
import ModalReagendar from './componentes/ModalReagendar';

export default function App() {
  const [usuario, setUsuario] = useState(null);

  // Datos que vienen de MongoDB
  const [usuarios, setUsuarios] = useState([]);
  const [citas, setCitas] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [centros, setCentros] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorConexion, setErrorConexion] = useState('');

  // Cita que se está reagendando (null = ventana cerrada)
  const [citaReagendando, setCitaReagendando] = useState(null);

  // Listas derivadas
  const pacientes = usuarios.filter(u => u.role === 'Paciente');
  const profesionales = usuarios.filter(u => u.role === 'Médico');
  const personal = usuarios.filter(u => u.role === 'Recepcionista' || u.role === 'Administrador');

  // Carga inicial desde la API
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [listaUsuarios, listaCitas, listaEsp, listaCentros, listaBoxes] = await Promise.all([
          api.getUsuarios(),
          api.getCitas(),
          api.especialidades.listar(),
          api.centros.listar(),
          api.boxes.listar()
        ]);
        setUsuarios(listaUsuarios);
        setCitas(listaCitas);
        setEspecialidades(listaEsp);
        setCentros(listaCentros);
        setBoxes(listaBoxes);
        setErrorConexion('');
      } catch (err) {
        setErrorConexion(err.message);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  // INICIAR SESIÓN (RUT + clave)
  const handleLogin = async (rut, password) => {
    try {
      const encontrado = await api.login(rut, password);
      setUsuario(encontrado);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // REGISTRARSE (solo pacientes, con clave)
  const handleRegistrar = async (datos) => {
    try {
      const nuevo = await api.crearUsuario(datos);
      setUsuarios(prev => [...prev, nuevo]);
      setUsuario(nuevo);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const handleCerrarSesion = () => {
    setCitaReagendando(null);
    setUsuario(null);
  };

  // Agregar nueva cita médica (y actualizar lista de usuarios si se creó el paciente)
  // Devuelve null si salió bien, o el mensaje de error del servidor
  const handleAgendar = async (nuevaCita) => {
    try {
      const creada = await api.crearCita(nuevaCita);
      setCitas(prev => [creada, ...prev]);
      const listaUsuarios = await api.getUsuarios();
      setUsuarios(listaUsuarios);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // Reagendar una cita (nueva fecha, hora y box)
  // Devuelve null si salió bien, o el mensaje de error del servidor
  const handleReagendar = async (idCita, cambios) => {
    try {
      const actualizada = await api.reagendarCita(idCita, cambios);
      setCitas(prev => prev.map(c => (c.id === idCita ? actualizada : c)));
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // Cambiar estado de la cita (Cancelar o Atendida)
  const handleCambiarEstadoCita = async (idCita, nuevoEstado) => {
    try {
      const actualizada = await api.cambiarEstadoCita(idCita, nuevoEstado);
      setCitas(prev => prev.map(c => (c.id === idCita ? actualizada : c)));
    } catch (err) {
      alert(err.message);
    }
  };

  // Agregar personal (Recepcionista, Administrador o Médico)
  const handleAgregarPersonal = async (nuevoPersonal) => {
    try {
      const creado = await api.crearUsuario(nuevoPersonal);
      setUsuarios(prev => [...prev, creado]);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // Actualizar datos de un usuario (Médico o Paciente; sin modificar el RUT)
  const handleActualizarUsuario = async (idUsuario, cambios) => {
    try {
      const actualizado = await api.actualizarUsuario(idUsuario, cambios);
      setUsuarios(prev => prev.map(u => (u.id === idUsuario ? actualizado : u)));
      if (usuario && usuario.id === idUsuario) {
        setUsuario(actualizado);
      }
      const listaCitas = await api.getCitas();
      setCitas(listaCitas);
      return null;
    } catch (err) {
      return err.message;
    }
  };

  // Crea o actualiza un registro (si viene "id" actualiza, si no crea)
  // Devuelve null si salió bien, o el mensaje de error
  const crearGuardador = (setLista, apiCrear, apiActualizar) => async (datos, id) => {
    try {
      if (id) {
        const actualizado = await apiActualizar(id, datos);
        setLista(prev => prev.map(x => (x.id === id ? actualizado : x)));
      } else {
        const nuevo = await apiCrear(datos);
        setLista(prev => [...prev, nuevo]);
      }
      return null;
    } catch (err) {
      return err.message;
    }
  };

  const handleGuardarEspecialidad = crearGuardador(
    setEspecialidades, api.especialidades.crear, api.especialidades.actualizar
  );
  const handleGuardarCentro = crearGuardador(
    setCentros, api.centros.crear, api.centros.actualizar
  );
  const handleGuardarBox = crearGuardador(
    setBoxes, api.boxes.crear, api.boxes.actualizar
  );

  // Eliminar registros (solo Administrador)
  const handleEliminarUsuario = async (idUsuario) => {
    try {
      if (usuario && usuario.id === idUsuario) {
        alert('No puedes eliminar el usuario con el que tienes la sesión iniciada.');
        return;
      }
      await api.eliminarUsuario(idUsuario);
      setUsuarios(prev => prev.filter(u => u.id !== idUsuario));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminarCita = async (idCita) => {
    try {
      await api.eliminarCita(idCita);
      setCitas(prev => prev.filter(c => c.id !== idCita));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminarEspecialidad = async (idEsp) => {
    try {
      await api.especialidades.eliminar(idEsp);
      setEspecialidades(prev => prev.filter(e => e.id !== idEsp));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminarCentro = async (idCentro) => {
    try {
      await api.centros.eliminar(idCentro);
      setCentros(prev => prev.filter(c => c.id !== idCentro));
      setBoxes(prev => prev.filter(b => b.centro !== idCentro));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminarBox = async (idBox) => {
    try {
      await api.boxes.eliminar(idBox);
      setBoxes(prev => prev.filter(b => b.id !== idBox));
    } catch (err) {
      alert(err.message);
    }
  };

  // Propiedades que comparten los 3 formularios de reserva
  const propsFormulario = {
    usuario,
    pacientes,
    especialidades,
    profesionales,
    centros,
    boxes,
    citas,
    onAgendar: handleAgendar
  };

  return (
    <div className="app-container">
      <Cabecera usuario={usuario} onCerrarSesion={handleCerrarSesion} />

      <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {errorConexion && (
          <div className="error-banner" style={{ marginBottom: '12px' }}>
            ⚠️ {errorConexion} Revisa que el backend esté corriendo en el puerto 4000.
          </div>
        )}

        {cargando ? (
          <p style={{ textAlign: 'center', marginTop: '40px' }}>Cargando datos...</p>
        ) : !usuario ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
            <div className="login-card-wrapper">
              <AccesoSistema
                especialidades={especialidades}
                onLogin={handleLogin}
                onRegistrar={handleRegistrar}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* 1. SECCIÓN PACIENTE */}
            {usuario.role === 'Paciente' && (
              <PanelPaciente
                usuario={usuario}
                propsFormulario={propsFormulario}
                citas={citas.filter(c => c.patientRut === usuario.rut)}
                onCambiarEstadoCita={handleCambiarEstadoCita}
                onReagendar={setCitaReagendando}
                onActualizarUsuario={handleActualizarUsuario}
              />
            )}

            {/* 2. SECCIÓN MÉDICO */}
            {usuario.role === 'Médico' && (
              <PanelMedico
                propsFormulario={propsFormulario}
                citas={citas.filter(c => c.profName === usuario.name)}
                onCambiarEstadoCita={handleCambiarEstadoCita}
              />
            )}

            {/* 3. SECCIÓN RECEPCIONISTA */}
            {usuario.role === 'Recepcionista' && (
              <PanelRecepcionista
                propsFormulario={propsFormulario}
                citas={citas}
                pacientes={pacientes}
                profesionales={profesionales}
                personal={personal}
                especialidades={especialidades}
                centros={centros}
                onCambiarEstadoCita={handleCambiarEstadoCita}
                onReagendar={setCitaReagendando}
                onAgregarMedico={handleAgregarPersonal}
                onActualizarUsuario={handleActualizarUsuario}
              />
            )}

            {/* 4. SECCIÓN ADMINISTRADOR */}
            {usuario.role === 'Administrador' && (
              <PanelAdmin
                citas={citas}
                pacientes={pacientes}
                profesionales={profesionales}
                personal={personal}
                especialidades={especialidades}
                centros={centros}
                boxes={boxes}
                onAgregarPersonal={handleAgregarPersonal}
                onActualizarUsuario={handleActualizarUsuario}
                onEliminarUsuario={handleEliminarUsuario}
                onCambiarEstadoCita={handleCambiarEstadoCita}
                onEliminarCita={handleEliminarCita}
                onGuardarEspecialidad={handleGuardarEspecialidad}
                onEliminarEspecialidad={handleEliminarEspecialidad}
                onGuardarCentro={handleGuardarCentro}
                onEliminarCentro={handleEliminarCentro}
                onGuardarBox={handleGuardarBox}
                onEliminarBox={handleEliminarBox}
              />
            )}

          </div>
        )}
      </main>

      {/* Ventana para reagendar */}
      {citaReagendando && (
        <ModalReagendar
          cita={citaReagendando}
          profesionales={profesionales}
          centros={centros}
          boxes={boxes}
          citas={citas}
          onConfirmar={handleReagendar}
          onCerrar={() => setCitaReagendando(null)}
        />
      )}
    </div>
  );
}