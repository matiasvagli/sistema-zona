from rest_framework import serializers
from .models import Product, StockMovement, MaterialReservation, PurchaseRequest


def _is_admin(user):
    return user.is_staff or (hasattr(user, 'perfil') and user.perfil.rol in ('admin', 'ceo'))


class ProductSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')
    stock_bajo = serializers.ReadOnlyField()
    reserved_qty = serializers.SerializerMethodField()
    available_qty = serializers.SerializerMethodField()

    def get_reserved_qty(self, obj):
        if hasattr(obj, 'reserved_qty'):
            return obj.reserved_qty
        from django.db.models import Sum, Q
        return obj.reservations.filter(status='pendiente').aggregate(
            t=Sum('quantity')
        )['t'] or 0

    def get_available_qty(self, obj):
        reserved = self.get_reserved_qty(obj)
        return max(obj.stock_qty - reserved, 0)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and not _is_admin(request.user):
            data.pop('unit_price', None)
        return data

    class Meta:
        model = Product
        fields = '__all__'


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and not _is_admin(request.user):
            data.pop('purchase_price', None)
        return data

    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at')


class MaterialReservationSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_unit = serializers.ReadOnlyField(source='product.unit')
    product_stock = serializers.ReadOnlyField(source='product.stock_qty')
    sector_task_sector = serializers.ReadOnlyField(source='sector_task.sector.name')
    work_order_id = serializers.ReadOnlyField(source='sector_task.work_order_id')
    requested_by_name = serializers.ReadOnlyField(source='requested_by.username')
    approved_by_name = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = MaterialReservation
        fields = '__all__'
        read_only_fields = ('status', 'is_cross_sector', 'requested_by', 'approved_by', 'approved_at', 'created_at')


class PurchaseRequestSerializer(serializers.ModelSerializer):
    product_name    = serializers.ReadOnlyField(source='product.name')
    product_unit    = serializers.ReadOnlyField(source='product.unit')
    product_stock   = serializers.ReadOnlyField(source='product.stock_qty')
    product_alert   = serializers.ReadOnlyField(source='product.alert_qty')
    requested_by_name = serializers.ReadOnlyField(source='requested_by.username')
    resolved_by_name  = serializers.ReadOnlyField(source='resolved_by.username')

    class Meta:
        model = PurchaseRequest
        fields = '__all__'
        read_only_fields = (
            'status', 'requested_by', 'resolved_by', 'resolved_at',
            'quantity_received', 'purchase_price', 'created_at',
        )
