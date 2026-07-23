# Alerta Plus

Sistema web para la gestión de ventas, encuestas comerciales y validación de operaciones por parte de jefatura.

La aplicación permite a vendedores cargar nuevas ventas, adjuntar documentación obligatoria, consultar el estado de sus operaciones y visualizar estadísticas. Por otro lado, el perfil de jefatura puede revisar ventas recibidas, cambiar estados, gestionar vendedores y supervisar el flujo general del sistema.

## Características principales

### Vendedor
- Inicio de sesión con cuenta personal
- Registro de nuevos vendedores
- Carga de nuevas ventas
- Formulario completo de encuesta comercial
- Resumen dinámico de la venta mientras se completa el formulario
- Carga de DNI frente y dorso
- Consulta de ventas registradas
- Edición de ventas pendientes
- Visualización del detalle de cada venta
- Cambio de tema claro / oscuro
- Actualización de perfil y contraseña

### Jefatura
- Panel de control con estadísticas
- Visualización de ventas recibidas en central
- Filtro por estado, vendedor y búsqueda
- Cambio de estado de ventas
- Observaciones de jefatura
- Gestión de vendedores
- Alta, baja y reactivación de usuarios
- Visualización de documentación adjunta

### Interfaz
- Diseño moderno y responsivo
- Vista adaptada para escritorio, tablet y móvil
- Sidebar lateral para navegación
- Modal para cambio de estado
- Modal para visualización de DNI
- Dashboard con gráfico de actividad

## Tecnologías utilizadas

- **Node.js**
- **JavaScript Vanilla**
- **HTML5**
- **CSS3**
- **JSON** como almacenamiento local de datos

## Estructura del proyecto

```bash
alerta-plus/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── assets/
├── data/
│   ├── users.json
│   ├── surveys.json
│   └── ...
├── server.js
├── package.json
└── README.md
