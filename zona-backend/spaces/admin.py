from django.contrib import admin
from .models import Landlord, Location, Structure, StructureFace, SpaceExpense, SpaceRental

@admin.register(Landlord)
class LandlordAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'phone', 'cuit')
    search_fields = ('name', 'cuit')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name', 'landlord', 'rent_amount', 'rent_period', 'is_active')
    search_fields = ('name', 'address')

@admin.register(Structure)
class StructureAdmin(admin.ModelAdmin):
    list_display = ('name', 'location', 'type', 'is_active')
    list_filter = ('type', 'is_active')
    search_fields = ('name', 'location__name')

@admin.register(StructureFace)
class StructureFaceAdmin(admin.ModelAdmin):
    list_display = ('structure', 'name', 'is_active')
    list_filter = ('is_active',)

@admin.register(SpaceExpense)
class SpaceExpenseAdmin(admin.ModelAdmin):
    list_display = ('expense_type', 'amount', 'date', 'location', 'structure')
    list_filter = ('expense_type', 'date')

@admin.register(SpaceRental)
class SpaceRentalAdmin(admin.ModelAdmin):
    list_display = ('face', 'client', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('face__name', 'face__structure__name', 'client__name')
