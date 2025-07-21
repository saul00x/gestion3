from django.urls import path
from . import views

urlpatterns = [
    path('plannings/', views.PlanningListCreateView.as_view(), name='planning_list_create'),
    path('plannings/<int:pk>/', views.PlanningDetailView.as_view(), name='planning_detail'),
]
