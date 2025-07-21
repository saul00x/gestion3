from rest_framework import serializers
from .models import Fournisseur

class FournisseurSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    magasin_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Fournisseur
        fields = ['id', 'nom', 'adresse', 'contact', 'magasin', 'magasin_id', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_magasin_id(self, obj):
        return str(obj.magasin.id) if obj.magasin else None