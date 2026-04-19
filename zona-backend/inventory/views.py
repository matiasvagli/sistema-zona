from rest_framework import viewsets
from .models import Product, StockMovement
from .serializers import ProductSerializer, StockMovementSerializer

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    search_fields = ('name',)

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    filterset_fields = ('product',)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        # Aquí se podría añadir lógica para actualizar stock_qty del producto
        # aunque lo ideal es que StockMovement actualice el Product vía signals o en el save
