from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('employe', 'Employé'),
    ]
    
    nom = models.CharField(max_length=100, blank=True)
    prenom = models.CharField(max_length=100, blank=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employe')
    magasin = models.ForeignKey('stores.Magasin', on_delete=models.SET_NULL, null=True, blank=True)
    image = models.ImageField(upload_to='users/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.email})"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None