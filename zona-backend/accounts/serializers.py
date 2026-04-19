from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'sector', 'sector_name', 'groups')
        read_only_fields = ('id', 'groups')
