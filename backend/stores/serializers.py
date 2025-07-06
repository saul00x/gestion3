from rest_framework import serializers
from .models import Magasin

class MagasinSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    
    class Meta:
        model = Magasin
        fields = ['id', 'nom', 'adresse', 'latitude', 'longitude', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']