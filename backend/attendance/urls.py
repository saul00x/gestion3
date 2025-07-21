from django.urls import path
from . import views

urlpatterns = [
    path('presences/', views.PresenceListCreateView.as_view(), name='presence_list_create'),
    path('presences/<int:pk>/', views.PresenceDetailView.as_view(), name='presence_detail'),

    # Endpoints Planning

]