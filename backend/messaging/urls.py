from django.urls import path
from . import views

urlpatterns = [
    path('messages/', views.MessageListCreateView.as_view(), name='message_list_create'),
    path('messages/<int:pk>/', views.MessageDetailView.as_view(), name='message_detail'),
]