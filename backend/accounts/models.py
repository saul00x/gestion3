from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('employe', 'Employé'),
    ]
    
    # Utiliser email comme identifiant principal
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, blank=True, null=True)
    
    nom = models.CharField(max_length=100, blank=True)
    prenom = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employe')
    magasin = models.ForeignKey('stores.Magasin', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to='users/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Définir email comme champ d'authentification
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']
    
    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
    
    def save(self, *args, **kwargs):
        # Générer un username basé sur l'email si vide
        if not self.username:
            self.username = self.email.split('@')[0]
        super().save(*args, **kwargs)