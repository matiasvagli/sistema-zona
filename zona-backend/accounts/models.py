from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class User(AbstractUser):
    sector = models.ForeignKey(
        'production.Sector', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    last_seen = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['username']

    def __str__(self):
        return self.username

    @property
    def is_online(self):
        from django.utils import timezone
        if not self.last_seen:
            return False
        return (timezone.now() - self.last_seen).total_seconds() < 120  # 2 minutos

class Perfil(models.Model):
    ROLES = [
        ('ceo', 'CEO'),
        ('admin', 'Admin'),
        ('empleado', 'Empleado'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    rol = models.CharField(max_length=20, choices=ROLES, default='empleado')

    def __str__(self):
        return f"Perfil de {self.usuario.username} - {self.rol}"

class SectorMembership(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sector_memberships')
    sector = models.ForeignKey('production.Sector', on_delete=models.CASCADE, related_name='memberships')
    puede_ver = models.BooleanField(default=True)
    puede_crear = models.BooleanField(default=False)
    puede_editar = models.BooleanField(default=False)
    puede_eliminar = models.BooleanField(default=False)

    class Meta:
        unique_together = ('usuario', 'sector')

    def __str__(self):
        return f"{self.usuario.username} en {self.sector.name}"

@receiver(post_save, sender=User)
def crear_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(usuario=instance, rol='empleado')
