from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from .models import User

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['email'] = serializers.EmailField()
        self.fields.pop('username', None)
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'),
                              username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Email ou mot de passe incorrect.')
            
            if not user.is_active:
                raise serializers.ValidationError('Compte utilisateur désactivé.')
            
            # Utiliser l'email comme username pour la validation parent
            attrs['username'] = email
            
        return super().validate(attrs)
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Ajouter des claims personnalisés
        token['email'] = user.email
        token['role'] = user.role
        token['nom'] = user.nom
        token['prenom'] = user.prenom
        token['magasin_id'] = str(user.magasin.id) if user.magasin else None
        
        return token

class UserSerializer(serializers.ModelSerializer):
    image_url = serializers.ReadOnlyField()
    magasin_id = serializers.SerializerMethodField()
    magasin_nom = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nom', 'prenom', 'role', 'magasin', 'magasin_id', 'magasin_nom', 'image', 'image_url', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def get_magasin_id(self, obj):
        return str(obj.magasin.id) if obj.magasin else None
    
    def get_magasin_nom(self, obj):
        return obj.magasin.nom if obj.magasin else None

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    username = serializers.CharField(required=False, allow_blank=True)  # Ajout de ce champ
    
    class Meta:
        model = User
        fields = ['email', 'password', 'nom', 'prenom', 'role', 'magasin', 'image', 'username']
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un utilisateur avec cet email existe déjà.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        # Forcer magasin=None si admin
        if validated_data.get('role') == 'admin':
            validated_data['magasin'] = None
        # Générer le username automatiquement si non fourni
        if not validated_data.get('username'):
            validated_data['username'] = validated_data['email'].split('@')[0]
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