# Deuda Técnica — Sistema Zona

Bugs conocidos que no se resolvieron de inmediato. Resolver antes de pasar el sistema a producción con volumen real.

---

## DT-01 — Overselling silencioso en Pantallas LED

**Severidad:** Alta  
**Archivos:** `zona-backend/spaces/serializers.py`, `zona-backend/spaces/models.py`

### El problema

El sistema acepta crear `LEDSlot`s que, sumados, superan la capacidad total de la pantalla. No hay ninguna validación que lo impida. Cuando ocurre, el backend calcula `available_day = max(0, total_day - sold_day)` y clampea a 0, mostrando "COMPLETO" o "0% libre" — sin ningún warning de que la pantalla está sobre-vendida.

**Ejemplo concreto:** pantalla con 3600 seg/h × 18h = 64.800 seg/día. Si se cargan slots que suman 70.000 seg/día, el sistema muestra 0% disponible pero nadie sabe que hay 5.200 seg vendidos de más.

### Qué hay que hacer

1. **En el serializer** (`LEDSlotSerializer`), agregar un método `validate()` que calcule el `sold_day` actual de la pantalla y verifique que al agregar el nuevo slot no se supera `total_day`:

```python
def validate(self, data):
    structure = data.get('structure') or self.instance.structure
    op_hours = structure.led_operating_hours or 24
    sec_per_hour = structure.led_total_seconds_per_hour or 3600
    total_day = sec_per_hour * op_hours

    # calcular segundos del slot entrante
    d = float(data['duration'])
    if data.get('time_unit') == 'minutos':
        d *= 60
    elif data.get('time_unit') == 'horas':
        d *= 3600
    new_slot_sph = d * data.get('repetitions_per_hour', 1)
    hour_from = data.get('hour_from')
    hour_to = data.get('hour_to')
    if hour_from is not None and hour_to is not None:
        new_slot_hours = max(0, hour_to - hour_from)
    else:
        new_slot_hours = op_hours
    new_slot_contribution = new_slot_sph * new_slot_hours

    # sold_day actual (excluyendo el slot que se está editando si es update)
    existing = structure.led_slots.filter(status='activo')
    if self.instance:
        existing = existing.exclude(pk=self.instance.pk)
    sold_day = 0
    for s in existing:
        sh = max(0, s.hour_to - s.hour_from) if (s.hour_from is not None and s.hour_to is not None) else op_hours
        sold_day += s.seconds_per_hour * sh

    if sold_day + new_slot_contribution > total_day:
        raise serializers.ValidationError(
            f"Capacidad insuficiente. Disponible: {round(total_day - sold_day, 0)} seg/día, "
            f"requerido por este slot: {round(new_slot_contribution, 0)} seg/día."
        )
    return data
```

2. **Opcional:** agregar un campo calculado `is_oversold` en el serializer de `Structure` para que el frontend pueda mostrar un badge de alerta.

---

## DT-02 — `SpaceRental.face` nullable sin validación

**Severidad:** Media  
**Archivos:** `zona-backend/spaces/models.py`, `zona-backend/spaces/serializers.py`

### El problema

El campo `SpaceRental.face` es `null=True, blank=True` por compatibilidad con una migración anterior. Esto significa que una renta puede existir en la base de datos sin estar asociada a ninguna cara de estructura. Consecuencias:

- La renta **no aparece** en el cálculo de disponibilidad de ninguna cara.
- La renta **sí aparece** en la tabla de Reservas del frontend, pero sin cara/estructura/ubicación.
- No hay ningún error visible — es un hueco de datos silencioso.

Desde el form del frontend siempre se carga con cara, pero alguien que use la API directamente (o una migración futura) puede crear rentas huérfanas.

### Qué hay que hacer

1. **En `SpaceRentalSerializer`**, agregar validación de `face` requerida en create:

```python
def validate(self, data):
    if not self.instance and not data.get('face'):
        raise serializers.ValidationError({'face': 'Este campo es requerido al crear una reserva.'})
    return data
```

2. **A largo plazo**, hacer una migración que ponga `null=False` en `SpaceRental.face` una vez confirmado que no hay rentas huérfanas en la base:

```python
# Primero limpiar datos:
# SpaceRental.objects.filter(face__isnull=True).delete()
# Luego migrar:
face = models.ForeignKey(StructureFace, on_delete=models.CASCADE, related_name='rentals')
```

3. **Script de auditoría** para correr antes de hacer la migración:

```python
# En Django shell
orphaned = SpaceRental.objects.filter(face__isnull=True)
print(f"Rentas huérfanas: {orphaned.count()}")
for r in orphaned:
    print(f"  ID={r.id}, cliente={r.client}, fechas={r.start_date}→{r.end_date}")
```

---

## Bugs ya resueltos (referencia)

| # | Descripción | Commit |
|---|-------------|--------|
| B1 | `hour_to` max=23 en UI → faltaba la última hora en slots LED | branch `dev` |
| B2 | `new Date("YYYY-MM-DD")` UTC off-by-1 en vencimientos de contratos | branch `dev` |
| B3 | FormData no enviaba `landlord=''` al limpiar el propietario de un terreno | branch `dev` |
