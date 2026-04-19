from django.db import models
from django.conf import settings

class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee'
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    legajo = models.CharField(max_length=20, unique=True)
    sector = models.ForeignKey(
        'production.Sector',
        on_delete=models.PROTECT,
        related_name='employees'
    )
    phone = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.legajo} - {self.last_name}, {self.first_name}"
