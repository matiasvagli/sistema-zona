from rest_framework import viewsets
from .models import Employee
from .serializers import EmployeeSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    search_fields = ('first_name', 'last_name', 'legajo')
    filterset_fields = ('sector', 'is_active')
