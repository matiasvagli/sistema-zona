from rest_framework import serializers
from .models import Campaign, CampaignSpace

class CampaignSpaceSerializer(serializers.ModelSerializer):
    space_name = serializers.ReadOnlyField(source='space_rental.ad_space.name')

    class Meta:
        model = CampaignSpace
        fields = '__all__'

class CampaignSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    spaces = CampaignSpaceSerializer(many=True, read_only=True)

    class Meta:
        model = Campaign
        fields = '__all__'
        read_only_fields = ('spaces',)
