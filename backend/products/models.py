from django.db import models
from suppliers.models import Fournisseur
from stores.models import Magasin

class Produit(models.Model):
    nom = models.CharField(max_length=200)
    reference = models.CharField(max_length=100, unique=True)
    categorie = models.CharField(max_length=100)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    seuil_alerte = models.IntegerField(default=0)  # seuil pour alerte stock bas
    seuil_mouvement = models.IntegerField(default=0)  # seuil pour notifier le manager lors d'un mouvement
    fournisseur = models.ForeignKey(Fournisseur, on_delete=models.SET_NULL, null=True, blank=True)
    magasin = models.ForeignKey(Magasin, on_delete=models.CASCADE, null=True, blank=True)
    image = models.ImageField(upload_to='produits/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.nom} ({self.reference})"
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
    
    @property
    def fournisseur_id(self):
        return self.fournisseur.id if self.fournisseur else None
    
    @property
    def magasin_id(self):
        return self.magasin.id if self.magasin else None
    
    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'