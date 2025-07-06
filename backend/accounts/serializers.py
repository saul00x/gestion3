from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User

class UserSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    magasin_id = serializers.CharField(source='magasin.id', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'magasin_id', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'nom', 'prenom', 'role', 'magasin', 'image']
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Compte utilisateur désactivé.')
            else:
                raise serializers.ValidationError('Email ou mot de passe incorrect.')
        else:
            raise serializers.ValidationError('Email et mot de passe requis.')
        
        return data