from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from .models import Stock, Mouvement, Commande, CommandeDetail, Notification
from .serializers import StockSerializer, MouvementSerializer, CommandeSerializer, CommandeDetailSerializer, NotificationSerializer
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

logger = logging.getLogger(__name__)

class StockListCreateView(generics.ListCreateAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['produit', 'magasin']
    ordering = ['-updated_at']
    
    def create(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Seuls les managers ou admins peuvent gérer le stock."}, status=status.HTTP_403_FORBIDDEN)
        try:
            logger.info(f"Création de stock")
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            stock = serializer.save()
            logger.info(f"Stock créé avec succès")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Erreur lors de la création du stock: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StockDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Seuls les managers ou admins peuvent modifier le stock."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Seuls les managers ou admins peuvent supprimer le stock."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

class MouvementListCreateView(generics.ListCreateAPIView):
    queryset = Mouvement.objects.all()
    serializer_class = MouvementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['produit', 'magasin', 'user', 'type']
    ordering = ['-date']

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Mouvement.objects.none()
        return super().get_queryset()

    def list(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Accès interdit."}, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Accès interdit."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    @transaction.atomic
    def perform_create(self, serializer):
        user = self.request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            raise Exception("Seuls les managers ou admins peuvent gérer les mouvements de stock.")
        
        # Vérification du seuil mouvement pour notification manager
        produit = serializer.validated_data['produit']
        quantite = serializer.validated_data['quantite']
        seuil_mouvement = getattr(produit, 'seuil_mouvement', None)
        seuil_ok = True
        if seuil_mouvement is not None and seuil_mouvement > 0:
            if quantite > seuil_mouvement:
                seuil_ok = False

        # Création du mouvement avec statut adapté
        statut = 'valide' if seuil_ok else 'attente'
        mouvement = serializer.save(statut=statut)

        # Mettre à jour le stock si validé automatiquement
        if statut == 'valide':
            stock, created = Stock.objects.get_or_create(
                produit=mouvement.produit,
                magasin=mouvement.magasin,
                defaults={'quantite': 0}
            )
            if mouvement.type == 'entrée':
                stock.quantite += mouvement.quantite
            else:
                stock.quantite -= mouvement.quantite
                if stock.quantite < 0:
                    stock.quantite = 0
            stock.save()
        else:
            # Notification au manager
            User = get_user_model()
            managers = User.objects.filter(Q(groups__name__iexact='manager') | Q(is_staff=True)).distinct()
            for manager in managers:
                Notification.objects.create(
                    destinataire=manager,
                    mouvement=mouvement,
                    type='mouvement_attente',
                    message=f"Nouveau mouvement à valider : {mouvement.produit.nom}, quantité : {mouvement.quantite}, motif : {mouvement.motif}, employé : {mouvement.user.get_full_name()} ({mouvement.user.email})"
                )

from rest_framework.views import APIView

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(destinataire=user).order_by('-date')

    def post(self, request, *args, **kwargs):
        # Marquer une notification comme lue
        notif_id = request.data.get('notification_id')
        try:
            notif = Notification.objects.get(id=notif_id, destinataire=request.user)
            notif.lu = True
            notif.save()
            return Response({'status': 'lu'}, status=200)
        except Notification.DoesNotExist:
            return Response({'error': 'Notification introuvable'}, status=404)

class MouvementValidationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, mouvement_id):
        user = request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Response({'error': "Accès interdit."}, status=status.HTTP_403_FORBIDDEN)

        action = request.data.get('action')  # 'accepte' ou 'rejete'
        try:
            mouvement = Mouvement.objects.get(id=mouvement_id)
            if mouvement.statut not in ['attente']:
                return Response({'error': 'Déjà traité'}, status=400)

            if action == 'accepte':
                mouvement.statut = 'accepte'
                # Mettre à jour le stock
                stock, created = Stock.objects.get_or_create(
                    produit=mouvement.produit,
                    magasin=mouvement.magasin,
                    defaults={'quantite': 0}
                )
                if mouvement.type == 'entrée':
                    stock.quantite += mouvement.quantite
                else:
                    stock.quantite -= mouvement.quantite
                    if stock.quantite < 0:
                        stock.quantite = 0
                stock.save()
                notif_type = 'mouvement_valide'
                notif_msg = f"Votre mouvement pour {mouvement.produit.nom} a été validé."
            elif action == 'rejete':
                mouvement.statut = 'rejete'
                notif_type = 'mouvement_rejete'
                notif_msg = f"Votre mouvement pour {mouvement.produit.nom} a été rejeté."
            else:
                return Response({'error': 'Action invalide'}, status=400)

            mouvement.save()
            # Notification à l'employé
            Notification.objects.create(
                destinataire=mouvement.user,
                mouvement=mouvement,
                type=notif_type,
                message=notif_msg
            )
            return Response({'status': mouvement.statut}, status=200)
        except Mouvement.DoesNotExist:
            return Response({'error': 'Mouvement introuvable'}, status=404)


class CommandeListCreateView(generics.ListCreateAPIView):
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['fournisseur', 'statut']
    ordering = ['-date']

class CommandeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Commande.objects.all()
    serializer_class = CommandeSerializer
    permission_classes = [permissions.IsAuthenticated]

class CommandeDetailListCreateView(generics.ListCreateAPIView):
    serializer_class = CommandeDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        commande_id = self.kwargs.get('commande_id')
        return CommandeDetail.objects.filter(commande_id=commande_id)
    
    def perform_create(self, serializer):
        commande_id = self.kwargs.get('commande_id')
        commande = Commande.objects.get(id=commande_id)
        serializer.save(commande=commande)