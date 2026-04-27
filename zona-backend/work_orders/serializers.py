from rest_framework import serializers
from .models import WorkOrder, WorkOrderPhoto, WorkOrderNotification
from production.serializers import SectorTaskSerializer


class WorkOrderPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderPhoto
        fields = ('id', 'image', 'category', 'uploaded_at')


class WorkOrderSerializer(serializers.ModelSerializer):
    client_name    = serializers.ReadOnlyField(source='client.name')
    structure_name = serializers.ReadOnlyField(source='structure.name')
    budget_title   = serializers.SerializerMethodField()
    tasks        = SectorTaskSerializer(many=True, read_only=True)
    new_photos   = WorkOrderPhotoSerializer(many=True, read_only=True, source='work_order_photos')

    def get_budget_title(self, obj):
        if obj.budget_id:
            return f"PRE-{obj.budget_id:04d}"
        return None

    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
class WorkOrderNotificationSerializer(serializers.ModelSerializer):
    work_order_title = serializers.ReadOnlyField(source='work_order.title')
    work_order_priority = serializers.ReadOnlyField(source='work_order.priority')
    
    class Meta:
        model = WorkOrderNotification
        fields = ('id', 'work_order', 'work_order_title', 'work_order_priority', 'kind', 'is_confirmed', 'confirmed_at', 'created_at')
        read_only_fields = ('is_confirmed', 'confirmed_at', 'created_at')
