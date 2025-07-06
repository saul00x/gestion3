from django.urls import path
from . import views

urlpatterns = [
    path('', views.MagasinListCreateView.as_view(), name='magasin_list_create'),
    path('<int:pk>/', views.MagasinDetailView.as_view(), name='magasin_detail'),
]