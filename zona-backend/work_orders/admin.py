from django.contrib import admin
from .models import WorkOrder

@admin.register(WorkOrder)
class WorkOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'client', 'status', 'priority', 'due_date', 'created_at')
    list_filter = ('status', 'priority', 'created_at')
    search_fields = ('title', 'client__name', 'notes')
    date_hierarchy = 'created_at'
