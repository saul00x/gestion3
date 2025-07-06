from rest_framework import serializers
from .models import Stock, Mouvement, Commande, CommandeDetail

class StockSerializer(serializers.ModelSerializer):
    produit_id = serializers.ReadOnlyField()
    magasin_id = serializers.ReadOnlyField()
    
    class Meta:
        model = Stock
        fields = ['id', 'produit', 'produit_id', 'magasin', 'magasin_id', 'quantite', 'updated_at']
        read_only_fields = ['id', 'updated_at']

class MouvementSerializer(serializers.ModelSerializer):
    produit_id = serializers.ReadOnlyField()
    magasin_id = serializers.ReadOnlyField()
    user_id = serializers.ReadOnlyField()
    
    class Meta:
        model = Mouvement
        fields = ['id', 'produit', 'produit_id', 'magasin', 'magasin_id', 'user', 'user_id', 
                 'type', 'quantite', 'date', 'motif']
        read_only_fields = ['id', 'date', 'user']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class CommandeDetailSerializer(serializers.ModelSerializer):
    commande_id = serializers.ReadOnlyField()
    produit_id = serializers.ReadOnlyField()
    
    class Meta:
        model = CommandeDetail
        fields = ['id', 'commande', 'commande_id', 'produit', 'produit_id', 'quantite', 'prix_unitaire']
        read_only_fields = ['id']

class CommandeSerializer(serializers.ModelSerializer):
    fournisseur_id = serializers.ReadOnlyField()
    details = CommandeDetailSerializer(many=True, read_only=True)
    
    class Meta:
        model = Commande
        fields = ['id', 'fournisseur', 'fournisseur_id', 'date', 'statut', 'total', 'details']
        read_only_fields = ['id', 'date']