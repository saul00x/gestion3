from rest_framework import serializers
from .models import Stock, Mouvement, Commande, CommandeDetail, Notification

class StockSerializer(serializers.ModelSerializer):
    produit_id = serializers.SerializerMethodField()
    magasin_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Stock
        fields = ['id', 'produit', 'produit_id', 'magasin', 'magasin_id', 'quantite', 'updated_at']
        read_only_fields = ['id', 'updated_at']
    
    def get_produit_id(self, obj):
        return str(obj.produit.id) if obj.produit else None
    
    def get_magasin_id(self, obj):
        return str(obj.magasin.id) if obj.magasin else None

class MouvementSerializer(serializers.ModelSerializer):
    produit_id = serializers.SerializerMethodField()
    magasin_id = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    justificatif_url = serializers.SerializerMethodField()

    class Meta:
        model = Mouvement
        fields = ['id', 'produit', 'produit_id', 'magasin', 'magasin_id', 'user', 'user_id',
                  'type', 'quantite', 'date', 'motif', 'justificatif', 'justificatif_url', 'statut']
        read_only_fields = ['id', 'date', 'user', 'justificatif_url', 'statut']

    def get_produit_id(self, obj):
        return str(obj.produit.id) if obj.produit else None

    def get_magasin_id(self, obj):
        return str(obj.magasin.id) if obj.magasin else None

    def get_user_id(self, obj):
        return str(obj.user.id) if obj.user else None

    def get_justificatif_url(self, obj):
        request = self.context.get('request')
        if obj.justificatif and hasattr(obj.justificatif, 'url'):
            url = obj.justificatif.url
            if request is not None:
                return request.build_absolute_uri(url)
            return url
        return None

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommandeDetailSerializer(serializers.ModelSerializer):
    commande_id = serializers.SerializerMethodField()
    produit_id = serializers.SerializerMethodField()
    
    class Meta:
        model = CommandeDetail
        fields = ['id', 'commande', 'commande_id', 'produit', 'produit_id', 'quantite', 'prix_unitaire']
        read_only_fields = ['id']
    
    def get_commande_id(self, obj):
        return str(obj.commande.id) if obj.commande else None
    
    def get_produit_id(self, obj):
        return str(obj.produit.id) if obj.produit else None

class NotificationSerializer(serializers.ModelSerializer):
    mouvement = MouvementSerializer(read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'destinataire', 'mouvement', 'type', 'message', 'date', 'lu']
        read_only_fields = ['id', 'date', 'destinataire', 'mouvement', 'type', 'message', 'lu']


class CommandeSerializer(serializers.ModelSerializer):
    fournisseur_id = serializers.SerializerMethodField()
    details = CommandeDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = Commande
        fields = ['id', 'fournisseur', 'fournisseur_id', 'date', 'statut', 'total', 'details']
        read_only_fields = ['id', 'date']
    
    def get_fournisseur_id(self, obj):
        return str(obj.fournisseur.id) if obj.fournisseur else None