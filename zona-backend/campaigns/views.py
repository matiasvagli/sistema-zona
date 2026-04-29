from rest_framework import viewsets, status as drf_status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsAdminUser
from .models import Campaign, CampaignSpace
from .serializers import CampaignSerializer, CampaignSpaceSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related('client').prefetch_related(
        'spaces__space_rental__face__structure__location',
        'spaces__space_rental__client',
        'work_orders',
    ).all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name',)
    filterset_fields = ('client', 'status')

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
