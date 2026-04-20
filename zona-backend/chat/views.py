from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models as db_models
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Message
from .serializers import MessageSerializer

User = get_user_model()


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        """Devuelve mensajes del chat grupal (sin destinatario específico) + conversaciones del usuario."""
        me = self.request.user
        # Mensajes grupales (broadcast) + mensajes en los que el usuario es sender o recipient
        return Message.objects.filter(
            db_models.Q(recipient__isnull=True) |
            db_models.Q(sender=me) |
            db_models.Q(recipient=me)
        ).select_related("sender", "recipient").order_by("created_at")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=["post"], url_path="mark-read")
    def mark_read(self, request):
        """Marca como leídos los mensajes personales o grupales."""
        sender_id = request.data.get("sender_id")
        me = request.user
        
        if sender_id:
            # Mensajes personales directos de este remitente para mí
            qs = Message.objects.filter(recipient=me, sender_id=sender_id, is_read=False)
        else:
            # Mensajes grupales (equipo) que no envié yo
            qs = Message.objects.filter(recipient__isnull=True, is_read=False).exclude(sender=me)
            
        qs.update(is_read=True)
        return Response({"ok": True})
    @action(detail=False, methods=["get"], url_path="unread-count")
    def unread_count(self, request):
        me = request.user
        
        # 1. Mensajes Directos (Personales)
        direct_qs = Message.objects.filter(recipient=me, is_read=False)
        direct_count = direct_qs.count()
        
        # 2. Mensajes Grupales (Equipo)
        group_qs = Message.objects.filter(recipient__isnull=True, is_read=False).exclude(sender=me)
        group_count = group_qs.count()
        
        # Conteo por remitente
        from django.db.models import Count
        per_sender_list = direct_qs.values('sender').annotate(total=Count('id'))
        per_sender = {str(item['sender']): item['total'] for item in per_sender_list}
        
        # Si hay mensajes de equipo, usamos una clave especial "group"
        if group_count > 0:
            per_sender["group"] = group_count
            
        return Response({
            "count": direct_count + group_count,
            "per_sender": per_sender
        })


class PresenceViewSet(viewsets.ViewSet):
    """Endpoints para gestión de presencia (heartbeat y listado)."""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=["post"], url_path="ping")
    def ping(self, request):
        """El frontend llama a este endpoint cada ~30s para indicar que el usuario está online."""
        user = request.user
        user.last_seen = timezone.now()
        user.save(update_fields=["last_seen"])
        return Response({"ok": True, "last_seen": user.last_seen})

    @action(detail=False, methods=["get"], url_path="online-users")
    def online_users(self, request):
        """Devuelve qué usuarios estuvieron activos en los últimos 2 minutos."""
        threshold = timezone.now() - timezone.timedelta(minutes=2)
        online_ids = list(
            User.objects.filter(last_seen__gte=threshold).values_list("id", flat=True)
        )
        return Response({"online": online_ids})
