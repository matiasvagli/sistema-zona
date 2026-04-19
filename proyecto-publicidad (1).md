# Sistema de Gestión — Empresa de Publicidad

## Repositorios

| Repo | Stack | Puerto dev |
|---|---|---|
| `zona-backend` | Python · Django · DRF | 8000 |
| `zona-frontend` | Next.js · Refine · Ant Design | 3000 |

Dos repos separados. Cada uno tiene su propio ciclo de deploy, sus dependencias y sus migraciones. No hay monorepo.

---

## Decisiones de entorno cerradas

- **Nombres de repos:** `zona-backend` / `zona-frontend`
- **UI library:** Ant Design (mejor soporte con Refine, componentes de tabla/kanban/form completos)
- **DB dev:** PostgreSQL vía Docker (`docker-compose.yml` incluido en `zona-backend`)
- **Sectores:** dinámicos — se crean y eliminan desde admin. No son estáticos en código.
  - Sectores iniciales de referencia: Administración, Impresión, Herrería, Armado, Depósito
  - "Administración" es de donde sale el trabajo (quien carga la OT)
  - "Armado" recibe el trabajo post-impresión pero puede recibir materiales directos si no hay etapa de impresión
- **OTs sin presupuesto:** permitido. Una OT puede existir sin presupuesto asociado.
- **Presupuesto flexible:** el presupuesto puede cargarse después de la OT, o convertirse directamente en factura sin pasar por OT intermedia.
- **Fotos de trabajos y carteles:** storage externo (S3 / Cloudflare R2 / similar) a definir luego. Los modelos usan `JSONField` con lista de URLs para no bloquear el desarrollo inicial.
- **Deploy:** no definido aún, ignorar en esta etapa.

---

## Apps Django (`zona-backend`)

```
zona_backend/
├── accounts/        # Usuarios, roles, permisos
├── clients/         # Clientes
├── inventory/       # Productos y stock
├── budgets/         # Presupuestos (opcionales, se pueden cargar post-OT)
├── work_orders/     # Orden de trabajo (entidad central)
├── production/      # Pipeline de tareas por sector (sectores dinámicos)
├── spaces/          # Cartelería vial y disponibilidad de espacios
└── campaigns/       # Campañas de clientes (alquiler de espacios)
```

### Por qué esta separación

- **Un sector no es una app.** `production` maneja todos los sectores vía datos. Agregar o sacar un sector es un CRUD en admin, no un cambio de código.
- **`work_orders` y `production` son apps distintas** porque la orden existe aunque no tenga sectores asignados. La orden es el trabajo; las tareas de sector son la ejecución.
- **`budgets` es opcional** en el flujo — una OT puede nacer sin presupuesto y el presupuesto se puede cargar después o emitir como factura directa.
- **`spaces` y `campaigns` son independientes** de producción — pueden funcionar sin generar una OT.
- **`clients` separado** porque tanto budgets, OTs, espacios y campañas referencian al mismo cliente.

---

## Modelos clave

### `accounts`

```python
# Roles manejados con Groups de Django
# grupos: admin, comercial, operario, deposito, etc.
# Se agregan/sacan grupos sin tocar código

User (AbstractUser)
  - groups (ManyToMany → Group)       # rol
  - sector (FK → Sector, nullable)    # a qué sector pertenece el operario
```

### `clients`

```python
Client
  - name
  - tax_id            # CUIT
  - address
  - phone
  - email
  - notes
  - is_active
```

### `inventory`

```python
Product
  - name
  - unit              # metros, unidades, kg, etc.
  - stock_qty
  - alert_qty         # stock mínimo para alerta

StockMovement
  - product (FK)
  - qty               # negativo = egreso
  - reason            # "OT-0042", "ajuste manual", etc.
  - created_at
  - created_by (FK → User)
```

### `budgets`

```python
Budget
  - client (FK → Client)
  - work_order (FK → WorkOrder, nullable)  # puede vincularse después
  - status            # borrador | aprobado | rechazado | facturado
  - created_by (FK → User)
  - created_at
  - notes

BudgetItem
  - budget (FK)
  - product (FK → Product, nullable)   # puede ser servicio sin stock
  - description
  - qty
  - unit_price
  - discount_pct

# Flujos posibles:
# 1. Budget aprobado → genera WorkOrder → descuenta stock
# 2. WorkOrder creada → Budget cargado después y vinculado
# 3. Budget aprobado → factura directa (sin OT de producción)
```

### `work_orders`

```python
WorkOrder
  - title
  - client (FK → Client, nullable)
  - budget (FK → Budget, nullable)    # puede no tener
  - status            # pendiente | en_proceso | pausada | completada | cancelada
  - priority          # normal | inmediata
  - due_date
  - notes
  - photos            # JSONField — lista de URLs a storage externo
  - created_by (FK → User)
  - created_at
```

### `production` — el corazón del pipeline

```python
Sector
  - name              # "Impresión", "Herrería", "Armado", etc. — dinámico
  - order             # orden visual por defecto en el pipeline
  - is_active

SectorTask
  - work_order (FK → WorkOrder)
  - sector (FK → Sector)
  - depends_on (FK → SectorTask, nullable, self-ref)
                      # no puede iniciar hasta que depends_on esté completada
  - status            # pendiente | en_proceso | completada | bloqueada
  - priority          # normal | inmediata (heredada de OT, sobreescribible)
  - assigned_to (FK → User, nullable)
  - estimated_finish  # el operario lo pone al tomar la tarea
                      # visible para todos los sectores siguientes
  - started_at
  - finished_at
  - notes
  - photos            # JSONField — lista de URLs a storage externo
```

