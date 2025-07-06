from rest_framework import serializers
from .models import Presence

class PresenceSerializer(serializers.ModelSerializer):
    user_id = serializers.ReadOnlyField()
    magasin_id = serializers.ReadOnlyField()
    
    class Meta:
        model = Presence
        fields = ['id', 'user', 'user_id', 'magasin', 'magasin_id', 'magasin_nom', 
                 'date_pointage', 'heure_entree', 'heure_sortie', 'pause_entree', 
                 'pause_sortie', 'duree_pause', 'latitude', 'longitude', 'type']
        read_only_fields = ['id', 'user']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        if 'magasin_nom' not in validated_data and validated_data.get('magasin'):
            validated_data['magasin_nom'] = validated_data['magasin'].nom
        return super().create(validated_data)