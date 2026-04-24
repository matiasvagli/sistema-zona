from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import SectorTask
from work_orders.models import WorkOrderNotification
from accounts.models import SectorMembership
from notifications.models import Notification

@receiver(pre_save, sender=SectorTask)
def capture_old_status(sender, instance, **kwargs):
    if instance.pk:
        instance._old_status = SectorTask.objects.get(pk=instance.pk).status
    else:
        instance._old_status = None

@receiver(post_save, sender=SectorTask)
def notify_status_change(sender, instance, created, **kwargs):
    # Si es nueva, ya existe la lógica de WorkOrderNotification (mantener por compatibilidad)
    if created:
        memberships = SectorMembership.objects.filter(
            sector=instance.sector,
            puede_ver=True
        )
        for membership in memberships:
            WorkOrderNotification.objects.get_or_create(
                user=membership.usuario,
                work_order=instance.work_order,
                kind='nueva_ot'
            )
        return

    # Lógica de cambio de estado para la "campanita" genérica
    old_status = getattr(instance, '_old_status', None)
    if old_status and old_status != instance.status:
        # Definir mensaje según el nuevo estado
        status_display = dict(SectorTask.Status.choices).get(instance.status, instance.status)
        title = f"Actualización en OT-{instance.work_order.id}"
        message = f"El sector {instance.sector.name} cambió su estado a '{status_display}' en la orden '{instance.work_order.title}'."

        # Destinatarios: Usuarios de sectores de la MISMA OT que NO hayan terminado aún
        # 1. Buscar todas las tareas de esta OT que no estén completadas
        active_tasks = SectorTask.objects.filter(
            work_order=instance.work_order
        ).exclude(status=SectorTask.Status.COMPLETADA)

        # 2. Obtener los sectores de esas tareas activas
        active_sectors = active_tasks.values_list('sector', flat=True)

        # 3. Notificar a los miembros de esos sectores
        # Excluimos al sector que acaba de hacer el cambio para no notificarles a ellos mismos (opcional)
        members_to_notify = SectorMembership.objects.filter(
            sector__in=active_sectors
        ).exclude(sector=instance.sector).select_related('usuario')

        unique_users = {m.usuario for m in members_to_notify}

        for user in unique_users:
            Notification.objects.create(
                user=user,
                title=title,
                message=message,
                link=f"/work-orders/{instance.work_order.id}"
            )
