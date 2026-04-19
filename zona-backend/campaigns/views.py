from rest_framework import viewsets
from .models import Campaign, CampaignSpace
from .serializers import CampaignSerializer, CampaignSpaceSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    search_fields = ('name',)
    filterset_fields = ('client', 'status')

class CampaignSpaceViewSet(viewsets.ModelViewSet):
    queryset = CampaignSpace.objects.all()
    serializer_class = CampaignSpaceSerializer
