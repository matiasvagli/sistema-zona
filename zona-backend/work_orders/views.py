import os
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import WorkOrder
from .serializers import WorkOrderSerializer


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.all()
    serializer_class = WorkOrderSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], url_path='upload-photo',
            parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        ot = self.get_object()
        file = request.FILES.get('file')
        category = request.data.get('category', 'before')

        if not file:
            return Response({'detail': 'No se recibió archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import WorkOrderPhoto
        photo = WorkOrderPhoto.objects.create(
            work_order=ot,
            image=file,
            category=category
        )

        return Response({
            'id': photo.id,
            'url': request.build_absolute_uri(photo.image.url),
            'category': photo.category
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='remove-photo')
    def remove_photo(self, request, pk=None):
        ot = self.get_object()
        photo_id = request.data.get('id')
        url = request.data.get('url')

        from .models import WorkOrderPhoto
        if photo_id:
            photo = WorkOrderPhoto.objects.filter(work_order=ot, id=photo_id).first()
        else:
            filename = url.split('/')[-1] if url else None
            photo = WorkOrderPhoto.objects.filter(work_order=ot, image__icontains=filename).first()

        if photo:
            photo.image.delete()
            photo.delete()
            return Response({'ok': True})

        return Response({'detail': 'Foto no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