**Regla de negocio central:**
Cuando un operario intenta poner su `SectorTask` en `en_proceso`, el backend verifica que su `depends_on` esté en `completada`. Si no → 400 con mensaje claro. La lógica vive en el backend, no en el frontend.

---

## Flujo completo de una Orden de Trabajo

```
[Opción A — con presupuesto previo]
Comercial crea Presupuesto → cliente aprueba → se aprueba en sistema
  → se descuenta stock
  → se crea WorkOrder automáticamente
  → se asignan SectorTasks

[Opción B — OT directa]
Administración crea WorkOrder manualmente
  → se asignan sectores
  → presupuesto se carga después (o nunca)

[En ambos casos, el pipeline es igual]
Sector toma tarea → pone estimated_finish → trabaja → marca completada
  → siguiente sector ve que puede arrancar
  → cuando todas las tasks están completadas → OT pasa a completada
```

---

## Módulos especiales

### `spaces` — Cartelería vial

```python
AdSpace
  - name              # "Cartel Ruta 2 km 43"
  - location_desc
  - latitude / longitude (opcional)
  - dimensions
  - photos            # JSONField URLs
  - is_active

SpaceRental
  - ad_space (FK → AdSpace)
  - client (FK → Client)
  - start_date / end_date
  - price
  - status            # reservado | activo | finalizado
  - work_order (FK → WorkOrder, nullable)  # si requiere instalación
```

### `campaigns`

```python
Campaign
  - client (FK → Client)
  - name
  - start_date / end_date
  - status            # borrador | activa | finalizada
  - budget_total
  - notes

CampaignSpace
  - campaign (FK → Campaign)
  - space_rental (FK → SpaceRental)
  - creative_url      # URL a archivo en storage externo
  - notes
```

---

## Frontend (`zona-frontend`)

**Stack:** Next.js 14 (App Router) + Refine + Ant Design

**Vistas por rol:**

| Rol | Qué ve |
|---|---|
| Admin | Todo. Config de sectores, usuarios, roles |
| Comercial / Admin OT | Clientes, Presupuestos, WorkOrders, Espacios, Campañas |
| Operario de sector | Su queue de SectorTasks + estado de tasks previas de su OT |
| Depósito | Stock, movimientos, alertas |

**Vista de pipeline:**
Kanban por WorkOrder. Cada columna = un sector. Cada card = SectorTask con estado (color), prioridad, `estimated_finish` visible. Un sector puede ver el estado de los anteriores pero solo puede actuar sobre sus propias tasks.

---

## Orden de desarrollo

### Fase 1 — Base
1. Setup Django, DRF, JWT, CORS, Docker + PostgreSQL
2. App `accounts` — usuarios, grupos, auth endpoints
3. App `clients` — CRUD clientes
4. App `inventory` — productos, stock, movimientos

### Fase 2 — Núcleo comercial
5. App `budgets` — presupuestos, ítems, estados, vinculación con OT
6. App `work_orders` — CRUD OTs, estados, prioridad

### Fase 3 — Pipeline
7. App `production` — Sector (CRUD dinámico), SectorTask, lógica depends_on
8. Endpoints con semántica: `start/`, `complete/`, `block/`, `set-estimate/`

### Fase 4 — Módulos de negocio
9. App `spaces` — AdSpace, SpaceRental, disponibilidad
10. App `campaigns` — Campaign, CampaignSpace

### Fase 5 — Frontend
11. Setup Next.js + Refine + Ant Design, auth, layout por rol
12. Vistas Clientes, Productos, Presupuestos, WorkOrders
13. Vista pipeline kanban
14. Vistas Spaces y Campaigns

---

## Stack técnico

### Backend
```
Django 5.x
djangorestframework
djangorestframework-simplejwt
django-cors-headers
django-filter
psycopg2-binary
python-decouple
Pillow
```

### Frontend
```
Next.js 14 (App Router)
@refinedev/core
@refinedev/nextjs-router
@refinedev/antd
antd
axios
dayjs
```

---

## Convenciones

- Todos los endpoints bajo `/api/v1/`
- Paginación por defecto: `PageNumberPagination`, `page_size=20`
- Fechas en ISO 8601, timezone UTC
- Soft delete: WorkOrder y Budget no se borran — se cancelan/rechazan
- **Estados siempre via endpoints con semántica propia** — nunca PATCH libre al campo `status`:
  - `POST /api/v1/work-orders/{id}/approve/`
  - `POST /api/v1/sector-tasks/{id}/start/`
  - `POST /api/v1/sector-tasks/{id}/complete/`
  - `POST /api/v1/sector-tasks/{id}/set-estimate/`
- Fotos: `JSONField` con lista de URLs a storage externo (integración pendiente — no bloquea desarrollo)


Agregado — App `employees`

App separada desde el arranque para no mezclar con `accounts` y dejar la base para RR.HH futuro.

```
zona_backend/
└── employees/       # Datos de empleados, base para RR.HH futuro
```

### Modelo

```python
Employee
  - user (OneToOne → User)       # login, rol y permisos viven en User
  - first_name
  - last_name
  - legajo                       # número interno
  - sector (FK → Sector)         # sector principal donde trabaja
  - phone
  - is_active

# Campos que se agregan cuando llegue RR.HH (no ahora):
# - salary, hire_date, schedule, overtime_rate, etc.
```

### Relación con el pipeline

`SectorTask.assigned_to` apunta a `User`. Para saber qué empleado fue, se hace `task.assigned_to.employee`. Así en cualquier vista o reporte se puede mostrar nombre y legajo de quien ejecutó cada tarea.

### Lo que NO se hace ahora

- Fichaje / control de asistencia
- Horas extras
- Liquidación de sueldos
- Vacaciones / licencias

Todo eso va en una segunda iteración de esta misma app.