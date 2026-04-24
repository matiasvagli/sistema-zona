from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from accounts.models import Perfil

User = get_user_model()


class ChangeRolePermissionsTest(TestCase):
    """
    Verifica que la escalada de privilegios en change_role esté correctamente bloqueada.
    Esto es lógica de seguridad crítica: si se rompe, un empleado puede promoverse a admin.
    """

    def setUp(self):
        self.api = APIClient()

        self.ceo_user = User.objects.create_user(username='ceo_test', password='pass')
        self.ceo_user.perfil.rol = 'ceo'
        self.ceo_user.perfil.save()

        self.admin_user = User.objects.create_user(username='admin_test', password='pass')
        self.admin_user.perfil.rol = 'admin'
        self.admin_user.perfil.save()

        self.employee = User.objects.create_user(username='emp_test', password='pass')

        self.target = User.objects.create_user(username='target_test', password='pass')

    def _url(self, user_id):
        return f'/api/v1/users/{user_id}/change_role/'

    def test_employee_cannot_change_any_role(self):
        self.api.force_authenticate(user=self.employee)
        response = self.api.patch(self._url(self.target.id), {'rol': 'admin'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_admin_cannot_assign_ceo(self):
        self.api.force_authenticate(user=self.admin_user)
        response = self.api.patch(self._url(self.target.id), {'rol': 'ceo'}, format='json')
        self.assertEqual(response.status_code, 403)
        self.target.perfil.refresh_from_db()
        self.assertEqual(self.target.perfil.rol, 'empleado')

    def test_admin_can_assign_admin(self):
        self.api.force_authenticate(user=self.admin_user)
        response = self.api.patch(self._url(self.target.id), {'rol': 'admin'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.target.perfil.refresh_from_db()
        self.assertEqual(self.target.perfil.rol, 'admin')

    def test_ceo_can_assign_ceo(self):
        self.api.force_authenticate(user=self.ceo_user)
        response = self.api.patch(self._url(self.target.id), {'rol': 'ceo'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.target.perfil.refresh_from_db()
        self.assertEqual(self.target.perfil.rol, 'ceo')

    def test_unauthenticated_cannot_change_role(self):
        response = self.api.patch(self._url(self.target.id), {'rol': 'admin'}, format='json')
        self.assertEqual(response.status_code, 401)
