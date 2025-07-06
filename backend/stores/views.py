from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Magasin
from .serializers import MagasinSerializer

class MagasinListCreateView(generics.ListCreateAPIView):
    queryset = Magasin.objects.all()
    serializer_class = MagasinSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nom', 'adresse']
    ordering_fields = ['nom', 'created_at']
    ordering = ['-created_at']

class MagasinDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Magasin.objects.all()
    serializer_class = MagasinSerializer
    permission_classes = [permissions.IsAuthenticated]