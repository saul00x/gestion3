from rest_framework import serializers
from .models import Produit

class ProduitSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    fournisseur_id = serializers.SerializerMethodField()
    magasin_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Produit
        fields = ['id', 'nom', 'reference', 'categorie', 'prix_unitaire', 'seuil_alerte', 'seuil_mouvement',
                 'fournisseur', 'fournisseur_id', 'magasin', 'magasin_id', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_fournisseur_id(self, obj):
        return str(obj.fournisseur.id) if obj.fournisseur else None
    
    def get_magasin_id(self, obj):
        return str(obj.magasin.id) if obj.magasin else None