from django.contrib import admin
from .models import Campaign, CampaignSpace

class CampaignSpaceInline(admin.TabularInline):
    model = CampaignSpace
    extra = 1

@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'start_date', 'end_date', 'status')
    list_filter = ('status', 'start_date', 'end_date')
    search_fields = ('name', 'client__name')
    inlines = [CampaignSpaceInline]
