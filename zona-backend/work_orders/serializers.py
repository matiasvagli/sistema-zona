from rest_framework import serializers
from .models import WorkOrder, WorkOrderMaterial, WorkOrderPhoto
from production.serializers import SectorTaskSerializer


class WorkOrderMaterialSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_unit = serializers.ReadOnlyField(source='product.unit')

    class Meta:
        model = WorkOrderMaterial
        fields = ('id', 'work_order', 'product', 'product_name', 'product_unit', 'quantity', 'notes')


class WorkOrderPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkOrderPhoto
        fields = ('id', 'image', 'category', 'uploaded_at')

class WorkOrderSerializer(serializers.ModelSerializer):
    client_name  = serializers.ReadOnlyField(source='client.name')
    budget_title = serializers.SerializerMethodField()
    tasks        = SectorTaskSerializer(many=True, read_only=True)
    materials    = WorkOrderMaterialSerializer(many=True, read_only=True)
    new_photos   = WorkOrderPhotoSerializer(many=True, read_only=True, source='work_order_photos')

    def get_budget_title(self, obj):
        if obj.budget_id:
            return f"PRE-{obj.budget_id:04d}"
        return None

    class Meta:
        model = WorkOrder
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
