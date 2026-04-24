from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from accounts.permissions import is_admin
from .models import Expense, Supplier, SupplierInvoice
from .serializers import ExpenseSerializer, SupplierSerializer, SupplierInvoiceSerializer
from inventory.models import StockMovement


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
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)

        insumo_product_id      = request.data.get('insumo_product_id')
        insumo_name            = (request.data.get('insumo_name') or '').strip()
        insumo_unit            = request.data.get('insumo_unit') or 'unidad'
        insumo_qty_raw         = request.data.get('insumo_qty')

        herramienta_product_id = request.data.get('herramienta_product_id')
        herramienta_name       = (request.data.get('herramienta_name') or '').strip()
        herramienta_serial     = (request.data.get('herramienta_serial') or '').strip()
        herramienta_qty_raw    = request.data.get('herramienta_qty')

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save(registered_by=request.user)

        from inventory.models import Product, StockMovement
        from decimal import Decimal, InvalidOperation

        def _parse_qty(raw):
            try:
                qty = Decimal(str(raw))
                return qty if qty > 0 else None
            except (InvalidOperation, TypeError, ValueError):
                return None

        if insumo_qty_raw and (qty := _parse_qty(insumo_qty_raw)):
            product = None
            if insumo_product_id:
                product = Product.objects.filter(pk=insumo_product_id, kind='insumo').first()
            elif insumo_name:
                product = Product.objects.create(name=insumo_name, unit=insumo_unit, kind='insumo')
            if product:
                StockMovement.objects.create(
                    product=product, qty=qty,
                    reason=f"Compra — gasto #{expense.id}",
                    created_by=request.user,
                )

        if herramienta_qty_raw and (qty := _parse_qty(herramienta_qty_raw)):
            product = None
            if herramienta_product_id:
                product = Product.objects.filter(pk=herramienta_product_id, kind='herramienta').first()
            elif herramienta_name:
                product = Product.objects.create(
                    name=herramienta_name, unit='unidad', kind='herramienta',
                    serial_number=herramienta_serial,
                )
            if product:
                StockMovement.objects.create(
                    product=product, qty=qty,
                    reason=f"Compra — gasto #{expense.id}",
                    created_by=request.user,
                )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='resumen-ot/(?P<work_order_id>[^/.]+)')
    def resumen_ot(self, request, work_order_id=None):
        if not is_admin(request.user):
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
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
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
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        if not is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if invoice.status == SupplierInvoice.Status.PAGADA:
            return Response({'detail': 'La factura ya está marcada como pagada.'}, status=status.HTTP_400_BAD_REQUEST)

        invoice.status = SupplierInvoice.Status.PAGADA
        invoice.paid_at = timezone.now()
        invoice.save()
        return Response(SupplierInvoiceSerializer(invoice).data)
