from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import SectorTask
from work_orders.models import WorkOrderNotification
from accounts.models import SectorMembership

@receiver(post_save, sender=SectorTask)
def create_notifications_on_task_creation(sender, instance, created, **kwargs):
    if created:
        # Destinatarios: usuarios que pertenecen al sector de la tarea
        memberships = SectorMembership.objects.filter(
            sector=instance.sector,
            puede_ver=True  # Solo si tienen permiso de ver
        )
        
        for membership in memberships:
            WorkOrderNotification.objects.get_or_create(
                user=membership.usuario,
                work_order=instance.work_order
            )
