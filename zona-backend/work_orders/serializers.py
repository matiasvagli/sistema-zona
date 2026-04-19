from rest_framework import serializers
from .models import WorkOrder
from production.serializers import SectorTaskSerializer

class WorkOrderSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    tasks = SectorTaskSerializer(many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
