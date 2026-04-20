from rest_framework import serializers
from .models import Budget, BudgetItem

class BudgetItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    total_price = serializers.ReadOnlyField()

    class Meta:
        model = BudgetItem
        fields = '__all__'

class BudgetSerializer(serializers.ModelSerializer):
    client_name  = serializers.ReadOnlyField(source='client.name')
    total_amount = serializers.ReadOnlyField()
    items        = BudgetItemSerializer(many=True, read_only=True)

    class Meta:
        model = Budget
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'issue_date')
