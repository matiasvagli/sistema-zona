from datetime import date
from rest_framework import serializers
from .models import Landlord, Location, Structure, StructureFace, SpaceExpense, SpaceRental, LEDSlot, LocationContract


class LandlordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Landlord
        fields = '__all__'


class LocationContractSerializer(serializers.ModelSerializer):
    contract_file_url = serializers.SerializerMethodField()

    def get_contract_file_url(self, obj):
        if obj.contract_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.contract_file.url)
            return obj.contract_file.url
        return None

    class Meta:
        model = LocationContract
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    landlord_name = serializers.ReadOnlyField(source='landlord.name')
    contracts = LocationContractSerializer(many=True, read_only=True)

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
    location_latitude = serializers.ReadOnlyField(source='location.latitude')
    location_longitude = serializers.ReadOnlyField(source='location.longitude')
    location_address = serializers.ReadOnlyField(source='location.address')
    location_locality = serializers.ReadOnlyField(source='location.locality')
    faces = StructureFaceSerializer(many=True, required=False)
    has_installation_ot = serializers.SerializerMethodField()
    availability = serializers.SerializerMethodField()

    def get_has_installation_ot(self, obj):
        installation_ots = getattr(obj, 'installation_ots', None)
        if installation_ots is not None:
            return len(installation_ots) > 0
        return obj.structure_work_orders.filter(work_type='instalacion_espacio_vial').exists()

    def get_availability(self, obj):
        today = date.today()
        if obj.type == 'pantalla_led':
            active_slots = getattr(obj, 'active_led_slots', None)
            if active_slots is None:
                active_slots = list(obj.led_slots.filter(status='activo'))

            op_hours = obj.led_operating_hours or 24
            sec_per_hour = obj.led_total_seconds_per_hour or 3600
            total_day = sec_per_hour * op_hours

            sold_day = 0
            for s in active_slots:
                if s.hour_from is not None and s.hour_to is not None:
                    slot_hours = max(0, s.hour_to - s.hour_from)
                else:
                    slot_hours = op_hours
                sold_day += s.seconds_per_hour * slot_hours

            available_day = max(0, total_day - sold_day)
            pct_free = round(available_day / total_day * 100) if total_day else 0

            max_end_date = None
            if active_slots:
                end_dates = [s.end_date for s in active_slots if s.end_date]
                if end_dates:
                    max_end_date = max(end_dates).isoformat()

            return {
                'type': 'led',
                'operating_hours': op_hours,
                'sec_per_hour': sec_per_hour,
                'total_day': round(total_day, 2),
                'sold_day': round(sold_day, 2),
                'available_day': round(available_day, 2),
                'pct': pct_free,
                'end_date': max_end_date,
            }
        faces = [f for f in obj.faces.all() if f.is_active]
        face_details = []
        for f in faces:
            active_rentals = [
                r for r in f.rentals.all()
                if r.status in ('activo', 'reservado') and r.start_date <= today <= r.end_date
            ]
            is_occupied = len(active_rentals) > 0
            face_end_date = None
            if is_occupied:
                end_dates = [r.end_date for r in active_rentals if r.end_date]
                if end_dates:
                    face_end_date = max(end_dates).isoformat()
            
            face_details.append({
                'id': f.id, 
                'name': f.name, 
                'occupied': is_occupied,
                'end_date': face_end_date
            })

        occupied = sum(1 for f in face_details if f['occupied'])
        total = len(face_details)
        if total == 0:
            status = 'sin_caras'
        elif occupied == 0:
            status = 'disponible'
        elif occupied < total:
            status = 'parcial'
        else:
            status = 'ocupado'
            
        # Calcular fecha máxima de finalización global de caras ocupadas
        max_face_end_date = None
        if occupied == total and total > 0:
            all_end_dates = [f['end_date'] for f in face_details if f['end_date']]
            if all_end_dates:
                max_face_end_date = max(all_end_dates)

        return {
            'type': 'faces',
            'total': total,
            'occupied': occupied,
            'available': total - occupied,
            'status': status,
            'faces': face_details,
            'end_date': max_face_end_date,
        }

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
    location_name = serializers.ReadOnlyField(source='location.name')
    structure_name = serializers.ReadOnlyField(source='structure.name')

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
