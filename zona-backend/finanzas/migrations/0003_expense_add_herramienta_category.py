from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finanzas', '0002_suppliers_invoices'),
    ]

    operations = [
        migrations.AlterField(
            model_name='expense',
            name='category',
            field=models.CharField(
                choices=[
                    ('insumo', 'Insumo'),
                    ('herramienta', 'Herramienta'),
                    ('servicio', 'Servicio'),
                    ('alquiler', 'Alquiler'),
                    ('otro', 'Otro'),
                ],
                default='insumo',
                max_length=20,
            ),
        ),
    ]
