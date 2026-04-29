from django.db import migrations, models


def borrador_to_presupuesto(apps, schema_editor):
    Campaign = apps.get_model('campaigns', 'Campaign')
    Campaign.objects.filter(status='borrador').update(status='presupuesto')


class Migration(migrations.Migration):

    dependencies = [
        ('campaigns', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='campaign',
            name='status',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('presupuesto', 'Presupuesto'),
                    ('aprobado', 'Aprobado'),
                    ('activa', 'Activa'),
                    ('finalizada', 'Finalizada'),
                    ('cancelada', 'Cancelada'),
                ],
                default='presupuesto',
            ),
        ),
        migrations.RunPython(borrador_to_presupuesto, migrations.RunPython.noop),
    ]
