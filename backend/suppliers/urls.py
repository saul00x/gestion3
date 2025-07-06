from django.urls import path
from . import views

urlpatterns = [
    path('', views.FournisseurListCreateView.as_view(), name='fournisseur_list_create'),
    path('<int:pk>/', views.FournisseurDetailView.as_view(), name='fournisseur_detail'),
]