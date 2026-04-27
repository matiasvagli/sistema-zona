import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()
from rest_framework.test import APIClient
from accounts.models import User
c = APIClient()
u = User.objects.filter(perfil__rol='ceo').first()
if not u: u = User.objects.first()
c.force_authenticate(user=u)
res = c.get('/api/v1/locations/')
print("STATUS:", res.status_code)
print("CONTENT:", res.content.decode())
