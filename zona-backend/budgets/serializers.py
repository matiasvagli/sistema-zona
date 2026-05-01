from rest_framework import serializers
from .models import Budget, BudgetItem

class BudgetItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = BudgetItem
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    client_name    = serializers.ReadOnlyField(source='client.name')
    client_tax_id  = serializers.ReadOnlyField(source='client.tax_id')
    client_email   = serializers.ReadOnlyField(source='client.email')
    client_phone   = serializers.ReadOnlyField(source='client.phone')
    client_address = serializers.ReadOnlyField(source='client.address')
    total_amount   = serializers.ReadOnlyField()
    iva_amount     = serializers.ReadOnlyField()
    total_with_iva = serializers.ReadOnlyField()
    items          = BudgetItemSerializer(many=True, read_only=True)
    work_order     = serializers.SerializerMethodField()

    def get_work_order(self, obj):
        wo = getattr(obj, 'work_order_assigned', None)
        return wo.id if wo else None

    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'issue_date')
