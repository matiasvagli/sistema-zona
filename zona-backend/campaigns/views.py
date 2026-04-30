from rest_framework import viewsets, status as drf_status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Campaign, CampaignSpace, CampaignPayment
from .serializers import CampaignSerializer, CampaignSpaceSerializer, CampaignPaymentSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    queryset = Campaign.objects.select_related('client').prefetch_related(
        'spaces__space_rental__face__structure__location',
        'spaces__space_rental__client',
        'payments',
        'work_orders',
    ).all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name',)
    filterset_fields = ('client', 'status')

    def perform_create(self, serializer):
        campaign = serializer.save()
        campaign.generate_payments()

    def perform_update(self, serializer):
        campaign = serializer.save()
        campaign.generate_payments()

    @action(detail=True, methods=['post'], url_path='regenerar-pagos')
    def regenerar_pagos(self, request, pk=None):
        campaign = self.get_object()
        campaign.generate_payments()
        return Response({'detail': 'Pagos regenerados correctamente.'})

    @action(detail=True, methods=['post'], url_path='aprobar')
    def aprobar(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status not in ('presupuesto', 'borrador'):
            return Response(
                {'detail': 'Solo se pueden aprobar campañas en estado Presupuesto.'},
                status=drf_status.HTTP_400_BAD_REQUEST
            )
        from work_orders.models import WorkOrder
        wo = WorkOrder.objects.create(
            title=campaign.name,
            work_type='campana',
            campaign=campaign,
            client=campaign.client,
            status='pendiente',
            notes=campaign.notes,
            created_by=request.user,
        )
        campaign.status = 'aprobado'
        campaign.save(update_fields=['status'])
        campaign.generate_payments()
        return Response(
            {'work_order_id': wo.id, 'work_order_title': str(wo)},
            status=drf_status.HTTP_201_CREATED
        )


class CampaignSpaceViewSet(viewsets.ModelViewSet):
    queryset = CampaignSpace.objects.select_related(
        'campaign__client',
        'space_rental__face__structure__location',
        'space_rental__client',
    ).all()
    serializer_class = CampaignSpaceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('campaign',)


class CampaignPaymentViewSet(viewsets.ModelViewSet):
    queryset = CampaignPayment.objects.select_related('campaign__client').all()
    serializer_class = CampaignPaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('campaign', 'status')
    http_method_names = ['get', 'patch', 'head', 'options']
