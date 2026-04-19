from django.contrib import admin
from .models import Budget, BudgetItem

class BudgetItemInline(admin.TabularInline):
    model = BudgetItem
    extra = 1

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'status', 'created_at', 'created_by')
    list_filter = ('status', 'created_at')
    search_fields = ('client__name', 'notes')
    inlines = [BudgetItemInline]
