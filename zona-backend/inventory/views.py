from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from .models import Product, StockMovement, MaterialReservation, PurchaseRequest
from .serializers import ProductSerializer, StockMovementSerializer, MaterialReservationSerializer, PurchaseRequestSerializer


def _is_admin(user):
    return user.is_staff or (hasattr(user, 'perfil') and user.perfil.rol in ('admin', 'ceo'))


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.none()
    serializer_class = ProductSerializer
    search_fields = ('name',)
    filterset_fields = ('sector', 'kind')

    def perform_create(self, serializer):
        kind = serializer.validated_data.get('kind', 'material')
        initial_qty = serializer.validated_data.get('stock_qty', Decimal('0'))

        if initial_qty > 0:
            product = serializer.save(stock_qty=Decimal('0'))
            sm_kwargs = {
                'product': product,
                'qty': initial_qty,
                'reason': "Stock inicial",
                'created_by': self.request.user,
            }
            raw = self.request.data.get('purchase_total')
            if raw:
                try:
                    total = Decimal(str(raw))
                    if total > 0:
                        if kind in ('insumo', 'herramienta'):
                            from finanzas.models import Expense
                            Expense.objects.create(
                                category=kind,
                                description=f"Compra inicial — {product.name}",
                                amount=total,
                                date=timezone.now().date(),
                                registered_by=self.request.user,
                            )
                        else:  # material: calcular precio unitario para promedio ponderado
                            sm_kwargs['purchase_price'] = total / initial_qty
                except Exception:
                    pass
            StockMovement.objects.create(**sm_kwargs)
        else:
            serializer.save(unit_price=None)

    def perform_update(self, serializer):
        if serializer.instance.kind == 'material':
            # Preservar unit_price existente — no pisar con lo que mande el form
            serializer.save(unit_price=serializer.instance.unit_price)
        else:
            serializer.save()

    def get_queryset(self):
        qs = Product.objects.select_related('sector').annotate(
            reserved_qty=Coalesce(
                Sum('reservations__quantity', filter=Q(reservations__status='pendiente')),
                Decimal('0')
            )
        )
        user = self.request.user
        if not _is_admin(user):
            sector_ids = set(user.sector_memberships.values_list('sector_id', flat=True))
            if user.sector_id:
                sector_ids.add(user.sector_id)
            qs = qs.filter(Q(sector__isnull=True) | Q(sector_id__in=sector_ids))
        return qs


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('product', 'created_by').all()
    serializer_class = StockMovementSerializer
    filterset_fields = ('product', 'product__kind')

    def perform_create(self, serializer):
        user = self.request.user
        if not _is_admin(user):
            qty = serializer.validated_data.get('qty', 0)
            if qty <= 0:
                raise ValidationError({"qty": "Solo podés registrar ingresos de material (cantidad positiva)."})
            product = serializer.validated_data['product']
            sector_ids = set(user.sector_memberships.values_list('sector_id', flat=True))
            if user.sector_id:
                sector_ids.add(user.sector_id)
            if product.sector_id and product.sector_id not in sector_ids:
                raise ValidationError({"product": "No tenés acceso a este producto."})

        instance = serializer.save(created_by=user)

        # Insumo/herramienta entries auto-generate an Expense using the total cost
        if instance.qty > 0 and instance.product.kind in ('insumo', 'herramienta'):
            from decimal import Decimal, InvalidOperation
            from finanzas.models import Expense
            raw = self.request.data.get('total_cost')
            if raw:
                try:
                    total_cost = Decimal(str(raw))
                    if total_cost > 0:
                        Expense.objects.create(
                            category=instance.product.kind,
                            description=f"{instance.reason or 'Compra'} — {instance.product.name}",
                            amount=total_cost,
                            date=timezone.now().date(),
                            registered_by=user,
                        )
                except (InvalidOperation, ValueError):
                    pass


