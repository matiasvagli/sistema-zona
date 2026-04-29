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
    queryset = Budget.objects.select_related('client', 'work_order_assigned').prefetch_related('items__product').all()
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

        existing_wo = getattr(budget, 'work_order_assigned', None)
        if existing_wo:
            return Response(
                {'detail': f'Este presupuesto ya tiene una OT asociada (#{existing_wo.id}).'},
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
        return Response(WorkOrderSerializer(wo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def invoice(self, request, pk=None):
        budget = self.get_object()
        if budget.status == Budget.Status.FACTURADO:
            return Response({'detail': 'Este presupuesto ya fue facturado.'}, status=status.HTTP_400_BAD_REQUEST)
        billing_type = request.data.get('billing_type', Budget.BillingType.FACTURA)
        budget.status = Budget.Status.FACTURADO
        budget.billing_type = billing_type
        budget.save(update_fields=['status', 'billing_type'])
        wo = getattr(budget, 'work_order_assigned', None)
        if wo:
            from work_orders.models import WorkOrder
            WorkOrder.objects.filter(pk=wo.id).update(status=WorkOrder.Status.FACTURADA)
        if budget.iva_pct > 0:
            from finanzas.models import IvaRecord
            from django.utils import timezone as tz
            IvaRecord.objects.get_or_create(
                budget=budget,
                defaults={
                    'amount': budget.iva_amount,
                    'period': tz.now().date(),
                    'registered_by': request.user,
                },
            )
        return Response(self.get_serializer(budget).data)
