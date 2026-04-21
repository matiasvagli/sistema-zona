# Modelo de Stock — Sistema Zona

## Resumen del flujo

1. Cada sector carga sus propios productos al inventario
2. Cuando un sector arranca su tarea de una OT, carga los materiales que va a usar → crea una `MaterialReservation` en estado `pendiente`
3. Las admins aprueban o rechazan la reserva
4. Al aprobar → se descuenta el stock automáticamente via `StockMovement`

---

## Modelos

### `Product` (`inventory`)

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | CharField | Nombre del producto |
| `unit` | CharField | Unidad: metros, kg, unidades, etc. |
| `stock_qty` | DecimalField | Stock actual. Se actualiza automáticamente via signal al crear un `StockMovement` |
| `alert_qty` | DecimalField | Umbral de alerta de stock bajo. `0` = sin alerta |
| `unit_price` | DecimalField (null) | **Precio promedio ponderado de costo.** Solo visible para admins y CEO. Se recalcula automáticamente en cada ingreso con precio de compra. Se puede setear manualmente desde el admin. |
| `image` | ImageField | Foto del producto (opcional) |
| `sector` | FK → Sector | Sector dueño del producto. **`null` = producto global/compartido**, disponible para todos los sectores sin restricción cross-sector |

**Regla de sector:** `on_delete=PROTECT`. No se puede borrar un sector si tiene productos asignados. Hay que migrar los productos primero.

**Property `stock_bajo`:** True si `stock_qty <= alert_qty` y `alert_qty > 0`.

**Visibilidad de precios:** El serializer oculta `unit_price` para usuarios con rol `empleado`. Solo `admin`, `ceo` y `is_staff` lo reciben en el API.

---

### `MaterialReservation` (`inventory`)

Reemplaza al antiguo `WorkOrderMaterial`. Vinculada a la tarea del sector, no a la OT directamente.

| Campo | Tipo | Descripción |
|---|---|---|
| `sector_task` | FK → SectorTask | La tarea de sector que origina el pedido |
| `product` | FK → Product | Producto solicitado |
| `quantity` | DecimalField | Cantidad solicitada |
| `notes` | CharField | Observaciones opcionales |
| `status` | choices | `pendiente` / `aprobada` / `rechazada` |
| `is_cross_sector` | BooleanField | Auto-calculado. True si el sector de la tarea ≠ sector del producto |
| `requested_by` | FK → User | Quién hizo el pedido (auto desde request) |
| `approved_by` | FK → User | Quién aprobó o rechazó (null mientras está pendiente) |
| `approved_at` | DateTimeField | Timestamp de la acción de aprobación/rechazo |
| `rejection_reason` | CharField | Motivo de rechazo (opcional) |
| `created_at` | DateTimeField | Auto |

**Unicidad:** `unique_together = (sector_task, product)` — un producto por tarea por vez.

**Cross-sector:** Cuando Impresión necesita un producto de Herrería, `is_cross_sector=True` se setea automáticamente. La aprobación funciona igual. Para productos sin sector asignado (`null`), siempre `is_cross_sector=False`.

---

### `StockMovement` (`inventory`)

| Campo | Tipo | Descripción |
|---|---|---|
| `product` | FK → Product | Producto afectado |
| `qty` | DecimalField | Positivo = ingreso, negativo = egreso |
| `reason` | CharField | Texto libre: "OT-0042 — Herrería", "Ajuste manual", etc. |
| `purchase_price` | DecimalField (null) | Precio unitario de compra. Solo para movimientos positivos (ingresos). Visible solo para admins. |
| `reservation` | FK → MaterialReservation | Link a la reserva que originó el movimiento (null para ajustes manuales) |
| `created_by` | FK → User | Quién registró el movimiento |
| `created_at` | DateTimeField | Auto |

**Signal `post_save`:** Cada vez que se crea un `StockMovement`:
- Actualiza `Product.stock_qty` automáticamente (`stock_qty += qty`).
- Si el movimiento es un **ingreso** (`qty > 0`) y tiene `purchase_price`, recalcula `Product.unit_price` con el **promedio ponderado móvil**:

```
unit_price_nuevo = (unit_price_anterior × stock_anterior + purchase_price × qty_nueva) / (stock_anterior + qty_nueva)
```

Nunca modificar `stock_qty` ni `unit_price` directamente — siempre via `StockMovement`.

---

## Manejo de precios en el frontend

El campo `purchase_price` del `StockMovement` es siempre **precio unitario** (por metro, kg, unidad, etc.). Sin embargo, en el UI nunca se le pide el precio unitario al usuario — se le pide el **precio total de la factura** y el sistema calcula el unitario automáticamente:

```
purchase_price (unitario) = precio_total_factura / cantidad_recibida
```

Ejemplo: comprás 5000 m de lona y pagás $15.000 en total → el usuario ingresa `5000 m` y `$15.000` → el sistema calcula `$3.00/m` y lo guarda.

