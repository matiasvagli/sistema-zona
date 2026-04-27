from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUser
from .models import Campaign, CampaignSpace
from .serializers import CampaignSerializer, CampaignSpaceSerializer


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.select_related('client').prefetch_related(
        'spaces__space_rental__face__structure__location',
        'spaces__space_rental__client',
    ).all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    search_fields = ('name',)
    filterset_fields = ('client', 'status')


class CampaignSpaceViewSet(viewsets.ModelViewSet):
    queryset = CampaignSpace.objects.select_related(
        'campaign__client',
        'space_rental__face__structure__location',
        'space_rental__client',
    ).all()
    serializer_class = CampaignSpaceSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filterset_fields = ('campaign',)
