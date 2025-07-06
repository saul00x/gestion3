from django.urls import path
from . import views

urlpatterns = [
    path('stocks/', views.StockListCreateView.as_view(), name='stock_list_create'),
    path('stocks/<int:pk>/', views.StockDetailView.as_view(), name='stock_detail'),
    path('mouvements/', views.MouvementListCreateView.as_view(), name='mouvement_list_create'),
    path('commandes/', views.CommandeListCreateView.as_view(), name='commande_list_create'),
    path('commandes/<int:pk>/', views.CommandeDetailView.as_view(), name='commande_detail'),
    path('commandes/<int:commande_id>/details/', views.CommandeDetailListCreateView.as_view(), name='commande_detail_list_create'),
]