Mientras se completan los campos, el frontend muestra en tiempo real el precio por unidad resultante para que el admin pueda verificar antes de confirmar.

---

## Permisos

### Roles y acceso al inventario

| Acción | Empleado | Admin / CEO |
|---|---|---|
| Ver productos de su sector + globales | ✅ | ✅ (todos los sectores) |
| Ver precio de costo (`unit_price`) | ❌ | ✅ |
| Crear/editar/eliminar productos | ❌ | ✅ |
| Registrar ingreso de stock (`StockMovement` positivo) | ✅ (solo sus sectores) | ✅ |
| Registrar egreso manual de stock (`qty < 0`) | ❌ | ✅ |
| Poner precio de compra al ingresar stock | ❌ | ✅ |
| Crear reservas de material | ✅ | ✅ |
| Aprobar / rechazar reservas | Solo con permiso `approve_material_reservation` | ✅ |
| Crear solicitud de compra | ✅ | ✅ |
| Marcar solicitud "en compra" / rechazar | ❌ | ✅ |
| Marcar solicitud "recibido" (crea StockMovement) | ❌ | ✅ |

### Permiso custom: `inventory.approve_material_reservation`

Controla quién puede aprobar y rechazar reservas.

Para asignarlo desde el admin de Django:
1. Ir a Admin → Groups → crear o editar grupo "Supervisores" / "Admin"
2. Agregar permiso `inventory | materialreservation | Puede aprobar/rechazar reservas de material`
3. Asignar el grupo a los usuarios que correspondan

**Para cambiar quién aprueba en el futuro:** solo mover el permiso de grupo, sin tocar código.

---

## Endpoints API

| Método | URL | Descripción |
|---|---|---|
| GET/POST | `/api/v1/products/` | Listar y crear productos. Filtra por `?sector=<id>` |
| GET/POST | `/api/v1/material-reservations/` | Listar y crear reservas. Filtra por `?sector_task=`, `?status=`, `?work_order=` |
| POST | `/api/v1/material-reservations/{id}/approve/` | Aprobar reserva → descuenta stock |
| POST | `/api/v1/material-reservations/{id}/reject/` | Rechazar reserva. Body: `{"reason": "..."}` |
| GET/POST | `/api/v1/stock-movements/` | Historial de movimientos de stock |

**Respuesta de `/approve/`:** incluye campo `warning` si el stock era insuficiente al momento de aprobar.

---

## Flujo completo de una OT

```
OT creada por las chicas
    └── SectorTask Herrería (pendiente)
    └── SectorTask Impresión (pendiente)

Herrería arranca su tarea:
    POST /api/v1/material-reservations/
    { sector_task: 5, product: 12, quantity: 3.5, notes: "para el bastidor" }
    → Reserva #1 status=pendiente

Admin aprueba:
    POST /api/v1/material-reservations/1/approve/
    → Reserva #1 status=aprobada
    → StockMovement creado: product=12, qty=-3.5, reason="OT-0042 — Herrería"
    → Product.stock_qty -= 3.5 (automático via signal)
```

---

---

## Modelo `PurchaseRequest` (`inventory`)

Solicitudes de compra de material. Cualquier empleado puede crearlas; los admins las gestionan.

| Campo | Tipo | Descripción |
|---|---|---|
| `product` | FK → Product | Producto a comprar |
| `quantity_requested` | DecimalField | Cantidad solicitada |
| `notes` | CharField | Notas para el admin (opcional) |
| `status` | choices | `pendiente` → `en_compra` → `recibido` / `rechazado` |
| `requested_by` | FK → User | Quién hizo la solicitud |
| `resolved_by` | FK → User | Admin que gestionó |
| `resolved_at` | DateTimeField | Timestamp de resolución |
| `quantity_received` | DecimalField (null) | Cantidad efectivamente recibida (puede diferir de la solicitada) |
| `purchase_price` | DecimalField (null) | Precio pagado. Al recibir, activa el recálculo del promedio ponderado vía `StockMovement` |
| `rejection_reason` | CharField | Motivo de rechazo |

**Endpoints:**

| Método | URL | Descripción |
|---|---|---|
| GET/POST | `/api/v1/purchase-requests/` | Listar y crear solicitudes |
| POST | `/api/v1/purchase-requests/{id}/mark_ordered/` | Admin → "en compra" |
| POST | `/api/v1/purchase-requests/{id}/receive/` | Admin → "recibido". Body: `{"quantity_received": X, "purchase_price": Y}`. Crea StockMovement automáticamente. |
| POST | `/api/v1/purchase-requests/{id}/reject/` | Admin → "rechazado". Body: `{"reason": "..."}` |

---

## Alertas de bajo stock

Cuando `Product.stock_qty <= Product.alert_qty` (y `alert_qty > 0`), la property `stock_bajo` devuelve `True`. El serializer expone este campo.

Pendiente: implementar notificación push/in-app cuando el signal detecta que el stock bajó del umbral post-movimiento.