class MaterialReservationViewSet(viewsets.ModelViewSet):
    queryset = MaterialReservation.objects.select_related(
        'product', 'sector_task__sector', 'sector_task__work_order',
        'requested_by', 'approved_by'
    ).all()
    serializer_class = MaterialReservationSerializer
    filterset_fields = ('sector_task', 'status', 'is_cross_sector')

    def get_queryset(self):
        qs = super().get_queryset()
        work_order_id = self.request.query_params.get('work_order')
        if work_order_id:
            qs = qs.filter(sector_task__work_order_id=work_order_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product       = serializer.validated_data['product']
        sector_task   = serializer.validated_data['sector_task']
        qty_requested = serializer.validated_data['quantity']

        # Bloquear solo si ya hay una pendiente para el mismo par (no tiene sentido duplicar)
        if MaterialReservation.objects.filter(
            sector_task=sector_task,
            product=product,
            status=MaterialReservation.Status.PENDIENTE,
        ).exists():
            return Response(
                {'detail': 'Ya hay una solicitud pendiente para este material. Esperá que el admin la procese.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation = serializer.save(requested_by=request.user)

        reserved  = product.reservations.filter(status='pendiente').aggregate(t=Sum('quantity'))['t'] or Decimal('0')
        available = product.stock_qty - reserved

        data = MaterialReservationSerializer(reservation).data
        if qty_requested > available:
            data['warning'] = (
                f"Stock disponible es {available} {product.unit} "
                f"(total: {product.stock_qty}, ya reservado: {reserved}). "
                f"Se registró el pedido igualmente para que el admin decida."
            )

        headers = self.get_success_headers(data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        reservation = self.get_object()

        if not request.user.has_perm('inventory.approve_material_reservation'):
            return Response(
                {'detail': 'No tenés permiso para aprobar reservas de material.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if reservation.status != MaterialReservation.Status.PENDIENTE:
            return Response(
                {'detail': 'Solo se pueden aprobar reservas en estado pendiente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        warning = None
        if reservation.product.stock_qty < reservation.quantity:
            warning = (
                f"Stock insuficiente: hay {reservation.product.stock_qty} "
                f"{reservation.product.unit} disponibles, se solicitan {reservation.quantity}."
            )

        reservation.status = MaterialReservation.Status.APROBADA
        reservation.approved_by = request.user
        reservation.approved_at = timezone.now()
        reservation.save()

        StockMovement.objects.create(
            product=reservation.product,
            qty=-reservation.quantity,
            reason=f"OT-{reservation.sector_task.work_order_id:04d} — {reservation.sector_task.sector.name}",
            created_by=request.user,
            reservation=reservation
        )

        data = MaterialReservationSerializer(reservation).data
        if warning:
            data['warning'] = warning
        return Response(data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        reservation = self.get_object()

        if not request.user.has_perm('inventory.approve_material_reservation'):
            return Response(
                {'detail': 'No tenés permiso para rechazar reservas de material.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if reservation.status != MaterialReservation.Status.PENDIENTE:
            return Response(
                {'detail': 'Solo se pueden rechazar reservas en estado pendiente.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.status = MaterialReservation.Status.RECHAZADA
        reservation.approved_by = request.user
        reservation.approved_at = timezone.now()
        reservation.rejection_reason = request.data.get('reason', '')
        reservation.save()

        return Response(MaterialReservationSerializer(reservation).data)


class PurchaseRequestViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequest.objects.select_related(
        'product', 'requested_by', 'resolved_by'
    ).all()
    serializer_class = PurchaseRequestSerializer
    filterset_fields = ('product', 'status')

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_ordered(self, request, pk=None):
        pr = self.get_object()
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if pr.status != PurchaseRequest.Status.PENDIENTE:
            return Response({'detail': 'Solo se puede marcar como "en compra" desde estado pendiente.'}, status=status.HTTP_400_BAD_REQUEST)

        pr.status = PurchaseRequest.Status.EN_COMPRA
        pr.resolved_by = request.user
        pr.resolved_at = timezone.now()
        pr.save()
        return Response(PurchaseRequestSerializer(pr).data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Marca como recibido y crea el StockMovement correspondiente."""
        pr = self.get_object()
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if pr.status not in (PurchaseRequest.Status.PENDIENTE, PurchaseRequest.Status.EN_COMPRA):
            return Response({'detail': 'Este pedido ya fue procesado.'}, status=status.HTTP_400_BAD_REQUEST)

        qty = request.data.get('quantity_received')
        price = request.data.get('purchase_price')

        if not qty:
            return Response({'detail': 'Ingresá la cantidad recibida.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            qty = Decimal(str(qty))
            price = Decimal(str(price)) if price else None
        except Exception:
            return Response({'detail': 'Valores numéricos inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

        pr.status = PurchaseRequest.Status.RECIBIDO
        pr.resolved_by = request.user
        pr.resolved_at = timezone.now()
        pr.quantity_received = qty
        pr.purchase_price = price
        pr.save()

        StockMovement.objects.create(
            product=pr.product,
            qty=qty,
            reason=f"Compra — pedido #{pr.id}",
            purchase_price=price,
            created_by=request.user,
        )

        return Response(PurchaseRequestSerializer(pr).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pr = self.get_object()
        if not _is_admin(request.user):
            return Response({'detail': 'Sin permiso.'}, status=status.HTTP_403_FORBIDDEN)
        if pr.status not in (PurchaseRequest.Status.PENDIENTE, PurchaseRequest.Status.EN_COMPRA):
            return Response({'detail': 'Este pedido ya fue procesado.'}, status=status.HTTP_400_BAD_REQUEST)

        pr.status = PurchaseRequest.Status.RECHAZADO
        pr.resolved_by = request.user
        pr.resolved_at = timezone.now()
        pr.rejection_reason = request.data.get('reason', '')
        pr.save()
        return Response(PurchaseRequestSerializer(pr).data)
