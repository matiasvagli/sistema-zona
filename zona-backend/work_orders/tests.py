from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import WorkOrder
import os
from django.conf import settings
import shutil

User = get_user_model()

class WorkOrderTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='password123')
        self.client.force_authenticate(user=self.user)
        self.ot = WorkOrder.objects.create(
            title="Test OT",
            created_by=self.user
        )

    def tearDown(self):
        # Limpiar archivos de media creados durante el test
        test_media = os.path.join(settings.MEDIA_ROOT, 'work_orders')
        if os.path.exists(test_media):
            shutil.rmtree(test_media)

    def test_create_work_order(self):
        response = self.client.post('/api/v1/work-orders/', {
            'title': 'New OT',
            'status': 'pendiente'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkOrder.objects.count(), 2)

    def test_upload_photo(self):
        # Crear un archivo de imagen dummy
        from django.core.files.uploadedfile import SimpleUploadedFile
        image_content = b'image_data'
        image = SimpleUploadedFile('test_photo.jpg', image_content, content_type='image/jpeg')

        response = self.client.post(
            f'/api/v1/work-orders/{self.ot.id}/upload-photo/',
            {'file': image, 'category': 'before'},
            format='multipart'
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('url', response.data)
        
        # Verificar que se guardó en el modelo
        self.ot.refresh_from_db()
        self.assertTrue(any('test_photo.jpg' in url for url in self.ot.photos_before))
