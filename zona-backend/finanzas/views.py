from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from .models import Expense, Supplier, SupplierInvoice
from .serializers import ExpenseSerializer, SupplierSerializer, SupplierInvoiceSerializer
from inventory.models import StockMovement


def _is_admin(user):
    return user.is_staff or (hasattr(user, 'perfil') and user.perfil.rol in ('admin', 'ceo'))


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    filterset_fields = ('category', 'work_order')

    def get_queryset(self):
        qs = Expense.objects.select_related('work_order', 'registered_by').all()
        desde = self.request.query_params.get('desde')
        hasta = self.request.query_params.get('hasta')
        if desde:
            qs = qs.filter(date__gte=desde)
        if hasta:
            qs = qs.filter(date__lte=hasta)
        return qs

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)

    def create(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='resumen-ot/(?P<work_order_id>[^/.]+)')
    def resumen_ot(self, request, work_order_id=None):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)

        from work_orders.models import WorkOrder
        try:
            ot = WorkOrder.objects.prefetch_related('budgets_linked__items').get(pk=work_order_id)
        except WorkOrder.DoesNotExist:
            return Response({'detail': 'OT no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        income = Decimal('0')
        for budget in ot.budgets_linked.filter(status__in=('aprobado', 'facturado')):
            income += budget.total_amount

        movements = StockMovement.objects.filter(
            reservation__sector_task__work_order_id=work_order_id,
            qty__lt=0
        ).exclude(unit_price_snapshot=None)

        material_cost = sum(abs(m.qty) * m.unit_price_snapshot for m in movements)

        direct_expenses = Expense.objects.filter(work_order_id=work_order_id).aggregate(
            t=Sum('amount')
        )['t'] or Decimal('0')

        net = income - material_cost - direct_expenses

        return Response({
            'work_order_id':    int(work_order_id),
            'work_order_title': str(ot),
            'income':           income,
            'material_cost':    material_cost,
            'direct_expenses':  direct_expenses,
            'net':              net,
        })


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.prefetch_related('invoices').all()
    serializer_class = SupplierSerializer

    def create(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)


class SupplierInvoiceViewSet(viewsets.ModelViewSet):
    queryset = SupplierInvoice.objects.select_related(
        'supplier', 'registered_by', 'purchase_request__product'
    ).all()
    serializer_class = SupplierInvoiceSerializer
    filterset_fields = ('supplier', 'status')
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = super().get_queryset()
        desde = self.request.query_params.get('desde')
        hasta = self.request.query_params.get('hasta')
        if desde:
            qs = qs.filter(date__gte=desde)
        if hasta:
            qs = qs.filter(date__lte=hasta)
        return qs

    def perform_create(self, serializer):
        serializer.save(registered_by=self.request.user)

    def create(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if invoice.status == SupplierInvoice.Status.PAGADA:
            return Response({'detail': 'La factura ya está marcada como pagada.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice.status = SupplierInvoice.Status.PAGADA
        invoice.paid_at = timezone.now()
        invoice.save()
        return Response(SupplierInvoiceSerializer(invoice).data)
