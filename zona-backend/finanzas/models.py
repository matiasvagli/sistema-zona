from django.db import models
from django.conf import settings


class Expense(models.Model):
    class Category(models.TextChoices):
        INSUMO      = 'insumo',      'Insumo'
        HERRAMIENTA = 'herramienta', 'Herramienta'
        SERVICIO    = 'servicio',    'Servicio'
        ALQUILER    = 'alquiler',    'Alquiler'
        OTRO        = 'otro',        'Otro'

    category    = models.CharField(max_length=20, choices=Category.choices, default=Category.INSUMO)
    description = models.CharField(max_length=255)
    amount      = models.DecimalField(max_digits=12, decimal_places=2)
    date        = models.DateField()
    work_order  = models.ForeignKey(
        'work_orders.WorkOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='expenses',
        help_text="OT a la que se imputa el gasto. Null = gasto general del período."
    )
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='expenses_registered'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.get_category_display()} — {self.description} (${self.amount})"


def invoice_pdf_path(instance, filename):
    return f"invoices/{instance.supplier_id}/{filename}"


class Supplier(models.Model):
    name  = models.CharField(max_length=255)
    cuit  = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.CharField(max_length=255, blank=True)
    notes = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class SupplierInvoice(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADA    = 'pagada',    'Pagada'

    supplier         = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name='invoices')
    invoice_number   = models.CharField(max_length=100, blank=True, help_text="Nro de factura del proveedor")
    amount           = models.DecimalField(max_digits=12, decimal_places=2)
    date             = models.DateField(help_text="Fecha de emisión de la factura")
    due_date         = models.DateField(null=True, blank=True, help_text="Fecha de vencimiento para el pago")
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDIENTE)
    paid_at          = models.DateTimeField(null=True, blank=True)
    pdf              = models.FileField(upload_to=invoice_pdf_path, null=True, blank=True)
    purchase_request = models.ForeignKey(
        'inventory.PurchaseRequest',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        help_text="Pedido de compra de stock al que corresponde esta factura (opcional)"
    )
    notes          = models.CharField(max_length=500, blank=True)
    registered_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='invoices_registered'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.supplier.name} — {self.invoice_number or 'S/N'} ${self.amount} [{self.status}]"
