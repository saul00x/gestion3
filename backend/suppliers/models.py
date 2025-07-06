from django.db import models

class Fournisseur(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.TextField()
    contact = models.CharField(max_length=200)
    image = models.ImageField(upload_to='fournisseurs/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nom
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
    
    class Meta:
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'