# Zona — Sistema de Gestión para Empresa de Publicidad

Sistema integral de gestión operativa, comercial y administrativa para empresas del rubro publicitario. Cubre desde la carga de un trabajo hasta su producción, facturación, control de stock, gestión de empleados y alquiler de espacios publicitarios.

---

## Módulos

### Comercial
- **Clientes** — ABM completo con datos fiscales (CUIT), historial de trabajos y campañas
- **Presupuestos** — Creación con ítems, descuentos y estados (borrador / aprobado / rechazado / facturado). Flujo flexible: puede preceder a una orden de trabajo, vincularse después, o convertirse directamente en factura
- **Facturación electrónica** — Integración con ARCA (ex-AFIP) para emisión de facturas A, B y C. Vinculación automática con presupuestos aprobados

### Producción
- **Órdenes de Trabajo** — Entidad central del sistema. Pueden crearse con o sin presupuesto previo. Estados: pendiente / en proceso / pausada / completada / cancelada. Prioridad normal o inmediata
- **Pipeline por sector** — Cada OT se divide en tareas por sector (Administración, Impresión, Herrería, Armado, Depósito y los que se agreguen). Los sectores son dinámicos: se crean y eliminan sin tocar código. Cada tarea tiene dependencias — un sector no puede arrancar si el anterior no terminó. Cada operario informa su tiempo estimado de finalización, visible para los sectores siguientes
- **Registro fotográfico** — Carga de fotos por OT y por tarea de sector, almacenadas en storage externo (S3 / Cloudflare R2)

### Stock
- **Productos e insumos** — ABM con unidades de medida y stock mínimo configurable
- **Movimientos** — Descuento automático al aprobar un presupuesto. Ajustes manuales con trazabilidad completa
- **Alertas** — Notificación cuando un producto cae por debajo del stock mínimo

### Espacios Publicitarios
- **Cartelería vial** — Registro de espacios con ubicación, dimensiones y fotos. Gestión de disponibilidad por período
- **Alquileres** — Alta de alquileres por cliente con fechas, precio y estado. Posibilidad de generar una OT de instalación asociada

### Campañas
- **Gestión de campañas** — Una campaña agrupa múltiples espacios alquilados por un mismo cliente. Cada espacio tiene su propia creatividad asociada. Seguimiento de fechas y estado general de la campaña

### Empleados y RR.HH
- **Legajos** — Registro de empleados con datos personales, sector asignado y número de legajo
- **App móvil** — Aplicación para empleados: registro de entrada y salida (fichaje), visualización de las tareas asignadas en el pipeline
- **RR.HH (próxima iteración)** — Liquidación de sueldos, control de asistencia, horas extras, vacaciones y licencias

### Administración
- **Usuarios y roles** — Acceso diferenciado por rol: administrador, comercial, operario de sector, depósito. Los roles se asignan sin tocar código
- **Conciliación bancaria** — Importación de extractos bancarios y matching contra facturas emitidas. Detección de pagos no registrados y cobros pendientes

---

## Arquitectura

```
zona-backend          zona-frontend         zona-mobile
────────────────      ─────────────────     ──────────────────
Django 5              Next.js 14            React Native
Django REST Framework Refine                Expo
PostgreSQL            Ant Design
JWT auth              App Router
```

### Apps Django

| App | Responsabilidad |
|---|---|
| `accounts` | Usuarios, roles, permisos |
| `employees` | Legajos, datos de empleados, base para RR.HH |
| `clients` | Clientes y datos fiscales |
| `inventory` | Productos, stock, movimientos |
| `budgets` | Presupuestos e ítems |
| `work_orders` | Órdenes de trabajo |
| `production` | Sectores dinámicos y pipeline de tareas |
| `billing` | Facturación electrónica, integración ARCA/AFIP |
| `spaces` | Espacios publicitarios y alquileres |
| `campaigns` | Campañas multi-espacio |
| `banking` | Conciliación bancaria, extractos |

---

## Flujo principal

```
Cliente solicita trabajo
        │
        ▼
Comercial carga Presupuesto ──► Aprobación ──► Factura directa
        │                                           (sin OT)
        ▼
Se genera Orden de Trabajo
        │
        ▼
Pipeline por sector:
  Administración ──► Impresión ──► Herrería ──► Armado ──► Depósito
        │                │               │           │
    (carga OT)    (estima tiempo)  (ve estado   (ve estado
                                   anterior)    anterior)
        │
        ▼
OT completada ──► Facturación electrónica ──► Conciliación bancaria
```

---

## Roles y accesos

| Rol | Acceso |
|---|---|
| Admin | Todo el sistema, configuración de sectores y usuarios |
| Comercial | Clientes, presupuestos, OTs (lectura), espacios, campañas, facturación |
| Operario | Sus tareas del pipeline, registro fotográfico, app móvil |
| Depósito | Stock, movimientos, alertas de insumos |

---

## Stack técnico

### Backend (`zona-backend`)
```
Python 3.12
Django 5.x
Django REST Framework
djangorestframework-simplejwt
django-cors-headers
django-filter
psycopg2-binary / dj-database-url
python-decouple
```

### Frontend (`zona-frontend`)
```
Next.js 14 (App Router)
Refine
Ant Design
TypeScript
Axios
Day.js
```

### Mobile (`zona-mobile`)
```
React Native
Expo
```

### Infraestructura
```
PostgreSQL
Storage externo: S3 / Cloudflare R2 (fotos)
ARCA API (facturación electrónica)
```

---

## Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Setup, accounts, clients, inventory | Pendiente |
| 2 | Budgets, work orders | Pendiente |
| 3 | Pipeline de producción (sectores dinámicos) | Pendiente |
| 4 | Spaces, campaigns | Pendiente |
| 5 | Frontend web (Next.js + Refine) | Pendiente |
| 6 | Facturación electrónica (ARCA) | Pendiente |
| 7 | App móvil (fichaje + tareas) | Pendiente |
| 8 | Conciliación bancaria | Pendiente |
| 9 | RR.HH completo (sueldos, asistencia, horas extras) | Pendiente |
