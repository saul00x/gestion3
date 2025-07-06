from django.contrib import admin
from .models import Fournisseur

@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ('nom', 'contact', 'adresse', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('nom', 'contact')
    ordering = ('-created_at',)