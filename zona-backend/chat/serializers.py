from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_name     = serializers.SerializerMethodField()
    recipient_name  = serializers.SerializerMethodField()
    sender_initials = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_name", "sender_initials",
                  "recipient", "recipient_name", "content", "is_read", "created_at"]
        read_only_fields = ["id", "sender", "sender_name", "sender_initials", "recipient_name", "is_read", "created_at"]

    def get_sender_name(self, obj):
        u = obj.sender
        return f"{u.first_name} {u.last_name}".strip() or u.username

    def get_sender_initials(self, obj):
        u = obj.sender
        fn = (u.first_name or u.username or "?")[0].upper()
        ln = (u.last_name or (u.username[1] if len(u.username) > 1 else "?"))[0].upper()
        return fn + ln

    def get_recipient_name(self, obj):
        if not obj.recipient:
            return "Todos"
        u = obj.recipient
        return f"{u.first_name} {u.last_name}".strip() or u.username
