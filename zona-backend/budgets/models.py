from django.db import models
from django.conf import settings

class Budget(models.Model):
    class Status(models.TextChoices):
        BORRADOR = 'borrador', 'Borrador'
        APROBADO = 'aprobado', 'Aprobado'
        RECHAZADO = 'rechazado', 'Rechazado'
        FACTURADO = 'facturado', 'Facturado'
        VENCIDO = 'vencido', 'Vencido'

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BORRADOR
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='budgets_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    issue_date = models.DateField(auto_now_add=True, verbose_name="Fecha de emisión")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="Fecha de vencimiento")
    notes = models.TextField(blank=True)
    iva_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name="IVA %"
    )

    class Meta:
        ordering = ['-created_at']

    @property
    def total_amount(self):
        return sum(item.total_price for item in self.items.all())

    @property
    def iva_amount(self):
        return self.total_amount * self.iva_pct / 100

    @property
    def total_with_iva(self):
        return self.total_amount + self.iva_amount

    def __str__(self):
        return f"PRE-{self.id:04d} - {self.client.name}"

class BudgetItem(models.Model):
    budget = models.ForeignKey(
        Budget,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        'inventory.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='budget_items'
    )
    description = models.TextField()
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    @property
    def total_price(self):
        subtotal = self.qty * self.unit_price
        discount = subtotal * (self.discount_pct / 100)
        return subtotal - discount

    def __str__(self):
        return f"{self.description} ({self.qty})"
