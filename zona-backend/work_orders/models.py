from django.db import models
from django.conf import settings

class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PROCESO = 'en_proceso', 'En Proceso'
        PAUSADA = 'pausada', 'Pausada'
        COMPLETADA = 'completada', 'Completada'
        ENTREGADA = 'entregada', 'Entregada'
        FACTURADA = 'facturada', 'Facturada'
        CANCELADA = 'cancelada', 'Cancelada'

    class Priority(models.TextChoices):
        NORMAL = 'normal', 'Normal'
        INMEDIATA = 'inmediata', 'Inmediata'

    class WorkType(models.TextChoices):
        GENERAL = 'general', 'General'
        INSTALACION_EV = 'instalacion_espacio_vial', 'Instalación Espacio Vial'
        MANTENIMIENTO_EV = 'mantenimiento_espacio_vial', 'Mantenimiento Espacio Vial'
        CAMPANA = 'campana', 'Campaña'
        CIVIL = 'civil', 'Civil / Construcción'
        ELECTRICO = 'electrico', 'Eléctrico'

    title = models.CharField(max_length=255)
    client = models.ForeignKey(
        'clients.Client', 
        on_delete=models.CASCADE, 
        related_name='work_orders',
        null=True,
        blank=True
    )
    budget = models.OneToOneField(
        'budgets.Budget',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_order_assigned'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDIENTE
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL
    )
    work_type = models.CharField(
        max_length=30,
        choices=WorkType.choices,
        default=WorkType.GENERAL,
        verbose_name="Tipo de OT"
    )
    structure = models.ForeignKey(
        'spaces.Structure',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='structure_work_orders',
        verbose_name="Estructura vinculada"
    )
    due_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='work_orders_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"OT-{self.id:04d}: {self.title}"

    class Meta:
        ordering = ['-created_at']


def work_order_photo_path(instance, filename):
    # Genera una ruta: media/work_orders/{ot_id}/{category}/{filename}
    return f"work_orders/{instance.work_order.id}/{instance.category}/{filename}"

class WorkOrderPhoto(models.Model):
    class Category(models.TextChoices):
        BEFORE = 'before', 'Antes/Diseño'
        AFTER = 'after', 'Después/Terminado'

    work_order = models.ForeignKey(WorkOrder, on_delete=models.CASCADE, related_name='work_order_photos')
    image = models.ImageField(upload_to=work_order_photo_path)
    category = models.CharField(max_length=10, choices=Category.choices, default=Category.BEFORE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Foto {self.category} - {self.work_order.title}"


class WorkOrderNotification(models.Model):
    class Kind(models.TextChoices):
        NUEVA_OT            = 'nueva_ot',            'Nueva OT'
        LISTA_PARA_FACTURAR = 'lista_para_facturar', 'Lista para facturar'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='work_order_notifications'
    )
    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    kind = models.CharField(max_length=30, choices=Kind.choices, default=Kind.NUEVA_OT)
    is_confirmed = models.BooleanField(default=False)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notificación [{self.kind}] OT-{self.work_order.id} para {self.user.username}"

    class Meta:
        unique_together = ('user', 'work_order', 'kind')
        ordering = ['-created_at']
