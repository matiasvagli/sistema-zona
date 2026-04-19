from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('legajo', 'last_name', 'first_name', 'sector', 'is_active')
    list_filter = ('sector', 'is_active')
    search_fields = ('legajo', 'last_name', 'first_name')
    raw_id_fields = ('user',)
