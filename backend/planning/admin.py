from django.contrib import admin
from .models import Planning

@admin.register(Planning)
class PlanningAdmin(admin.ModelAdmin):
    list_display = ('user', 'magasin', 'date', 'heure_debut', 'heure_fin', 'tache', 'created_by')
    search_fields = ('user__email', 'magasin__nom', 'tache')
    list_filter = ('magasin', 'date')
    ordering = ('-date', 'heure_debut')
