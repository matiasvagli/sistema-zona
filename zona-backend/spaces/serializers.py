from rest_framework import serializers
from .models import AdSpace, SpaceRental

class AdSpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdSpace
        fields = '__all__'

class SpaceRentalSerializer(serializers.ModelSerializer):
    ad_space_name = serializers.ReadOnlyField(source='ad_space.name')
    client_name = serializers.ReadOnlyField(source='client.name')

    class Meta:
        model = SpaceRental
        fields = '__all__'
