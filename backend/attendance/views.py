from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Presence
from .serializers import PresenceSerializer

class PresenceListCreateView(generics.ListCreateAPIView):
    serializer_class = PresenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['user', 'magasin', 'type']
    ordering = ['-date_pointage']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Presence.objects.all()
        else:
            return Presence.objects.filter(user=user)

class PresenceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PresenceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Presence.objects.all()
        else:
            return Presence.objects.filter(user=user)