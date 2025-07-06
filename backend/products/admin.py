from django.contrib import admin
from .models import Produit

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('nom', 'reference', 'categorie', 'prix_unitaire', 'seuil_alerte', 'fournisseur', 'created_at')
    list_filter = ('categorie', 'fournisseur', 'created_at')
    search_fields = ('nom', 'reference', 'categorie')
    ordering = ('-created_at',)