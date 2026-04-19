from django.db import models

class Client(models.Model):
    name = models.CharField(max_length=255)
    tax_id = models.CharField(max_length=20, unique=True, verbose_name="CUIT/CUIL")
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
