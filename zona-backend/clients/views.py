from rest_framework import viewsets
from .models import Client
from .serializers import ClientSerializer

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    search_fields = ('name', 'tax_id')
    filterset_fields = ('is_active',)
