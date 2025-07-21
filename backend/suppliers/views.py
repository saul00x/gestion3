# suppliers/views.py - Version corrigée avec filtrage par magasin

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Fournisseur
from .serializers import FournisseurSerializer
import logging

logger = logging.getLogger(__name__)

class FournisseurListCreateView(generics.ListCreateAPIView):
    serializer_class = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nom', 'contact']
    ordering_fields = ['nom', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Filtrer les fournisseurs selon le magasin du manager connecté
        """
        user = self.request.user
        
        # Vérifier si l'utilisateur a un profil manager avec un magasin
        if hasattr(user, 'manager_profile') and user.manager_profile.magasin:
            magasin = user.manager_profile.magasin
            logger.info(f"Manager {user.username} accède aux fournisseurs du magasin {magasin.nom}")
            return Fournisseur.objects.filter(magasin=magasin)
        
        # Fallback: essayer de récupérer le magasin depuis d'autres sources
        # (ajustez selon votre structure de données utilisateur)
        elif hasattr(user, 'magasin'):
            return Fournisseur.objects.filter(magasin=user.magasin)
        
        # Si aucun magasin n'est associé, retourner une queryset vide
        logger.warning(f"Utilisateur {user.username} n'a pas de magasin associé")
        return Fournisseur.objects.none()

    def perform_create(self, serializer):
        """
        Associer automatiquement le fournisseur au magasin du manager
        """
        user = self.request.user
        
        # Récupérer le magasin du manager connecté
        magasin = None
        if hasattr(user, 'manager_profile') and user.manager_profile.magasin:
            magasin = user.manager_profile.magasin
        elif hasattr(user, 'magasin'):
            magasin = user.magasin
            
        if magasin:
            serializer.save(magasin=magasin)
            logger.info(f"Fournisseur créé pour le magasin {magasin.nom}")
        else:
            logger.error(f"Impossible de créer le fournisseur: aucun magasin associé à {user.username}")
            raise serializers.ValidationError("Aucun magasin associé à votre compte")

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Création de fournisseur par {request.user.username}: {request.data.get('nom')}")
            return super().create(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Erreur lors de la création du fournisseur: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class FournisseurDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FournisseurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Même logique de filtrage pour les opérations de détail
        """
        user = self.request.user
        
        if hasattr(user, 'manager_profile') and user.manager_profile.magasin:
            magasin = user.manager_profile.magasin
            return Fournisseur.objects.filter(magasin=magasin)
        elif hasattr(user, 'magasin'):
            return Fournisseur.objects.filter(magasin=user.magasin)
        
        return Fournisseur.objects.none()

    def update(self, request, *args, **kwargs):
        try:
            # Vérifier que le fournisseur appartient au bon magasin
            instance = self.get_object()
            user = self.request.user
            
            # Vérification de sécurité supplémentaire
            user_magasin = None
            if hasattr(user, 'manager_profile') and user.manager_profile.magasin:
                user_magasin = user.manager_profile.magasin
            elif hasattr(user, 'magasin'):
                user_magasin = user.magasin
                
            if instance.magasin != user_magasin:
                logger.warning(f"Tentative de modification non autorisée par {user.username}")
                return Response({'error': 'Non autorisé'}, status=status.HTTP_403_FORBIDDEN)
            
            partial = kwargs.pop('partial', False)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            fournisseur = serializer.save()
            logger.info(f"Fournisseur modifié avec succès: {fournisseur.nom}")
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Erreur lors de la modification du fournisseur: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)