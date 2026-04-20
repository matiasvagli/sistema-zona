from functools import wraps
from rest_framework.exceptions import PermissionDenied

def solo_ceo(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not hasattr(request.user, 'perfil') or request.user.perfil.rol != 'ceo':
            raise PermissionDenied("Solo el ceo tiene acceso a esta sección.")
        return view_func(request, *args, **kwargs)
    return _wrapped_view

def requiere_permiso_sector(sector_field='sector_id', accion='puede_ver'):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Obtener el ID del sector de los kwargs o de la request
            sector_id = kwargs.get(sector_field)
            if not sector_id and request.method in ['POST', 'PUT', 'PATCH']:
                sector_id = request.data.get(sector_field)
                
            if not sector_id:
                return view_func(request, *args, **kwargs)
                
            user = request.user
            # El ceo puede todo
            if hasattr(user, 'perfil') and user.perfil.rol == 'ceo':
                return view_func(request, *args, **kwargs)
                
            # Verificar permiso en SectorMembership
            from accounts.models import SectorMembership
            try:
                membership = SectorMembership.objects.get(usuario=user, sector_id=sector_id)
                if not getattr(membership, accion, False):
                    raise PermissionDenied(f"No tienes permiso '{accion}' en este sector.")
            except SectorMembership.DoesNotExist:
                raise PermissionDenied("No perteneces a este sector o no tienes permisos.")
                
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

from rest_framework import permissions

class IsCeo(permissions.BasePermission):
    message = "Solo el ceo tiene acceso a esta sección."

    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'ceo'

class RequireSectorPermission(permissions.BasePermission):
    def __init__(self, accion='puede_ver'):
        self.accion = accion

    def __call__(self):
        return self

    def has_permission(self, request, view):
        if hasattr(request.user, 'perfil') and request.user.perfil.rol == 'ceo':
            return True
        return True # El chequeo detallado sería en has_object_permission o filtrando el queryset

    def has_object_permission(self, request, view, obj):
        if hasattr(request.user, 'perfil') and request.user.perfil.rol == 'ceo':
            return True
            
        sector_id = None
        if hasattr(obj, 'sector_id'):
            sector_id = obj.sector_id
        elif hasattr(obj, 'sector'):
            sector_id = obj.sector.id
            
        if not sector_id:
            return True
            
        from accounts.models import SectorMembership
        try:
            membership = SectorMembership.objects.get(usuario=request.user, sector_id=sector_id)
            return getattr(membership, self.accion, False)
        except SectorMembership.DoesNotExist:
            return False
