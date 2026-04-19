from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from production.models import Sector, SectorTask
from work_orders.models import WorkOrder
from clients.models import Client

User = get_user_model()

class ProductionLogicTest(TestCase):
    def setUp(self):
        self.client = Client.objects.create(name="Cliente Test", tax_id="123")
        self.user = User.objects.create_user(username="testuser", password="password")
        self.work_order = WorkOrder.objects.create(
            title="OT Test",
            client=self.client,
            created_by=self.user
        )
        self.sector_a = Sector.objects.create(name="Sector A", order=1)
        self.sector_b = Sector.objects.create(name="Sector B", order=2)

    def test_dependency_validation(self):
        # Tarea A (Predecesora)
        task_a = SectorTask.objects.create(
            work_order=self.work_order,
            sector=self.sector_a,
            status='pendiente'
        )
        
        # Tarea B (Dependiente de A)
        task_b = SectorTask.objects.create(
            work_order=self.work_order,
            sector=self.sector_b,
            depends_on=task_a,
            status='pendiente'
        )

        # Intentar pasar B a 'en_proceso' cuando A está 'pendiente' debe fallar
        task_b.status = 'en_proceso'
        with self.assertRaises(ValidationError):
            task_b.full_clean()
            task_b.save()

        # Pasar A a 'completada'
        task_a.status = 'completada'
        task_a.save()

        # Ahora intentar pasar B a 'en_proceso' debe funcionar
        task_b.status = 'en_proceso'
        task_b.full_clean() # No debe lanzar excepción
        task_b.save()
        
        self.assertEqual(task_b.status, 'en_proceso')
        self.assertIsNotNone(task_b.started_at)

    def test_auto_dates(self):
        task = SectorTask.objects.create(
            work_order=self.work_order,
            sector=self.sector_a,
            status='pendiente'
        )
        
        # Al iniciar, se debe grabar started_at
        task.status = 'en_proceso'
        task.save()
        self.assertIsNotNone(task.started_at)
        self.assertIsNone(task.finished_at)

        # Al completar, se debe grabar finished_at
        task.status = 'completada'
        task.save()
        self.assertIsNotNone(task.finished_at)
