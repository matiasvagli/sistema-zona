from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from accounts.models import Perfil, SectorMembership
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


class SectorPermissionsTest(TestCase):
    """
    Verifica que _puede_editar_sector se aplique correctamente en los endpoints de tareas.
    Este es el control de acceso central del pipeline — si falla, empleados pueden
    iniciar/completar tareas de sectores ajenos.
    """

    def setUp(self):
        self.api = APIClient()
        self.client_obj = Client.objects.create(name="Cliente Perms", tax_id="999")

        self.admin_user = User.objects.create_user(username='admin_perms', password='pass', is_staff=True)
        self.employee = User.objects.create_user(username='emp_perms', password='pass')

        self.sector_a = Sector.objects.create(name="Sector PA", order=10)
        self.sector_b = Sector.objects.create(name="Sector PB", order=11)

        self.wo = WorkOrder.objects.create(
            title="OT Perms Test",
            client=self.client_obj,
            created_by=self.admin_user,
        )
        self.task_a = SectorTask.objects.create(
            work_order=self.wo, sector=self.sector_a, status='pendiente'
        )
        self.task_b = SectorTask.objects.create(
            work_order=self.wo, sector=self.sector_b, status='pendiente'
        )

        SectorMembership.objects.create(
            usuario=self.employee,
            sector=self.sector_a,
            puede_ver=True,
            puede_editar=True,
        )

    def test_employee_can_start_task_in_permitted_sector(self):
        self.api.force_authenticate(user=self.employee)
        response = self.api.post(f'/api/v1/sector-tasks/{self.task_a.id}/start/')
        self.assertEqual(response.status_code, 200)
        self.task_a.refresh_from_db()
        self.assertEqual(self.task_a.status, 'en_proceso')

    def test_employee_cannot_start_task_in_forbidden_sector(self):
        self.api.force_authenticate(user=self.employee)
        response = self.api.post(f'/api/v1/sector-tasks/{self.task_b.id}/start/')
        self.assertEqual(response.status_code, 403)
        self.task_b.refresh_from_db()
        self.assertEqual(self.task_b.status, 'pendiente')

    def test_admin_can_start_task_in_any_sector(self):
        self.api.force_authenticate(user=self.admin_user)
        response = self.api.post(f'/api/v1/sector-tasks/{self.task_b.id}/start/')
        self.assertEqual(response.status_code, 200)

    def test_revoking_editar_blocks_task_start(self):
        # Si se quita el permiso de edición, la tarea debe ser inaccesible
        SectorMembership.objects.filter(usuario=self.employee, sector=self.sector_a).update(
            puede_editar=False
        )
        self.api.force_authenticate(user=self.employee)
        response = self.api.post(f'/api/v1/sector-tasks/{self.task_a.id}/start/')
        self.assertEqual(response.status_code, 403)
