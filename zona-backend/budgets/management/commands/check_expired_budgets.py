from django.core.management.base import BaseCommand
from django.utils import timezone
from budgets.models import Budget

class Command(BaseCommand):
    help = 'Marca como vencidos los presupuestos que superaron su fecha de vencimiento y no han sido aprobados.'

    def handle(self, *args, **options):
        today = timezone.now().date()
        
        # Presupuestos en borrador que tienen fecha de vencimiento y ya pasó
        expired_budgets = Budget.objects.filter(
            status=Budget.Status.BORRADOR,
            expiry_date__lt=today
        )
        
        count = expired_budgets.count()
        
        if count > 0:
            expired_budgets.update(status=Budget.Status.VENCIDO)
            self.stdout.write(self.style.SUCCESS(f'Se actualizaron {count} presupuestos a estado VENCIDO.'))
        else:
            self.stdout.write(self.style.SUCCESS('No hay presupuestos para actualizar.'))
