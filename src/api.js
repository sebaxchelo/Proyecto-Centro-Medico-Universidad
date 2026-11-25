const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
  } catch (err) {
    throw new Error('No se pudo conectar con el servidor.');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 404 && !data.mensaje) {
      throw new Error('Ruta no activa en el backend. Reinicia el servidor backend (Ctrl+C y npm start en la carpeta backend).');
    }
    throw new Error(data.mensaje || 'Error en el servidor.');
  }
  return data;
}

// Funciones estándar (listar / crear / actualizar / eliminar) para un recurso
const crud = (ruta) => ({
  listar: () => request(ruta),
  crear: (datos) => request(ruta, { method: 'POST', body: JSON.stringify(datos) }),
  actualizar: (id, datos) => request(`${ruta}/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminar: (id) => request(`${ruta}/${id}`, { method: 'DELETE' })
});

export const api = {
  getUsuarios: () => request('/usuarios'),
  crearUsuario: (usuario) =>
    request('/usuarios', { method: 'POST', body: JSON.stringify(usuario) }),
  actualizarUsuario: (id, datos) =>
    request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(datos) }),
  eliminarUsuario: (id) =>
    request(`/usuarios/${id}`, { method: 'DELETE' }),
  login: (rut, password) =>
    request('/usuarios/login', { method: 'POST', body: JSON.stringify({ rut, password }) }),

  getCitas: () => request('/citas'),
  crearCita: (cita) =>
    request('/citas', { method: 'POST', body: JSON.stringify(cita) }),
  cambiarEstadoCita: (id, status) =>
    request(`/citas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  reagendarCita: (id, cambios) =>
    request(`/citas/${id}/reagendar`, { method: 'PATCH', body: JSON.stringify(cambios) }),
  eliminarCita: (id) =>
    request(`/citas/${id}`, { method: 'DELETE' }),

  especialidades: crud('/especialidades'),
  centros: crud('/centros'),
  boxes: crud('/boxes')
};