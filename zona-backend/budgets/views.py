from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.permissions import IsAdminUser
from .models import Budget, BudgetItem
from .serializers import BudgetSerializer, BudgetItemSerializer

class BudgetItemViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = BudgetItem.objects.select_related('product').all()
    serializer_class = BudgetItemSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminUser]
    queryset = Budget.objects.select_related('client').prefetch_related('items__product').all()
    serializer_class = BudgetSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        budget = self.get_object()
        budget.status = Budget.Status.APROBADO
        budget.save()
        return Response(self.get_serializer(budget).data)

    @action(detail=True, methods=['post'], url_path='create-work-order')
    def create_work_order(self, request, pk=None):
        budget = self.get_object()

        if budget.work_order_id:
            return Response(
                {'detail': f'Este presupuesto ya tiene una OT asociada (#{budget.work_order_id}).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from work_orders.models import WorkOrder
        from work_orders.serializers import WorkOrderSerializer

        title = request.data.get('title') or f"OT — PRE-{budget.id:04d} {budget.client.name}"
        wo = WorkOrder.objects.create(
            title=title,
            client=budget.client,
            notes=budget.notes,
            budget=budget,
            created_by=request.user,
        )
        budget.work_order = wo
        budget.save(update_fields=['work_order'])
        return Response(WorkOrderSerializer(wo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def invoice(self, request, pk=None):
        budget = self.get_object()
        if budget.status == Budget.Status.FACTURADO:
            return Response({'detail': 'Este presupuesto ya fue facturado.'}, status=status.HTTP_400_BAD_REQUEST)
        budget.status = Budget.Status.FACTURADO
        budget.save(update_fields=['status'])
        if budget.work_order_id:
            from work_orders.models import WorkOrder
            WorkOrder.objects.filter(pk=budget.work_order_id).update(status=WorkOrder.Status.FACTURADA)
        return Response(self.get_serializer(budget).data)
