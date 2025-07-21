from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Produit
from .serializers import ProduitSerializer
import logging

logger = logging.getLogger(__name__)

class ProduitListCreateView(generics.ListCreateAPIView):
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['categorie', 'fournisseur']
    search_fields = ['nom', 'reference', 'categorie']
    ordering_fields = ['nom', 'prix_unitaire', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Produit.objects.all()
        # Si le user est rattaché à un magasin (manager), filtrer
        if hasattr(user, 'magasin') and user.magasin is not None and not user.is_superuser:
            return qs.filter(magasin=user.magasin)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        magasin = None
        if hasattr(user, 'magasin') and user.magasin is not None and not user.is_superuser:
            magasin = user.magasin
        serializer.save(magasin=magasin)


class ProduitDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            produit = serializer.save()
            logger.info(f"Produit modifié avec succès: {produit.nom}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur lors de la modification du produit: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)