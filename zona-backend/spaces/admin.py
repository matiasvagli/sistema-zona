from django.contrib import admin
from .models import AdSpace, SpaceRental

@admin.register(AdSpace)
class AdSpaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'dimensions', 'is_active')
    search_fields = ('name', 'location_desc')

@admin.register(SpaceRental)
class SpaceRentalAdmin(admin.ModelAdmin):
    list_display = ('ad_space', 'client', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('ad_space__name', 'client__name')
