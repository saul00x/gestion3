from rest_framework import serializers
from .models import Produit

class ProduitSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    fournisseur_id = serializers.ReadOnlyField()
    
    class Meta:
        model = Produit
        fields = ['id', 'nom', 'reference', 'categorie', 'prix_unitaire', 'seuil_alerte', 
                 'fournisseur', 'fournisseur_id', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']