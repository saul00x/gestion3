from django.contrib import admin
from .models import Stock, Mouvement, Commande, CommandeDetail

@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ('produit', 'magasin', 'quantite', 'updated_at')
    list_filter = ('magasin', 'updated_at')
    search_fields = ('produit__nom', 'magasin__nom')
    ordering = ('-updated_at',)

@admin.register(Mouvement)
class MouvementAdmin(admin.ModelAdmin):
    list_display = ('produit', 'magasin', 'user', 'type', 'quantite', 'motif', 'date')
    list_filter = ('type', 'motif', 'date', 'magasin')
    search_fields = ('produit__nom', 'user__email')
    ordering = ('-date',)

class CommandeDetailInline(admin.TabularInline):
    model = CommandeDetail
    extra = 1

@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'fournisseur', 'date', 'statut', 'total')
    list_filter = ('statut', 'date', 'fournisseur')
    search_fields = ('fournisseur__nom',)
    ordering = ('-date',)
    inlines = [CommandeDetailInline]