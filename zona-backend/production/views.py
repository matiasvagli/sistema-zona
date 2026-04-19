from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Sector, SectorTask
from .serializers import SectorSerializer, SectorTaskSerializer

class SectorViewSet(viewsets.ModelViewSet):
    queryset = Sector.objects.all()
    serializer_class = SectorSerializer

class SectorTaskViewSet(viewsets.ModelViewSet):
    queryset = SectorTask.objects.all()
    serializer_class = SectorTaskSerializer

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
        return Response(self.get_serializer(task).data)

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
