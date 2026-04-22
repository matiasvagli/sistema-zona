from rest_framework import serializers
from .models import Expense, Supplier, SupplierInvoice


class ExpenseSerializer(serializers.ModelSerializer):
    registered_by_name = serializers.ReadOnlyField(source='registered_by.username')
    work_order_title   = serializers.ReadOnlyField(source='work_order.title')
    category_display   = serializers.ReadOnlyField(source='get_category_display')

    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('registered_by', 'created_at')


class SupplierSerializer(serializers.ModelSerializer):
    invoice_count = serializers.SerializerMethodField()
    pending_amount = serializers.SerializerMethodField()

    def get_invoice_count(self, obj):
        return obj.invoices.count()

    def get_pending_amount(self, obj):
        from django.db.models import Sum
        return obj.invoices.filter(status='pendiente').aggregate(t=Sum('amount'))['t'] or 0

    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ('created_at',)


class SupplierInvoiceSerializer(serializers.ModelSerializer):
    supplier_name          = serializers.ReadOnlyField(source='supplier.name')
    registered_by_name     = serializers.ReadOnlyField(source='registered_by.username')
    purchase_request_info  = serializers.SerializerMethodField()
    status_display         = serializers.ReadOnlyField(source='get_status_display')

    def get_purchase_request_info(self, obj):
        if not obj.purchase_request_id:
            return None
        pr = obj.purchase_request
        return {
            'id': pr.id,
            'product_name': pr.product.name,
            'quantity_requested': str(pr.quantity_requested),
        }

    class Meta:
        model = SupplierInvoice
        fields = '__all__'
        read_only_fields = ('registered_by', 'paid_at', 'created_at')
