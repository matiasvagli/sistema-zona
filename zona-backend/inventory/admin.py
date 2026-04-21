from django.contrib import admin
from .models import Product, StockMovement, MaterialReservation


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sector', 'unit', 'stock_qty', 'alert_qty', 'stock_bajo')
    list_filter = ('sector',)
    search_fields = ('name',)


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'qty', 'reason', 'created_at', 'created_by')
    list_filter = ('product', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(MaterialReservation)
class MaterialReservationAdmin(admin.ModelAdmin):
    list_display = ('product', 'sector_task', 'quantity', 'status', 'is_cross_sector', 'requested_by', 'approved_by', 'created_at')
    list_filter = ('status', 'is_cross_sector', 'sector_task__sector')
    readonly_fields = ('is_cross_sector', 'created_at', 'approved_at')
    search_fields = ('product__name',)
