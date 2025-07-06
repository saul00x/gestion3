from django.db import models
from django.conf import settings
from products.models import Produit
from stores.models import Magasin

class Stock(models.Model):
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    magasin = models.ForeignKey(Magasin, on_delete=models.CASCADE)
    quantite = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.produit.nom} - {self.magasin.nom}: {self.quantite}"
    
    @property
    def produit_id(self):
        return self.produit.id
    
    @property
    def magasin_id(self):
        return self.magasin.id
    
    class Meta:
        unique_together = ['produit', 'magasin']
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'

class Mouvement(models.Model):
    TYPE_CHOICES = [
        ('entrée', 'Entrée'),
        ('sortie', 'Sortie'),
    ]
    
    MOTIF_CHOICES = [
        ('livraison', 'Livraison fournisseur'),
        ('retour', 'Retour client'),
        ('transfert_entrant', 'Transfert entrant'),
        ('transfert_sortant', 'Transfert sortant'),
        ('vente', 'Vente'),
        ('casse', 'Casse/Perte'),
        ('retour_fournisseur', 'Retour fournisseur'),
        ('correction', 'Correction d\'inventaire'),
    ]
    
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    magasin = models.ForeignKey(Magasin, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    quantite = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    motif = models.CharField(max_length=50, choices=MOTIF_CHOICES)
    
    def __str__(self):
        return f"{self.type} - {self.produit.nom} ({self.quantite})"
    
    @property
    def produit_id(self):
        return self.produit.id
    
    @property
    def magasin_id(self):
        return self.magasin.id
    
    @property
    def user_id(self):
        return self.user.id
    
    class Meta:
        verbose_name = 'Mouvement'
        verbose_name_plural = 'Mouvements'
        ordering = ['-date']

class Commande(models.Model):
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]
    
    fournisseur = models.ForeignKey('suppliers.Fournisseur', on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    total = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    def __str__(self):
        return f"Commande {self.id} - {self.fournisseur.nom}"
    
    @property
    def fournisseur_id(self):
        return self.fournisseur.id
    
    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-date']

class CommandeDetail(models.Model):
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='details')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE)
    quantite = models.IntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.commande.id} - {self.produit.nom}"
    
    @property
    def commande_id(self):
        return self.commande.id
    
    @property
    def produit_id(self):
        return self.produit.id
    
    class Meta:
        verbose_name = 'Détail de commande'
        verbose_name_plural = 'Détails de commandes'