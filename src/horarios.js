export const DIAS = [
  { num: 1, corto: 'Lun', largo: 'Lunes' },
  { num: 2, corto: 'Mar', largo: 'Martes' },
  { num: 3, corto: 'Mié', largo: 'Miércoles' },
  { num: 4, corto: 'Jue', largo: 'Jueves' },
  { num: 5, corto: 'Vie', largo: 'Viernes' }
];

export const BLOQUES_AM = ['08:30', '09:15', '10:00', '11:30'];
export const BLOQUES_PM = ['14:00', '15:00', '16:00', '17:00'];
export const BLOQUES = [...BLOQUES_AM, ...BLOQUES_PM];
export const DIAS_POR_DEFECTO = [1, 2, 3, 4, 5];
export const TIPOS_AUSENCIA = ['Vacaciones', 'Día no trabajado', 'Licencia médica'];

// Boxes de la clínica (debe coincidir con la lista del backend, routes/citas.js)
export const BOXES = ['Box 101', 'Box 102', 'Box 103', 'Box 104', 'Box 105', 'Box 106'];

// Fecha de hoy en formato YYYY-MM-DD (hora local del navegador)
export const fechaHoy = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

// Hora actual en formato HH:MM
export const horaAhora = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Día de la semana de 'YYYY-MM-DD' (0=domingo ... 6=sábado)
export const diaDeSemana = (fecha) => {
  const [y, m, d] = fecha.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

// Verifica si una fecha cae en una ausencia (vacaciones, día no trabajado o licencia médica)
export const buscarAusencia = (prof, fecha) => {
  if (!prof || !fecha || !Array.isArray(prof.ausencias)) return null;
  return prof.ausencias.find((a) => fecha >= a.desde && fecha <= a.hasta) || null;
};

// Determina la jornada (AM, PM o AM/PM) según los bloques del médico
export const obtenerJornada = (prof) => {
  const bloques = prof?.bloques?.length ? prof.bloques : BLOQUES_AM;
  const tieneAm = bloques.some((b) => BLOQUES_AM.includes(b));
  const tienePm = bloques.some((b) => BLOQUES_PM.includes(b));
  if (tieneAm && tienePm) return 'AM y PM';
  if (tienePm) return 'PM';
  return 'AM';
};

// Texto resumen del horario de un médico
export const resumenHorario = (prof) => {
  const dias = prof?.diasAtencion?.length ? prof.diasAtencion : DIAS_POR_DEFECTO;
  const bloques = prof?.bloques?.length ? prof.bloques : BLOQUES_AM;
  const nombres = DIAS.filter((d) => dias.includes(d.num)).map((d) => d.corto).join(', ');
  const jornada = obtenerJornada(prof);
  return `[${jornada}] ${nombres} · ${bloques.join(', ')} hrs`;
};