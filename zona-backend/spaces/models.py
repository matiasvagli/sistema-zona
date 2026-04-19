from django.db import models

class AdSpace(models.Model):
    name = models.CharField(max_length=255)
    location_desc = models.TextField(verbose_name="Descripción de ubicación")
    latitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    dimensions = models.CharField(max_length=100, help_text="Ej: 4x3m")
    photos = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class SpaceRental(models.Model):
    class Status(models.TextChoices):
        RESERVADO = 'reservado', 'Reservado'
        ACTIVO = 'activo', 'Activo'
        FINALIZADO = 'finalizado', 'Finalizado'

    ad_space = models.ForeignKey(
        AdSpace, 
        on_delete=models.CASCADE, 
        related_name='rentals'
    )
    client = models.ForeignKey(
        'clients.Client', 
        on_delete=models.CASCADE, 
        related_name='rentals'
    )
    start_date = models.DateField()
    end_date = models.DateField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RESERVADO
    )
    work_order = models.ForeignKey(
        'work_orders.WorkOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rentals_linked'
    )

    def __str__(self):
        return f"{self.ad_space.name} - {self.client.name}"
