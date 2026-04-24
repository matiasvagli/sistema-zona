from rest_framework import permissions


def is_admin(user):
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    if user.is_staff or user.is_superuser:
        return True
    return getattr(getattr(user, 'perfil', None), 'rol', None) in ('ceo', 'admin')


class IsCeo(permissions.BasePermission):
    message = "Solo el ceo tiene acceso a esta sección."

    def has_permission(self, request, view):
        return hasattr(request.user, 'perfil') and request.user.perfil.rol == 'ceo'


class IsAdminUser(permissions.BasePermission):
    message = "Solo los administradores tienen acceso a esta sección."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        return getattr(getattr(request.user, 'perfil', None), 'rol', None) in ('ceo', 'admin')
