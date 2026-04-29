from django.db import models

class Campaign(models.Model):
    class Status(models.TextChoices):
        PRESUPUESTO = 'presupuesto', 'Presupuesto'
        APROBADO = 'aprobado', 'Aprobado'
        ACTIVA = 'activa', 'Activa'
        FINALIZADA = 'finalizada', 'Finalizada'
        CANCELADA = 'cancelada', 'Cancelada'

    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,
        related_name='campaigns'
    )
    name = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PRESUPUESTO
    )
    budget_total = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name

class CampaignSpace(models.Model):
    campaign = models.ForeignKey(
        Campaign,
        on_delete=models.CASCADE,
        related_name='spaces'
    )
    space_rental = models.ForeignKey(
        'spaces.SpaceRental',
        on_delete=models.CASCADE,
        related_name='campaign_links'
    )
    creative_url = models.URLField(max_length=500, blank=True, verbose_name="URL del arte/diseño")
    notes = models.TextField(blank=True)

    def __str__(self):
        face = self.space_rental.face if (self.space_rental_id and self.space_rental.face_id) else None
        return f"{self.campaign.name} - {face or '—'}"
