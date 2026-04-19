from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Budget
from .serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        budget = self.get_object()
        budget.status = Budget.Status.APROBADO
        budget.save()
        # Aquí se podría disparar la creación de la WorkOrder
        return Response(self.get_serializer(budget).data)
