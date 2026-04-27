from rest_framework import serializers
from .models import Campaign, CampaignSpace


class CampaignSpaceSerializer(serializers.ModelSerializer):
    face_name = serializers.ReadOnlyField(source='space_rental.face.name')
    structure_name = serializers.ReadOnlyField(source='space_rental.face.structure.name')
    location_name = serializers.ReadOnlyField(source='space_rental.face.structure.location.name')
    client_name = serializers.ReadOnlyField(source='space_rental.client.name')
    rental_start = serializers.ReadOnlyField(source='space_rental.start_date')
    rental_end = serializers.ReadOnlyField(source='space_rental.end_date')
    rental_price = serializers.ReadOnlyField(source='space_rental.price')

    class Meta:
        model = CampaignSpace
        fields = '__all__'


class CampaignSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    spaces = CampaignSpaceSerializer(many=True, read_only=True)
    spaces_count = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('spaces',)

    def get_spaces_count(self, obj):
        return obj.spaces.count()
