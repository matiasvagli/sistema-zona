from decimal import Decimal
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import F
from django.conf import settings


def product_image_path(instance, filename):
    return f"products/{instance.id}/{filename}"


class Product(models.Model):
    class Kind(models.TextChoices):
        MATERIAL    = 'material',    'Material de producción'
        INSUMO      = 'insumo',      'Insumo'
        HERRAMIENTA = 'herramienta', 'Herramienta'

    class AssetStatus(models.TextChoices):
        ACTIVA        = 'activa',        'Activa'
        EN_REPARACION = 'en_reparacion', 'En reparación'
        BAJA          = 'baja',          'Baja'

    name = models.CharField(max_length=255)
    kind = models.CharField(
        max_length=20, choices=Kind.choices, default=Kind.MATERIAL,
        help_text="material = producción (OTs), insumo = consumible, herramienta = activo patrimonial"
    )
    unit = models.CharField(max_length=50, help_text="metros, unidades, kg, etc.")
    stock_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    alert_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="stock mínimo para alerta")
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Precio promedio ponderado de costo — visible solo para admins"
    )
    image = models.ImageField(upload_to=product_image_path, null=True, blank=True)
    sector = models.ForeignKey(
        'production.Sector',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='products',
        help_text="Null = producto compartido/global disponible para todos los sectores"
    )
    # Solo para herramientas
    serial_number = models.CharField(max_length=100, blank=True)
    asset_status  = models.CharField(
        max_length=20, choices=AssetStatus.choices, default=AssetStatus.ACTIVA, blank=True
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def stock_bajo(self):
        return self.stock_qty <= self.alert_qty and self.alert_qty > 0


class MaterialReservation(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        APROBADA = 'aprobada', 'Aprobada'
        RECHAZADA = 'rechazada', 'Rechazada'

    sector_task = models.ForeignKey(
        'production.SectorTask',
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='reservations'
    )
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDIENTE
    )
    # True cuando el sector que pide != sector dueño del producto
    is_cross_sector = models.BooleanField(default=False, editable=False)
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='material_requests'
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='material_approvals'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sector_task', 'product')
        permissions = [
            ('approve_material_reservation', 'Puede aprobar/rechazar reservas de material'),
        ]

    def save(self, *args, **kwargs):
        product_sector = self.product.sector_id
        task_sector = self.sector_task.sector_id
        if product_sector and task_sector:
            self.is_cross_sector = product_sector != task_sector
        else:
            self.is_cross_sector = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sector_task} — {self.product.name} x{self.quantity} [{self.status}]"


class StockMovement(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    qty = models.DecimalField(max_digits=10, decimal_places=2, help_text="negativo = egreso")
    reason = models.CharField(max_length=255, help_text="OT-0042, ajuste manual, etc.")
    purchase_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Precio unitario de compra (solo en ingresos). Actualiza el promedio ponderado del producto."
    )
    reservation = models.ForeignKey(
        MaterialReservation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='stock_movements'
    )
    unit_price_snapshot = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Snapshot del precio promedio ponderado del producto al momento del egreso. Permite calcular el costo real de materiales usados en OTs."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return f"{self.product.name} ({self.qty})"


class PurchaseRequest(models.Model):
    class Status(models.TextChoices):
        PENDIENTE   = 'pendiente',   'Pendiente'
        EN_COMPRA   = 'en_compra',   'En compra'
        RECIBIDO    = 'recibido',    'Recibido'
        RECHAZADO   = 'rechazado',   'Rechazado'

    product          = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='purchase_requests')
    quantity_requested = models.DecimalField(max_digits=10, decimal_places=2)
    notes            = models.CharField(max_length=255, blank=True)
    status           = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDIENTE)
    requested_by     = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='purchase_requests_made'
    )
    resolved_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='purchase_requests_resolved'
    )
    resolved_at      = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.CharField(max_length=255, blank=True)
    # Se completan al recibir la mercadería
    quantity_received = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    purchase_price    = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    created_at       = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.product.name} x{self.quantity_requested} [{self.status}]"


@receiver(post_save, sender=StockMovement)
def update_product_stock(sender, instance, created, **kwargs):
    if not created:
        return

    product = Product.objects.get(pk=instance.product_id)

    if instance.qty > 0 and instance.purchase_price is not None:
        # Ingreso con precio → recalcular promedio ponderado
        old_qty = max(product.stock_qty, Decimal('0'))
        old_price = product.unit_price or Decimal('0')
        total_qty = old_qty + instance.qty
        new_avg = (old_price * old_qty + instance.purchase_price * instance.qty) / total_qty
        Product.objects.filter(pk=instance.product_id).update(
            stock_qty=F('stock_qty') + instance.qty,
            unit_price=new_avg,
        )
    else:
        Product.objects.filter(pk=instance.product_id).update(
            stock_qty=F('stock_qty') + instance.qty
        )

    # Egreso: snapshot del precio promedio actual para poder calcular costo de OT
    if instance.qty < 0 and instance.unit_price_snapshot is None and product.unit_price:
        StockMovement.objects.filter(pk=instance.pk).update(
            unit_price_snapshot=product.unit_price
        )
