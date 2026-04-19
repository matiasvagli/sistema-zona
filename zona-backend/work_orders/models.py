from django.db import models
from django.conf import settings

class WorkOrder(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PROCESO = 'en_proceso', 'En Proceso'
        PAUSADA = 'pausada', 'Pausada'
        COMPLETADA = 'completada', 'Completada'
        CANCELADA = 'cancelada', 'Cancelada'

    class Priority(models.TextChoices):
        NORMAL = 'normal', 'Normal'
        INMEDIATA = 'inmediata', 'Inmediata'

    title = models.CharField(max_length=255)
    client = models.ForeignKey(
        'clients.Client', 
        on_delete=models.CASCADE, 
        related_name='work_orders',
        null=True,
        blank=True
    )
    budget = models.ForeignKey(
        'budgets.Budget',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='work_orders_linked'
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
    due_date = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True, help_text="Lista de URLs a storage externo")
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
