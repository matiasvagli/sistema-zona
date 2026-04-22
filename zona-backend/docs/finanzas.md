# Módulo Finanzas — Sistema Zona

## Estado actual (v1 — MVP)

Módulo incremental. Lo que está implementado es la base; la idea es agrandarlo a medida que surjan necesidades.

---

## Qué resuelve

Dos problemas independientes:

1. **Registrar gastos operativos** que no tienen relación con el inventario de producción (insumos de oficina, servicios, alquileres, etc.)
2. **Calcular la ganancia neta por OT** combinando ingreso facturado + costo de materiales usados + gastos directos imputados

---

## Modelo `Expense` (`finanzas`)

| Campo | Tipo | Descripción |
|---|---|---|
| `category` | choices | `insumo` / `servicio` / `alquiler` / `otro` |
| `description` | CharField | Texto libre: "Resmas A4", "Luz febrero", etc. |
| `amount` | DecimalField | Total pagado |
| `date` | DateField | Fecha del gasto |
| `work_order` | FK → WorkOrder (null) | Opcional. Cuando el gasto es directo de una OT (ej: flete especial). `null` = gasto general del período |
| `registered_by` | FK → User | Auto-seteado desde el request |
| `created_at` | auto | |

**Permisos:** solo admins/ceo pueden crear, editar y eliminar. Todos los roles pueden ver.

---

## Endpoints

| Método | URL | Descripción |
|---|---|---|
| GET/POST | `/api/v1/expenses/` | Listar y registrar gastos. Filtra por `?category=` y `?work_order=` |
| GET/PUT/PATCH/DELETE | `/api/v1/expenses/{id}/` | CRUD estándar |
| GET | `/api/v1/expenses/resumen-ot/{work_order_id}/` | Resumen financiero de una OT (admin only) |

---

## Cálculo de ganancia neta por OT

### Endpoint: `GET /api/v1/expenses/resumen-ot/{id}/`

Respuesta:

```json
{
  "work_order_id": 42,
  "work_order_title": "OT-0042: Cartelería campaña verano",
  "income": 150000.00,
  "material_cost": 38250.00,
  "direct_expenses": 5000.00,
  "net": 106750.00
}
```

### Cómo se calcula cada campo

**`income`** — Suma de `BudgetItem.total_price` de todos los presupuestos vinculados a la OT con `status IN ('aprobado', 'facturado')`.

**`material_cost`** — Suma de `abs(qty) × unit_price_snapshot` de todos los `StockMovement`s negativos originados por reservas de materiales de esa OT.

> El campo `unit_price_snapshot` en `StockMovement` guarda el precio promedio ponderado del producto **al momento del egreso**. Esto es clave: el costo refleja el precio real que tenía el material cuando se usó, no el precio actual (que pudo cambiar). Se setea automáticamente vía signal `post_save`.

**`direct_expenses`** — Suma de `Expense.amount` donde `work_order_id` coincide.

**`net`** — `income - material_cost - direct_expenses`

---

## Insumos vs productos de inventario

| | Insumos (finanzas) | Productos (inventario) |
|---|---|---|
| Ejemplos | Hojas, lapiceras, botella de gas, luz | Lona, hierros, perfiles, tintas |
| Se vincula a OTs | Opcional | Sí (vía reservas → stock movements) |
| Tiene stock | No | Sí |
| Registro | Se crea un `Expense` al comprarlo | Se crea un `StockMovement` positivo al recibirlo |
| Impacto en ganancia OT | Solo si se imputa (`work_order != null`) | Siempre, vía `unit_price_snapshot` |

**Regla general:** si el material se consume en la producción de algo para un cliente → inventario. Si es gasto operativo de la empresa → `Expense`.

---

## Campo `unit_price_snapshot` en `StockMovement`

Agregado en migración `0006_unit_price_snapshot`.

- Solo tiene valor en movimientos negativos (egresos)
- Se setea automáticamente vía signal `post_save` en `inventory/models.py`
- Visible solo para admins en el API
- Es la base para calcular `material_cost` en el resumen de OT

```python
# Signal — inventory/models.py
if instance.qty < 0 and instance.unit_price_snapshot is None and product.unit_price:
    StockMovement.objects.filter(pk=instance.pk).update(
        unit_price_snapshot=product.unit_price
    )
```

---

## Pendientes / ideas para cuando crezcamos

- **Dashboard de período**: ingresos del mes vs gastos del mes vs ganancia neta
- **Filtro por rango de fechas** en `/expenses/` (hoy no hay filtro por fecha en el backend)
- **Presupuesto mensual por categoría**: alerta cuando un tipo de gasto supera el límite configurado
- **Exportar a CSV/Excel**: para contaduría
- **Vinculación automática de `PurchaseRequest` → `Expense`**: cuando el admin marca "recibido" un pedido de compra, crear automáticamente un `Expense` de categoría `insumo` o `materia_prima` con el monto total pagado (hoy se registra solo el `StockMovement` de inventario, no el gasto financiero)
- **Costos de mano de obra**: eventualmente sumar el costo de horas-hombre por sector a la ganancia neta de la OT

---

## Notas de diseño

- Los precios de inventario se manejan siempre con **promedio ponderado móvil** — nunca modificar `Product.unit_price` directamente, solo via `StockMovement` con `purchase_price`.
- El módulo `finanzas` es independiente del módulo `inventory`. Se conectan únicamente a través del campo `unit_price_snapshot` y la FK `work_order` en `Expense`.
