from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone

class Sector(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['order']

class SectorTask(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        EN_PROCESO = 'en_proceso', 'En Proceso'
        COMPLETADA = 'completada', 'Completada'
        BLOQUEADA = 'bloqueada', 'Bloqueada'

    work_order = models.ForeignKey(
        'work_orders.WorkOrder',
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='tasks'
    )
    depends_on = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='next_tasks'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDIENTE
    )
    priority = models.CharField(
        max_length=20,
        choices=[('normal', 'Normal'), ('inmediata', 'Inmediata')],
        default='normal'
    )
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )
    estimated_finish = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    photos = models.JSONField(default=list, blank=True)

    def clean(self):
        # Regla de negocio central: 
        # Si pasa a en_proceso, verificar que la dependencia esté completada
        if self.status == self.Status.EN_PROCESO:
            if self.depends_on and self.depends_on.status != self.Status.COMPLETADA:
                raise ValidationError(
                    f"No se puede iniciar esta tarea. El sector previo ({self.depends_on.sector.name}) aún no ha completado su trabajo."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        
        # Lógica de tiempos automática
        if self.status == self.Status.EN_PROCESO and not self.started_at:
            self.started_at = timezone.now()
        
        if self.status == self.Status.COMPLETADA and not self.finished_at:
            self.finished_at = timezone.now()
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.work_order.title} - {self.sector.name}"
