from datetime import date
from django.db import models

class Campaign(models.Model):
    class Status(models.TextChoices):
        PRESUPUESTO = 'presupuesto', 'Presupuesto'
        APROBADO = 'aprobado', 'Aprobado'
        ACTIVA = 'activa', 'Activa'
        FINALIZADA = 'finalizada', 'Finalizada'
        CANCELADA = 'cancelada', 'Cancelada'

    class BillingType(models.TextChoices):
        MENSUAL = 'mensual', 'Mensual'
        CONTRATO = 'contrato', 'Por Contrato'

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
    billing_type = models.CharField(
        max_length=20,
        choices=BillingType.choices,
        default=BillingType.CONTRATO,
        verbose_name='Tipo de facturación'
    )
    notes = models.TextField(blank=True)
    photo = models.ImageField(upload_to='campaigns/photos/', null=True, blank=True)

    def __str__(self):
        return self.name

    def generate_payments(self):
        if self.status in ('presupuesto', 'borrador'):
            return
        self.payments.filter(status__in=('pendiente', 'vencido')).delete()
        if self.billing_type == 'mensual':
            months = []
            y, m = self.start_date.year, self.start_date.month
            ey, em = self.end_date.year, self.end_date.month
            while (y, m) <= (ey, em):
                months.append(date(y, m, 1))
                m += 1
                if m > 12:
                    m, y = 1, y + 1
            n = len(months)
            amount = round(float(self.budget_total) / n, 2) if n else float(self.budget_total)
            for period in months:
                CampaignPayment.objects.get_or_create(campaign=self, period=period, defaults={'amount': amount})
        else:
            CampaignPayment.objects.get_or_create(
                campaign=self,
                period=self.start_date.replace(day=1),
                defaults={'amount': self.budget_total},
            )


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


class CampaignPayment(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        PAGADO = 'pagado', 'Pagado'
        VENCIDO = 'vencido', 'Vencido'

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='payments')
    period = models.DateField(help_text="Primer día del mes del período")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDIENTE)
    paid_date = models.DateField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    invoice_ref = models.CharField(max_length=200, blank=True, verbose_name="Nro. Comprobante")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['period']
        unique_together = [('campaign', 'period')]

    def __str__(self):
        return f"{self.campaign.name} — {self.period.strftime('%m/%Y')} [{self.status}]"
