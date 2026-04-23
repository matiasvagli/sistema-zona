from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Sector, SectorTask
from .serializers import SectorSerializer, SectorTaskSerializer

class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer

class SectorTaskViewSet(viewsets.ModelViewSet):
    queryset = SectorTask.objects.select_related('work_order', 'sector', 'assigned_to').all()
    serializer_class = SectorTaskSerializer
    pagination_class = None

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        task.status = SectorTask.Status.EN_PROCESO
        try:
            task.save()
            return Response(self.get_serializer(task).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        task.status = SectorTask.Status.COMPLETADA
        task.save()
        self._notificar_sectores_pendientes(task, request.user)
        self._cerrar_ot_si_completa(task)
        return Response(self.get_serializer(task).data)

    def _cerrar_ot_si_completa(self, task_completada):
        """Si todas las tareas de la OT están completadas, cierra la OT."""
        wo = task_completada.work_order
        pendientes = SectorTask.objects.filter(
            work_order=wo
        ).exclude(
            status=SectorTask.Status.COMPLETADA
        ).exists()
        if not pendientes:
            wo.status = 'completada'
            wo.save(update_fields=['status'])

    def _notificar_sectores_pendientes(self, task_completada, actor):
        """Envía mensaje directo a usuarios de los sectores que aún no terminaron en esta OT."""
        from chat.models import Message
        from accounts.models import SectorMembership

        otras_tasks = SectorTask.objects.filter(
            work_order=task_completada.work_order
        ).exclude(
            id=task_completada.id
        ).exclude(
            status=SectorTask.Status.COMPLETADA
        ).select_related('sector')

        if not otras_tasks.exists():
            return

        ot_titulo = task_completada.work_order.title
        sector_nombre = task_completada.sector.name
        nota = f' — "{task_completada.notes}"' if task_completada.notes else ""
        contenido = (
            f"✅ {sector_nombre} completó su tarea en OT: {ot_titulo}{nota}. "
            f"Sectores pendientes: {', '.join(t.sector.name for t in otras_tasks)}"
        )

        # Destinatarios: usuarios con puede_ver en los sectores pendientes
        sectores_pendientes_ids = otras_tasks.values_list('sector_id', flat=True)
        usuarios = SectorMembership.objects.filter(
            sector_id__in=sectores_pendientes_ids,
            puede_ver=True
        ).exclude(
            usuario=actor
        ).values_list('usuario', flat=True).distinct()

        mensajes = [
            Message(sender=actor, recipient_id=uid, content=contenido)
            for uid in usuarios
        ]
        Message.objects.bulk_create(mensajes)

    @action(detail=True, methods=['post'])
    def block(self, request, pk=None):
        task = self.get_object()
        task.status = SectorTask.Status.BLOQUEADA
        task.save()
        return Response(self.get_serializer(task).data)

    @action(detail=True, methods=['post'], url_path='set-estimate')
    def set_estimate(self, request, pk=None):
        task = self.get_object()
        estimate = request.data.get('estimated_finish')
        if not estimate:
            return Response({'error': 'Falta la fecha estimada'}, status=status.HTTP_400_BAD_REQUEST)
        task.estimated_finish = estimate
        task.save()
        return Response(self.get_serializer(task).data)
