import React, { useState } from 'react';

const TIPOS_BOX = ['Consulta general', 'Pediátrico', 'Cardiología', 'Odontológico', 'Procedimientos'];
const ESTADOS_BOX = ['Disponible', 'Mantención', 'Inactivo'];

const CENTRO_VACIO = { nombre: '', ubicacion: '', activo: true };
const BOX_VACIO = { centro: '', nombre: '', tipo: TIPOS_BOX[0], caracteristicas: '', estado: 'Disponible' };

const claseEstadoBox = (estado) =>
  estado === 'Disponible' ? 'badge-ok' : estado === 'Mantención' ? 'badge-warn' : 'badge-off';

export default function GestionCentros({
  centros = [],
  boxes = [],
  onGuardarCentro,
  onGuardarBox,
  onEliminarCentro,
  onEliminarBox
}) {
  // ---------- Centros ----------
  const [formCentro, setFormCentro] = useState(CENTRO_VACIO);
  const [centroEditando, setCentroEditando] = useState(null);
  const [errorCentro, setErrorCentro] = useState('');

  // ---------- Boxes ----------
  const [formBox, setFormBox] = useState(BOX_VACIO);
  const [boxEditando, setBoxEditando] = useState(null);
  const [errorBox, setErrorBox] = useState('');

  const nombreCentro = (id) => centros.find((c) => c.id === id)?.nombre || '—';

  const cancelarCentro = () => {
    setCentroEditando(null);
    setFormCentro(CENTRO_VACIO);
    setErrorCentro('');
  };

  const editarCentro = (c) => {
    setCentroEditando(c.id);
    setFormCentro({ nombre: c.nombre, ubicacion: c.ubicacion || '', activo: c.activo });
    setErrorCentro('');
  };

  const guardarCentro = async (e) => {
    e.preventDefault();
    setErrorCentro('');
    if (!formCentro.nombre.trim()) {
      setErrorCentro('El nombre del centro es obligatorio.');
      return;
    }
    const resultado = await onGuardarCentro(
      {
        nombre: formCentro.nombre.trim(),
        ubicacion: formCentro.ubicacion.trim(),
        activo: formCentro.activo
      },
      centroEditando
    );
    if (resultado) {
      setErrorCentro(resultado);
      return;
    }
    cancelarCentro();
  };

  const cancelarBox = () => {
    setBoxEditando(null);
    setFormBox(BOX_VACIO);
    setErrorBox('');
  };

  const editarBox = (b) => {
    setBoxEditando(b.id);
    setFormBox({
      centro: b.centro,
      nombre: b.nombre,
      tipo: b.tipo,
      caracteristicas: b.caracteristicas || '',
      estado: b.estado
    });
    setErrorBox('');
  };

  const guardarBox = async (e) => {
    e.preventDefault();
    setErrorBox('');
    if (!formBox.centro) {
      setErrorBox('Selecciona el centro del box.');
      return;
    }
    if (!formBox.nombre.trim()) {
      setErrorBox('El nombre del box es obligatorio.');
      return;
    }
    const resultado = await onGuardarBox(
      {
        centro: formBox.centro,
        nombre: formBox.nombre.trim(),
        tipo: formBox.tipo,
        caracteristicas: formBox.caracteristicas.trim(),
        estado: formBox.estado
      },
      boxEditando
    );
    if (resultado) {
      setErrorBox(resultado);
      return;
    }
    cancelarBox();
  };

  const boxesOrdenados = [...boxes].sort(
    (a, b) =>
      nombreCentro(a.centro).localeCompare(nombreCentro(b.centro)) ||
      a.nombre.localeCompare(b.nombre)
  );

  return (
    <div className="card-info">
      <h2>Centros de Atención</h2>

      <form onSubmit={guardarCentro} className="grid-2-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label>Nombre del centro</label>
          <input
            type="text"
            placeholder="Ej: Sede Sur"
            value={formCentro.nombre}
            disabled={!!centroEditando}
            onChange={(e) => setFormCentro({ ...formCentro, nombre: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Estado</label>
          <select
            value={formCentro.activo ? 'activo' : 'inactivo'}
            onChange={(e) => setFormCentro({ ...formCentro, activo: e.target.value === 'activo' })}
          >
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
          </select>
        </div>

        <div className="form-group full-width">
          <label>Ubicación</label>
          <input
            type="text"
            placeholder="Dirección y comuna"
            value={formCentro.ubicacion}
            onChange={(e) => setFormCentro({ ...formCentro, ubicacion: e.target.value })}
          />
        </div>

        {errorCentro && <div className="error-banner full-width">⚠️ {errorCentro}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {centroEditando ? 'Guardar cambios' : '+ Agregar centro'}
          </button>
          {centroEditando && (
            <button type="button" className="btn-outline" onClick={cancelarCentro}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Centro</th>
            <th>Ubicación</th>
            <th>Boxes</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {centros.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.nombre}</strong></td>
              <td>{c.ubicacion || '—'}</td>
              <td>{boxes.filter((b) => b.centro === c.id).length}</td>
              <td>
                <span className={`badge ${c.activo ? 'badge-ok' : 'badge-off'}`}>
                  {c.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="acciones">
                  <button className="btn-outline" onClick={() => editarCentro(c)}>Editar</button>
                  {onEliminarCentro && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar la sucursal "${c.nombre}" y sus boxes asociados?`)) return;
                        if (centroEditando === c.id) cancelarCentro();
                        await onEliminarCentro(c.id);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '28px' }}>Boxes</h2>

      <form onSubmit={guardarBox} className="grid-2-cols" style={{ marginBottom: '16px' }}>
        <div className="form-group">
          <label>Centro</label>
          <select
            value={formBox.centro}
            disabled={!!boxEditando}
            onChange={(e) => setFormBox({ ...formBox, centro: e.target.value })}
          >
            <option value="">-- Seleccionar centro --</option>
            {centros.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Nombre del box</label>
          <input
            type="text"
            placeholder="Ej: Box 107"
            value={formBox.nombre}
            disabled={!!boxEditando}
            onChange={(e) => setFormBox({ ...formBox, nombre: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tipo</label>
          <select
            value={formBox.tipo}
            onChange={(e) => setFormBox({ ...formBox, tipo: e.target.value })}
          >
            {TIPOS_BOX.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Estado de disponibilidad</label>
          <select
            value={formBox.estado}
            onChange={(e) => setFormBox({ ...formBox, estado: e.target.value })}
          >
            {ESTADOS_BOX.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="form-group full-width">
          <label>Características</label>
          <input
            type="text"
            placeholder="Equipamiento, capacidad, etc."
            value={formBox.caracteristicas}
            onChange={(e) => setFormBox({ ...formBox, caracteristicas: e.target.value })}
          />
        </div>

        {errorBox && <div className="error-banner full-width">⚠️ {errorBox}</div>}

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {boxEditando ? 'Guardar cambios' : '+ Agregar box'}
          </button>
          {boxEditando && (
            <button type="button" className="btn-outline" onClick={cancelarBox}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>Centro</th>
            <th>Box</th>
            <th>Tipo</th>
            <th>Características</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {boxesOrdenados.map((b) => (
            <tr key={b.id}>
              <td>{nombreCentro(b.centro)}</td>
              <td><strong>{b.nombre}</strong></td>
              <td>{b.tipo}</td>
              <td>{b.caracteristicas || '—'}</td>
              <td><span className={`badge ${claseEstadoBox(b.estado)}`}>{b.estado}</span></td>
              <td>
                <div className="acciones">
                  <button className="btn-outline" onClick={() => editarBox(b)}>Editar</button>
                  {onEliminarBox && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={async () => {
                        if (!window.confirm(`¿Eliminar el box "${b.nombre}"?`)) return;
                        if (boxEditando === b.id) cancelarBox();
                        await onEliminarBox(b.id);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}