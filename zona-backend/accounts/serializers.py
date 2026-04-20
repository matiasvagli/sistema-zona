from rest_framework import serializers
from .models import User, Perfil, SectorMembership


class SectorMembershipSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')
    username = serializers.ReadOnlyField(source='usuario.username')

    class Meta:
        model = SectorMembership
        fields = ('id', 'usuario', 'username', 'sector', 'sector_name', 'puede_ver', 'puede_crear', 'puede_editar', 'puede_eliminar')


class UserSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.name')
    password = serializers.CharField(write_only=True, required=False)
    rol = serializers.CharField(source='perfil.rol', read_only=True)
    sector_memberships = SectorMembershipSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'sector', 'sector_name', 'password', 'is_staff', 'rol', 'sector_memberships')
        read_only_fields = ('id', 'rol', 'sector_memberships')

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ('id', 'rol')
