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
    reservations = serializers.SerializerMethodField()

    def get_reservations(self, obj):
        from inventory.serializers import MaterialReservationSerializer
        return MaterialReservationSerializer(
            obj.reservations.all(), many=True, context=self.context
        ).data

    class Meta:
        model = SectorTask
        fields = '__all__'
        read_only_fields = ('started_at', 'finished_at', 'created_at')
