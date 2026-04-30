from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0002_campaign_statuses'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaign',
            name='billing_type',
            field=models.CharField(
                max_length=20,
                choices=[('mensual', 'Mensual'), ('contrato', 'Por Contrato')],
                default='contrato',
                verbose_name='Tipo de facturación',
            ),
        ),
    ]
