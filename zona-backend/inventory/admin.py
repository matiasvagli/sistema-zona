from django.contrib import admin
from .models import Product, StockMovement

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'unit', 'stock_qty', 'alert_qty')
    search_fields = ('name',)

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'qty', 'reason', 'created_at', 'created_by')
    list_filter = ('product', 'created_at')
    readonly_fields = ('created_at',)
