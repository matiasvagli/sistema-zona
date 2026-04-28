from rest_framework import viewsets
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from django.db.models import Prefetch
from accounts.permissions import IsAdminUser
from work_orders.models import WorkOrder
from .models import Landlord, Location, Structure, StructureFace, SpaceExpense, SpaceRental, LEDSlot
from .serializers import (
    LandlordSerializer, LocationSerializer, StructureSerializer,
    StructureFaceSerializer, SpaceExpenseSerializer, SpaceRentalSerializer,
    LEDSlotSerializer
)


class LandlordViewSet(viewsets.ModelViewSet):
    queryset = Landlord.objects.all()
    serializer_class = LandlordSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name', 'cuit')


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related('landlord').all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name', 'address')


class StructureViewSet(viewsets.ModelViewSet):
    queryset = Structure.objects.select_related('location').prefetch_related(
        'faces',
        Prefetch(
            'structure_work_orders',
            queryset=WorkOrder.objects.filter(work_type='instalacion_espacio_vial'),
            to_attr='installation_ots'
        )
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
    queryset = SpaceExpense.objects.all()
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
