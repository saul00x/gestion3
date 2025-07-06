from django.db import models

class Magasin(models.Model):
    nom = models.CharField(max_length=200)
    adresse = models.TextField()
    latitude = models.FloatField()
    longitude = models.FloatField()
    image = models.ImageField(upload_to='magasins/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.nom
    
    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None
    
    class Meta:
        verbose_name = 'Magasin'
        verbose_name_plural = 'Magasins'