# Guia: Espacios Viales - Campanas - OT - LED Slots

> Documento de referencia. Ultima actualizacion: 29/04/2026

---

## 1. Separacion de Modulos (Frontend)

### Hub de Via Publica (spaces/page.tsx)
Solo infraestructura:
- **Terrenos** - CRUD de Location con geocoding y contratos de alquiler
- **Estructuras** - Cards con tipo, foto, disponibilidad, caras
- **Contratos** - Vencimientos y alertas de terrenos
- **Propietarios** - CRUD de Landlords

### Campanas (campaigns/page.tsx)
Gestion comercial:
- **Campanas** - CRUD de Campaign (nombre, cliente, fechas, presupuesto)
- **Reservas Comerciales** - Alquileres de caras vinculados a campanas y clientes
- **Pantallas LED** - CRUD de LEDSlots con duracion, repeticiones, precio, franja horaria

---

## 2. Reglas de negocio clave

### Estructuras multi-cara (doble, triple, etc.)
- Cada `StructureFace` puede tener UN `SpaceRental` activo por periodo
- Faces diferentes → clientes/campanas diferentes → no hay conflicto
- Una Campaign pertenece a UN cliente; si dos clientes comparten estructura, son dos campanas separadas

### Pantallas LED
- La unidad de venta es **segundos por hora** (`seconds_per_hour = duration × repetitions_per_hour`)
- Multiples `LEDSlot` pueden coexistir en la misma pantalla mientras no superen `led_total_seconds_per_hour`
- Si se quiere vender franjas horarias (prime time / diurno), usar `hour_from` / `hour_to` (0-23)
- `hour_from`/`hour_to` = null significa toda la jornada

### Relacion Campana <-> Espacios (unica fuente de verdad)
- `SpaceRental.campaign` (FK directo) = como vincular una cara a una campana
- `LEDSlot.campaign` (FK directo) = como vincular un slot LED a una campana
- **`CampaignSpace` esta deprecado** - no usar para nuevas funcionalidades

---

## 3. Disponibilidad (implementado)

### API
El endpoint `/api/v1/structures/` incluye el campo `availability` en cada estructura:

**Estructura con caras:**
```json
{
  "availability": {
    "type": "faces",
    "total": 2,
    "occupied": 1,
    "available": 1,
    "status": "parcial"    // disponible | parcial | ocupado | sin_caras
  }
}
```

**Pantalla LED:**
```json
{
  "availability": {
    "type": "led",
    "total": 3600,
    "sold": 300.0,
    "available": 3300.0,
    "pct": 91             // % libre
  }
}
```

### Logica de calculo
- **Caras**: una cara esta ocupada si tiene algun `SpaceRental` con status activo/reservado cuyo rango de fechas incluye HOY
- **LED**: disponible = `led_total_seconds_per_hour - sum(active_slots.seconds_per_hour)`
- Calculado en Python sobre datos prefetcheados (sin N+1)

---

## 4. Modelos relevantes

### LEDSlot
- `structure` FK -> Structure (pantalla LED)
- `client` FK -> Client
- `campaign` FK -> Campaign (opcional)
- `duration` Decimal + `time_unit` (segundos/minutos/horas)
- `repetitions_per_hour` Int
- `hour_from` / `hour_to` Int nullable (franja horaria, 0-23)
- `start_date` / `end_date`
- `price` Decimal
- `status` activo/pausado/finalizado
- `seconds_per_hour` propiedad calculada

### WorkOrder - Tipos
| work_type | Descripcion | Campos extra |
|-----------|-------------|--------------|
| general | OT generica | - |
| instalacion_espacio_vial | Instalar cartel/estructura | structure |
| mantenimiento_espacio_vial | Mantenimiento de estructura | structure |
| campana | Produccion para una campana | campaign |
| civil | Obra civil | - |
| electrico | Trabajo electrico | - |

---

## 5. Flujos

### Instalar estructura nueva
1. Crear `Structure` en Hub de Via Publica
2. Crear OT `work_type=instalacion_espacio_vial` vinculada a la estructura
3. Pipeline de produccion → entregada
4. La estructura queda activa y disponible para alquiler

### Vender cara de cartel
1. Crear `Campaign` para el cliente
2. Crear `SpaceRental` (cara + cliente + fechas + precio) con `campaign` FK
3. Opcional: crear OT `work_type=campana` vinculada a la campana (para produccion del arte/banner)

### Vender tiempo LED
1. Crear `Campaign` para el cliente (o usar existente)
2. Crear `LEDSlot` (pantalla + cliente + segundos + repeticiones + precio)
3. Opcional: indicar franja horaria con `hour_from`/`hour_to`
4. El campo `availability.pct` de la estructura se actualiza automaticamente

---

## 6. Migraciones aplicadas
| Migracion | Contenido |
|-----------|-----------|
| spaces/0008 | FK campaign en SpaceRental + modelo LEDSlot |
| spaces/0009 | LEDSlot.hour_from + LEDSlot.hour_to |
| work_orders/0012 | FK campaign + FK structure en WorkOrder |

---

## 7. Pendiente / Futuro
- Frontend: badge de disponibilidad en cards de estructuras usando `availability`
- Frontend: CRUD de LEDSlots en pagina de campanas
- Financiero: conectar `Campaign.budget_total` con el sistema de presupuestos/facturas (hoy es solo un numero manual)
- Financiero: revenue de campana = suma de SpaceRentals + LEDSlots vinculados
