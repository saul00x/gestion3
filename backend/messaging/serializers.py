from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.ReadOnlyField()
    receiver_id = serializers.ReadOnlyField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'receiver', 'receiver_id', 'content', 'timestamp', 'read']
        read_only_fields = ['id', 'timestamp', 'sender']
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)