# Guia: Espacios Viales - Campanas - OT - LED Slots

> Documento de referencia. Ultima actualizacion: 28/04/2026

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
- **Pantallas LED** - CRUD de LEDSlots con duracion, repeticiones, precio

---

## 2. Cambios Backend

| Archivo | Cambio |
|---------|--------|
| `work_orders/models.py` | FK `campaign` en WorkOrder |
| `spaces/models.py` | FK `campaign` en SpaceRental |
| `spaces/models.py` | Campo `led_total_seconds_per_hour` en Structure |
| `spaces/models.py` | Modelo LEDSlot completo |
| `spaces/serializers.py` | LEDSlotSerializer + campaign_name en SpaceRentalSerializer |
| `spaces/views.py` | LEDSlotViewSet |
| `core/urls.py` | Ruta led-slots |
| Migraciones | work_orders/0012, spaces/0008 |

---

## 3. Modelo LEDSlot

- `structure` FK -> Structure (pantalla LED)
- `client` FK -> Client
- `campaign` FK -> Campaign (opcional)
- `duration` Decimal + `time_unit` (segundos/minutos/horas)
- `repetitions_per_hour` Int
- `start_date` / `end_date`
- `price` Decimal (negociado por empleado)
- `status` activo/pausado/finalizado
- `seconds_per_hour` propiedad calculada

---

## 4. Tipos de OT

| work_type | Campos extra |
|-----------|--------------|
| general | Ninguno |
| instalacion_espacio_vial | structure |
| mantenimiento_espacio_vial | structure |
| campana | campaign |
| civil | Ninguno |
| electrico | Ninguno |

---

## 5. Disponibilidad en Estructuras

Las cards muestran badge de estado:
- Carteles: por caras con rental activo (DISPONIBLE/PARCIAL/OCUPADO)
- LED: por segundos/hora vendidos vs capacidad total

---

## 6. API Endpoints

| Recurso | URL | Filtros |
|---------|-----|---------|
| LED Slots | /api/v1/led-slots/ | structure, client, campaign, status |
| Work Orders | /api/v1/work-orders/ | campaign, work_type |
| Space Rentals | /api/v1/space-rentals/ | campaign, client, face, status |

---

## 7. Flujos

### Instalar cartel: Structure -> OT instalacion_espacio_vial -> Produccion
### Vender cara: Campaign -> SpaceRental (cara+cliente+campana) -> OT campana -> Produccion
### Vender LED: Campaign -> LEDSlot (pantalla+cliente+duracion+precio) -> OT campana si necesario
