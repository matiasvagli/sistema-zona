from rest_framework import viewsets
from .models import WorkOrder
from .serializers import WorkOrderSerializer

class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
