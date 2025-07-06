from rest_framework import serializers
from .models import Fournisseur

class FournisseurSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    
    class Meta:
        model = Fournisseur
        fields = ['id', 'nom', 'adresse', 'contact', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']