from django.db import models
from django.conf import settings
from stores.models import Magasin

class Presence(models.Model):
    TYPE_CHOICES = [
        ('arrivee', 'Arrivée'),
        ('depart', 'Départ'),
        ('pause_entree', 'Début pause'),
        ('pause_sortie', 'Fin pause'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    magasin = models.ForeignKey(Magasin, on_delete=models.CASCADE)
    magasin_nom = models.CharField(max_length=200)  # Pour garder le nom même si magasin supprimé
    date_pointage = models.DateTimeField()
    heure_entree = models.DateTimeField(null=True, blank=True)
    heure_sortie = models.DateTimeField(null=True, blank=True)
    pause_entree = models.DateTimeField(null=True, blank=True)
    pause_sortie = models.DateTimeField(null=True, blank=True)
    duree_pause = models.IntegerField(null=True, blank=True)  # en minutes
    latitude = models.FloatField()
    longitude = models.FloatField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    def __str__(self):
        return f"{self.user.email} - {self.magasin_nom} - {self.date_pointage.date()}"
    
    @property
    def user_id(self):
        return self.user.id
    
    @property
    def magasin_id(self):
        return self.magasin.id
    
    class Meta:
        verbose_name = 'Présence'
        verbose_name_plural = 'Présences'
        ordering = ['-date_pointage']