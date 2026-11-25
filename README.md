# Proyecto-Centro-Medico-Universidad

Sistema web full-stack (MERN) para la gestión de centros médicos, agendamiento de citas, administración de profesionales de la salud, boxes de atención y pacientes.

## Tecnologías y Lenguajes

- **Lenguajes:** JavaScript (ES6+), HTML5, CSS3
- **Frontend:** React 19
- **Backend:** Node.js, Express.js
- **Base de datos:** MongoDB + Mongoose
- **Seguridad:** Encriptación de contraseñas con `bcryptjs`

## Funcionalidades por Rol

- **Paciente:**
  - Registro e inicio de sesión con RUT y clave.
  - Reserva de horas médicas filtrando por especialidad, médico (jornada AM/PM), sucursal, fecha, bloque horario y box disponible.
  - Consulta, reagendamiento y cancelación de sus citas.
  - Edición de sus datos personales (excepto RUT).
- **Médico:**
  - Panel por pestañas para consultar sus citas asignadas (marcar como *Completada* o *Cancelada*) y agendar citas validando automáticamente el RUT de pacientes registrados.
- **Recepcionista:**
  - Panel por pestañas para agendar horas (creando automáticamente la cuenta del paciente si no existe), gestionar todas las citas, añadir/editar médicos (horarios AM/PM, vacaciones, días libres y licencias médicas), gestionar vacaciones del personal y editar datos de pacientes.
- **Administrador:**
  - Panel completo con reportes estadísticos, gestión y eliminación de citas, personal, médicos, pacientes, especialidades, sucursales (centros) y boxes de atención.

## Instalación y Ejecución

### 1. Backend
```bash
cd backend
npm install
# Configura tu archivo .env basándote en .env.example
npm run seed   # (Opcional) Carga datos de prueba (clave general: Clinica123)
npm start      # Inicia la API en http://localhost:4000
```

### 2. Frontend
```bash
npm install
npm start      # Inicia la aplicación en http://localhost:3000
```
