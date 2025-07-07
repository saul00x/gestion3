from rest_framework import serializers
from .models import Message

class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.SerializerMethodField()
    receiver_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'receiver', 'receiver_id', 'content', 'timestamp', 'read']
        read_only_fields = ['id', 'timestamp', 'sender']
    
    def get_sender_id(self, obj):
        return str(obj.sender.id) if obj.sender else None
    
    def get_receiver_id(self, obj):
        return str(obj.receiver.id) if obj.receiver else None
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)