from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Produit
from .serializers import ProduitSerializer

class ProduitListCreateView(generics.ListCreateAPIView):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categorie', 'fournisseur']
    search_fields = ['nom', 'reference', 'categorie']
    ordering_fields = ['nom', 'prix_unitaire', 'created_at']
    ordering = ['-created_at']

class ProduitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]