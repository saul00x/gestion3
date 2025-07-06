from django.contrib import admin
from .models import Presence

@admin.register(Presence)
class PresenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'magasin_nom', 'date_pointage', 'heure_entree', 'heure_sortie', 'type')
    list_filter = ('type', 'date_pointage', 'magasin')
    search_fields = ('user__email', 'magasin_nom')
    ordering = ('-date_pointage',)
    date_hierarchy = 'date_pointage'