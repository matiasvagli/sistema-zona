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
        null=True,
        blank=True,
        related_name='employees'
    )
    phone = models.CharField(max_length=50, blank=True)
    dni = models.CharField(max_length=20, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    cbu_cvu = models.CharField(max_length=30, blank=True)
    email_personal = models.EmailField(blank=True)
    fecha_ingreso = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.legajo} - {self.last_name}, {self.first_name}"
