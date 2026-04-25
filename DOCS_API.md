# 🚀 Sistema Zona - Documentación de API v1

Bienvenido a la referencia técnica de la API de **Sistema Zona**. Este documento sirve como guía principal para la integración con la aplicación móvil y otros servicios.

---

## 🛠 Información General

- **Base URL (Local):** `http://localhost:8000/api/v1/`
- **Formato de Datos:** `JSON`
- **Autenticación:** `JWT (JSON Web Token)`
- **Documentación Interactiva:** 
  - [Swagger UI](http://localhost:8000/api/docs/)
  - [Redoc](http://localhost:8000/api/redoc/)

---

## 🔐 Autenticación

| Endpoint | Método | Descripción |
| :--- | :--- | :--- |
| `/auth/token/` | `POST` | Obtener par de tokens (Access & Refresh) |
| `/auth/token/refresh/` | `POST` | Refrescar el token de acceso expirado |

> [!TIP]
> Para todas las peticiones protegidas, incluya el header: `Authorization: Bearer <su_token_de_acceso>`

---

## 📦 Módulos y Recursos

A continuación se detallan los recursos disponibles en la API. Todos los endpoints siguen el estándar RESTful.

### 👤 Usuarios y Seguridad
- `/users/`: Gestión de usuarios del sistema.
- `/sector-memberships/`: Relación de usuarios con sectores específicos.

### 🤝 Gestión de Clientes
- `/clients/`: Directorio central de clientes y prospectos.

### 💰 Finanzas
- `/expenses/`: Registro de gastos operativos y de obra.
  - `GET /expenses/resumen-ot/{id}/`: Resumen de rentabilidad de una OT específica.
- `/suppliers/`: Gestión de proveedores y contratistas.
- `/supplier-invoices/`: Control de facturas recibidas de proveedores.
  - `POST /supplier-invoices/{id}/mark_paid/`: Marcar factura como pagada.

### 💵 Presupuestos y Ventas
- `/budgets/`: Cabeceras de presupuestos generados.
- `/budget-items/`: Ítems detallados dentro de cada presupuesto.

### 🏭 Producción y Órdenes de Trabajo
- `/work-orders/`: Gestión del flujo de trabajo y estados de órdenes.
  - `POST /work-orders/{id}/mark-delivered/`: Marcar OT como entregada a logística/cliente.
  - `POST /work-orders/{id}/upload-photo/`: Subir evidencia fotográfica (antes/después).
- `/work-order-materials/`: Registro de materiales consumidos por orden.
- `/work-order-notifications/`: Alertas críticas específicas de OTs.
- `/sectors/`: Definición de sectores de la empresa.
- `/sector-tasks/`: Tareas asignadas a sectores específicos.
  - `POST /sector-tasks/{id}/start/`: Iniciar cronómetro de tarea.
  - `POST /sector-tasks/{id}/complete/`: Finalizar tarea (dispara notificaciones a otros sectores).
  - `POST /sector-tasks/{id}/block/`: Marcar tarea como bloqueada por incidencia.

### 🏪 Inventario
- `/products/`: Catálogo de productos y materiales.
- `/stock-movements/`: Historial de entradas y salidas de almacén.
- `/material-reservations/`: Gestión de reservas para producción.
  - `POST /material-reservations/{id}/approve/`: (Admin) Aprobar reserva y descontar stock.
  - `POST /material-reservations/{id}/reject/`: (Admin) Rechazar reserva con motivo.
- `/purchase-requests/`: Solicitudes de compra de insumos faltantes.
  - `POST /purchase-requests/{id}/receive/`: Registrar recepción de mercadería y sumar stock.

### 📍 Espacios Publicitarios
- `/ad-spaces/`: Inventario de espacios físicos o digitales para publicidad.
- `/space-rentals/`: Registro de alquileres de espacios.

### 📊 Campañas
- `/campaigns/`: Gestión de campañas publicitarias.
- `/campaign-spaces/`: Asociación de espacios a campañas específicas.

### 👷 Personal
- `/employees/`: Perfiles detallados de los empleados.

### 🔔 Notificaciones
- `/notifications/`: Sistema central de notificaciones internas del sistema.

### 💬 Comunicación (Real-time)
- `/messages/`: Historial y envío de mensajes internos.
- `/presence/`: Estado de conexión de los usuarios.

---

## 🧪 Ejemplo de Integración (Mobile)

Para obtener la lista de Órdenes de Trabajo desde la App Móvil:

```javascript
const fetchWorkOrders = async (token) => {
  const response = await fetch('http://localhost:8000/api/v1/work-orders/', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return await response.json();
};
```

---

## 📜 Estándares de Respuesta

- `200 OK`: Petición exitosa.
- `201 Created`: Recurso creado exitosamente.
- `400 Bad Request`: Error de validación en los datos enviados.
- `401 Unauthorized`: Token faltante o inválido.
- `403 Forbidden`: El usuario no tiene permisos para esta acción.
- `404 Not Found`: El recurso solicitado no existe.

---
> [!NOTE]
> Esta documentación se actualiza periódicamente. Para detalles técnicos de cada campo (tipos de datos, requeridos, etc.), consulte el **Swagger UI** en su entorno local.
