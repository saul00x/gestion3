from rest_framework import generics, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Planning
from .serializers import PlanningSerializer

class PlanningListCreateView(generics.ListCreateAPIView):
    serializer_class = PlanningSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'date', 'magasin']
    ordering = ['-date', 'heure_debut']
    queryset = Planning.objects.all()

    def get_queryset(self):
        user = self.request.user
        if not hasattr(user, 'role') or user.role not in ['manager', 'admin']:
            return Planning.objects.none()
        return super().get_queryset()
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class PlanningDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlanningSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Planning.objects.all()
