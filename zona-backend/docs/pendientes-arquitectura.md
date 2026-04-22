# Pendientes de arquitectura — Sistema Zona

Decisiones de diseño acordadas pero no implementadas. Leer antes de arrancar cada módulo.

---

## 1. RRHH — Sueldos

### Qué queremos
Trazabilidad completa de sueldos por empleado: quién cobró, cuánto, en qué período, con el recibo adjunto (PDF o imagen escaneada). El contador ya maneja la liquidación externa; esto es el registro interno para poder consultar historial.

### Modelo propuesto

```
PayrollRecord
  employee       → FK Employee
  period         → CharField "2025-03" (año-mes, no DateField para evitar ambigüedad de día)
  gross_amount   → DecimalField  (bruto)
  net_amount     → DecimalField  (neto — lo que efectivamente cobró)
  receipt_file   → FileField     (PDF o imagen del recibo firmado)
  notes          → CharField     (opcional)
  registered_by  → FK User
  created_at     → auto
```

### Pendiente decidir antes de codear
- ¿Se necesita desglose de deducciones (aportes, retenciones) o solo bruto/neto?
- ¿Quién puede ver los sueldos de otros? ¿Solo admin/ceo, o cada empleado ve el suyo?
- ¿El `Employee` ya tiene toda la info necesaria (CUIT, CBU) o hay que agregarle campos?

### Impacto en finanzas
Cuando se registra un `PayrollRecord`, automáticamente crear un `Expense` con `category='sueldo'`, `amount=net_amount`, `date=último día del período`. Así los sueldos quedan sumados en el dashboard de gastos sin tener que contarlos dos veces.

---

## 2. Espacios publicitarios — Rentabilidad por cartel

### El problema
El módulo `spaces` ya tiene `AdSpace` (el espacio físico) y `SpaceRental` (lo que cobra al cliente). Falta la mitad del cálculo: cuánto le pagan al dueño del espacio.

### Modelo propuesto: `SpaceLease`

```
SpaceLease
  ad_space       → FK AdSpace
  owner_name     → CharField     (nombre del dueño / razón social)
  monthly_cost   → DecimalField  (lo que se le paga por mes)
  start_date     → DateField
  end_date       → DateField     (null = contrato vigente sin vencimiento fijo)
  notes          → CharField
  created_at     → auto
```

### Cálculo de rentabilidad por espacio

Para un período dado (ej: año 2025):

```
ingreso     = SUM(SpaceRental.price) donde status != 'cancelado' y el período se superpone
costo       = monthly_cost × meses activos del SpaceLease en ese período
meses_vacíos = meses donde hay SpaceLease activo pero ningún SpaceRental activo
neto        = ingreso - costo
```

Los meses vacíos no son un campo separado — salen solos de la diferencia entre el período del contrato con el dueño y los períodos ocupados por clientes.

### Endpoint propuesto
`GET /api/v1/ad-spaces/{id}/rentabilidad/?desde=2025-01&hasta=2025-12`

Devuelve: ingreso, costo, neto, meses_ocupados, meses_vacios, lista de rentals en el período.

---

## 3. OTs con categoría — Diferenciar campañas de producción

### La idea
Hoy todas las OTs son iguales. Pero una OT de "instalar cartel en Av. Corrientes" es distinta a una OT de producción: su ganancia no viene de materiales usados sino de la rentabilidad del espacio publicitario asociado.

### Propuesta futura

Agregar `category` a `WorkOrder`:

```python
class Category(TextChoices):
    PRODUCCION  = 'produccion',  'Producción'    # OTs de fabricación / impresión
    CAMPANA     = 'campana',     'Campaña'        # OTs de espacios publicitarios
    SERVICIO    = 'servicio',    'Servicio'       # Instalación, mantenimiento, etc.
```

### Cómo cambia el cálculo de ganancia según categoría

| Categoría | Ingreso | Costo | Ganancia neta |
|---|---|---|---|
| `produccion` | Budget vinculado | Materiales (StockMovements × unit_price_snapshot) + Expenses directas | `income - material_cost - direct_expenses` |
| `campana` | SpaceRental.price del rental vinculado | Costo proporcional del SpaceLease en ese período | `rental_price - lease_cost_proportional` |
| `servicio` | Budget vinculado | Solo Expenses directas (sin materiales significativos) | `income - direct_expenses` |

### Vínculo OT ↔ SpaceRental
Hoy `SpaceRental` ya tiene `work_order` FK (nullable). Cuando la OT es de tipo `campana`, ese campo se vuelve obligatorio y es desde donde se tira el cálculo de rentabilidad.

### Lo que habría que hacer
1. Agregar `category` a `WorkOrder` con los choices de arriba
2. En el endpoint `resumen-ot`, ramificar el cálculo según `category`
3. En el frontend, mostrar en el detalle de OT la sección de rentabilidad del espacio si es `campana`

### Pendiente decidir antes de codear
- ¿Una OT de campaña puede tener también materiales (lona, bastidor) y que eso entre en el costo? Probablemente sí.
- ¿El `SpaceRental.price` es el precio total del contrato o mensual? (Hoy en el modelo está como total — confirmar)
- ¿Una campaña puede abarcar múltiples espacios (múltiples `SpaceRental`) bajo una misma OT?

---

## Orden de implementación sugerido

1. **`SpaceLease`** — es el más autónomo y el que desbloquea la rentabilidad por cartel
2. **OT category + resumen por campaña** — requiere SpaceLease para ser útil
3. **RRHH / PayrollRecord** — independiente, no tiene dependencias con lo de arriba
