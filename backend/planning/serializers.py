from rest_framework import serializers
from .models import Planning

class PlanningSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    created_by_email = serializers.SerializerMethodField()

    class Meta:
        model = Planning
        fields = [
            'id', 'user', 'user_email', 'magasin', 'date', 'heure_debut', 'heure_fin',
            'tache', 'notes', 'created_by', 'created_by_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'created_by_email', 'user_email']

    def get_user_email(self, obj):
        return obj.user.email if obj.user else None

    def get_created_by_email(self, obj):
        return obj.created_by.email if obj.created_by else None
