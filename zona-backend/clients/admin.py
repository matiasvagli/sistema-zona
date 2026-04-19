from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'tax_id', 'email', 'is_active')
    search_fields = ('name', 'tax_id', 'email')
    list_filter = ('is_active',)
