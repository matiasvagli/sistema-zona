from rest_framework import serializers
from .models import Landlord, Location, Structure, StructureFace, SpaceExpense, SpaceRental, LEDSlot


class LandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landlord
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    landlord_name = serializers.ReadOnlyField(source='landlord.name')

    class Meta:
        model = Location
        fields = '__all__'


class StructureFaceSerializer(serializers.ModelSerializer):
    structure_name = serializers.ReadOnlyField(source='structure.name')
    location_name = serializers.ReadOnlyField(source='structure.location.name')
    display_name = serializers.SerializerMethodField()

    def get_display_name(self, obj):
        return f"{obj.name} — {obj.structure.name} ({obj.structure.location.name})"

    class Meta:
        model = StructureFace
        fields = '__all__'
        extra_kwargs = {
            'structure': {'read_only': True}
        }


class StructureSerializer(serializers.ModelSerializer):
    location_name = serializers.ReadOnlyField(source='location.name')
    faces = StructureFaceSerializer(many=True, required=False)
    has_installation_ot = serializers.SerializerMethodField()

    def get_has_installation_ot(self, obj):
        installation_ots = getattr(obj, 'installation_ots', None)
        if installation_ots is not None:
            return len(installation_ots) > 0
        return obj.structure_work_orders.filter(work_type='instalacion_espacio_vial').exists()

    class Meta:
        model = Structure
        fields = '__all__'

    def create(self, validated_data):
        faces_data = validated_data.pop('faces', [])
        structure = Structure.objects.create(**validated_data)
        if not faces_data:
            StructureFace.objects.create(structure=structure, name="Principal")
        else:
            for face_data in faces_data:
                StructureFace.objects.create(structure=structure, **face_data)
        return structure

    def update(self, instance, validated_data):
        faces_data = validated_data.pop('faces', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if faces_data is not None:
            for face_data in faces_data:
                if 'id' not in face_data:
                    StructureFace.objects.create(structure=instance, **face_data)
        return instance


class SpaceExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = SpaceExpense
        fields = '__all__'


class SpaceRentalSerializer(serializers.ModelSerializer):
    face_name = serializers.ReadOnlyField(source='face.name')
    structure_name = serializers.ReadOnlyField(source='face.structure.name')
    location_name = serializers.ReadOnlyField(source='face.structure.location.name')
    client_name = serializers.ReadOnlyField(source='client.name')
    campaign_name = serializers.ReadOnlyField(source='campaign.name')

    class Meta:
        model = SpaceRental
        fields = '__all__'


class LEDSlotSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    campaign_name = serializers.ReadOnlyField(source='campaign.name')
    structure_name = serializers.ReadOnlyField(source='structure.name')
    location_name = serializers.ReadOnlyField(source='structure.location.name')
    seconds_per_hour = serializers.ReadOnlyField()

    class Meta:
        model = LEDSlot
        fields = '__all__'
