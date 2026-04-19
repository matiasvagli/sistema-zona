from django.contrib import admin
from .models import Sector, SectorTask

@admin.register(Sector)
class SectorAdmin(admin.ModelAdmin):
    list_display = ('name', 'order', 'is_active')
    list_editable = ('order', 'is_active')
    search_fields = ('name',)

@admin.register(SectorTask)
class SectorTaskAdmin(admin.ModelAdmin):
    list_display = ('work_order', 'sector', 'status', 'assigned_to', 'started_at', 'finished_at')
    list_filter = ('status', 'sector', 'work_order')
    search_fields = ('work_order__title', 'sector__name', 'notes')
    # Usamos raw_id_fields si no configuramos search_fields en los otros admins aún
    raw_id_fields = ('work_order', 'sector', 'assigned_to', 'depends_on')
