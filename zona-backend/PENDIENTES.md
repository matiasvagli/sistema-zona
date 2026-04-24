# Deuda técnica pendiente

## 3. Doble referencia Budget ↔ WorkOrder

**Problema:** el vínculo entre presupuesto y OT está representado dos veces:
- `Budget.work_order` — ForeignKey desde Budget hacia WorkOrder
- `WorkOrder.budget` — OneToOneField desde WorkOrder hacia Budget

Ambos campos se actualizan juntos en `budgets/views.py::create_work_order`, pero si alguien
toca uno solo (desde el admin de Django, un fixture, o una migration futura) quedan desincronizados
silenciosamente, sin error en runtime.

**Decisión a tomar:** elegir un lado como fuente de verdad y eliminar el otro.
La opción más limpia es quedarse con `WorkOrder.budget` (OneToOne) y hacer que
`Budget.work_order` sea una `@property` que resuelve via `self.work_order_set.first()`,
o directamente eliminarlo del modelo y ajustar las queries.

**Archivos involucrados:**
- `budgets/models.py` — campo `work_order`
- `work_orders/models.py` — campo `budget`
- `budgets/views.py` — `create_work_order`, `invoice`
- `budgets/serializers.py` — campo `work_order` en `BudgetSerializer`
- Migration de datos necesaria antes de eliminar el campo

---

## 4. Campos legacy de fotos en WorkOrder

**Problema:** `WorkOrder` tiene tres campos JSONField marcados "Legacy" en el `help_text`:
- `photos`
- `photos_before`
- `photos_after`

Estos coexisten con el modelo `WorkOrderPhoto` que tiene un `ImageField` real con categorías
(`before`/`after`/`progress`). El código activo ya usa `WorkOrderPhoto` para subir y eliminar fotos,
pero los campos JSONField siguen en el schema y hay un test en `work_orders/tests.py` que
todavía los referencia (y falla por eso).

**Pasos para resolver:**
1. Verificar si hay datos reales en `photos_before`/`photos_after` en la DB de producción.
2. Si los hay, escribir un script/migration de datos para moverlos a `WorkOrderPhoto`.
3. Eliminar los tres campos del modelo y generar la migration de schema.
4. Actualizar `WorkOrderSerializer` para que no los incluya.
5. Corregir el test en `work_orders/tests.py` que assert sobre `photos_before`.

**Archivos involucrados:**
- `work_orders/models.py` — campos `photos`, `photos_before`, `photos_after`
- `work_orders/serializers.py` — verificar si los expone
- `work_orders/tests.py` — `test_upload_photo` falla porque assertea sobre `photos_before`
- Migration de datos + schema
