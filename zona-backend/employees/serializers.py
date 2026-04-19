from rest_framework import serializers
from .models import Employee

class EmployeeSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Employee
        fields = '__all__'
