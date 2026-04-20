from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessageViewSet, PresenceViewSet

router = DefaultRouter()
router.register("messages", MessageViewSet, basename="messages")
router.register("presence", PresenceViewSet, basename="presence")

urlpatterns = [
    path("", include(router.urls)),
]
