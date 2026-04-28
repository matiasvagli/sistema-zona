import os
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from .models import WorkOrder, WorkOrderNotification
from .serializers import WorkOrderSerializer, WorkOrderNotificationSerializer

class WorkOrderNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = WorkOrderNotificationSerializer

    def get_queryset(self):
        return WorkOrderNotification.objects.filter(user=self.request.user, is_confirmed=False)

    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        notification = self.get_object()
        notification.is_confirmed = True
        notification.confirmed_at = timezone.now()
        notification.save()
        return Response({'status': 'confirmed'})


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer
    pagination_class = None

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-delivered')
    def mark_delivered(self, request, pk=None):
        wo = self.get_object()
        if wo.status != WorkOrder.Status.COMPLETADA:
            return Response(
                {'detail': 'Solo se pueden entregar OTs con producción completada.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        wo.status = WorkOrder.Status.ENTREGADA
        wo.save(update_fields=['status'])

        # Notificar a todos los admins/CEO/staff
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(
            models.Q(is_staff=True) | models.Q(perfil__rol__in=['admin', 'ceo'])
        ).distinct()
        for admin in admins:
            WorkOrderNotification.objects.get_or_create(
                user=admin,
                work_order=wo,
                kind=WorkOrderNotification.Kind.LISTA_PARA_FACTURAR,
            )

        return Response(self.get_serializer(wo).data)

    @action(detail=True, methods=['post'], url_path='upload-photo',
            parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        ot = self.get_object()
        file = request.FILES.get('file')
        category = request.data.get('category', 'before')

        if not file:
            return Response({'detail': 'No se recibió archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import WorkOrderPhoto
        photo = WorkOrderPhoto.objects.create(
            work_order=ot,
            image=file,
            category=category
        )

        return Response({
            'id': photo.id,
            'url': request.build_absolute_uri(photo.image.url),
            'category': photo.category
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='assign-client')
    def assign_client(self, request, pk=None):
        from accounts.permissions import is_admin
        wo = self.get_object()
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        client_id = request.data.get('client')
        if not client_id:
            return Response({'detail': 'Enviá el id del cliente.'}, status=status.HTTP_400_BAD_REQUEST)
        from clients.models import Client
        try:
            client = Client.objects.get(pk=client_id)
        except Client.DoesNotExist:
            return Response({'detail': 'Cliente no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        wo.client = client
        wo.save(update_fields=['client'])
        return Response(self.get_serializer(wo).data)

    @action(detail=True, methods=['post'], url_path='create-budget')
    def create_budget(self, request, pk=None):
        from accounts.permissions import is_admin
        wo = self.get_object()
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if wo.budget_id:
            return Response({'detail': 'Esta OT ya tiene un presupuesto vinculado.'}, status=status.HTTP_400_BAD_REQUEST)
        if not wo.client_id:
            return Response({'detail': 'Asigná un cliente a la OT antes de crear el presupuesto.'}, status=status.HTTP_400_BAD_REQUEST)
        from budgets.models import Budget
        budget = Budget.objects.create(
            client=wo.client,
            notes=wo.notes,
            created_by=request.user,
        )
        wo.budget = budget
        wo.save(update_fields=['budget'])
        return Response({'budget_id': budget.id, 'budget_title': f'PRE-{budget.id:04d}'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='remove-photo')
    def remove_photo(self, request, pk=None):
        ot = self.get_object()
        photo_id = request.data.get('id')
        url = request.data.get('url')

        from .models import WorkOrderPhoto
        if photo_id:
            photo = WorkOrderPhoto.objects.filter(work_order=ot, id=photo_id).first()
        else:
            filename = url.split('/')[-1] if url else None
            photo = WorkOrderPhoto.objects.filter(work_order=ot, image__icontains=filename).first()

        if photo:
            photo.image.delete()
            photo.delete()
            return Response({'ok': True})

        return Response({'detail': 'Foto no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
