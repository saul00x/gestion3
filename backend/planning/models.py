from django.db import models
from django.conf import settings
from stores.models import Magasin

class Planning(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='plannings')  # Employé concerné
    magasin = models.ForeignKey(Magasin, on_delete=models.CASCADE)
    date = models.DateField()
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    tache = models.CharField(max_length=255)
    notes = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_plannings')  # Manager qui crée
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.magasin.nom if self.magasin else ''} - {self.date} - {self.tache}"

    @property
    def user_id(self):
        return self.user.id

    @property
    def magasin_id(self):
        return self.magasin.id

    class Meta:
        verbose_name = 'Planning'
        verbose_name_plural = 'Plannings'
        ordering = ['-date', 'heure_debut']
        unique_together = ['user', 'date', 'heure_debut']
