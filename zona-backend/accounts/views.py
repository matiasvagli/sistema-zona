from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import User, Perfil, SectorMembership
from .serializers import UserSerializer, SectorMembershipSerializer
from .permissions import IsAdminUser

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.action in ('me', 'mis_permisos', 'list', 'retrieve'):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def mis_permisos(self, request):
        user = request.user
        memberships = SectorMembership.objects.filter(usuario=user)
        serializer = SectorMembershipSerializer(memberships, many=True)
        try:
            rol = user.perfil.rol
        except Perfil.DoesNotExist:
            rol = 'empleado'
            
        return Response({
            'rol': rol,
            'sectores': serializer.data
        })

    def perform_update(self, serializer):
        target_user = self.get_object()
        try:
            target_role = target_user.perfil.rol
        except Perfil.DoesNotExist:
            target_role = 'empleado'

        if target_role == 'ceo' and not self._requester_is_ceo():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Solo un CEO puede modificar el perfil de otro CEO.")

        serializer.save()

    def _requester_is_ceo(self):
        user = self.request.user
        if user.is_superuser:
            return True
        try:
            return user.perfil.rol == 'ceo'
        except Perfil.DoesNotExist:
            return False

    @action(detail=True, methods=['patch'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('rol')
        if not new_role in [choice[0] for choice in Perfil.ROLES]:
            return Response({'error': 'Rol inválido'}, status=400)

        try:
            current_user_role = request.user.perfil.rol
        except Perfil.DoesNotExist:
            current_user_role = 'empleado'

        try:
            target_role = user.perfil.rol
        except Perfil.DoesNotExist:
            target_role = 'empleado'

        if target_role == 'ceo' and current_user_role != 'ceo' and not request.user.is_superuser:
            return Response({'error': 'Solo un CEO puede modificar el rol de otro CEO'}, status=403)

        if new_role == 'ceo' and current_user_role != 'ceo' and not request.user.is_superuser:
            return Response({'error': 'Solo un CEO puede asignar el rol de CEO'}, status=403)

        perfil, created = Perfil.objects.get_or_create(usuario=user)
        perfil.rol = new_role
        perfil.save()
        return Response({'status': 'Rol actualizado', 'rol': new_role})

class SectorMembershipViewSet(viewsets.ModelViewSet):
    queryset = SectorMembership.objects.all()
    serializer_class = SectorMembershipSerializer
    permission_classes = [IsAdminUser]
    filterset_fields = ['usuario', 'sector']
