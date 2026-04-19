from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    sector = models.ForeignKey(
        'production.Sector', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )

    def __str__(self):
        return self.username
