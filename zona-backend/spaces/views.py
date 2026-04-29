from datetime import date
from dateutil.relativedelta import relativedelta
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Prefetch
from accounts.permissions import IsAdminUser
from work_orders.models import WorkOrder
from .models import Landlord, Location, Structure, StructureFace, SpaceExpense, SpaceRental, LEDSlot
from .serializers import (
    LandlordSerializer, LocationSerializer, StructureSerializer,
    StructureFaceSerializer, SpaceExpenseSerializer, SpaceRentalSerializer,
    LEDSlotSerializer
)

_faces_with_rentals = Prefetch(
    'faces',
    queryset=StructureFace.objects.prefetch_related('rentals'),
)


class LandlordViewSet(viewsets.ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name', 'cuit')


_PERIOD_DELTA = {
    'mensual':    relativedelta(months=1),
    'bimestral':  relativedelta(months=2),
    'semestral':  relativedelta(months=6),
    'anual':      relativedelta(years=1),
    'por_contrato': None,
}

_PERIOD_END_OFFSET = {
    'mensual':    relativedelta(months=1, days=-1),
    'bimestral':  relativedelta(months=2, days=-1),
    'semestral':  relativedelta(months=6, days=-1),
    'anual':      relativedelta(years=1, days=-1),
}


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related('landlord').all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name', 'address')

    @action(detail=True, methods=['post'], url_path='generate_rent')
    def generate_rent(self, request, pk=None):
        location = self.get_object()

        if not location.rent_amount or not location.contract_start_date:
            return Response({'error': 'El terreno no tiene monto de alquiler o fecha de inicio de contrato.'}, status=400)

        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        try:
            start = date.fromisoformat(from_date) if from_date else location.contract_start_date
            end = date.fromisoformat(to_date) if to_date else (location.contract_end_date or date(start.year, 12, 31))
        except (ValueError, TypeError):
            return Response({'error': 'Fechas inválidas. Usar formato YYYY-MM-DD.'}, status=400)

        period = location.rent_period
        delta = _PERIOD_DELTA.get(period)

        created = []

        if delta is None:
            # por_contrato: un único gasto por el período completo
            if not SpaceExpense.objects.filter(
                location=location, expense_type='alquiler',
                period_from=start, period_to=end
            ).exists():
                exp = SpaceExpense.objects.create(
                    location=location,
                    expense_type='alquiler',
                    amount=location.rent_amount,
                    date=start,
                    period_from=start,
                    period_to=end,
                    description=f'Alquiler por contrato generado automáticamente',
                )
                created.append(exp)
        else:
            end_offset = _PERIOD_END_OFFSET[period]
            cursor = start
            while cursor <= end:
                period_end = min(cursor + end_offset, end)
                if not SpaceExpense.objects.filter(
                    location=location, expense_type='alquiler', period_from=cursor
                ).exists():
                    exp = SpaceExpense.objects.create(
                        location=location,
                        expense_type='alquiler',
                        amount=location.rent_amount,
                        date=cursor,
                        period_from=cursor,
                        period_to=period_end,
                        description=f'Alquiler {period} generado automáticamente',
                    )
                    created.append(exp)
                cursor += delta

        serializer = SpaceExpenseSerializer(created, many=True)
        return Response({'created': len(created), 'expenses': serializer.data})


class StructureViewSet(viewsets.ModelViewSet):
    queryset = Structure.objects.select_related('location').prefetch_related(
        _faces_with_rentals,
        Prefetch(
            'led_slots',
            queryset=LEDSlot.objects.filter(status='activo'),
            to_attr='active_led_slots',
        ),
        Prefetch(
            'structure_work_orders',
            queryset=WorkOrder.objects.filter(work_type='instalacion_espacio_vial'),
            to_attr='installation_ots',
        ),
    ).all()
    serializer_class = StructureSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields = ('name', 'location__name')
    filterset_fields = ('location', 'type', 'is_active')


class StructureFaceViewSet(viewsets.ModelViewSet):
    queryset = StructureFace.objects.select_related('structure__location').all()
    serializer_class = StructureFaceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('structure', 'is_active')


class SpaceExpenseViewSet(viewsets.ModelViewSet):
    queryset = SpaceExpense.objects.select_related('location', 'structure').order_by('-date')
    serializer_class = SpaceExpenseSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('location', 'structure', 'expense_type')


class SpaceRentalViewSet(viewsets.ModelViewSet):
    queryset = SpaceRental.objects.select_related(
        'face__structure__location', 'client', 'campaign'
    ).all()
    serializer_class = SpaceRentalSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('client', 'face', 'status', 'campaign')


class LEDSlotViewSet(viewsets.ModelViewSet):
    queryset = LEDSlot.objects.select_related(
        'structure__location', 'client', 'campaign'
    ).all()
    serializer_class = LEDSlotSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('structure', 'client', 'campaign', 'status')
