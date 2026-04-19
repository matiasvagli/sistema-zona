from rest_framework import serializers
from .models import Sector, SectorTask

class SectorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = '__all__'

class SectorTaskSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')
    assigned_to_name = serializers.ReadOnlyField(source='assigned_to.username')
    work_order_title = serializers.ReadOnlyField(source='work_order.title')

    class Meta:
        model = SectorTask
        fields = '__all__'
        read_only_fields = ('started_at', 'finished_at', 'created_at')
