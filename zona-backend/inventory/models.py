from django.db import models
from django.conf import settings

class Product(models.Model):
    name = models.CharField(max_length=255)
    unit = models.CharField(max_length=50, help_text="metros, unidades, kg, etc.")
    stock_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    alert_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="stock mínimo para alerta")

    def __str__(self):
        return self.name

class StockMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    qty = models.DecimalField(max_digits=10, decimal_places=2, help_text="negativo = egreso")
    reason = models.CharField(max_length=255, help_text="OT-0042, ajuste manual, etc.")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.product.name} ({self.qty})"
