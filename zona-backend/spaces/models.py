from django.db import models

class Landlord(models.Model):
    """Propietario / Arrendatario del terreno"""
    name = models.CharField(max_length=255, verbose_name="Nombre completo / Razón Social")
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    cuit = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    """El Terreno o Espacio Físico alquilado por la agencia"""
    class RentPeriod(models.TextChoices):
        MENSUAL = 'mensual', 'Mensual'
        BIMESTRAL = 'bimestral', 'Bimestral'
        SEMESTRAL = 'semestral', 'Semestral'
        ANUAL = 'anual', 'Anual'
        POR_CONTRATO = 'por_contrato', 'Por Contrato'

    name = models.CharField(max_length=255, verbose_name="Nombre descriptivo", help_text="Ej: Esquina Ruta 8 y 197")
    address = models.CharField(max_length=255, blank=True, null=True, verbose_name="Dirección")
    latitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    
    landlord = models.ForeignKey(Landlord, on_delete=models.SET_NULL, null=True, blank=True, related_name='locations')
    
    contract_start_date = models.DateField(null=True, blank=True)
    contract_end_date = models.DateField(null=True, blank=True)
    contract_file = models.FileField(upload_to='contracts/locations/', null=True, blank=True)
    
    rent_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rent_period = models.CharField(max_length=20, choices=RentPeriod.choices, default=RentPeriod.MENSUAL)
    
    # Alertas de vencimiento de contrato
    expiration_alert_days_before = models.IntegerField(default=30, help_text="Días antes del vencimiento para empezar a alertar")
    expiration_alert_frequency = models.IntegerField(default=7, help_text="Frecuencia de alerta en días (ej: cada 7 días)")
    expiration_alert_active = models.BooleanField(default=True, verbose_name="Alertas activadas")
    
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-id']

    def __str__(self):
        return self.name

class Structure(models.Model):
    """La Estructura (Cartel) física instalada en el terreno"""
    class StructureType(models.TextChoices):
        MONOPOSTE = 'monoposte', 'Monoposte'
        FRONTLIGHT = 'frontlight', 'Frontlight'
        PANTALLA_LED = 'pantalla_led', 'Pantalla LED'
        PARED = 'pared', 'Pared/Medianera'
        OTRO = 'otro', 'Otro'

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='structures')
    name = models.CharField(max_length=255, verbose_name="Identificador", help_text="Ej: Monoposte Principal")
    type = models.CharField(max_length=20, choices=StructureType.choices, default=StructureType.MONOPOSTE)
    dimensions = models.CharField(max_length=100, help_text="Ej: 4x3m", blank=True, null=True)
    photo = models.ImageField(upload_to='structures/photos/', null=True, blank=True, verbose_name="Foto de instalación")
    installation_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.location.name})"

class StructureFace(models.Model):
    """Cada una de las caras alquilables de la estructura"""
    structure = models.ForeignKey(Structure, on_delete=models.CASCADE, related_name='faces')
    name = models.CharField(max_length=50, help_text="Ej: Cara Norte, Cara Sur, Principal")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.structure.name} - {self.name}"

class SpaceExpense(models.Model):
    """Gastos operativos de mantenimiento, alquiler, luz, etc."""
    class ExpenseType(models.TextChoices):
        ALQUILER = 'alquiler', 'Alquiler Terreno'
        LUZ = 'luz', 'Luz / Energía'
        SEGURO = 'seguro', 'Seguro'
        IMPUESTO = 'impuesto', 'Impuesto Municipal'
        MANTENIMIENTO = 'mantenimiento', 'Mantenimiento / Reparación'
        OTRO = 'otro', 'Otro'

    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    structure = models.ForeignKey(Structure, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    
    expense_type = models.CharField(max_length=20, choices=ExpenseType.choices)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    receipt_file = models.FileField(upload_to='receipts/spaces/', null=True, blank=True)

    def __str__(self):
        return f"{self.get_expense_type_display()} - ${self.amount}"

class SpaceRental(models.Model):
    class Status(models.TextChoices):
        RESERVADO = 'reservado', 'Reservado'
        ACTIVO = 'activo', 'Activo'
        FINALIZADO = 'finalizado', 'Finalizado'

    # null=True, blank=True por compatibilidad con la migración anterior donde se borra ad_space
    face = models.ForeignKey(
        StructureFace, 
        on_delete=models.CASCADE, 
        related_name='rentals',
        null=True,
        blank=True
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
        if self.face:
            return f"{self.face} - {self.client.name}"
        return f"Alquiler - {self.client.name}"
