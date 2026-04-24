from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Perfil, SectorMembership

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Información de Sector', {'fields': ('sector',)}),
    )
    list_display = UserAdmin.list_display + ('sector',)

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'rol')
    list_editable = ('rol',)
    search_fields = ('usuario__username',)

@admin.register(SectorMembership)
class SectorMembershipAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'sector', 'puede_ver', 'puede_editar', 'puede_crear', 'puede_eliminar')
    list_filter = ('sector',)
    search_fields = ('usuario__username',)
