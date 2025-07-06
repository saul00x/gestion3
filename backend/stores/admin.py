from django.contrib import admin
from .models import Magasin

@admin.register(Magasin)
class MagasinAdmin(admin.ModelAdmin):
    list_display = ('nom', 'adresse', 'latitude', 'longitude', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('nom', 'adresse')
    ordering = ('-created_at',)