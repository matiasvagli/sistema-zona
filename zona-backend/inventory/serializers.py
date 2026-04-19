from rest_framework import serializers
from .models import Product, StockMovement

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')
