from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Fournisseur
from .serializers import FournisseurSerializer

class FournisseurListCreateView(generics.ListCreateAPIView):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nom', 'contact']
    ordering_fields = ['nom', 'created_at']
    ordering = ['-created_at']

class FournisseurDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Fournisseur.objects.all()
    serializer_class = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]