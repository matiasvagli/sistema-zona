from rest_framework import viewsets
from .models import AdSpace, SpaceRental
from .serializers import AdSpaceSerializer, SpaceRentalSerializer

class AdSpaceViewSet(viewsets.ModelViewSet):
    queryset = AdSpace.objects.all()
    serializer_class = AdSpaceSerializer
    search_fields = ('name', 'location_desc')

class SpaceRentalViewSet(viewsets.ModelViewSet):
    queryset = SpaceRental.objects.all()
    serializer_class = SpaceRentalSerializer
    filterset_fields = ('client', 'ad_space', 'status')
